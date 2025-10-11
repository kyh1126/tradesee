import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { TradeseeEscrow } from '../target/types/tradesee_escrow';
import { 
  deriveContractPda, 
  deriveEscrowVaultPda, 
  deriveTrustScorePda, 
  deriveOracleFlagPda,
  deriveSplAta,
  airdropSolIfNeeded,
  generateContractId,
  hashDocument
} from './sdk/utils';
import { TradeseeClient } from './sdk/client';
import { 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  createAssociatedTokenAccount,
  mintTo,
  getAccount
} from '@solana/spl-token';
import { PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { expect } from 'chai';

describe('tradesee_escrow', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  
  // Log RPC URL for verification
  console.log('Using RPC:', provider.connection.rpcEndpoint);

  const program = anchor.workspace.TradeseeEscrow as Program<TradeseeEscrow>;
  const client = new TradeseeClient(program, provider);

  // Test accounts
  let buyer: Keypair;
  let seller: Keypair;
  let oracleAuthority: Keypair;
  let usdcMint: PublicKey;
  let buyerAta: PublicKey;
  let sellerAta: PublicKey;

  before(async () => {
    // Create test keypairs
    buyer = Keypair.generate();
    seller = Keypair.generate();
    oracleAuthority = Keypair.generate();

    // Airdrop SOL to test accounts
    await airdropSolIfNeeded(provider, buyer.publicKey, 2);
    await airdropSolIfNeeded(provider, seller.publicKey, 2);
    await airdropSolIfNeeded(provider, oracleAuthority.publicKey, 2);

    // Create USDC mint for testing
    usdcMint = await createMint(
      provider.connection,
      buyer,
      buyer.publicKey,
      null,
      6 // USDC decimals
    );

    // Create ATAs
    buyerAta = await createAssociatedTokenAccount(
      provider.connection,
      buyer,
      usdcMint,
      buyer.publicKey
    );

    sellerAta = await createAssociatedTokenAccount(
      provider.connection,
      seller,
      usdcMint,
      seller.publicKey
    );

    // Mint USDC to buyer
    await mintTo(
      provider.connection,
      buyer,
      usdcMint,
      buyerAta,
      buyer,
      1000000000 // 1000 USDC
    );
  });

  describe('Contract Lifecycle', () => {
    it('Initialize contract', async () => {
      const contractId = generateContractId();
      const docHash = hashDocument('test document content');
      const expiryTs = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now

      const [contractPda] = deriveContractPda(program.programId, buyer.publicKey, contractId);
      const [escrowVaultPda] = deriveEscrowVaultPda(program.programId, contractPda);

      const tx = await program.methods
        .initializeContract(
          contractId,
          seller.publicKey,
          new anchor.BN(100000000), // 100 USDC
          1, // 1 milestone
          new anchor.BN(expiryTs),
          true, // auto release on expiry
          docHash
        )
        .accounts({
          contract: contractPda,
          initializer: buyer.publicKey,
          usdcMint,
          escrowVault: escrowVaultPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .signers([buyer])
        .rpc();

      // Verify contract was created
      const contractData = await program.account.contract.fetch(contractPda);
      expect(contractData.initializer.toString()).to.equal(buyer.publicKey.toString());
      expect(contractData.seller.toString()).to.equal(seller.publicKey.toString());
      expect(contractData.amountExpected.toNumber()).to.equal(100000000);
      expect(contractData.milestonesTotal).to.equal(1);
      expect(contractData.autoReleaseOnExpiry).to.be.true;
      expect(contractData.released).to.be.false;
      expect(contractData.refunded).to.be.false;

      console.log('Contract initialized:', contractPda.toString());
    });

    it('Deposit payin', async () => {
      const contractId = generateContractId();
      const docHash = hashDocument('test document content');
      const expiryTs = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now

      const [contractPda] = deriveContractPda(program.programId, buyer.publicKey, contractId);
      const [escrowVaultPda] = deriveEscrowVaultPda(program.programId, contractPda);

      // Initialize contract first
      await program.methods
        .initializeContract(
          contractId,
          seller.publicKey,
          new anchor.BN(100000000),
          1,
          new anchor.BN(expiryTs),
          true,
          docHash
        )
        .accounts({
          contract: contractPda,
          initializer: buyer.publicKey,
          usdcMint,
          escrowVault: escrowVaultPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .signers([buyer])
        .rpc();

      // Create escrow vault ATA (escrow vault is a PDA, so we need to use the program as signer)
      // This will be handled by the program during initialize_contract

      // Deposit
      const tx = await program.methods
        .depositPayin(new anchor.BN(100000000))
        .accounts({
          contract: contractPda,
          buyer: buyer.publicKey,
          buyerTokenAccount: buyerAta,
          escrowVault: escrowVaultPda,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([buyer])
        .rpc();

      // Verify deposit
      const escrowBalance = await getAccount(provider.connection, escrowVaultPda);
      expect(Number(escrowBalance.amount)).to.equal(100000000);

      console.log('Deposit successful:', tx);
    });

    it('Release payout', async () => {
      const contractId = generateContractId();
      const docHash = hashDocument('test document content');
      const expiryTs = Math.floor(Date.now() / 1000) + 1; // 1 second from now (very short expiry)

      const [contractPda] = deriveContractPda(program.programId, buyer.publicKey, contractId);
      const [escrowVaultPda] = deriveEscrowVaultPda(program.programId, contractPda);

      // Initialize and deposit
      await program.methods
        .initializeContract(
          contractId,
          seller.publicKey,
          new anchor.BN(100000000),
          1,
          new anchor.BN(expiryTs),
          true,
          docHash
        )
        .accounts({
          contract: contractPda,
          initializer: buyer.publicKey,
          usdcMint,
          escrowVault: escrowVaultPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .signers([buyer])
        .rpc();

      // Escrow vault ATA is created by the program during initialize_contract

      await program.methods
        .depositPayin(new anchor.BN(100000000))
        .accounts({
          contract: contractPda,
          buyer: buyer.publicKey,
          buyerTokenAccount: buyerAta,
          escrowVault: escrowVaultPda,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([buyer])
        .rpc();

      // Wait for expiry (2 seconds)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Release payout
      const tx = await program.methods
        .releasePayout()
        .accounts({
          contract: contractPda,
          sellerTokenAccount: sellerAta,
          escrowVault: escrowVaultPda,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      // Verify release
      const sellerBalance = await getAccount(provider.connection, sellerAta);
      expect(Number(sellerBalance.amount)).to.equal(100000000);

      const contractData = await program.account.contract.fetch(contractPda);
      expect(contractData.released).to.be.true;

      console.log('Release successful:', tx);
    });

    it('Refund when expired', async () => {
      const contractId = generateContractId();
      const docHash = hashDocument('test document content');
      const expiryTs = Math.floor(Date.now() / 1000) + 1; // 1 second from now (very short expiry)

      const [contractPda] = deriveContractPda(program.programId, buyer.publicKey, contractId);
      const [escrowVaultPda] = deriveEscrowVaultPda(program.programId, contractPda);

      // Initialize with very short expiry and no auto-release
      await program.methods
        .initializeContract(
          contractId,
          seller.publicKey,
          new anchor.BN(100000000),
          1,
          new anchor.BN(expiryTs),
          false, // no auto release
          docHash
        )
        .accounts({
          contract: contractPda,
          initializer: buyer.publicKey,
          usdcMint,
          escrowVault: escrowVaultPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .signers([buyer])
        .rpc();

      // Escrow vault ATA is created by the program during initialize_contract

      await program.methods
        .depositPayin(new anchor.BN(100000000))
        .accounts({
          contract: contractPda,
          buyer: buyer.publicKey,
          buyerTokenAccount: buyerAta,
          escrowVault: escrowVaultPda,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([buyer])
        .rpc();

      // Wait for expiry (2 seconds)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Refund
      const tx = await program.methods
        .refund()
        .accounts({
          contract: contractPda,
          buyerTokenAccount: buyerAta,
          escrowVault: escrowVaultPda,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      // Verify refund
      const buyerBalance = await getAccount(provider.connection, buyerAta);
      expect(Number(buyerBalance.amount)).to.equal(800000000); // Back to original minus deposit

      const contractData = await program.account.contract.fetch(contractPda);
      expect(contractData.refunded).to.be.true;

      console.log('Refund successful:', tx);
    });
  });

  describe('Error Cases', () => {
    it('Should fail with wrong signer', async () => {
      const contractId = generateContractId();
      const docHash = hashDocument('test document content');
      const expiryTs = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now

      const [contractPda] = deriveContractPda(program.programId, buyer.publicKey, contractId);
      const [escrowVaultPda] = deriveEscrowVaultPda(program.programId, contractPda);

      try {
        await program.methods
          .initializeContract(
            contractId,
            seller.publicKey,
            new anchor.BN(100000000),
            1,
            new anchor.BN(expiryTs),
            true,
            docHash
          )
          .accounts({
            contract: contractPda,
            initializer: seller.publicKey, // Wrong signer
            usdcMint,
            escrowVault: escrowVaultPda,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          })
          .signers([seller])
          .rpc();

        expect.fail('Should have failed with wrong signer');
      } catch (error) {
        expect(error.message).to.include('AnchorError');
      }
    });

    it('Should fail with amount mismatch', async () => {
      const contractId = generateContractId();
      const docHash = hashDocument('test document content');
      const expiryTs = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now

      const [contractPda] = deriveContractPda(program.programId, buyer.publicKey, contractId);
      const [escrowVaultPda] = deriveEscrowVaultPda(program.programId, contractPda);

      // Initialize contract
      await program.methods
        .initializeContract(
          contractId,
          seller.publicKey,
          new anchor.BN(100000000),
          1,
          new anchor.BN(expiryTs),
          true,
          docHash
        )
        .accounts({
          contract: contractPda,
          initializer: buyer.publicKey,
          usdcMint,
          escrowVault: escrowVaultPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .signers([buyer])
        .rpc();

      // Escrow vault ATA is created by the program during initialize_contract

      try {
        await program.methods
          .depositPayin(new anchor.BN(50000000)) // Wrong amount
          .accounts({
            contract: contractPda,
            buyer: buyer.publicKey,
            buyerTokenAccount: buyerAta,
            escrowVault: escrowVaultPda,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([buyer])
          .rpc();

        expect.fail('Should have failed with amount mismatch');
      } catch (error) {
        expect(error.message).to.include('AmountMismatch');
      }
    });
  });

  describe('Trust Score Stub', () => {
    it('Anchor trust score', async () => {
      const [trustScorePda] = deriveTrustScorePda(program.programId, buyer.publicKey, seller.publicKey);

      const tx = await program.methods
        .anchorTrustScore(seller.publicKey, 850)
        .accounts({
          trustScore: trustScorePda,
          authority: buyer.publicKey,
          counterparty: seller.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([buyer])
        .rpc();

      // Verify trust score
      const trustScoreData = await program.account.trustScore.fetch(trustScorePda);
      expect(trustScoreData.authority.toString()).to.equal(buyer.publicKey.toString());
      expect(trustScoreData.counterparty.toString()).to.equal(seller.publicKey.toString());
      expect(trustScoreData.score).to.equal(850);

      console.log('Trust score anchored:', tx);
    });

    it('Should fail with invalid score', async () => {
      const [trustScorePda] = deriveTrustScorePda(program.programId, buyer.publicKey, seller.publicKey);

      try {
        await program.methods
          .anchorTrustScore(seller.publicKey, 1500) // Invalid score > 1000
          .accounts({
            trustScore: trustScorePda,
            authority: buyer.publicKey,
            counterparty: seller.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([buyer])
          .rpc();

        expect.fail('Should have failed with invalid score');
      } catch (error) {
        expect(error.message).to.include('InvalidScore');
      }
    });
  });

  describe('Oracle Stub', () => {
    it('Set oracle result', async () => {
      const contractId = generateContractId();
      const docHash = hashDocument('test document content');
      const expiryTs = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now

      const [contractPda] = deriveContractPda(program.programId, buyer.publicKey, contractId);
      const [oracleFlagPda] = deriveOracleFlagPda(program.programId, contractPda);

      // Initialize contract first
      await program.methods
        .initializeContract(
          contractId,
          seller.publicKey,
          new anchor.BN(100000000),
          1,
          new anchor.BN(expiryTs),
          true,
          docHash
        )
        .accounts({
          contract: contractPda,
          initializer: buyer.publicKey,
          usdcMint,
          escrowVault: deriveEscrowVaultPda(program.programId, contractPda)[0],
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .signers([buyer])
        .rpc();

      const tx = await program.methods
        .setOracleResult(true)
        .accounts({
          contract: contractPda,
          oracleFlag: oracleFlagPda,
          oracleAuthority: oracleAuthority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([oracleAuthority])
        .rpc();

      // Verify oracle result
      const oracleData = await program.account.oracleFlag.fetch(oracleFlagPda);
      expect(oracleData.shipmentVerified).to.be.true;
      expect(oracleData.updatedBy.toString()).to.equal(oracleAuthority.publicKey.toString());

      console.log('Oracle result set:', tx);
    });
  });
});
