import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import { TradeseeEscrow } from './idl/tradesee_escrow';
import { TradeseeClient } from './sdk';

const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID!);
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;
const USDC_MINT = new PublicKey(process.env.NEXT_PUBLIC_USDC_MINT!);

let program: Program<TradeseeEscrow> | null = null;
let client: TradeseeClient | null = null;

export function getProgram(wallet: Wallet): Program<TradeseeEscrow> {
  if (!program) {
    const connection = new Connection(RPC_URL, 'confirmed');
    const provider = new AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
    });
    program = new Program(TradeseeEscrow as any, provider);
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
