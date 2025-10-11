import { PublicKey, Transaction, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { TradeseeEscrow } from '../target/types/tradesee_escrow';
import { 
  deriveContractPda, 
  deriveEscrowVaultPda, 
  deriveTrustScorePda, 
  deriveOracleFlagPda,
  getOrCreateAta,
  generateContractId
} from './utils';
import { CreateContractParams } from './types';

export class TradeseeClient {
  constructor(
    public program: Program<TradeseeEscrow>,
    public provider: AnchorProvider
  ) {}

  async createContract(params: CreateContractParams): Promise<[PublicKey, Transaction]> {
    const contractId = generateContractId();
    const [contractPda] = deriveContractPda(this.program.programId, this.provider.wallet.publicKey, contractId);
    const [escrowVaultPda] = deriveEscrowVaultPda(this.program.programId, contractPda);

    const tx = await this.program.methods
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

  async depositPayin(contract: PublicKey, amount: number): Promise<Transaction> {
    const contractData = await this.program.account.contract.fetch(contract);
    const buyerAta = await getOrCreateAta(this.provider, contractData.usdcMint, this.provider.wallet.publicKey);

    return await this.program.methods
      .depositPayin(new anchor.BN(amount))
      .accounts({
        contract,
        buyer: this.provider.wallet.publicKey,
        buyerTokenAccount: buyerAta,
        escrowVault: contractData.escrowVault,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .transaction();
  }

  async releasePayout(contract: PublicKey, sellerAta: PublicKey): Promise<Transaction> {
    const contractData = await this.program.account.contract.fetch(contract);

    return await this.program.methods
      .releasePayout()
      .accounts({
        contract,
        sellerTokenAccount: sellerAta,
        escrowVault: contractData.escrowVault,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .transaction();
  }

  async refund(contract: PublicKey, buyerAta: PublicKey): Promise<Transaction> {
    const contractData = await this.program.account.contract.fetch(contract);

    return await this.program.methods
      .refund()
      .accounts({
        contract,
        buyerTokenAccount: buyerAta,
        escrowVault: contractData.escrowVault,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .transaction();
  }

  async anchorTrustScore(counterparty: PublicKey, score: number): Promise<Transaction> {
    const [trustScorePda] = deriveTrustScorePda(this.program.programId, this.provider.wallet.publicKey, counterparty);

    return await this.program.methods
      .anchorTrustScore(counterparty, score)
      .accounts({
        trustScore: trustScorePda,
        authority: this.provider.wallet.publicKey,
        counterparty,
        systemProgram: SystemProgram.programId,
      })
      .transaction();
  }

  async setOracleResult(contract: PublicKey, shipmentVerified: boolean): Promise<Transaction> {
    const [oracleFlagPda] = deriveOracleFlagPda(this.program.programId, contract);

    return await this.program.methods
      .setOracleResult(shipmentVerified)
      .accounts({
        contract,
        oracleFlag: oracleFlagPda,
        oracleAuthority: this.provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .transaction();
  }

  async getContract(contract: PublicKey) {
    return await this.program.account.contract.fetch(contract);
  }

  async getTrustScore(authority: PublicKey, counterparty: PublicKey) {
    const [trustScorePda] = deriveTrustScorePda(this.program.programId, authority, counterparty);
    try {
      return await this.program.account.trustScore.fetch(trustScorePda);
    } catch (error) {
      return null;
    }
  }

  async getOracleFlag(contract: PublicKey) {
    const [oracleFlagPda] = deriveOracleFlagPda(this.program.programId, contract);
    try {
      return await this.program.account.oracleFlag.fetch(oracleFlagPda);
    } catch (error) {
      return null;
    }
  }
}
