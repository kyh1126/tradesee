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
  // Solana Pay UI 버그로 인해 직접 QR 코드 생성
  const usdcMint = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
  const solanaPayUrl = `solana:${recipient}?amount=${amount}&token=${usdcMint}&label=${encodeURIComponent(label || 'Tradesee Payment')}`;
  return solanaPayUrl;
}

// QR 코드 생성 함수 추가
export function generateQRCodeData(recipient: string, amount: number, label?: string): string {
  const usdcMint = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
  return `solana:${recipient}?amount=${amount}&token=${usdcMint}&label=${encodeURIComponent(label || 'Tradesee Payment')}`;
}

import { PublicKey } from '@solana/web3.js';
import { AnchorProvider } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';

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

// Get USDC mint from environment variables
export function getUsdcMint(): PublicKey {
  // Default to Phantom wallet devnet USDC mint if not set
  const usdcMint = process.env.NEXT_PUBLIC_USDC_MINT || '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
  return new PublicKey(usdcMint);
}

// Get RPC URL from environment variables
export function getRpcUrl(): string {
  // Default to official Solana Devnet RPC if not set
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://api.devnet.solana.com';
  
  // Ensure we're using official Solana Devnet RPC
  if (!rpcUrl.includes('api.devnet.solana.com')) {
    throw new Error('Only official Solana Devnet RPC (https://api.devnet.solana.com) is supported.');
  }
  
  return rpcUrl;
}

// Rate limit 방지를 위한 요청 지연 함수
export function createRateLimitedConnection(connection: any) {
  let lastRequestTime = 0;
  const minInterval = 200; // 200ms 간격으로 요청 제한
  
  return {
    ...connection,
    getTokenAccountBalance: async (address: any, commitment?: any) => {
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime;
      
      if (timeSinceLastRequest < minInterval) {
        await new Promise(resolve => setTimeout(resolve, minInterval - timeSinceLastRequest));
      }
      
      lastRequestTime = Date.now();
      return connection.getTokenAccountBalance(address, commitment);
    }
  };
}

// Support both SPL Token and Token-2022
export async function getOrCreateAtaWithTokenProgram(
  provider: AnchorProvider,
  mint: PublicKey,
  owner: PublicKey,
  tokenProgram: PublicKey = TOKEN_PROGRAM_ID
): Promise<PublicKey> {
  const [ata] = PublicKey.findProgramAddressSync(
    [owner.toBuffer(), tokenProgram.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  try {
    await provider.connection.getAccountInfo(ata);
    return ata;
  } catch {
    return ata;
  }
}

// Try both SPL Token and Token-2022 for ATA creation
export async function getOrCreateAtaUniversal(
  provider: AnchorProvider,
  mint: PublicKey,
  owner: PublicKey
): Promise<{ ata: PublicKey; tokenProgram: PublicKey }> {
  try {
    // Try SPL Token first
    const ata = await getOrCreateAtaWithTokenProgram(provider, mint, owner, TOKEN_PROGRAM_ID);
    const accountInfo = await provider.connection.getAccountInfo(ata);
    if (accountInfo) {
      return { ata, tokenProgram: TOKEN_PROGRAM_ID };
    }
  } catch (error) {
    console.log('SPL Token ATA not found, trying Token-2022...');
  }

  try {
    // Try Token-2022
    const ata = await getOrCreateAtaWithTokenProgram(provider, mint, owner, TOKEN_2022_PROGRAM_ID);
    const accountInfo = await provider.connection.getAccountInfo(ata);
    if (accountInfo) {
      return { ata, tokenProgram: TOKEN_2022_PROGRAM_ID };
    }
  } catch (error) {
    console.log('Token-2022 ATA not found');
  }

  // If neither exists, default to SPL Token
  const ata = await getOrCreateAtaWithTokenProgram(provider, mint, owner, TOKEN_PROGRAM_ID);
  return { ata, tokenProgram: TOKEN_PROGRAM_ID };
}


