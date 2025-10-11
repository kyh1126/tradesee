use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use anchor_lang::solana_program::clock::Clock;

declare_id!("J6w1gENjjbx8XG6ECtwWqfjmoPFHwtz9wqx2jj84qk5t");

#[program]
pub mod tradesee_escrow {
    use super::*;

    /// Initialize a new escrow contract
    pub fn initialize_contract(
        ctx: Context<InitializeContract>,
        contract_id: [u8; 32],
        seller: Pubkey,
        amount_expected: u64,
        milestones_total: u8,
        expiry_ts: i64,
        auto_release_on_expiry: bool,
        doc_hash: [u8; 32],
    ) -> Result<()> {
        let contract = &mut ctx.accounts.contract;
        let clock = Clock::get()?;

        // Validate inputs
        require!(amount_expected > 0, TradeseeError::InvalidAmount);
        require!(milestones_total > 0, TradeseeError::InvalidMilestones);
        require!(expiry_ts > clock.unix_timestamp, TradeseeError::InvalidExpiry);

        // Initialize contract state
        contract.initializer = ctx.accounts.initializer.key();
        contract.seller = seller;
        contract.usdc_mint = ctx.accounts.usdc_mint.key();
        contract.escrow_vault = ctx.accounts.escrow_vault.key();
        contract.contract_id = contract_id;
        contract.amount_expected = amount_expected;
        contract.milestones_total = milestones_total;
        contract.milestones_completed = 0;
        contract.auto_release_on_expiry = auto_release_on_expiry;
        contract.expiry_ts = expiry_ts;
        contract.doc_hash = doc_hash;
        contract.bump = ctx.bumps.contract;
        contract.released = false;
        contract.refunded = false;
        contract.created_at = clock.unix_timestamp;
        contract.updated_at = clock.unix_timestamp;

        emit!(ContractInitialized {
            contract: contract.key(),
            initializer: contract.initializer,
            seller: contract.seller,
            amount_expected: contract.amount_expected,
            expiry_ts: contract.expiry_ts,
        });

        Ok(())
    }

