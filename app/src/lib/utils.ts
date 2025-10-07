export function hashDocument(content: string): number[] {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hash = new Uint8Array(32);
  for (let i = 0; i < data.length && i < 32; i++) {
    hash[i] = data[i];
  }
  return Array.from(hash);
}

export async function computeSHA256(content: string): Promise<string> {
  // Use Web Crypto API for actual SHA256
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function generateSolanaPayURL(recipient: string, amount: number, label?: string): string {
  const baseURL = 'https://solana-pay.vercel.app';
  const params = new URLSearchParams({
    recipient,
    amount: amount.toString(),
    ...(label && { label }),
  });
  return `${baseURL}?${params.toString()}`;
}

import { PublicKey } from '@solana/web3.js';
import { AnchorProvider } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';

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
  const [ata] = PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  try {
    await provider.connection.getAccountInfo(ata);
    return ata;
  } catch {
    return ata;
  }
}


