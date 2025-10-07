# Tradesee - Solana Escrow Platform

A production-quality escrow platform built on Solana using Anchor framework. Tradesee implements secure escrow contracts with document anchoring, trust scoring, and oracle integration.

## Features

### Step 1: Escrow & Document Hash Anchoring ✅
- **Initialize Contract**: Create escrow contracts with buyer/seller, milestones, expiry, and document hashing
- **Deposit Payin**: Secure USDC deposits into escrow
- **Release Payout**: Automatic or milestone-based fund release
- **Refund**: Expired contract refunds with safety checks
- **Document Anchoring**: Keccak256/SHA256 document hashing for verification

### Step 2: Trust Score Anchoring (Stub) ✅
- **Anchor Trust Scores**: Off-chain computed trust scores (0-1000) anchored on-chain
- **Authority-based Scoring**: Configurable authority system for trust score management

### Step 3: Oracle Integration (Stub) ✅
- **Oracle Results**: Boolean oracle results for shipment verification
- **Event Emission**: Rich event system for off-chain monitoring
- **Extensible Design**: Ready for future oracle integrations

## Architecture

### Smart Contract (Rust + Anchor)
- **Program ID**: `Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS`
- **Accounts**: Contract, TrustScore, OracleFlag PDAs
- **Security**: Comprehensive validation, reentrancy protection, role-based access

### Frontend (Next.js + React)
- **Wallet Integration**: Phantom, Solflare support
- **Real-time Updates**: Contract status monitoring
- **User-friendly**: Intuitive contract creation and management

### SDK (TypeScript)
- **Client Wrapper**: Easy-to-use program interaction
- **Utilities**: PDA derivation, ATA management, helper functions
- **Type Safety**: Full TypeScript support with generated types

## Prerequisites

- **Rust** (latest stable)
- **Solana CLI** (v1.16+)
- **Anchor Framework** (v0.29+)
- **Node.js** (v18+)
- **Yarn** or **npm**

## Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd tradesee

# Install dependencies
cd ts && npm install
cd ../app && npm install
```

### 2. Environment Setup

Copy the environment file and configure:

```bash
cd app
cp env.example .env.local
```

**Required Environment Variables** (`.env.local`):
```env
# Solana Network Configuration
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_USDC_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
NEXT_PUBLIC_PROGRAM_ID=Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS

# App Configuration
NEXT_PUBLIC_APP_NAME=Tradesee
NEXT_PUBLIC_APP_VERSION=0.1.0
NEXT_PUBLIC_DEBUG_MODE=true
```

### 3. Start Development Server

```bash
cd app
npm run dev
```

The application will be available at `http://localhost:3000`

### 4. Demo Path

1. **Connect Wallet**: Use Phantom or Solflare wallet
2. **View Dashboard**: See balance placeholder and active trades list
3. **Create New Trade**: Click "Create New Trade" button
4. **Document Anchoring**: Upload a file and see SHA256 hash computation
5. **Solana Pay Demo**: Click "Create/Deposit" to see Solana Pay URL/QR
6. **Test Script**: Run `npm run test:pay` to generate test Solana Pay URLs

### 5. Local Development

#### Option A: Local Validator (Recommended for Development)

```bash
# Terminal 1: Start local validator
solana-test-validator --reset

# Terminal 2: Build and test
cd ts
npm run build
npm run test

# Terminal 3: Start frontend
cd app
npm run dev
```

#### Option B: Devnet Deployment

```bash
# Build and deploy to devnet
cd ts
npm run build
npm run devnet

# Start frontend
cd ../app
npm run dev
```

### 4. Create Local USDC Mint (Optional)

For local testing, create a test USDC mint:

```bash
cd ts
npx ts-node ../scripts/local-usdc-mint.ts
```

## Usage

### Creating an Escrow Contract

1. **Connect Wallet**: Use Phantom or Solflare
2. **Fill Contract Form**:
   - Seller address
   - USDC amount
   - Number of milestones
   - Expiry time
   - Document content (will be hashed)
   - Auto-release option
3. **Submit Transaction**: Sign and confirm

### Contract Lifecycle

1. **Initialized**: Contract created, awaiting deposit
2. **Deposited**: USDC deposited, contract active
3. **Released**: Funds sent to seller (milestones complete or auto-release)
4. **Refunded**: Funds returned to buyer (expired, no auto-release)

### Trust Score Management

```typescript
// Anchor a trust score
const tx = await client.anchorTrustScore(counterparty, 850); // 85%
await provider.sendAndConfirm(tx, [authority]);

// Read trust score
const score = await client.getTrustScore(authority, counterparty);
```

### Oracle Integration

```typescript
// Set oracle result
const tx = await client.setOracleResult(contract, true); // shipment verified
await provider.sendAndConfirm(tx, [oracleAuthority]);
```

## API Reference

### Core Instructions

#### `initialize_contract`
Creates a new escrow contract with specified parameters.

**Parameters**:
- `contract_id: [u8; 32]` - Unique contract identifier
- `seller: Pubkey` - Seller's public key
- `amount_expected: u64` - Expected USDC amount
- `milestones_total: u8` - Total number of milestones
- `expiry_ts: i64` - Expiry timestamp
- `auto_release_on_expiry: bool` - Auto-release flag
- `doc_hash: [u8; 32]` - Document hash

#### `deposit_payin`
Deposits USDC into the escrow contract.

**Requirements**:
- Buyer must be the initializer
- Amount must match `amount_expected`
- Contract must not be expired

