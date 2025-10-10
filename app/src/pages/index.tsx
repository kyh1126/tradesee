import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { getAccount, getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { getClient, USDC_MINT } from '../lib/anchor';
import WalletConnect from '../components/WalletConnect';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import CreateContractModal from '../components/CreateContractModal';
import ProfileModal from '../components/ProfileModal';
import ContractDetailModal from '../components/ContractDetailModal';
import AccountBalanceCard from '../components/AccountBalanceCard';

// Mock data for demonstration
const mockTrades = [
  {
    id: 'LB25NNEO32035',
    route: 'New York → Seoul',
    amount: '38,000 USDC',
    weight: '220kg',
    date: '2025.08.12',
    status: 'In transit',
    statusColor: 'bg-blue-500'
  },
  {
    id: 'LB25NNEO32036',
    route: 'Tokyo → London',
    amount: '25,000 USDC',
    weight: '150kg',
    date: '2025.08.10',
    status: 'Pending',
    statusColor: 'bg-orange-500'
  },
  {
    id: 'LB25NNEO32037',
    route: 'Seoul → Singapore',
    amount: '15,000 USDC',
    weight: '80kg',
    date: '2025.08.08',
    status: 'Complete',
    statusColor: 'bg-green-500'
  },
  {
    id: 'LB25NNEO32038',
    route: 'Berlin → New York',
    amount: '42,000 USDC',
    weight: '300kg',
    date: '2025.08.05',
    status: 'In transit',
    statusColor: 'bg-blue-500'
  }
];

function HomePage() {
  const { publicKey, connected } = useWallet();
  const [usdcBalance, setUsdcBalance] = useState<number>(200000);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showContractDetail, setShowContractDetail] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [contracts, setContracts] = useState(mockTrades);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Balance now handled in AccountBalanceCard; keep placeholder to avoid unused vars
  const fetchUSDCBalance = async () => {};

  useEffect(() => {
    if (mounted && connected && publicKey) {
      fetchUSDCBalance();
    } else if (mounted && !connected) {
      setUsdcBalance(0);
    }
  }, [mounted, connected, publicKey]);

  const addNewContract = (contractData: any) => {
    const newContract = {
      id: `LB25NNEO${Date.now().toString().slice(-5)}`,
      route: `${contractData.fromCountry} → ${contractData.toCountry}`,
      amount: `${contractData.contractValue} USDC`,
      weight: `${contractData.weight}kg`,
      date: new Date().toLocaleDateString('ko-KR', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      }).replace(/\./g, '.').replace(/\s/g, ''),
      status: 'Pending',
      statusColor: 'bg-orange-500',
      // Additional details for contract detail modal
      exporter: contractData.exporter,
      importer: contractData.importer,
      fromCountry: contractData.fromCountry,
      toCountry: contractData.toCountry,
      contractValue: contractData.contractValue,
      depositRate: contractData.depositRate,
      expiredDate: contractData.expiredDate,
      contractTerms: contractData.contractTerms,
      uploadedFile: contractData.uploadedFile
    };
    
    setContracts(prev => [newContract, ...prev]);
  };

  // Calculate total amount from all contracts
  const calculateTotalAmount = () => {
    return contracts.reduce((total, contract) => {
      const amount = parseFloat(contract.amount.replace(/[^\d.]/g, ''));
      return total + (isNaN(amount) ? 0 : amount);
    }, 0);
  };

  return (
    <WalletConnect>
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
        {/* Header */}
        <header className="flex justify-between items-center p-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-400 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Tradesee</h1>
          </div>
          <div className="flex items-center space-x-4">
            {mounted ? <WalletMultiButton /> : null}
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Create New Trade
            </button>
          </div>
        </header>

        <div className="px-6 pb-6">
          {/* Account Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <AccountBalanceCard />
            <div className="bg-blue-400/20 backdrop-blur-sm rounded-xl p-6 border border-blue-300/20">
              <p className="text-white/80 text-sm mb-2">Total Amount</p>
              <p className="text-white text-2xl font-bold">{calculateTotalAmount().toLocaleString()} USDC</p>
            </div>
            <div className="bg-blue-400/20 backdrop-blur-sm rounded-xl p-6 border border-blue-300/20">
              <p className="text-white/80 text-sm mb-2">My Trades</p>
              <p className="text-white text-2xl font-bold">{contracts.length}</p>
            </div>
            <div className="bg-blue-400/20 backdrop-blur-sm rounded-xl p-6 border border-blue-300/20">
              <p className="text-white/80 text-sm mb-2">Contract In Progress</p>
              <p className="text-white text-2xl font-bold">{contracts.filter(c => c.status === 'Pending' || c.status === 'In transit').length}</p>
            </div>
          </div>

                {/* Trade List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {contracts.map((trade) => (
              <div 
                key={trade.id} 
                className="bg-blue-400/20 backdrop-blur-sm rounded-xl p-6 border border-blue-300/20 cursor-pointer hover:bg-blue-400/30 transition-colors"
                onClick={() => {
                  setSelectedContract(trade);
                  setShowContractDetail(true);
                }}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-white font-bold text-lg">{trade.id}</h3>
                  <span className={`${trade.statusColor} text-white px-3 py-1 rounded-full text-xs font-medium`}>
                    {trade.status}
                  </span>
                </div>
                <div className="space-y-2">
                  <p className="text-white/90">{trade.route}</p>
                  <div className="flex justify-between text-white/80 text-sm">
                    <span>{trade.amount}</span>
                    <span>{trade.weight}</span>
                    <span>{trade.date}</span>
                  </div>
                </div>
              </div>
                  ))}
                </div>

          {/* Profile Button */}
          <div className="fixed bottom-6 right-6">
            <button
              onClick={() => setShowProfileModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full shadow-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
          </div>
        </div>

              {/* Modals */}
              {showCreateModal && (
                <CreateContractModal 
                  onClose={() => setShowCreateModal(false)}
                  onContractCreated={addNewContract}
                />
              )}
              {showContractDetail && selectedContract && (
                <ContractDetailModal 
                  contract={selectedContract}
                  onClose={() => {
                    setShowContractDetail(false);
                    setSelectedContract(null);
                  }}
                />
              )}
        {showProfileModal && (
          <ProfileModal onClose={() => setShowProfileModal(false)} />
        )}
      </div>
    </WalletConnect>
  );
}

export default dynamic(() => Promise.resolve(HomePage), { ssr: false });
