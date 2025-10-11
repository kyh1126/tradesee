#!/usr/bin/env node

/**
 * Simple test script to generate Solana Pay URLs
 * Run with: node scripts/test-solana-pay.js
 */

function generateSolanaPayURL(recipient, amount, label) {
  const baseURL = 'https://solana-pay.vercel.app';
  const params = new URLSearchParams({
    recipient,
    amount: amount.toString(),
    ...(label && { label }),
  });
  return `${baseURL}?${params.toString()}`;
}

// Test cases
const testCases = [
  {
    recipient: 'J6w1gENjjbx8XG6ECtwWqfjmoPFHwtz9wqx2jj84qk5t',
    amount: 100,
    label: 'Tradesee Escrow Demo'
  },
  {
    recipient: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    amount: 500,
    label: 'Test Payment'
  },
  {
    recipient: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    amount: 1000,
    label: 'Large Transaction'
  }
];

console.log('🔗 Solana Pay URL Generator Test\n');
console.log('=' .repeat(50));

testCases.forEach((testCase, index) => {
  const url = generateSolanaPayURL(testCase.recipient, testCase.amount, testCase.label);
  
  console.log(`\nTest Case ${index + 1}:`);
  console.log(`Recipient: ${testCase.recipient}`);
  console.log(`Amount: ${testCase.amount} USDC`);
  console.log(`Label: ${testCase.label}`);
  console.log(`URL: ${url}`);
  console.log('-'.repeat(50));
});

console.log('\n✅ All test cases generated successfully!');
console.log('\nTo test in browser, copy any URL above and paste in address bar.');
