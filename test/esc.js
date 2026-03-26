/**
 * XSS escape helper unit tests — no test framework, plain Node.js
 * Run: node test/esc.js
 */

'use strict';

let passed = 0, failed = 0;

function assert(desc, actual, expected) {
  if (actual === expected) {
    console.log(`  ✅ ${desc}`);
    passed++;
  } else {
    console.error(`  ❌ ${desc}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    failed++;
  }
}

// ─── The esc() helper (mirrors index.html) ────────────────────────────────────
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// ─── Tests ────────────────────────────────────────────────────────────────────

console.log('\n── esc(): HTML special chars ──');
assert('<script> tag escaped', esc('<script>alert(1)</script>'), '&lt;script&gt;alert(1)&lt;/script&gt;');
assert('& ampersand escaped', esc('Tom & Jerry'), 'Tom &amp; Jerry');
assert('double quote escaped', esc('"hello"'), '&quot;hello&quot;');
assert("single quote escaped", esc("it's"), 'it&#39;s');
assert('> greater-than escaped', esc('a>b'), 'a&gt;b');

console.log('\n── esc(): edge cases ──');
assert('null → empty string', esc(null), '');
assert('undefined → empty string', esc(undefined), '');
assert('number coercion', esc(42), '42');
assert('zero coercion', esc(0), '0');
assert('plain string unchanged', esc('hello world'), 'hello world');
assert('empty string unchanged', esc(''), '');

console.log('\n── esc(): XSS attack vectors ──');
assert('onerror injection', esc('" onerror="alert(1)"'), '&quot; onerror=&quot;alert(1)&quot;');
assert('svg injection', esc('<svg onload=alert(1)>'), '&lt;svg onload=alert(1)&gt;');
assert('style injection', esc("</style><script>evil()</script>"), '&lt;/style&gt;&lt;script&gt;evil()&lt;/script&gt;');

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(40)}`);
console.log(`Esc tests: ${passed} passed, ${failed} failed`);
if (failed) { console.error('FAIL'); process.exit(1); }
else { console.log('PASS'); }
