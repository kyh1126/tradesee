import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { getClient } from '../lib/anchor';

interface Contract {
  address: string;
  seller: string;
  amount: number;
  milestones: number;
  completed: number;
  expiry: number;
  released: boolean;
  refunded: boolean;
  autoRelease: boolean;
}

export default function ContractList() {
  const { publicKey } = useWallet();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchContracts = async () => {
    if (!publicKey) return;

    setLoading(true);
    try {
      const client = getClient({ publicKey } as any);
      // In a real app, you'd filter by initializer
      // For now, we'll show a placeholder
      setContracts([]);
    } catch (error) {
      console.error('Error fetching contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [publicKey]);

  const getStatusBadge = (contract: Contract) => {
    if (contract.released) return <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Released</span>;
    if (contract.refunded) return <span className="bg-red-100 text-red-800 px-2 py-1 rounded">Refunded</span>;
    if (Date.now() / 1000 > contract.expiry) return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Expired</span>;
    return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">Active</span>;
  };

  if (!publicKey) {
    return <div>Please connect your wallet to view contracts.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">My Contracts</h2>
        <button
          onClick={fetchContracts}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {contracts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No contracts found. Create your first contract above.
        </div>
      ) : (
        <div className="grid gap-4">
          {contracts.map((contract) => (
            <div key={contract.address} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold">Contract {contract.address.slice(0, 8)}...</h3>
                  <p className="text-sm text-gray-600">Seller: {contract.seller.slice(0, 8)}...</p>
                </div>
                {getStatusBadge(contract)}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Amount:</span>
                  <p>${contract.amount.toLocaleString()} USDC</p>
                </div>
                <div>
                  <span className="font-medium">Milestones:</span>
                  <p>{contract.completed}/{contract.milestones}</p>
                </div>
                <div>
                  <span className="font-medium">Expiry:</span>
                  <p>{new Date(contract.expiry * 1000).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="font-medium">Auto-release:</span>
                  <p>{contract.autoRelease ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
