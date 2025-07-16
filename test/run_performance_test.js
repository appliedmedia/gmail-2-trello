#!/usr/bin/env node

// Node.js script to run EventTarget performance test
// Run with: node test/run_performance_test.js

// Mock browser environment for Node.js
global.window = global;
global.EventTarget = require('events').EventTarget;
global.Event = require('events').Event;
global.CustomEvent = class CustomEvent extends Event {
  constructor(type, options = {}) {
    super(type, options);
    this.detail = options.detail;
    this.target = options.target;
  }
};

// Mock performance API
global.performance = {
  now: () => process.hrtime.bigint() / 1000000n
};

// Import the performance test
const PerformanceTest = require('./eventTarget_performance.js');

console.log('🚀 Running EventTarget Performance Test in Node.js\n');

// Run the performance comparison
const results = PerformanceTest.runComparison();

console.log('\n📊 Summary:');
console.log(`Custom EventTarget: ${results.custom.toFixed(2)}ms average`);
console.log(`Native EventTarget: ${results.native.toFixed(2)}ms average`);
console.log(`Difference: ${results.difference.toFixed(2)}ms (${results.percentage.toFixed(2)}%)`);

if (results.difference > 0) {
  console.log('✅ Custom EventTarget is faster');
} else {
  console.log('✅ Native EventTarget is faster');
}

console.log('\n🎯 Recommendation:');
if (Math.abs(results.percentage) < 10) {
  console.log('Performance difference is minimal. Use native EventTarget for better browser compatibility.');
} else if (results.difference > 0) {
  console.log('Custom EventTarget is significantly faster. Consider keeping current implementation.');
} else {
  console.log('Native EventTarget is significantly faster. Consider migrating to native implementation.');
}