import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { getAccount } from '@solana/spl-token';
import { getClient, USDC_MINT } from '../lib/anchor';
import WalletConnect from '../components/WalletConnect';
import CreateContractForm from '../components/CreateContractForm';
import ContractList from '../components/ContractList';

function HomePage() {
  const { publicKey } = useWallet();
  const [usdcBalance, setUsdcBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);

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

            <div className="grid lg:grid-cols-2 gap-8">
              <div>
                <CreateContractForm />
              </div>
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
