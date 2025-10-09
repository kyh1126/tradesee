import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { getAccount } from '@solana/spl-token';
import { getClient, USDC_MINT } from '../lib/anchor';
import WalletConnect from '../components/WalletConnect';
import CreateContractForm from '../components/CreateContractForm';
import ContractList from '../components/ContractList';
import DocumentAnchoring from '../components/DocumentAnchoring';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

function HomePage() {
  const { publicKey } = useWallet();
  const [usdcBalance, setUsdcBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchUSDCBalance = async () => {
    if (!publicKey) return;

    setLoading(true);
    try {
      const client = getClient({ publicKey } as any);
      const ata = await client.getOrCreateAta(USDC_MINT, publicKey);
      const account = await getAccount(client.program.provider.connection, ata);
      setUsdcBalance(Number(account.amount) / 1e6); // Convert from USDC units
    } catch (error) {
      console.error('Error fetching USDC balance:', error);
      setUsdcBalance(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUSDCBalance();
  }, [publicKey]);

  return (
    <WalletConnect>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Tradesee</h1>
            <p className="text-gray-600">Secure escrow platform on Solana</p>
            <div className="mt-4">
              {mounted ? <WalletMultiButton /> : null}
            </div>
          </header>

          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">Wallet Status</h2>
                  <p className="text-gray-600">
                    {publicKey ? `Connected: ${publicKey.toString().slice(0, 8)}...` : 'Not connected'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">USDC Balance</p>
                  <p className="text-2xl font-bold">
                    {loading ? 'Loading...' : `${usdcBalance.toFixed(2)} USDC`}
                  </p>
                </div>
              </div>
            </div>

            {/* Ad-hoc Credibility Card */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Ad-hoc Credibility</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">850</div>
                  <div className="text-sm text-gray-600">Trust Score</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">12</div>
                  <div className="text-sm text-gray-600">Completed Trades</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">98%</div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left column: Create form + Document anchoring stacked with CTA at bottom */}
              <div className="space-y-8">
                <CreateContractForm />
                <DocumentAnchoring />
                <button
                  form="create-contract-form"
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 px-4 rounded-md hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 font-semibold"
                >
                  Create Contract
                </button>
              </div>
              {/* Right column: Contracts list */}
              <div>
                <ContractList />
              </div>
            </div>
          </div>
        </div>
      </div>
    </WalletConnect>
  );
}

export default HomePage;
