// Simple test to check if basic Node.js setup works
console.log('Testing basic Node.js setup...');

// Test dotenv
try {
  require('dotenv').config();
  console.log('✅ dotenv loaded successfully');
  console.log('Environment variables:', {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET'
  });
} catch (error) {
  console.error('❌ dotenv failed:', error);
}

// Test basic imports
try {
  const express = require('express');
  console.log('✅ express loaded successfully');
} catch (error) {
  console.error('❌ express failed:', error);
}

console.log('Basic test completed');
