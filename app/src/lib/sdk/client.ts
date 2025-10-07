import { PublicKey, Transaction, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
// Using any type for prototype
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

export type Agreement = {
  id: string;
  buyer: string;
  seller: string;
  amount: number;
  milestones: number;
  expiry: number;
  doc_hash: string;
  status: 'initialized' | 'deposited' | 'released' | 'refunded';
};

export class TradeseeClient {
  constructor(
    public program: Program,
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

  // API Surface Methods (stubs for prototype)
  async createAgreement(params: {
    seller: PublicKey;
    amount: number;
    milestones: number;
    expiry: number;
    docHash: string;
  }): Promise<Agreement> {
    // Mock implementation for prototype
    const agreement: Agreement = {
      id: Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join(''),
      buyer: this.provider.wallet.publicKey.toString(),
      seller: params.seller.toString(),
      amount: params.amount,
      milestones: params.milestones,
      expiry: params.expiry,
      doc_hash: params.docHash,
      status: 'initialized'
    };
    
    // Store in localStorage for demo purposes
    const agreements = this.getAgreements();
    agreements.push(agreement);
    localStorage.setItem('tradesee_agreements', JSON.stringify(agreements));
    
    return agreement;
  }

  async deposit(agreementId: string, amount: number): Promise<boolean> {
    // Mock implementation - simulate deposit
    const agreements = this.getAgreements();
    const agreement = agreements.find(a => a.id === agreementId);
    if (agreement) {
      agreement.status = 'deposited';
      localStorage.setItem('tradesee_agreements', JSON.stringify(agreements));
      return true;
    }
    return false;
  }

  async release(agreementId: string): Promise<boolean> {
    // Mock implementation - simulate release
    const agreements = this.getAgreements();
    const agreement = agreements.find(a => a.id === agreementId);
    if (agreement && agreement.status === 'deposited') {
      agreement.status = 'released';
      localStorage.setItem('tradesee_agreements', JSON.stringify(agreements));
      return true;
    }
    return false;
  }

  getAgreements(): Agreement[] {
    // Mock implementation - get from localStorage
    const stored = localStorage.getItem('tradesee_agreements');
    return stored ? JSON.parse(stored) : [];
  }

  async getOrCreateAta(mint: PublicKey, owner: PublicKey): Promise<PublicKey> {
    return getOrCreateAta(this.provider, mint, owner);
  }
}