    /// Deposit USDC into the escrow
    pub fn deposit_payin(ctx: Context<DepositPayin>, amount: u64) -> Result<()> {
        let contract = &mut ctx.accounts.contract;
        let clock = Clock::get()?;

        // Validate state
        require!(!contract.released, TradeseeError::AlreadyReleased);
        require!(!contract.refunded, TradeseeError::AlreadyRefunded);
        require!(amount == contract.amount_expected, TradeseeError::AmountMismatch);
        require!(clock.unix_timestamp < contract.expiry_ts, TradeseeError::ContractExpired);

        // Transfer tokens from buyer to escrow
        let cpi_accounts = Transfer {
            from: ctx.accounts.buyer_token_account.to_account_info(),
            to: ctx.accounts.escrow_vault.to_account_info(),
            authority: ctx.accounts.buyer.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        contract.updated_at = clock.unix_timestamp;

        emit!(PayinDeposited {
            contract: contract.key(),
            amount,
            buyer: ctx.accounts.buyer.key(),
        });

        Ok(())
    }

    /// Release funds to seller
    pub fn release_payout(ctx: Context<ReleasePayout>) -> Result<()> {
        let contract = &mut ctx.accounts.contract;
        let clock = Clock::get()?;

        // Validate state
        require!(!contract.released, TradeseeError::AlreadyReleased);
        require!(!contract.refunded, TradeseeError::AlreadyRefunded);

        // Check release conditions
        let can_release = contract.milestones_completed == contract.milestones_total
            || (contract.auto_release_on_expiry && clock.unix_timestamp >= contract.expiry_ts);
        require!(can_release, TradeseeError::ReleaseConditionsNotMet);

        // Transfer tokens from escrow to seller
        let contract_key = contract.key();
        let seeds = &[
            b"escrow_vault",
            contract_key.as_ref(),
            &[ctx.bumps.escrow_vault],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_vault.to_account_info(),
            to: ctx.accounts.seller_token_account.to_account_info(),
            authority: ctx.accounts.escrow_vault.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, contract.amount_expected)?;

        contract.released = true;
        contract.updated_at = clock.unix_timestamp;

        emit!(PayoutReleased {
            contract: contract.key(),
            amount: contract.amount_expected,
            seller: contract.seller,
        });

        Ok(())
    }

    /// Refund funds to buyer
    pub fn refund(ctx: Context<Refund>) -> Result<()> {
        let contract = &mut ctx.accounts.contract;
        let clock = Clock::get()?;

        // Validate state
        require!(!contract.released, TradeseeError::AlreadyReleased);
        require!(!contract.refunded, TradeseeError::AlreadyRefunded);
        require!(clock.unix_timestamp >= contract.expiry_ts, TradeseeError::NotExpired);
        require!(!contract.auto_release_on_expiry, TradeseeError::AutoReleaseEnabled);

        // Transfer tokens from escrow back to buyer
        let contract_key = contract.key();
        let seeds = &[
            b"escrow_vault",
            contract_key.as_ref(),
            &[ctx.bumps.escrow_vault],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_vault.to_account_info(),
            to: ctx.accounts.buyer_token_account.to_account_info(),
            authority: ctx.accounts.escrow_vault.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, contract.amount_expected)?;

        contract.refunded = true;
        contract.updated_at = clock.unix_timestamp;

        emit!(Refunded {
            contract: contract.key(),
            amount: contract.amount_expected,
            buyer: contract.initializer,
        });

        Ok(())
    }

    /// Anchor a trust score (Step 2 stub)
    pub fn anchor_trust_score(
        ctx: Context<AnchorTrustScore>,
        counterparty: Pubkey,
        score: u16,
    ) -> Result<()> {
        let trust_score = &mut ctx.accounts.trust_score;
        let clock = Clock::get()?;

        // Validate score range (0-1000)
        require!(score <= 1000, TradeseeError::InvalidScore);

        trust_score.authority = ctx.accounts.authority.key();
        trust_score.counterparty = counterparty;
        trust_score.score = score;
        trust_score.updated_at = clock.unix_timestamp;
        trust_score.bump = ctx.bumps.trust_score;

        emit!(TrustScoreAnchored {
            authority: trust_score.authority,
            counterparty: trust_score.counterparty,
            score: trust_score.score,
        });

        Ok(())
    }

    /// Set oracle result (Step 3 stub)
    pub fn set_oracle_result(
        ctx: Context<SetOracleResult>,
        shipment_verified: bool,
    ) -> Result<()> {
        let oracle_flag = &mut ctx.accounts.oracle_flag;
        let clock = Clock::get()?;

        oracle_flag.shipment_verified = shipment_verified;
        oracle_flag.updated_by = ctx.accounts.oracle_authority.key();
        oracle_flag.updated_at = clock.unix_timestamp;
        oracle_flag.bump = ctx.bumps.oracle_flag;

        emit!(OracleUpdated {
            contract: ctx.accounts.contract.key(),
            shipment_verified,
            updated_by: oracle_flag.updated_by,
        });

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(contract_id: [u8; 32])]
pub struct InitializeContract<'info> {
    #[account(
        init,
        payer = initializer,
        space = 8 + Contract::INIT_SPACE,
        seeds = [b"contract", initializer.key().as_ref(), contract_id.as_ref()],
        bump
    )]
    pub contract: Account<'info, Contract>,
    
    #[account(mut)]
    pub initializer: Signer<'info>,
    
    /// CHECK: This is the USDC mint address
    pub usdc_mint: UncheckedAccount<'info>,
    
    #[account(
        init,
        payer = initializer,
        token::mint = usdc_mint,
        token::authority = escrow_vault,
        seeds = [b"escrow_vault", contract.key().as_ref()],
        bump
    )]
    pub escrow_vault: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, anchor_spl::associated_token::AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct DepositPayin<'info> {
    #[account(
        mut,
        seeds = [b"contract", contract.initializer.as_ref(), contract.contract_id.as_ref()],
        bump = contract.bump,
        constraint = contract.initializer == buyer.key() @ TradeseeError::InvalidAuthority
    )]
    pub contract: Account<'info, Contract>,
    
    #[account(mut)]
    pub buyer: Signer<'info>,
    
    #[account(
        mut,
        constraint = buyer_token_account.owner == buyer.key() @ TradeseeError::InvalidAuthority,
        constraint = buyer_token_account.mint == contract.usdc_mint @ TradeseeError::WrongMint
    )]
    pub buyer_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = escrow_vault.key() == contract.escrow_vault @ TradeseeError::InvalidAuthority
    )]
    pub escrow_vault: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ReleasePayout<'info> {
    #[account(
        mut,
        seeds = [b"contract", contract.initializer.as_ref(), contract.contract_id.as_ref()],
        bump = contract.bump
    )]
    pub contract: Account<'info, Contract>,
    
    /// CHECK: This is the seller's token account
    #[account(mut)]
    pub seller_token_account: UncheckedAccount<'info>,
    
    #[account(
        mut,
        seeds = [b"escrow_vault", contract.key().as_ref()],
        bump,
        constraint = escrow_vault.key() == contract.escrow_vault @ TradeseeError::InvalidAuthority
    )]
    pub escrow_vault: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Refund<'info> {
    #[account(
        mut,
        seeds = [b"contract", contract.initializer.as_ref(), contract.contract_id.as_ref()],
        bump = contract.bump
    )]
    pub contract: Account<'info, Contract>,
    
    /// CHECK: This is the buyer's token account
    #[account(mut)]
    pub buyer_token_account: UncheckedAccount<'info>,
    
    #[account(
        mut,
        seeds = [b"escrow_vault", contract.key().as_ref()],
        bump,
        constraint = escrow_vault.key() == contract.escrow_vault @ TradeseeError::InvalidAuthority
    )]
    pub escrow_vault: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct AnchorTrustScore<'info> {
    #[account(
        init_if_needed,
        payer = authority,
        space = 8 + TrustScore::INIT_SPACE,
        seeds = [b"trust", authority.key().as_ref(), counterparty.key().as_ref()],
        bump
    )]
    pub trust_score: Account<'info, TrustScore>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    /// CHECK: This is the counterparty being scored
    pub counterparty: UncheckedAccount<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SetOracleResult<'info> {
    #[account(
        mut,
        seeds = [b"contract", contract.initializer.as_ref(), contract.contract_id.as_ref()],
        bump = contract.bump
    )]
    pub contract: Account<'info, Contract>,
    
    #[account(
        init_if_needed,
        payer = oracle_authority,
        space = 8 + OracleFlag::INIT_SPACE,
        seeds = [b"oracle", contract.key().as_ref()],
        bump
    )]
    pub oracle_flag: Account<'info, OracleFlag>,
    
    #[account(mut)]
    pub oracle_authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Contract {
    pub initializer: Pubkey,
    pub seller: Pubkey,
    pub usdc_mint: Pubkey,
    pub escrow_vault: Pubkey,
    pub contract_id: [u8; 32],
    pub amount_expected: u64,
    pub milestones_total: u8,
    pub milestones_completed: u8,
    pub auto_release_on_expiry: bool,
    pub expiry_ts: i64,
    pub doc_hash: [u8; 32],
    pub bump: u8,
    pub released: bool,
    pub refunded: bool,
    pub created_at: i64,
    pub updated_at: i64,
}

