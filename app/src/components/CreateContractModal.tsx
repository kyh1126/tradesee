import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';

interface CreateContractModalProps {
  onClose: () => void;
  onContractCreated: (contractData: any) => void;
}

const CreateContractModal: React.FC<CreateContractModalProps> = ({ onClose, onContractCreated }) => {
  const { publicKey } = useWallet();
  const [formData, setFormData] = useState({
    exporter: '',
    importer: '',
    fromCountry: '',
    toCountry: '',
    weight: '',
    contractValue: '',
    depositRate: '',
    expiredDate: '',
    contractTerms: ''
  });
  const [exporterError, setExporterError] = useState('');
  const [importerError, setImporterError] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileHash, setFileHash] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  // Auto-fill exporter field with connected wallet address
  useEffect(() => {
    if (publicKey) {
      setFormData(prev => ({
        ...prev,
        exporter: publicKey.toString()
      }));
    }
  }, [publicKey]);

  // Validate Solana address
  const validateSolanaAddress = (address: string): boolean => {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  };

  // Generate SHA-256 hash of file
  const generateFileHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Validate addresses
    if (name === 'exporter') {
      if (value && !validateSolanaAddress(value)) {
        setExporterError('Invalid Solana address format');
      } else {
        setExporterError('');
      }
    }
    
    if (name === 'importer') {
      if (value && !validateSolanaAddress(value)) {
        setImporterError('Invalid Solana address format');
      } else {
        setImporterError('');
      }
    }
  };

  const handleUseMyWallet = () => {
    if (publicKey) {
      setFormData(prev => ({
        ...prev,
        exporter: publicKey.toString()
      }));
      setExporterError('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const hash = await generateFileHash(file);
      setUploadedFile(file);
      setFileHash(hash);
    } catch (error) {
      console.error('Error generating file hash:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setFileHash('');
  };

  const generateSolanaPayURL = (contractData: any) => {
    // Solana Pay URL 생성 (실제 구현에서는 더 복잡한 로직이 필요)
    const baseURL = 'https://solana-pay.vercel.app/';
    const params = new URLSearchParams({
      recipient: contractData.importer,
      amount: contractData.contractValue,
      label: 'Tradesee Contract Payment',
      message: `Contract ID: ${Date.now()}`,
      memo: `Contract: ${contractData.exporter} -> ${contractData.importer}`
    });
    
    return `${baseURL}?${params.toString()}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate addresses before submission
    const isExporterValid = !formData.exporter || validateSolanaAddress(formData.exporter);
    const isImporterValid = !formData.importer || validateSolanaAddress(formData.importer);
    
    if (!isExporterValid) {
      setExporterError('Invalid Solana address format');
      return;
    }
    
    if (!isImporterValid) {
      setImporterError('Invalid Solana address format');
      return;
    }
    
    // Handle form submission here
    const submissionData = {
      ...formData,
      uploadedFile: uploadedFile ? {
        name: uploadedFile.name,
        size: uploadedFile.size,
        type: uploadedFile.type,
        hash: fileHash
      } : null
    };
    
    console.log('Form submitted:', submissionData);
    
    // Add contract to the list
    onContractCreated(submissionData);
    
    // Generate and open Solana Pay URL
    const solanaPayURL = generateSolanaPayURL(submissionData);
    window.open(solanaPayURL, '_blank');
    
    // Close modal after a short delay to show the URL opening
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800/90 backdrop-blur-md rounded-2xl p-8 w-full max-w-2xl border border-gray-600/30">
        <h2 className="text-2xl font-bold text-white mb-8 text-center">
          New Smart Contract Agreement
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Exporter and Importer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-white/80 text-sm font-medium">
                  Exporter
                </label>
                {publicKey && (
                  <button
                    type="button"
                    onClick={handleUseMyWallet}
                    className="text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors"
                  >
                    Use my wallet
                  </button>
                )}
              </div>
              <input
                type="text"
                name="exporter"
                value={formData.exporter}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 bg-gray-700/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-1 ${
                  exporterError 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-600 focus:border-blue-500 focus:ring-blue-500'
                }`}
                placeholder="Enter exporter wallet address"
                required
              />
              {exporterError && (
                <p className="text-red-400 text-xs mt-1">{exporterError}</p>
              )}
              {formData.exporter && !exporterError && (
                <p className="text-green-400 text-xs mt-1">✓ Valid Solana address</p>
              )}
            </div>
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Importer
              </label>
              <input
                type="text"
                name="importer"
                value={formData.importer}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 bg-gray-700/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-1 ${
                  importerError 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-600 focus:border-blue-500 focus:ring-blue-500'
                }`}
                placeholder="Enter importer wallet address"
                required
              />
              {importerError && (
                <p className="text-red-400 text-xs mt-1">{importerError}</p>
              )}
              {formData.importer && !importerError && (
                <p className="text-green-400 text-xs mt-1">✓ Valid Solana address</p>
              )}
            </div>
          </div>

          {/* Contract Value and Deposit Rate */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Contract Value (Unit: USDC)
              </label>
              <input
                type="number"
                name="contractValue"
                value={formData.contractValue}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Enter contract value"
                required
              />
            </div>
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Deposit Rate(%)
              </label>
              <input
                type="number"
                name="depositRate"
                value={formData.depositRate}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Enter deposit rate"
                min="0"
                max="100"
                required
              />
            </div>
          </div>

          {/* From Country, To Country, and Weight */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                From Country
              </label>
              <input
                type="text"
                name="fromCountry"
                value={formData.fromCountry}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., New York"
                required
              />
            </div>
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                To Country
              </label>
              <input
                type="text"
                name="toCountry"
                value={formData.toCountry}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., Seoul"
                required
              />
            </div>
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Weight (kg)
              </label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Enter weight"
                min="0"
                step="0.1"
                required
              />
            </div>
          </div>

          {/* Payment Condition */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Payment Condition
            </label>
            {!uploadedFile ? (
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-gray-500 transition-colors">
                <input
                  type="file"
                  id="file-upload"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center space-y-2">
                    {isUploading ? (
                      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    )}
                    <span className="text-gray-400 text-sm">
                      {isUploading ? 'Processing...' : 'Upload'}
                    </span>
                  </div>
                </label>
              </div>
            ) : (
              <div className="border border-gray-600 rounded-lg p-4 bg-gray-700/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{uploadedFile.name}</p>
                      <p className="text-gray-400 text-xs">
                        {(uploadedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {fileHash && (
                  <div className="mt-3 pt-3 border-t border-gray-600">
                    <p className="text-gray-400 text-xs mb-1">File Hash (SHA-256):</p>
                    <div className="flex items-center space-x-2">
                      <code className="text-green-400 text-xs bg-gray-800 px-2 py-1 rounded font-mono break-all">
                        {fileHash}
                      </code>
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(fileHash)}
                        className="text-gray-400 hover:text-white transition-colors"
                        title="Copy hash"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Expired Date */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Expired Date
            </label>
            <input
              type="date"
              name="expiredDate"
              value={formData.expiredDate}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          {/* Contract Terms */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Contract Terms
            </label>
            <textarea
              name="contractTerms"
              value={formData.contractTerms}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
              placeholder="Enter contract terms and conditions..."
              required
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-between pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Generate Contract & Share
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateContractModal;
