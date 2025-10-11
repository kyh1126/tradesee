import { PublicKey, Transaction, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
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

  async depositPayin(contractPda: PublicKey, amount: number): Promise<Transaction> {
    const [escrowVaultPda] = deriveEscrowVaultPda(this.program.programId, contractPda);
    const buyer = this.provider.wallet.publicKey;
    const buyerTokenAccount = await getAssociatedTokenAddress(
      new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'), // USDC mint
      buyer
    );

    const tx = await (this.program as any).methods
      .depositPayin(new anchor.BN(amount * 1e6)) // Convert to 6 decimals
      .accounts({
        contract: contractPda,
        buyer: buyer,
        buyerTokenAccount: buyerTokenAccount,
        escrowVault: escrowVaultPda,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .transaction();

    return tx;
  }

  async updateToInTransit(
    contractPda: PublicKey, 
    shipmentDetails: {
      trackingNumber: string;
      carrier: string;
      estimatedDelivery: number;
      notes: string;
    },
    contractDetails?: {
      contractTerms?: string;
      uploadedFile?: {
        name: string;
        size: number;
        type: string;
        hash: string;
      };
    }
  ): Promise<Transaction> {
    // Generate doc_hash from contract details and shipment info
    const docData = JSON.stringify({
      contractTerms: contractDetails?.contractTerms || '',
      uploadedFile: contractDetails?.uploadedFile || null,
      shipmentDetails: shipmentDetails,
      timestamp: Date.now()
    });
    
    // Create hash from contract details
    const encoder = new TextEncoder();
    const data = encoder.encode(docData);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const docHash = Array.from(new Uint8Array(hashBuffer));
    
    const tx = await (this.program as any).methods
      .updateToInTransit(
        {
          trackingNumber: shipmentDetails.trackingNumber,
          carrier: shipmentDetails.carrier,
          estimatedDelivery: new anchor.BN(shipmentDetails.estimatedDelivery),
          notes: shipmentDetails.notes,
        },
        docHash
      )
      .accounts({
        contract: contractPda,
        authority: this.provider.wallet.publicKey,
      })
      .transaction();

    return tx;
  }

  async releasePayout(contractPda: PublicKey): Promise<Transaction> {
    const [escrowVaultPda] = deriveEscrowVaultPda(this.program.programId, contractPda);
    const seller = this.provider.wallet.publicKey;
    const sellerTokenAccount = await getAssociatedTokenAddress(
      new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'), // USDC mint
      seller
    );

    const tx = await (this.program as any).methods
      .releasePayout()
      .accounts({
        contract: contractPda,
        escrowVault: escrowVaultPda,
        seller: seller,
        sellerTokenAccount: sellerTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .transaction();

    return tx;
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


