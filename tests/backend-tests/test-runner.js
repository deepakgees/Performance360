/**
 * Test Runner for Backend Tests
 * 
 * Runs all backend unit and integration tests
 * 
 * Usage:
 *   node test-runner.js                    # Run all tests
 *   node test-runner.js --suite logging    # Run logging tests only
 *   node test-runner.js --suite database   # Run database tests only
 *   node test-runner.js --suite api        # Run API tests only
 */

const colors = require('colors');
const fs = require('fs');
const path = require('path');

// Test results
const results = {
  passed: [],
  failed: [],
  warnings: [],
  total: 0
};

// Helper functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const colors_map = {
    info: colors.blue,
    success: colors.green,
    error: colors.red,
    warning: colors.yellow
  };
  console.log(colors_map[type](`[${timestamp}] ${message}`));
}

function recordResult(testName, passed, message = '') {
  results.total++;
  if (passed) {
    results.passed.push({ test: testName, message });
    log(`✓ ${testName}`, 'success');
    if (message) {
      console.log(`  ${message}`);
    }
  } else {
    results.failed.push({ test: testName, message });
    log(`✗ ${testName}`, 'error');
    if (message) {
      console.log(`  ${message}`);
    }
  }
}

function recordWarning(testName, message) {
  results.warnings.push({ test: testName, message });
  log(`⚠ ${testName}`, 'warning');
  console.log(`  ${message}`);
}

// Get suite filter from command line
const suiteFilter = process.argv.includes('--suite') 
  ? process.argv[process.argv.indexOf('--suite') + 1]
  : null;

// Load and run tests
const testDir = __dirname;
const testFiles = fs.readdirSync(testDir)
  .filter(file => file.startsWith('test-') && file.endsWith('.js'))
  .filter(file => {
    if (!suiteFilter) return true;
    const suite = file.replace('test-', '').replace('.js', '');
    return suite.startsWith(suiteFilter);
  });

async function runTests() {
  log('Starting Backend Tests...', 'info');
  console.log('');

  for (const testFile of testFiles) {
    const testPath = path.join(testDir, testFile);
    log(`Running ${testFile}...`, 'info');
    
    try {
      const testModule = require(testPath);
      if (typeof testModule.run === 'function') {
        await testModule.run(recordResult, recordWarning);
      } else {
        recordWarning(testFile, 'Test file does not export a run function');
      }
    } catch (error) {
      recordResult(testFile, false, `Error running test: ${error.message}`);
    }
    console.log('');
  }

  // Print summary
  console.log('');
  log('=== Test Summary ===', 'info');
  log(`Total Tests: ${results.total}`, 'info');
  log(`Passed: ${results.passed.length}`, 'success');
  log(`Failed: ${results.failed.length}`, results.failed.length > 0 ? 'error' : 'success');
  log(`Warnings: ${results.warnings.length}`, results.warnings.length > 0 ? 'warning' : 'info');
  console.log('');

  if (results.failed.length > 0) {
    log('Failed Tests:', 'error');
    results.failed.forEach(failure => {
      log(`  - ${failure.test}: ${failure.message}`, 'error');
    });
    console.log('');
    process.exit(1);
  }

  if (results.passed.length === results.total) {
    log('All tests passed!', 'success');
    process.exit(0);
  }
}

runTests().catch(error => {
  log(`Fatal error: ${error.message}`, 'error');
  process.exit(1);
});
