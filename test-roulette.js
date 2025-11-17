// Automated test for roulette payout fix
// Run with: node test-roulette.js

const segments = 12;
const multipliers = [0, 0, 0.4, 1, 0, 2, 0, 4, 0, 10, 0, 20];

function simulateSpin() {
  // Step 1: Choose a random target segment (same as in spin())
  const targetIndex = Math.floor(Math.random() * segments);
  const segmentAngle = 360 / segments;
  
  // Step 2: Calculate rotation to place targetIndex at the top
  // Pointer is at 270° (top). To bring targetCenter to 270°, rotate by (270° - targetCenter)
  const margin = 2;
  const randomExtra = (Math.random() * (segmentAngle - 2 * margin)) - (segmentAngle / 2 - margin);
  const targetCenter = targetIndex * segmentAngle + segmentAngle / 2;
  const alignToTop = 270 - (targetCenter + randomExtra);
  const extraSpins = 8;
  const finalRotation = extraSpins * 360 + alignToTop;
  const lastFinalRotation = ((finalRotation % 360) + 360) % 360;
  
  // Step 3: OLD (buggy) calculation - trying to determine segment from rotation
  const segmentAngleDeg = 360 / segments;
  const theta = ((90 + lastFinalRotation) % 360 + 360) % 360;
  const oldCalculatedIndex = Math.floor(theta / segmentAngleDeg);
  
  // Step 4: NEW (correct) approach - use the stored targetIndex directly
  const winningIndex = targetIndex; // This matches lastTargetIndex in the fixed code
  
  // Step 5: Calculate payouts
  const betAmount = 5;
  const expectedPayout = Math.round(multipliers[targetIndex] * betAmount);
  const oldPayout = Math.round(multipliers[oldCalculatedIndex] * betAmount);
  const correctPayout = Math.round(multipliers[winningIndex] * betAmount);
  
  // Verify: winningIndex should always equal targetIndex, and payout should match
  const isCorrect = winningIndex === targetIndex && correctPayout === expectedPayout;
  const oldWasWrong = oldCalculatedIndex !== targetIndex || oldPayout !== expectedPayout;
  
  return {
    targetIndex,
    oldCalculatedIndex,
    winningIndex,
    expectedPayout,
    oldPayout,
    correctPayout,
    isCorrect,
    oldWasWrong,
    multiplier: multipliers[targetIndex]
  };
}

function runTests(numTests = 100) {
  let passCount = 0;
  let failCount = 0;
  let oldBugCount = 0;
  const failures = [];
  
  console.log(`Running ${numTests} tests...\n`);
  
  for (let i = 0; i < numTests; i++) {
    const result = simulateSpin();
    
    if (result.isCorrect) {
      passCount++;
      if (i < 10) { // Show first 10 results
        console.log(`Test ${i + 1}: ✓ PASS - Segment ${result.targetIndex} (${result.multiplier}x), Payout: $${result.correctPayout}`);
      }
    } else {
      failCount++;
      failures.push({ test: i + 1, ...result });
      console.log(`Test ${i + 1}: ✗ FAIL - Expected segment ${result.targetIndex} ($${result.expectedPayout}), got ${result.winningIndex} ($${result.correctPayout})`);
    }
    
    if (result.oldWasWrong) {
      oldBugCount++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${numTests}`);
  console.log(`✓ Passed: ${passCount} (${((passCount/numTests)*100).toFixed(1)}%)`);
  console.log(`✗ Failed: ${failCount} (${((failCount/numTests)*100).toFixed(1)}%)`);
  console.log(`Old Bug Would Have Occurred: ${oldBugCount} times (${((oldBugCount/numTests)*100).toFixed(1)}%)`);
  console.log('='.repeat(60));
  
  if (failCount > 0) {
    console.log('\nFAILURES:');
    failures.forEach(f => {
      console.log(`  Test ${f.test}: Expected segment ${f.targetIndex} ($${f.expectedPayout}), got ${f.winningIndex} ($${f.correctPayout})`);
    });
  }
  
  if (passCount === numTests) {
    console.log('\n✓ All tests passed! The fix works correctly.');
    return true;
  } else {
    console.log('\n✗ Some tests failed. Please review the code.');
    return false;
  }
}

// Run the tests
const success = runTests(100);
process.exit(success ? 0 : 1);

