/**
 * Professional Test Framework - Jest/Mocha style for WASM testing
 * Provides elegant test organization and reporting
 */

// Global test statistics
let testStats = {
  passed: 0,
  failed: 0,
  crashed: 0,
  total: 0,
  suites: {
    total: 0,
    passed: 0,
    failed: 0
  }
};

/**
 * Run a single test with professional formatting
 * @param {string} description - Descriptive test description
 * @param {Function} testFunction - Function that returns boolean
 * @returns {boolean} - Test result
 */
function test(description, testFunction) {
  testStats.total++;
  
  try {
    const result = testFunction();
    
    if (result === true) {
      testStats.passed++;
      console.log(`   ✅ ${description}`);
      return true;
    } else {
      testStats.failed++;
      console.log(`   ❌ ${description} - FAILED`);
      return false;
    }
  } catch (error) {
    testStats.crashed++;
    testStats.failed++; // Count crashes as failures too
    console.log(`   💥 ${description} - CRASHED`);
    console.log(`      Error: ${error.message}`);
    if (error.stack) {
      console.log(`      Stack: ${error.stack.split('\n')[1]}`);
    }
    return false;
  }
}

/**
 * Organize tests into a suite (like describe() in Jest/Mocha)
 * @param {string} suiteName - Name of the test suite
 * @param {Function} testSuite - Function that defines the tests
 * @returns {boolean} - True if all tests in suite passed
 */
function describe(suiteName, testSuite) {
  testStats.suites.total++;
  
  console.log(`\n📚 ${suiteName}:`);
  
  const results = [];
  
  // Execute the test suite
  testSuite(results);
  
  // Calculate suite statistics
  const suitePassed = results.filter(r => r).length;
  const suiteTotal = results.length;
  const suiteSuccess = suitePassed === suiteTotal;
  
  if (suiteSuccess) {
    testStats.suites.passed++;
    console.log(`\n   📊 Suite: ${suitePassed}/${suiteTotal} tests passed ✅`);
  } else {
    testStats.suites.failed++;
    console.log(`\n   📊 Suite: ${suitePassed}/${suiteTotal} tests passed ❌`);
  }
  
  return suiteSuccess;
}

/**
 * Run a simple test with minimal output (for quick checks)
 * @param {string} description - Short test description
 * @param {Function} testFunction - Function that returns boolean
 * @returns {boolean} - Test result
 */
function it(description, testFunction) {
  return test(description, testFunction);
}

/**
 * Print comprehensive final statistics
 */
function printFinalStats() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🏁 FINAL TEST RESULTS`);
  console.log(`${'='.repeat(60)}`);
  
  // Overall statistics
  console.log(`\n📊 Overall Statistics:`);
  console.log(`   Total Tests: ${testStats.total}`);
  console.log(`   Passed: ${testStats.passed} ✅`);
  console.log(`   Failed: ${testStats.failed} ❌`);
  if (testStats.crashed > 0) {
    console.log(`   Crashed: ${testStats.crashed} 💥`);
  }
  
  // Success rate
  const successRate = testStats.total > 0 ? 
    ((testStats.passed / testStats.total) * 100).toFixed(1) : 0;
  console.log(`   Success Rate: ${successRate}%`);
  
  // Suite statistics
  console.log(`\n📚 Suite Statistics:`);
  console.log(`   Total Suites: ${testStats.suites.total}`);
  console.log(`   Passed Suites: ${testStats.suites.passed} ✅`);
  console.log(`   Failed Suites: ${testStats.suites.failed} ❌`);
  
  // Final verdict
  const allPassed = testStats.failed === 0 && testStats.crashed === 0;
  console.log(`\n${allPassed ? '🎉' : '💔'} Final Verdict:`);
  
  if (allPassed) {
    console.log(`   🚀 ALL TESTS PASSED! Boolean class is mathematically correct!`);
  } else {
    console.log(`   ⚠️  ${testStats.failed} test(s) failed. Please review the failures above.`);
  }
  
  console.log(`${'='.repeat(60)}\n`);
  
  return allPassed;
}

/**
 * Reset test statistics (useful for multiple test runs)
 */
function resetStats() {
  testStats = {
    passed: 0,
    failed: 0,
    crashed: 0,
    total: 0,
    suites: {
      total: 0,
      passed: 0,
      failed: 0
    }
  };
}

/**
 * Get current test statistics
 * @returns {Object} Current statistics
 */
function getStats() {
  return { ...testStats };
}

/**
 * Print a header for the test session
 * @param {string} title - Main title
 * @param {string} subtitle - Subtitle (optional)
 */
function printHeader(title, subtitle = "") {
  console.log(`${'='.repeat(60)}`);
  console.log(`🧪 ${title.toUpperCase()}`);
  if (subtitle) {
    console.log(`   ${subtitle}`);
  }
  console.log(`${'='.repeat(60)}`);
}

// Export the framework functions
export {
  test,
  describe,
  it,
  printFinalStats,
  printHeader,
  resetStats,
  getStats
};