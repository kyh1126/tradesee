import { PublicKey, Transaction, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { TradeseeEscrow } from '../idl/tradesee_escrow';
import { 
  deriveContractPda, 
  deriveEscrowVaultPda, 
  deriveTrustScorePda, 
  deriveOracleFlagPda,
  getOrCreateAta,
} from '../../lib/utils';

export type CreateContractParams = {
  seller: PublicKey;
  amountExpected: number;
  milestonesTotal: number;
  expiryTs: number;
  autoReleaseOnExpiry: boolean;
  docHash: number[];
  usdcMint: PublicKey;
};

export class TradeseeClient {
  constructor(
    public program: Program<TradeseeEscrow>,
    public provider: AnchorProvider
  ) {}

  async createContract(params: CreateContractParams): Promise<[PublicKey, Transaction]> {
    const contractId = Array.from(crypto.getRandomValues(new Uint8Array(32)));
    const [contractPda] = deriveContractPda(this.program.programId, this.provider.wallet.publicKey, contractId);
    const [escrowVaultPda] = deriveEscrowVaultPda(this.program.programId, contractPda);

    const tx = await (this.program as any).methods
      .initializeContract(
        contractId,
        params.seller,
        new anchor.BN(params.amountExpected),
        params.milestonesTotal,
        new anchor.BN(params.expiryTs),
        params.autoReleaseOnExpiry,
        params.docHash
      )
      .accounts({
        contract: contractPda,
        initializer: this.provider.wallet.publicKey,
        usdcMint: params.usdcMint,
        escrowVault: escrowVaultPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .transaction();

    return [contractPda, tx];
  }
}


