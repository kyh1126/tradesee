#!/usr/bin/env ts-node

import { Connection, PublicKey, Keypair, SystemProgram } from '@solana/web3.js';
import { AnchorProvider, Wallet, Program, BN } from '@coral-xyz/anchor';
import { 
  createAssociatedTokenAccount, 
  getAssociatedTokenAddress, 
  getAccount,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID
} from '@solana/spl-token';
import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { randomBytes } from 'crypto';

const RPC_URL = 'https://api.devnet.solana.com';
const PROGRAM_ID = new PublicKey('J6w1gENjjbx8XG6ECtwWqfjmoPFHwtz9wqx2jj84qk5t');
const USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');

async function devnetRealE2E() {
  console.log('🚀 Starting Real Devnet E2E Test...');
  
  try {
    // Connect to Devnet
    const connection = new Connection(RPC_URL, 'confirmed');
    
    // Load wallet
    const walletPath = join(homedir(), '.config', 'solana', 'id.json');
    const walletKeypair = Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(readFileSync(walletPath, 'utf8')))
    );
    
    const wallet = new Wallet(walletKeypair);
    const provider = new AnchorProvider(connection, wallet, {});
    
    console.log(`📱 Wallet: ${wallet.publicKey.toString()}`);
    
    // Check SOL balance
    const balance = await connection.getBalance(wallet.publicKey);
    console.log(`💰 SOL Balance: ${balance / 1e9} SOL`);
    
    if (balance < 0.1e9) {
      console.log('⚠️  Low SOL balance. Requesting airdrop...');
      const signature = await connection.requestAirdrop(wallet.publicKey, 2e9);
      await connection.confirmTransaction(signature);
      console.log('✅ Airdrop received');
    }
    
    // Check USDC balance
    const ata = await getAssociatedTokenAddress(USDC_MINT, wallet.publicKey);
    let usdcBalance = 0;
    
    try {
      const tokenAccount = await getAccount(connection, ata);
      usdcBalance = Number(tokenAccount.amount) / Math.pow(10, 6);
      console.log(`🪙 USDC Balance: ${usdcBalance} tokens`);
    } catch (error) {
      console.log('⚠️  USDC ATA not found. Creating...');
      await createAssociatedTokenAccount(connection, walletKeypair, USDC_MINT, wallet.publicKey);
      console.log('✅ USDC ATA created');
    }
    
    if (usdcBalance < 10) {
      console.log('⚠️  Insufficient USDC balance. Please add USDC to your wallet.');
      return;
    }
    
    // Load program
    const idl = JSON.parse(readFileSync('target/idl/tradesee_escrow.json', 'utf8'));
    const program = new Program(idl, provider);
    
    console.log(`📦 Program ID: ${PROGRAM_ID.toString()}`);
    
    // Generate test data
    const contractId = Array.from(randomBytes(32));
    const seller = Keypair.generate();
    const amountExpected = 1000000; // 1 USDC (6 decimals)
    const milestonesTotal = 2;
    const expiryTs = Math.floor(Date.now() / 1000) + 86400; // 24 hours
    const autoReleaseOnExpiry = true;
    const docHash = Array.from(randomBytes(32));
    
    console.log(`📄 Contract ID: ${Buffer.from(contractId).toString('hex')}`);
    console.log(`👤 Seller: ${seller.publicKey.toString()}`);
    console.log(`💰 Amount: ${amountExpected / 1e6} USDC`);
    console.log(`⏰ Expiry: ${new Date(expiryTs * 1000).toISOString()}`);
    
    // Create PDAs
    const [contractPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('contract'), wallet.publicKey.toBuffer(), Buffer.from(contractId)],
      PROGRAM_ID
    );
    
    const [escrowVaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('escrow_vault'), contractPda.toBuffer()],
      PROGRAM_ID
    );
    
    console.log(`📦 Contract PDA: ${contractPda.toString()}`);
    console.log(`🏦 Escrow Vault PDA: ${escrowVaultPda.toString()}`);
    
    // Check if contract already exists
    const contractInfo = await connection.getAccountInfo(contractPda);
    if (contractInfo) {
      console.log('⚠️  Contract already exists. Skipping creation.');
      return;
    }
    
    console.log('\n🔨 Creating contract...');
    
    // Create contract
    const tx = await program.methods
      .initializeContract(
        contractId,
        seller.publicKey,
        new BN(amountExpected),
        milestonesTotal,
        new BN(expiryTs),
        autoReleaseOnExpiry,
        docHash
      )
      .accounts({
        contract: contractPda,
        escrowVault: escrowVaultPda,
        initializer: wallet.publicKey,
        usdcMint: USDC_MINT,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    
    console.log(`✅ Contract created: ${tx}`);
    
    // Wait for confirmation
    await connection.confirmTransaction(tx);
    console.log('✅ Transaction confirmed');
    
    // Check contract state
    const contractAccount: any = await (program.account as any).contract.fetch(contractPda);
    console.log('📋 Contract State:');
    console.log(`  - Initializer: ${contractAccount.initializer.toString()}`);
    console.log(`  - Seller: ${contractAccount.seller.toString()}`);
    console.log(`  - Amount: ${contractAccount.amountExpected.toString()}`);
    console.log(`  - Status: ${JSON.stringify(contractAccount.status)}`);
    
    console.log('\n🎉 Real Devnet E2E Test Complete!');
    console.log('✅ Contract successfully created on Devnet');
    console.log('✅ All transactions confirmed');
    console.log('\nNext steps:');
    console.log('1. Run: npm run dev');
    console.log('2. Open: http://localhost:3000');
    console.log('3. Connect Phantom wallet (Devnet network)');
    console.log('4. Test contract interaction in browser');
    
  } catch (error) {
    console.error('❌ Real E2E Test failed:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  devnetRealE2E().catch(console.error);
}

export { devnetRealE2E };
