// Use this script to generate a development token for your user.
// Usage: node generate-token.js

import { StreamChat } from 'stream-chat';

// 1. Paste your API Key and Secret from the Stream Dashboard
const apiKey = '4x2r59h2bf3g';
const apiSecret = 'zeea4agvjxb24p65skdszzq88grp7fv2man67sukz3u6enpjftah9mfxvs9zmhyv'; // <--- PASTE SECRET HERE

// 2. The User ID from your "Manage Users" screen
const userId = '825f83d5-5481-4eed-991a-a6cfb0ac8bf5'; // Replace with full ID if this is truncated

if (apiSecret === 'PASTE_YOUR_SECRET_HERE' || !apiSecret) {
    console.log('❌ Error: Please paste your API Secret into the script first!');
    process.exit(1);
}

const serverClient = StreamChat.getInstance(apiKey, apiSecret);
const token = serverClient.createToken(userId);

console.log('\n--- STREAM USER TOKEN ---');
console.log('Copy this token into your .env file:');
console.log('\n' + token + '\n');
console.log('--- END OF TOKEN ---');
