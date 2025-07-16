#!/usr/bin/env node

// Simple Node.js performance test for EventTarget implementations
// Run with: node test/simple_performance_test.js

const { EventTarget } = require('events');

// Current EventTarget implementation (copy from lib/eventTarget.js)
class CustomEventTarget {
  constructor() {
    this._listeners = {};
  }

  addListener(type, listener) {
    if (typeof this._listeners[type] === 'undefined') {
      this._listeners[type] = [];
    }
    this._listeners[type].push(listener);
  }

  fire(event, params) {
    if (typeof event === 'string') {
      event = { type: event };
    }
    if (!event.target) {
      event.target = this;
    }

    if (!event.type) {
      throw new Error("Event object missing 'type' property.");
    }

    if (this._listeners[event.type] instanceof Array) {
      var listeners = this._listeners[event.type];
      for (var i = 0, len = listeners.length; i < len; i++) {
        listeners[i].call(this, event, params);
      }
    }
  }

  removeListener(type, listener) {
    if (this._listeners[type] instanceof Array) {
      var listeners = this._listeners[type];
      for (var i = 0, len = listeners.length; i < len; i++) {
        if (listeners[i] === listener) {
          listeners.splice(i, 1);
          break;
        }
      }
    }
  }
}

// Native EventTarget wrapper
class NativeEventTargetWrapper extends EventTarget {
  constructor() {
    super();
    this._listeners = new Map();
  }

  addListener(type, listener) {
    if (!this._listeners.has(type)) {
      this._listeners.set(type, new Set());
    }
    this._listeners.get(type).add(listener);
    
    const wrapper = (event) => {
      const originalEvent = {
        type: event.type,
        target: this,
        detail: event.detail
      };
      listener.call(this, originalEvent, event.detail);
    };
    
    listener._wrapper = wrapper;
    this.addEventListener(type, wrapper);
  }

  fire(event, params) {
    if (typeof event === 'string') {
      const customEvent = new Event(event);
      customEvent.detail = params;
      customEvent.target = this;
      this.dispatchEvent(customEvent);
    } else {
      if (!event.target) {
        event.target = this;
      }
      const customEvent = new Event(event.type);
      customEvent.detail = params || event;
      customEvent.target = this;
      this.dispatchEvent(customEvent);
    }
  }

  removeListener(type, listener) {
    const listeners = this._listeners.get(type);
    if (listeners && listeners.has(listener)) {
      listeners.delete(listener);
      if (listener._wrapper) {
        this.removeEventListener(type, listener._wrapper);
        delete listener._wrapper;
      }
    }
  }
}

// Performance test
function runPerformanceTest() {
  const iterations = 100000;
  const eventTypes = ['test', 'data', 'update', 'delete', 'create'];
  const testData = { id: 1, message: 'test', timestamp: Date.now() };
  
  function createListener() {
    return (event, params) => {
      const result = event.type + (params ? JSON.stringify(params) : '');
      return result.length;
    };
  }
  
  function testCustomEventTarget() {
    const start = process.hrtime.bigint();
    const eventTarget = new CustomEventTarget();
    const listeners = [];
    
    // Add listeners
    for (let i = 0; i < 10; i++) {
      const listener = createListener();
      listeners.push(listener);
      eventTarget.addListener(eventTypes[i % eventTypes.length], listener);
    }
    
    // Fire events
    for (let i = 0; i < iterations; i++) {
      const eventType = eventTypes[i % eventTypes.length];
      eventTarget.fire(eventType, testData);
    }
    
    // Remove listeners
    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i];
      eventTarget.removeListener(eventTypes[i % eventTypes.length], listener);
    }
    
    const end = process.hrtime.bigint();
    return Number(end - start) / 1000000; // Convert to milliseconds
  }
  
  function testNativeEventTarget() {
    const start = process.hrtime.bigint();
    const eventTarget = new NativeEventTargetWrapper();
    const listeners = [];
    
    // Add listeners
    for (let i = 0; i < 10; i++) {
      const listener = createListener();
      listeners.push(listener);
      eventTarget.addListener(eventTypes[i % eventTypes.length], listener);
    }
    
    // Fire events
    for (let i = 0; i < iterations; i++) {
      const eventType = eventTypes[i % eventTypes.length];
      eventTarget.fire(eventType, testData);
    }
    
    // Remove listeners
    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i];
      eventTarget.removeListener(eventTypes[i % eventTypes.length], listener);
    }
    
    const end = process.hrtime.bigint();
    return Number(end - start) / 1000000; // Convert to milliseconds
  }
  
  console.log('🚀 EventTarget Performance Test (Node.js)');
  console.log(`Iterations: ${iterations.toLocaleString()}\n`);
  
  // Warm up
  console.log('🔥 Warming up...');
  for (let i = 0; i < 1000; i++) {
    testCustomEventTarget();
    testNativeEventTarget();
  }
  
  // Run tests
  console.log('📊 Running performance tests...\n');
  
  const customTimes = [];
  const nativeTimes = [];
  
  for (let run = 0; run < 5; run++) {
    console.log(`Run ${run + 1}/5...`);
    
    const customTime = testCustomEventTarget();
    const nativeTime = testNativeEventTarget();
    
    customTimes.push(customTime);
    nativeTimes.push(nativeTime);
    
    console.log(`  Custom: ${customTime.toFixed(2)}ms`);
    console.log(`  Native: ${nativeTime.toFixed(2)}ms`);
  }
  
  // Calculate averages
  const avgCustom = customTimes.reduce((a, b) => a + b, 0) / customTimes.length;
  const avgNative = nativeTimes.reduce((a, b) => a + b, 0) / nativeTimes.length;
  
  console.log('\n📈 Results:');
  console.log(`Custom EventTarget: ${avgCustom.toFixed(2)}ms average`);
  console.log(`Native EventTarget: ${avgNative.toFixed(2)}ms average`);
  
  const difference = avgNative - avgCustom;
  const percentage = (difference / avgCustom) * 100;
  
  if (difference > 0) {
    console.log(`Native is ${Math.abs(percentage).toFixed(2)}% slower`);
  } else {
    console.log(`Native is ${Math.abs(percentage).toFixed(2)}% faster`);
  }
  
  console.log(`\nEvents per second:`);
  console.log(`Custom: ${(iterations / (avgCustom / 1000)).toLocaleString()}`);
  console.log(`Native: ${(iterations / (avgNative / 1000)).toLocaleString()}`);
  
  return {
    custom: avgCustom,
    native: avgNative,
    difference,
    percentage
  };
}

// Run the test
const results = runPerformanceTest();

console.log('\n🎯 Recommendation:');
if (Math.abs(results.percentage) < 10) {
  console.log('Performance difference is minimal. Use native EventTarget for better browser compatibility.');
} else if (results.difference > 0) {
  console.log('Custom EventTarget is significantly faster. Consider keeping current implementation.');
} else {
  console.log('Native EventTarget is significantly faster. Consider migrating to native implementation.');
}