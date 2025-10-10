import React from 'react';

interface Contract {
  id: string;
  route: string;
  amount: string;
  weight: string;
  date: string;
  status: string;
  statusColor: string;
  exporter?: string;
  importer?: string;
  fromCountry?: string;
  toCountry?: string;
  contractValue?: string;
  depositRate?: string;
  expiredDate?: string;
  contractTerms?: string;
  autoRelease?: boolean;
  uploadedFile?: {
    name: string;
    size: number;
    type: string;
    hash: string;
  } | null;
}

interface ContractDetailModalProps {
  contract: Contract;
  onClose: () => void;
}

const ContractDetailModal: React.FC<ContractDetailModalProps> = ({ contract, onClose }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Complete':
        return 'bg-green-500';
      case 'In transit':
        return 'bg-blue-500';
      case 'Pending':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800/90 backdrop-blur-md rounded-2xl p-8 w-full max-w-4xl border border-gray-600/30 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-white">Contract Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contract ID and Status */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">{contract.id}</h3>
          <span className={`${getStatusColor(contract.status)} text-white px-4 py-2 rounded-full text-sm font-medium`}>
            {contract.status}
          </span>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-gray-700/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-white mb-4">Basic Information</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Route:</span>
                  <span className="text-white font-medium">{contract.route}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount:</span>
                  <span className="text-white font-medium">{contract.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Weight:</span>
                  <span className="text-white font-medium">{contract.weight}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Date:</span>
                  <span className="text-white font-medium">{contract.date}</span>
                </div>
              </div>
            </div>

            {/* Contract Details */}
            {(contract.contractValue || contract.depositRate || contract.expiredDate) && (
              <div className="bg-gray-700/30 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-white mb-4">Contract Details</h4>
                <div className="space-y-3">
                  {contract.contractValue && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Contract Value:</span>
                      <span className="text-white font-medium">{contract.contractValue} USDC</span>
                    </div>
                  )}
                  {contract.depositRate && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Deposit Rate:</span>
                      <span className="text-white font-medium">{contract.depositRate}%</span>
                    </div>
                  )}
                  {contract.expiredDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Expired Date:</span>
                      <span className="text-white font-medium">{contract.expiredDate}</span>
                    </div>
                  )}
                  {contract.autoRelease !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Auto Release:</span>
                      <span className={`font-medium ${contract.autoRelease ? 'text-green-400' : 'text-orange-400'}`}>
                        {contract.autoRelease ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* File Information */}
            {contract.uploadedFile && (
              <div className="bg-gray-700/30 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-white mb-4">Payment Condition</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{contract.uploadedFile.name}</p>
                      <p className="text-gray-400 text-xs">
                        {(contract.uploadedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-600">
                    <p className="text-gray-400 text-xs mb-1">File Hash (SHA-256):</p>
                    <code className="text-green-400 text-xs bg-gray-800 px-2 py-1 rounded font-mono break-all block">
                      {contract.uploadedFile.hash}
                    </code>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Wallet Addresses */}
            <div className="bg-gray-700/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-white mb-4">Wallet Addresses</h4>
              <div className="space-y-3">
                {contract.exporter && (
                  <div>
                    <span className="text-gray-400 text-sm">Exporter:</span>
                    <p className="text-white font-mono text-sm break-all mt-1">{contract.exporter}</p>
                  </div>
                )}
                {contract.importer && (
                  <div>
                    <span className="text-gray-400 text-sm">Importer:</span>
                    <p className="text-white font-mono text-sm break-all mt-1">{contract.importer}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Contract Terms */}
            {contract.contractTerms && (
              <div className="bg-gray-700/30 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-white mb-4">Contract Terms</h4>
                <p className="text-white text-sm leading-relaxed">{contract.contractTerms}</p>
              </div>
            )}

            {/* Actions */}
            <div className="bg-gray-700/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-white mb-4">Actions</h4>
              <div className="space-y-3">
                <button className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                  View on Blockchain
                </button>
                <button className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                  Download Contract
                </button>
                {contract.status === 'Pending' && (
                  <button className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                    Approve Contract
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractDetailModal;

