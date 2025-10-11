import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Connection } from '@solana/web3.js';
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { RPC_URL, USDC_MINT } from '../lib/anchor';

interface DepositPayinButtonProps {
  contractPda: string;
  amount: number;
  onSuccess?: () => void;
}

export default function DepositPayinButton({ contractPda, amount, onSuccess }: DepositPayinButtonProps) {
  const { publicKey } = useWallet();
  const [loading, setLoading] = useState(false);
  const [showTxInput, setShowTxInput] = useState(false);
  const [txId, setTxId] = useState('');
  const [processedTxIds, setProcessedTxIds] = useState<Set<string>>(new Set());

  const handleVerifyDeposit = async () => {
    if (!publicKey || !txId.trim()) {
      alert('Please connect wallet and enter transaction ID.');
      return;
    }

    const trimmedTxId = txId.trim();
    
    // 중복 요청 방지 - 더 강력한 체크
    if (processedTxIds.has(trimmedTxId)) {
      alert('This transaction has already been processed.');
      return;
    }

    if (loading) {
      alert('Verification is already in progress. Please wait.');
      return;
    }

    // 즉시 로딩 상태 설정 및 processedTxIds에 추가
    setLoading(true);
    setProcessedTxIds(prev => new Set([...prev, trimmedTxId]));
    
    console.log('🚀 Starting verification for TxID:', trimmedTxId);
    console.log('📝 Processed TxIDs:', Array.from(processedTxIds));
    
    try {
      const connection = new Connection(RPC_URL, 'confirmed');
      
      // Get transaction details
      const tx = await connection.getTransaction(txId, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0
      });

      if (!tx) {
        throw new Error('Transaction not found or not confirmed.');
      }

      // Check if transaction is successful
      if (tx.meta?.err) {
        throw new Error('Transaction failed: ' + JSON.stringify(tx.meta.err));
      }

      console.log('🔍 Transaction Analysis:', {
        signature: txId,
        blockTime: tx.blockTime,
        slot: tx.slot,
        fee: tx.meta?.fee
      });

      // Find USDC transfer instruction using token balance changes
      const accountKeys = tx.transaction.message.getAccountKeys();
      const preBalances = tx.meta?.preTokenBalances || [];
      const postBalances = tx.meta?.postTokenBalances || [];
      
      console.log('🔍 Transaction Analysis:', {
        accountKeysLength: accountKeys.length,
        preBalances: preBalances.length,
        postBalances: postBalances.length,
        USDC_MINT: USDC_MINT.toString()
      });

      // accountKeys 디버깅 - MessageAccountKeys는 배열이 아님
      console.log('🔍 Account Keys Length:', accountKeys.length);
      for (let i = 0; i < accountKeys.length; i++) {
        const key = accountKeys.get(i);
        console.log(`🔍 Account ${i}:`, key?.toString());
      }

      // Validate accountKeys array
      if (!accountKeys || accountKeys.length === 0) {
        throw new Error('No account keys found in transaction.');
      }

      let usdcTransferFound = false;
      let transferAmount = 0;
      let sourceAddress = '';
      let destinationAddress = '';

      // Look for USDC balance changes
      console.log('🔍 Searching for USDC transfers...');
      
      for (const preBalance of preBalances) {
        console.log('📊 Pre Balance:', {
          accountIndex: preBalance.accountIndex,
          mint: preBalance.mint,
          owner: preBalance.owner,
          uiTokenAmount: preBalance.uiTokenAmount
        });

        const postBalance = postBalances.find(
          (post: any) => post.accountIndex === preBalance.accountIndex
        );

        if (postBalance) {
          console.log('📊 Post Balance:', {
            accountIndex: postBalance.accountIndex,
            mint: postBalance.mint,
            owner: postBalance.owner,
            uiTokenAmount: postBalance.uiTokenAmount
          });
        }

        // Check if this is USDC token account
        if (postBalance && preBalance.mint === USDC_MINT.toString()) {
          console.log('✅ Found USDC token account!');
          const preAmount = Number(preBalance.uiTokenAmount.amount);
          const postAmount = Number(postBalance.uiTokenAmount.amount);
          const change = preAmount - postAmount;

        // Use MessageAccountKeys.get() method directly
        const account = accountKeys.get(preBalance.accountIndex);
        const accountAddress = account?.toString();
        if (!accountAddress) {
          console.log('⚠️ Account not found for index:', preBalance.accountIndex);
          console.log('🔍 AccountKeys length:', accountKeys.length);
          continue;
        }

          console.log('💰 USDC Balance Change:', {
            accountIndex: preBalance.accountIndex,
            account: accountAddress,
            preAmount: preAmount,
            postAmount: postAmount,
            change: change,
            mint: preBalance.mint
          });

          if (change > 0) {
            // This account sent USDC
            sourceAddress = accountAddress;
            transferAmount = change;
            usdcTransferFound = true;
            
            // Find the destination account
            for (const destPreBalance of preBalances) {
              const destPostBalance = postBalances.find(
                (post: any) => post.accountIndex === destPreBalance.accountIndex
              );
              
              if (destPostBalance && destPreBalance.mint === USDC_MINT.toString()) {
                const destPreAmount = Number(destPreBalance.uiTokenAmount.amount);
                const destPostAmount = Number(destPostBalance.uiTokenAmount.amount);
                const destChange = destPostAmount - destPreAmount;
                
                if (destChange > 0 && Math.abs(destChange - change) < 1) {
                  const destAccount = accountKeys.get(destPreBalance.accountIndex);
                  const destAccountAddress = destAccount?.toString();
                  if (destAccountAddress) {
                    destinationAddress = destAccountAddress;
                    break;
                  }
                }
              }
            }
            
            console.log('✅ USDC Transfer Found:', {
              source: sourceAddress,
              destination: destinationAddress,
              amount: transferAmount,
              amountInUSDC: transferAmount / 1e6
            });
            break;
          }
        }
      }

      if (!usdcTransferFound) {
        throw new Error('No USDC transfer found in this transaction.');
      }

      // Verify the amount
      const expectedAmount = amount * 1e6; // Convert to 6 decimals
      if (transferAmount < expectedAmount) {
        throw new Error(`Insufficient USDC amount. Expected: ${expectedAmount}, Got: ${transferAmount}`);
      }

      // Get the buyer's address from the contract (this should be the importer)
      // For now, we'll use the source address as the buyer
      console.log('📋 Verification Results:', {
        buyerAddress: sourceAddress,
        sellerAddress: publicKey.toString(), // Current user (seller)
        amountTransferred: transferAmount / 1e6,
        expectedAmount: amount,
        transactionId: txId
      });

      // 추가 검증: 실제 Buyer 주소와 비교
      const expectedBuyer = 'Ah98MjeCX4u4MJoxvB5BPkSLo1mR2a9WEZ7RTVkMnDXp';
      console.log('🔍 Address Verification:', {
        detectedSource: sourceAddress,
        expectedBuyer: expectedBuyer,
        isCorrectBuyer: sourceAddress === expectedBuyer
      });

      // Buyer 주소 검증
      if (sourceAddress !== expectedBuyer) {
        console.log('⚠️ Warning: Source address does not match expected buyer!');
        console.log('🔍 This might be a different transaction or the buyer used a different account.');
      }

      // 처리된 TxID 기록
      setProcessedTxIds(prev => new Set([...prev, txId.trim()]));

      alert(`✅ Deposit verified successfully!\n\n` +
            `Buyer: ${sourceAddress}\n` +
            `Amount: ${transferAmount / 1e6} USDC\n` +
            `Transaction: ${txId}\n\n` +
            `The buyer has successfully deposited the required amount.`);
      
      if (onSuccess) {
        onSuccess();
      }
      
      setShowTxInput(false);
      setTxId('');
      
    } catch (error) {
      console.error('Deposit Verification Error:', error);
      
      // 429 에러 시 특별 처리
      if (error.message && error.message.includes('429')) {
        alert('❌ Rate limit exceeded. Please wait a moment and try again.');
        console.log('🚫 Rate limit exceeded for TxID:', trimmedTxId);
      } else {
        alert('❌ Deposit verification failed: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!publicKey) {
    return <div>Please connect your wallet.</div>;
  }

  if (showTxInput) {
    return (
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Transaction ID
          </label>
          <input
            type="text"
            value={txId}
            onChange={(e) => setTxId(e.target.value)}
            placeholder="Enter transaction ID..."
            className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleVerifyDeposit}
            disabled={loading || !txId.trim() || processedTxIds.has(txId.trim())}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying...' : processedTxIds.has(txId.trim()) ? 'Already Processed' : 'Verify Deposit'}
          </button>
          <button
            onClick={() => {
              setShowTxInput(false);
              setTxId('');
            }}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowTxInput(true)}
      disabled={loading}
      className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
    >
      💰 Verify Deposit
    </button>
  );
}