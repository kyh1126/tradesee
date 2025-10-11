'use client';

import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { RPC_URL, USDC_MINT } from '../lib/anchor';

export default function AccountBalanceCard() {
  const { publicKey, connected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);

  const fetchBalance = async () => {
    if (!connected || !publicKey) {
      setBalance(0);
      return;
    }

    setLoading(true);
    try {
      const connection = new Connection(RPC_URL, 'confirmed');
      
      // Debug logs
      console.log('🔍 USDC Balance Debug:');
      console.log('RPC URL:', RPC_URL);
      console.log('USDC Mint:', USDC_MINT.toString());
      console.log('Wallet:', publicKey.toString());

      const ataSpl = getAssociatedTokenAddressSync(USDC_MINT, publicKey, false, TOKEN_PROGRAM_ID);
      const ata22 = getAssociatedTokenAddressSync(USDC_MINT, publicKey, false, TOKEN_2022_PROGRAM_ID);
      
      console.log('SPL Token ATA:', ataSpl.toString());
      console.log('Token-2022 ATA:', ata22.toString());

      const getBal = async (ata: PublicKey, tokenType: string) => {
        try {
          const info = await connection.getTokenAccountBalance(ata);
          const decimals = info.value.decimals ?? 6;
          const balance = Number(info.value.amount) / Math.pow(10, decimals);
          console.log(`${tokenType} Balance:`, balance, 'tokens');
          return balance;
        } catch (error) {
          console.log(`${tokenType} ATA not found or error:`, error.message);
          return 0;
        }
      };

      const [b1, b2] = await Promise.all([
        getBal(ataSpl, 'SPL Token'),
        getBal(ata22, 'Token-2022')
      ]);
      
      const finalBalance = Math.max(b1, b2);
      console.log('Final Balance:', finalBalance);
      setBalance(finalBalance);
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
    // Re-fetch on reconnect
  }, [connected, publicKey]);

  return (
    <div className="bg-blue-400/20 backdrop-blur-sm rounded-xl p-6 border border-blue-300/20">
      <p className="text-white/80 text-sm mb-2">My Account</p>
      <p className="text-white text-2xl font-bold">
        {!connected ? 'Connect Wallet' : loading ? 'Loading...' : `${balance.toLocaleString()} USDC`}
      </p>
    </div>
  );
}


