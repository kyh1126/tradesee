import { PublicKey } from '@solana/web3.js';
import { AnchorProvider } from '@coral-xyz/anchor';
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import { randomBytes, createHash } from 'crypto';

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

/**
 * Derive the SPL (Token Program) ATA for a given mint/owner.
 * Note: On-chain program currently uses classic SPL Token CPI, so this is
 * the ATA used for transactions in tests. Token-2022 balances should be
 * handled by a separate finder for read-only flows.
 */
export function deriveSplAta(mint: PublicKey, owner: PublicKey): PublicKey {
  return getAssociatedTokenAddressSync(mint, owner, false, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
}

/**
 * Derive the Token-2022 ATA for a given mint/owner (read-side support).
 */
export function deriveToken2022Ata(mint: PublicKey, owner: PublicKey): PublicKey {
  return getAssociatedTokenAddressSync(mint, owner, false, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
}

/**
 * Find an existing ATA among SPL and Token-2022. Useful for balance queries.
 */
export async function findExistingAtaAny(
  provider: AnchorProvider,
  mint: PublicKey,
  owner: PublicKey
): Promise<{ ata: PublicKey; programId: PublicKey } | null> {
  const splAta = deriveSplAta(mint, owner);
  const t22Ata = deriveToken2022Ata(mint, owner);

  const [splInfo, t22Info] = await Promise.all([
    provider.connection.getAccountInfo(splAta),
    provider.connection.getAccountInfo(t22Ata),
  ]);

  if (splInfo) return { ata: splAta, programId: TOKEN_PROGRAM_ID };
  if (t22Info) return { ata: t22Ata, programId: TOKEN_2022_PROGRAM_ID };
  return null;
}

/**
 * For tx construction with classic SPL program. If not exists, the tx creating
 * instructions should include ATA creation externally. Tests may create it.
 */
export async function getOrCreateAta(
  provider: AnchorProvider,
  mint: PublicKey,
  owner: PublicKey
): Promise<PublicKey> {
  const ata = deriveSplAta(mint, owner);
  // If absent, caller should add create ATA ix; here we just return address.
  // Keep signature for backward compatibility.
  return ata;
}

export async function airdropSolIfNeeded(
  provider: AnchorProvider,
  pubkey: PublicKey,
  amount: number = 1
): Promise<void> {
  const balance = await provider.connection.getBalance(pubkey);
  if (balance < amount * 1e9) {
    const sig = await provider.connection.requestAirdrop(pubkey, amount * 1e9);
    const latest = await provider.connection.getLatestBlockhash();
    await provider.connection.confirmTransaction({ signature: sig, ...latest }, 'confirmed');
  }
}

export function generateContractId(): number[] {
  const rnd = randomBytes(32);
  return Array.from(rnd);
}

export function hashDocument(content: string | Buffer): number[] {
  const buf = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8');
  const digest = createHash('sha256').update(buf).digest();
  // Ensure 32 bytes
  return Array.from(digest.subarray(0, 32));
}