#### `release_payout`
Releases funds to the seller.

**Conditions**:
- All milestones completed, OR
- Auto-release enabled and contract expired

#### `refund`
Refunds funds to the buyer.

**Conditions**:
- Contract expired
- Auto-release disabled
- Not already released/refunded

### Account Structures

#### Contract Account
```rust
pub struct Contract {
    pub initializer: Pubkey,        // Buyer
    pub seller: Pubkey,             // Seller
    pub usdc_mint: Pubkey,          // USDC mint address
    pub escrow_vault: Pubkey,       // Escrow token account
    pub contract_id: [u8; 32],      // Unique contract ID
    pub amount_expected: u64,       // Expected USDC amount
    pub milestones_total: u8,       // Total milestones
    pub milestones_completed: u8,   // Completed milestones
    pub auto_release_on_expiry: bool, // Auto-release flag
    pub expiry_ts: i64,             // Expiry timestamp
    pub doc_hash: [u8; 32],         // Document hash
    pub bump: u8,                   // PDA bump
    pub released: bool,             // Release status
    pub refunded: bool,             // Refund status
    pub created_at: i64,            // Creation timestamp
    pub updated_at: i64,            // Last update timestamp
}
```

#### TrustScore Account
```rust
pub struct TrustScore {
    pub authority: Pubkey,          // Scoring authority
    pub counterparty: Pubkey,       // Scored entity
    pub score: u16,                 // Trust score (0-1000)
    pub updated_at: i64,            // Last update timestamp
    pub bump: u8,                   // PDA bump
}
```

#### OracleFlag Account
```rust
pub struct OracleFlag {
    pub shipment_verified: bool,    // Oracle result
    pub updated_by: Pubkey,         // Oracle authority
    pub updated_at: i64,            // Last update timestamp
    pub bump: u8,                   // PDA bump
}
```

## Security Features

### Access Control
- **Role-based permissions**: Buyer, seller, oracle authority roles
- **Signer validation**: Comprehensive signer checks
- **Authority constraints**: PDA-based authority verification

### Reentrancy Protection
- **One-shot flags**: `released` and `refunded` prevent double execution
- **State validation**: Pre-transaction state checks
- **Atomic operations**: All-or-nothing transaction execution

### Input Validation
- **Amount validation**: Positive amounts, exact matches
- **Timestamp validation**: Future expiry times
- **Score bounds**: Trust scores limited to 0-1000
- **Milestone validation**: Positive milestone counts

### Error Handling
- **Custom error codes**: Detailed error messages
- **Require statements**: Anchor's built-in validation
- **Graceful failures**: Proper error propagation

## Events

All state transitions emit rich events for monitoring:

```rust
// Contract lifecycle events
ContractInitialized { contract, initializer, seller, amount_expected, expiry_ts }
PayinDeposited { contract, amount, buyer }
PayoutReleased { contract, amount, seller }
Refunded { contract, amount, buyer }

// Trust and oracle events
TrustScoreAnchored { authority, counterparty, score }
OracleUpdated { contract, shipment_verified, updated_by }
```

## Testing

### Running Tests

```bash
cd ts
npm run test
```

### Test Coverage

- ✅ **Happy Path**: Init → Deposit → Release
- ✅ **Refund Path**: Init → Deposit → Refund (expired)
- ✅ **Error Cases**: Wrong signer, amount mismatch, double execution
- ✅ **Trust Scores**: Write, read, update, validation
- ✅ **Oracle Results**: Set, update, multiple authorities

### Test Utilities

```typescript
// Helper functions
deriveContractPda(programId, initializer, contractId)
deriveEscrowVaultPda(programId, contract)
deriveTrustScorePda(programId, authority, counterparty)
deriveOracleFlagPda(programId, contract)

// Utility functions
getOrCreateAta(provider, mint, owner)
airdropSolIfNeeded(provider, pubkey, amount)
generateContractId()
hashDocument(content)
```

## Deployment

### Devnet Deployment

```bash
# Set cluster to devnet
solana config set --url https://api.devnet.solana.com

# Build and deploy
cd ts
npm run build
npm run devnet
```

### Mainnet Deployment

```bash
# Set cluster to mainnet
solana config set --url https://api.mainnet-beta.solana.com

# Update program ID in anchor.toml
# Build and deploy
cd ts
npm run build
anchor deploy
```

## Development Workflow

### 1. Program Development
```bash
cd programs/tradesee_escrow
# Edit src/lib.rs
anchor build
```

### 2. Testing
```bash
cd ts
npm run test
```

### 3. Frontend Development
```bash
cd app
npm run dev
```

### 4. IDL Updates
```bash
cd ts
npm run build
npm run idl:copy
```

## Troubleshooting

### Common Issues

1. **"InvalidAuthority" Error**
   - Check signer matches expected role
   - Verify PDA derivation

2. **"AmountMismatch" Error**
   - Ensure deposit amount equals `amount_expected`
   - Check USDC decimal places (6 decimals)

3. **"AlreadyReleased" Error**
   - Contract already executed
   - Check contract state

4. **RPC Connection Issues**
   - Verify RPC URL in environment
   - Check network connectivity

### Debug Mode

Enable debug logging:
```bash
export RUST_LOG=debug
anchor test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

- **Documentation**: This README
- **Issues**: GitHub Issues
- **Discord**: [Community Discord]
- **Email**: [Support Email]

---

**Built with ❤️ using Solana, Anchor, and Rust**