#[account]
#[derive(InitSpace)]
pub struct TrustScore {
    pub authority: Pubkey,
    pub counterparty: Pubkey,
    pub score: u16,
    pub updated_at: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct OracleFlag {
    pub shipment_verified: bool,
    pub updated_by: Pubkey,
    pub updated_at: i64,
    pub bump: u8,
}

#[event]
pub struct ContractInitialized {
    pub contract: Pubkey,
    pub initializer: Pubkey,
    pub seller: Pubkey,
    pub amount_expected: u64,
    pub expiry_ts: i64,
}

#[event]
pub struct PayinDeposited {
    pub contract: Pubkey,
    pub amount: u64,
    pub buyer: Pubkey,
}

#[event]
pub struct PayoutReleased {
    pub contract: Pubkey,
    pub amount: u64,
    pub seller: Pubkey,
}

#[event]
pub struct Refunded {
    pub contract: Pubkey,
    pub amount: u64,
    pub buyer: Pubkey,
}

#[event]
pub struct TrustScoreAnchored {
    pub authority: Pubkey,
    pub counterparty: Pubkey,
    pub score: u16,
}

#[event]
pub struct OracleUpdated {
    pub contract: Pubkey,
    pub shipment_verified: bool,
    pub updated_by: Pubkey,
}

#[error_code]
pub enum TradeseeError {
    #[msg("Invalid authority")]
    InvalidAuthority,
    #[msg("Amount mismatch")]
    AmountMismatch,
    #[msg("Already released")]
    AlreadyReleased,
    #[msg("Already refunded")]
    AlreadyRefunded,
    #[msg("Contract not expired")]
    NotExpired,
    #[msg("Not enough milestones completed")]
    NotEnoughMilestones,
    #[msg("Wrong mint")]
    WrongMint,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Invalid score (must be 0-1000)")]
    InvalidScore,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Invalid milestones")]
    InvalidMilestones,
    #[msg("Invalid expiry timestamp")]
    InvalidExpiry,
    #[msg("Contract expired")]
    ContractExpired,
    #[msg("Release conditions not met")]
    ReleaseConditionsNotMet,
    #[msg("Auto release is enabled")]
    AutoReleaseEnabled,
}
