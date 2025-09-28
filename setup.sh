#!/bin/bash

echo "=== Pre-flight Checks ==="
echo "Rust version:"
rustc --version

echo "Solana version:"
solana --version

echo "Anchor version:"
anchor --version

echo "=== Checking default key ==="
if [ ! -f ~/.config/solana/id.json ]; then
    echo "Creating default key..."
    solana-keygen new -o ~/.config/solana/id.json -s
else
    echo "Default key exists at ~/.config/solana/id.json"
fi

echo "=== Starting local validator ==="
echo "Starting solana-test-validator in background..."
nohup solana-test-validator --reset > validator.log 2>&1 &
VALIDATOR_PID=$!
echo "Validator PID: $VALIDATOR_PID"

echo "Waiting for validator to start..."
sleep 10

echo "Setting cluster to localhost..."
solana config set --url http://127.0.0.1:8899

echo "Airdropping 10 SOL..."
solana airdrop 10

echo "=== Building and testing ==="
cd ts
npm install
npm run build
npm run test

echo "=== Creating USDC mint ==="
cd ..
node scripts/local-usdc-mint.ts

echo "=== Deploying program ==="
anchor build
anchor deploy

echo "=== Copying IDL ==="
cd ts
npm run idl:copy

echo "=== Setting up environment files ==="
cd ..
echo "RPC_URL=http://127.0.0.1:8899" > ts/.env
echo "USDC_MINT=\$USDC_MINT" >> ts/.env
echo "WALLET_KEYPAIR=\$HOME/.config/solana/id.json" >> ts/.env

echo "NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8899" > app/.env.local
echo "NEXT_PUBLIC_PROGRAM_ID=\$PROGRAM_ID" >> app/.env.local
echo "NEXT_PUBLIC_USDC_MINT=\$USDC_MINT" >> app/.env.local

echo "=== Starting dashboard ==="
cd app
npm install
npm run dev &
DASHBOARD_PID=$!

echo "Dashboard started with PID: $DASHBOARD_PID"
echo "Dashboard: http://localhost:3000"

echo "=== Important Addresses ==="
echo "Program ID: \$PROGRAM_ID"
echo "USDC Mint: \$USDC_MINT"
echo "Escrow PDA example: [will be calculated based on program]"
