import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { TradeseeEscrow } from '../target/types/tradesee_escrow';

export function deriveContractPda(
  programId: PublicKey,
  initializer: PublicKey,
  contractId: number[]
): [PublicKey, number] {
  const contractIdBytes = new Uint8Array(contractId);
  return PublicKey.findProgramAddressSync(
    [Buffer.from('contract'), initializer.toBuffer(), contractIdBytes],
    programId
  );
}

export function deriveEscrowVaultPda(
  programId: PublicKey,
  contract: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('escrow_vault'), contract.toBuffer()],
    programId
  );
}

export function deriveTrustScorePda(
  programId: PublicKey,
  authority: PublicKey,
  counterparty: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('trust'), authority.toBuffer(), counterparty.toBuffer()],
    programId
  );
}

export function deriveOracleFlagPda(
  programId: PublicKey,
  contract: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('oracle'), contract.toBuffer()],
    programId
  );
}

export async function getOrCreateAta(
  provider: AnchorProvider,
  mint: PublicKey,
  owner: PublicKey
): Promise<PublicKey> {
  const [ata] = await PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  try {
    await provider.connection.getAccountInfo(ata);
    return ata;
  } catch (error) {
    // ATA doesn't exist, will be created by the instruction
    return ata;
  }
}

export async function airdropSolIfNeeded(
  provider: AnchorProvider,
  pubkey: PublicKey,
  amount: number = 1
): Promise<void> {
  const balance = await provider.connection.getBalance(pubkey);
  if (balance < amount * 1e9) {
    const signature = await provider.connection.requestAirdrop(pubkey, amount * 1e9);
    await provider.connection.confirmTransaction(signature);
  }
}

export function generateContractId(): number[] {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)));
}

export function hashDocument(content: string): number[] {
  // Simple hash function - in production, use proper hashing
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hash = new Uint8Array(32);
  for (let i = 0; i < data.length && i < 32; i++) {
    hash[i] = data[i];
  }
  return Array.from(hash);
}
