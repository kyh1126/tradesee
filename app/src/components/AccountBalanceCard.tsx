'use client';

import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { RPC_URL, USDC_MINT } from '../lib/anchor';
import { createRateLimitedConnection } from '../lib/utils';

export default function AccountBalanceCard() {
  const { publicKey, connected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);

  const fetchBalance = async () => {
    if (!connected || !publicKey) {
      setBalance(0);
      return;
    }

    if (loading) {
      console.log('🚫 Balance fetch already in progress. Skipping duplicate request.');
      return;
    }

    setLoading(true);
    try {
      // RPC 호출 최적화: 캐시된 연결 사용
      const connection = new Connection(RPC_URL, {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000,
        disableRetryOnRateLimit: true, // Rate limit 시 재시도 방지
      });
      
      const ataSpl = getAssociatedTokenAddressSync(USDC_MINT, publicKey, false, TOKEN_PROGRAM_ID);
      const ata22 = getAssociatedTokenAddressSync(USDC_MINT, publicKey, false, TOKEN_2022_PROGRAM_ID);

      // SPL Token만 먼저 시도 (Token-2022는 필요시에만)
      try {
        const info = await connection.getTokenAccountBalance(ataSpl);
        const decimals = info.value.decimals ?? 6;
        const balance = Number(info.value.amount) / Math.pow(10, decimals);
        setBalance(balance);
        return; // SPL Token에서 성공하면 Token-2022는 시도하지 않음
      } catch (error) {
        // SPL Token 실패 시에만 Token-2022 시도
        try {
          const info = await connection.getTokenAccountBalance(ata22);
          const decimals = info.value.decimals ?? 6;
          const balance = Number(info.value.amount) / Math.pow(10, decimals);
          setBalance(balance);
        } catch (error2) {
          setBalance(0);
        }
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance(0);
      
      // 429 에러 시 더 이상 재시도하지 않음
      if (error.message && error.message.includes('429')) {
        console.log('🚫 Rate limit exceeded. Stopping balance checks.');
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 자동 새로고침 완전 비활성화 (Rate Limit 방지)
    // 사용자가 수동으로 Refresh 버튼을 클릭해야만 업데이트
    if (connected && publicKey) {
      // fetchBalance(); // 자동 호출 비활성화
    }
  }, [connected, publicKey]);

  return (
    <div className="bg-blue-400/20 backdrop-blur-sm rounded-xl p-6 border border-blue-300/20">
      <div className="flex justify-between items-center mb-2">
        <p className="text-white/80 text-sm">My Account</p>
        <button
          onClick={fetchBalance}
          disabled={loading}
          className="text-white/60 hover:text-white text-xs px-2 py-1 rounded hover:bg-white/10 transition-colors"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
      <p className="text-white text-2xl font-bold">
        {!connected ? 'Connect Wallet' : loading ? 'Loading...' : `${balance.toLocaleString()} USDC`}
      </p>
    </div>
  );
}


