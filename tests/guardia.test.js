// Rotation tests: node --test tests/
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// guardia.js is a browser script: run it in a sandbox and pull out what we need
const sandbox = { navigator: {}, location: { protocol: 'file:' } };
vm.runInNewContext(
  fs.readFileSync(path.join(__dirname, '../js/guardia.js'), 'utf8') +
  '\nthis.getTurn = getTurn; this.ROTATION_START = ROTATION_START;',
  sandbox
);
const { getTurn, ROTATION_START } = sandbox;

const MODES = { '12 2x3': 10, '8 5x3': 5 };   // modality → cycle length in days
const day = offset => new Date(
  ROTATION_START.getFullYear(), ROTATION_START.getMonth(), ROTATION_START.getDate() + offset);

test('the cycle repeats evenly before and after the start date', () => {
  for (const [mode, period] of Object.entries(MODES))
    for (let guard = 0; guard < 5; guard++)
      for (let i = -1500; i < 1500; i++)
        assert.strictEqual(getTurn(mode, guard, day(i)), getTurn(mode, guard, day(i + period)),
          `${mode}, guard ${guard}, day ${i}`);
});

test('every day each turn is covered by exactly one guard', () => {
  const expected = { '12 2x3': [0, 0, 0, 1, 2], '8 5x3': [0, 0, 1, 2, 3] };
  for (const mode of Object.keys(MODES))
    for (let i = -1500; i < 1500; i++) {
      const turns = [0, 1, 2, 3, 4].map(g => getTurn(mode, g, day(i))).sort();
      assert.deepStrictEqual(turns, expected[mode], `${mode}, day ${i}`);
    }
});

test('the first guard starts its cycle on the start date', () => {
  const pattern = mode => Array.from({ length: MODES[mode] }, (_, i) => getTurn(mode, 0, day(i))).join('');
  assert.strictEqual(pattern('12 2x3'), '1100022000');
  assert.strictEqual(pattern('8 5x3'), '13020');
});
