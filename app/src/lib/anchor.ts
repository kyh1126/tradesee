import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import idl from './idl/tradesee_escrow.json';
import { TradeseeClient } from './sdk';
import { getRpcUrl, getUsdcMint } from './utils';

const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID || 'J6w1gENjjbx8XG6ECtwWqfjmoPFHwtz9wqx2jj84qk5t');
const RPC_URL = getRpcUrl();
const USDC_MINT = getUsdcMint();

let program: Program | null = null;
let client: TradeseeClient | null = null;

export function getProgram(wallet: Wallet): Program {
  if (!program) {
    try {
      const connection = new Connection(RPC_URL, 'confirmed');
      const provider = new AnchorProvider(connection, wallet, {
        commitment: 'confirmed',
      });
      
      // Log RPC URL for verification
      console.log('[AnchorProvider] Connected to', RPC_URL);
      console.log('Program ID:', PROGRAM_ID.toString());
      console.log('Mint:', USDC_MINT.toString());
      console.log('Environment Variables:');
      console.log('- NEXT_PUBLIC_RPC_URL:', process.env.NEXT_PUBLIC_RPC_URL);
      console.log('- NEXT_PUBLIC_USDC_MINT:', process.env.NEXT_PUBLIC_USDC_MINT);
      console.log('- NEXT_PUBLIC_PROGRAM_ID:', process.env.NEXT_PUBLIC_PROGRAM_ID);
      
      // Validate IDL before creating program
      if (!idl || !idl.instructions) {
        throw new Error('IDL is invalid or missing instructions');
      }
      
      console.log('IDL loaded:', idl.metadata?.name, idl.metadata?.version);
      console.log('Instructions count:', idl.instructions?.length);
      
      // Pass PROGRAM_ID explicitly; constructor expects (idl, provider, programId)
      program = new Program(idl as any, provider, PROGRAM_ID);
      console.log('✅ Program initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize program:', error);
      throw error;
    }
  }
  return program;
}

export function getClient(wallet: Wallet): TradeseeClient {
  if (!client) {
    const connection = new Connection(RPC_URL, 'confirmed');
    const provider = new AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
    });
    const program = getProgram(wallet);
    client = new TradeseeClient(program, provider);
  }
  return client;
}

export { PROGRAM_ID, RPC_URL, USDC_MINT };
