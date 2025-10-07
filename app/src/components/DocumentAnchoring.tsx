import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { computeSHA256, generateSolanaPayURL } from '../lib/utils';

interface DocumentAnchoringProps {
  onDocumentAnchored?: (hash: string) => void;
}

export default function DocumentAnchoring({ onDocumentAnchored }: DocumentAnchoringProps) {
  const { publicKey } = useWallet();
  const [documentContent, setDocumentContent] = useState('');
  const [documentHash, setDocumentHash] = useState<string | null>(null);
  const [isAnchored, setIsAnchored] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setDocumentContent(content);
      };
      reader.readAsText(file);
    }
  };

  const handleAnchorDocument = async () => {
    if (!documentContent) return;

    setLoading(true);
    try {
      // Compute SHA256 hash
      const hash = computeSHA256(documentContent);
      setDocumentHash(hash);

      // Mock storage in localStorage
      const anchoredDocs = JSON.parse(localStorage.getItem('tradesee_anchored_docs') || '[]');
      anchoredDocs.push({
        hash,
        content: documentContent,
        timestamp: Date.now(),
        anchored: true
      });
      localStorage.setItem('tradesee_anchored_docs', JSON.stringify(anchoredDocs));

      setIsAnchored(true);
      onDocumentAnchored?.(hash);
    } catch (error) {
      console.error('Error anchoring document:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayment = () => {
    if (!publicKey || !documentHash) return;

    const amount = 100; // Mock amount
    const payURL = generateSolanaPayURL(publicKey.toString(), amount, 'Tradesee Escrow');
    
    // Open Solana Pay URL
    window.open(payURL, '_blank');
  };

  if (!publicKey) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Document Anchoring</h3>
        <p className="text-gray-600">Please connect your wallet to anchor documents.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Document Anchoring</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Document
          </label>
          <input
            type="file"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {documentContent && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Content
            </label>
            <textarea
              value={documentContent}
              onChange={(e) => setDocumentContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={4}
              placeholder="Document content will appear here..."
            />
          </div>
        )}

        {documentContent && !isAnchored && (
          <button
            onClick={handleAnchorDocument}
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Anchoring...' : 'Anchor Document'}
          </button>
        )}

        {isAnchored && documentHash && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Document Anchored ✓
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>Hash: {documentHash}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {isAnchored && (
          <div className="space-y-2">
            <button
              onClick={handleCreatePayment}
              className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600"
            >
              Create/Deposit - Solana Pay
            </button>
            <p className="text-xs text-gray-500 text-center">
              Opens Solana Pay URL for payment
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
