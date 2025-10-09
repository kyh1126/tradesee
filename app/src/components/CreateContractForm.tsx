import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
// Avoid importing Anchor client here to keep form purely mock-mode
import { computeSHA256, generateSolanaPayURL } from '../lib/utils';

export default function CreateContractForm() {
  const { publicKey, signTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    seller: '',
    amount: '',
    milestones: '1',
    expiryHours: '24',
    autoRelease: false,
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey || !signTransaction) return;

    setLoading(true);
    try {
      // 1) Require an anchored document from the Document Anchoring section
      const anchoredDocs = JSON.parse(localStorage.getItem('tradesee_anchored_docs') || '[]');
      const lastAnchored = anchoredDocs[anchoredDocs.length - 1];
      if (!lastAnchored || !lastAnchored.hash) {
        alert('Please anchor a document below before creating the contract.');
        return;
      }
      const docHashHex = lastAnchored.hash as string;

      // 2) Create agreement locally (mock) with the anchored hash
      const expiryTs = Math.floor(Date.now() / 1000) + (parseInt(formData.expiryHours) * 3600);
      const agreement = {
        id: Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join(''),
        buyer: publicKey.toString(),
        seller: new PublicKey(formData.seller).toString(),
        amount: parseFloat(formData.amount),
        milestones: parseInt(formData.milestones),
        expiry: expiryTs,
        doc_hash: docHashHex,
        status: 'initialized' as const,
        description: formData.description,
      };
      const storedAgreements = JSON.parse(localStorage.getItem('tradesee_agreements') || '[]');
      storedAgreements.push(agreement);
      localStorage.setItem('tradesee_agreements', JSON.stringify(storedAgreements));
      console.log('Agreement created (mock, localStorage):', agreement);

      // 3) Open Solana Pay URL for deposit
      const payURL = generateSolanaPayURL(formData.seller, parseFloat(formData.amount), 'Tradesee Escrow');
      window.open(payURL, '_blank');

      alert('Contract created and document anchored successfully! Solana Pay opened.');

      // 4) Reset form for creating another contract
      setFormData({
        seller: '',
        amount: '',
        milestones: '1',
        expiryHours: '24',
        autoRelease: false,
        description: '',
      });

      // Also reset Document Anchoring section below
      window.dispatchEvent(new Event('tradesee-reset-anchoring'));
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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Create New Trade</h2>
      </div>
      <form id="create-contract-form" onSubmit={handleSubmit} className="space-y-4">
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
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            rows={3}
            placeholder="Brief description of this contract (for reference)"
            required
          />
        </div>

        {/* Submit button moved below Document Anchoring section in page layout */}
      </form>
    </div>
  );
}
