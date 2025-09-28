import { PublicKey } from '@solana/web3.js';

export interface ContractData {
  initializer: PublicKey;
  seller: PublicKey;
  usdcMint: PublicKey;
  escrowVault: PublicKey;
  contractId: number[];
  amountExpected: number;
  milestonesTotal: number;
  milestonesCompleted: number;
  autoReleaseOnExpiry: boolean;
  expiryTs: number;
  docHash: number[];
  bump: number;
  released: boolean;
  refunded: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface TrustScoreData {
  authority: PublicKey;
  counterparty: PublicKey;
  score: number;
  updatedAt: number;
  bump: number;
}

export interface OracleFlagData {
  shipmentVerified: boolean;
  updatedBy: PublicKey;
  updatedAt: number;
  bump: number;
}

export interface CreateContractParams {
  seller: PublicKey;
  amountExpected: number;
  milestonesTotal: number;
  expiryTs: number;
  autoReleaseOnExpiry: boolean;
  docHash: number[];
  usdcMint: PublicKey;
}
