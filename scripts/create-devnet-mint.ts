#!/usr/bin/env ts-node

import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import {
  createMint,
  createAssociatedTokenAccount,
  mintTo,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token';
import { AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const RPC_URL = 'https://api.devnet.solana.com';
const MINT_AMOUNT = 100; // 100 tokens
const DECIMALS = 6;

async function createDevnetMint() {
  console.log('🚀 Creating Devnet USDC mint...');
  
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
    console.log('⚠️  Low SOL balance. Please request airdrop manually:');
    console.log(`   solana airdrop 2 --url ${RPC_URL}`);
    console.log('   Or use a different RPC endpoint if this one is down.');
    return;
  }
  
  try {
    // Try SPL Token first
    console.log('🔧 Creating SPL Token mint...');
    const mint = await createMint(
      connection,
      walletKeypair,
      wallet.publicKey,
      null,
      DECIMALS
    );
    
    console.log(`✅ Created SPL Token mint: ${mint.toString()}`);
    
    // Create ATA for the wallet
    const ata = await createAssociatedTokenAccount(
      connection,
      walletKeypair,
      mint,
      wallet.publicKey
    );
    
    console.log(`✅ Created ATA: ${ata.toString()}`);
    
    // Mint tokens to the wallet
    const mintAmount = MINT_AMOUNT * Math.pow(10, DECIMALS);
    await mintTo(
      connection,
      walletKeypair,
      mint,
      ata,
      wallet.publicKey,
      mintAmount
    );
    
    console.log(`✅ Minted ${MINT_AMOUNT} tokens to ${wallet.publicKey.toString()}`);
    
    // Verify balance
    const tokenBalance = await connection.getTokenAccountBalance(ata);
    console.log(`💰 Token Balance: ${tokenBalance.value.uiAmount} tokens`);
    
    // Output for .env files
    console.log('\n📋 Environment Variables:');
    console.log(`NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com`);
    console.log(`NEXT_PUBLIC_USDC_MINT=${mint.toString()}`);
    console.log(`NEXT_PUBLIC_PROGRAM_ID=<will_be_set_after_deploy>`);
    
    // Write to .env files
    const envContent = `# Devnet Configuration
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_USDC_MINT=${mint.toString()}
NEXT_PUBLIC_PROGRAM_ID=<will_be_set_after_deploy>

# App Configuration
NEXT_PUBLIC_APP_NAME=Tradesee
NEXT_PUBLIC_APP_VERSION=0.1.0
NEXT_PUBLIC_DEBUG_MODE=true
`;
    
    const fs = require('fs');
    const path = require('path');
    
    // Write to app/.env.local
    fs.writeFileSync(path.join(__dirname, '..', 'app', '.env.local'), envContent);
    console.log('✅ Updated app/.env.local');
    
    // Note: tests/ folder doesn't need .env file
    // Tests use anchor.AnchorProvider.env() and hardcoded values
    
    console.log('\n🎉 Devnet mint setup complete!');
    console.log('Next steps:');
    console.log('1. Run: anchor deploy --provider.cluster devnet');
    console.log('2. Update PROGRAM_ID in .env files');
    console.log('3. Run: npm run dev');
    
  } catch (error) {
    console.error('❌ Error creating mint:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  createDevnetMint().catch(console.error);
}

export { createDevnetMint };
