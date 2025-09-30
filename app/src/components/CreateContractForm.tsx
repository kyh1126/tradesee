import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { getClient, USDC_MINT } from '../lib/anchor';
import { hashDocument } from '../lib/utils';

export default function CreateContractForm() {
  const { publicKey, signTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    seller: '',
    amount: '',
    milestones: '1',
    expiryHours: '24',
    autoRelease: false,
    documentContent: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey || !signTransaction) return;

    setLoading(true);
    try {
      const client = getClient({ publicKey, signTransaction } as any);
      const docHash = hashDocument(formData.documentContent);
      const expiryTs = Math.floor(Date.now() / 1000) + (parseInt(formData.expiryHours) * 3600);

      const [contractPda, tx] = await client.createContract({
        seller: new PublicKey(formData.seller),
        amountExpected: parseFloat(formData.amount) * 1e6, // Convert to USDC units
        milestonesTotal: parseInt(formData.milestones),
        expiryTs,
        autoReleaseOnExpiry: formData.autoRelease,
        docHash,
        usdcMint: USDC_MINT,
      });

      const signature = await client.program.provider.sendAndConfirm(tx);
      console.log('Contract created:', contractPda.toString());
      console.log('Transaction signature:', signature);
      
      alert('Contract created successfully!');
    } catch (error) {
      console.error('Error creating contract:', error);
      alert('Failed to create contract: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!publicKey) {
    return <div>Please connect your wallet to create a contract.</div>;
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">Create New Contract</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Seller Address</label>
          <input
            type="text"
            value={formData.seller}
            onChange={(e) => setFormData({ ...formData, seller: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Enter seller's public key"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Amount (USDC)</label>
          <input
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="1000"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Total Milestones</label>
          <input
            type="number"
            min="1"
            value={formData.milestones}
            onChange={(e) => setFormData({ ...formData, milestones: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Expiry (hours)</label>
          <input
            type="number"
            min="1"
            value={formData.expiryHours}
            onChange={(e) => setFormData({ ...formData, expiryHours: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.autoRelease}
              onChange={(e) => setFormData({ ...formData, autoRelease: e.target.checked })}
              className="mr-2"
            />
            Auto-release on expiry
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Document Content</label>
          <textarea
            value={formData.documentContent}
            onChange={(e) => setFormData({ ...formData, documentContent: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            rows={3}
            placeholder="Enter document content to be hashed"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Contract'}
        </button>
      </form>
    </div>
  );
}
