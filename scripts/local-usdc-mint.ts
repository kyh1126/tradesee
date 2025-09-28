import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';

const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8899';

async function createLocalUSDC() {
  const connection = new Connection(RPC_URL, 'confirmed');
  const payer = Keypair.generate();
  
  console.log('Creating payer keypair...');
  console.log('Payer public key:', payer.publicKey.toString());
  
  // Airdrop SOL to payer
  console.log('Requesting airdrop...');
  const signature = await connection.requestAirdrop(payer.publicKey, 2 * 1e9);
  await connection.confirmTransaction(signature);
  console.log('Airdrop confirmed:', signature);

  // Create USDC mint
  console.log('Creating USDC mint...');
  const usdcMint = await createMint(
    connection,
    payer,
    payer.publicKey,
    null,
    6 // USDC has 6 decimals
  );

  console.log('USDC Mint created:', usdcMint.toString());
  console.log('Add this to your .env file:');
  console.log(`USDC_MINT=${usdcMint.toString()}`);

  // Create token account for payer and mint some USDC
  console.log('Creating token account...');
  const tokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    usdcMint,
    payer.publicKey
  );

  console.log('Minting USDC...');
  await mintTo(
    connection,
    payer,
    usdcMint,
    tokenAccount.address,
    payer,
    1000000 * 1e6 // 1M USDC
  );

  console.log('Minted 1,000,000 USDC to:', tokenAccount.address.toString());
  console.log('Payer keypair (save this):', Array.from(payer.secretKey));
}

createLocalUSDC().catch(console.error);
