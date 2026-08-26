#!/usr/bin/env node
/**
 * Automated Production Smoke Test & Health Check Script
 * Evaluates production HTTP response status, TTFB latency, security headers, and asset caching.
 *
 * Usage:
 *   node scripts/smoke-test.js [target_url]
 *   npm run test:smoke
 */

const TARGET_URL = process.argv[2] || process.env.SMOKE_TEST_URL || process.env.PLAYWRIGHT_TEST_BASE_URL || 'https://customervendor.vercel.app';
const MAX_TTFB_MS = 800;
const TIMEOUT_MS = 6000;

// ANSI Colors for formatted console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m'
};

const results = [];

/**
 * Fetch helper with TTFB latency measurement & timeout
 */
async function probeEndpoint(path, description, expectedStatus = 200) {
  const url = `${TARGET_URL.replace(/\/$/, '')}${path}`;
  const start = performance.now();

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'VendorSaathi-SmokeTest/1.0',
        'Accept': '*/*'
      },
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });

    const duration = Math.round(performance.now() - start);
    const passed = res.status === expectedStatus;

    const result = {
      path,
      description,
      status: res.status,
      expected: expectedStatus,
      duration,
      passed,
      headers: Object.fromEntries(res.headers.entries())
    };

    results.push(result);
    return result;
  } catch (err) {
    const duration = Math.round(performance.now() - start);
    const result = {
      path,
      description,
      status: 'ERR',
      expected: expectedStatus,
      duration,
      passed: false,
      error: err.message,
      headers: {}
    };

    results.push(result);
    return result;
  }
}

async function runSmokeTests() {
  console.log(`\n${colors.bright}${colors.cyan}══════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}🚀  VendorSaathi Production Smoke Test & Health Check${colors.reset}`);
  console.log(`${colors.dim}Target URL: ${TARGET_URL}${colors.reset}`);
  console.log(`${colors.dim}Timestamp:  ${new Date().toISOString()}${colors.reset}`);
  console.log(`${colors.cyan}══════════════════════════════════════════════════════════════════${colors.reset}\n`);

  // 1. Probe Public Route Endpoints
  console.log(`${colors.bright}1. Probing Public Endpoints...${colors.reset}`);
  await probeEndpoint('/', 'Main SPA Entry Point', 200);
  await probeEndpoint('/manifest.json', 'PWA Web App Manifest', 200);
  await probeEndpoint('/robots.txt', 'Search Engine Robots Policy', 200);
  await probeEndpoint('/sitemap.xml', 'Public Search Sitemap', 200);
  await probeEndpoint('/favicon.svg', 'Vector SVG Favicon', 200);

  // 2. Probe SPA Fallback Subpath Routing
  console.log(`${colors.bright}2. Probing SPA Client-Side Routing Fallbacks...${colors.reset}`);
  await probeEndpoint('/categories', 'Categories Subpath (SPA)', 200);
  await probeEndpoint('/vendor/portal', 'Vendor Portal Deep Link (SPA)', 200);
  await probeEndpoint('/orders/tracking', 'Order Tracking Deep Link (SPA)', 200);

  // 3. Evaluate Security Headers & Latency on Root
  const rootResult = results.find(r => r.path === '/');
  const headers = rootResult?.headers || {};

  const requiredHeaders = [
    { key: 'x-content-type-options', expected: 'nosniff', name: 'MIME Sniffing Protection' },
    { key: 'x-frame-options', expected: 'DENY', name: 'Clickjacking Protection' },
    { key: 'referrer-policy', expected: 'strict-origin-when-cross-origin', name: 'Referrer Security Policy' },
    { key: 'permissions-policy', exists: true, name: 'Hardware Permissions Policy' },
    { key: 'content-security-policy', exists: true, name: 'Content Security Policy (CSP)' }
  ];

  const headerChecks = [];
  for (const req of requiredHeaders) {
    const val = headers[req.key] || headers[req.key.toLowerCase()];
    let valid = false;

    if (req.expected) {
      valid = val && val.toLowerCase().includes(req.expected.toLowerCase());
    } else if (req.exists) {
      valid = !!val && val.length > 0;
    }

    headerChecks.push({
      header: req.key,
      name: req.name,
      value: val || '(missing in response)',
      valid
    });
  }

  // 4. Print Structured Results Table
  console.log('\n' + colors.bright + '📋  ENDPOINT TEST MATRIX:' + colors.reset);
  console.log('┌──────────────┬────────────────────────────┬─────────┬──────────┬───────────┐');
  console.log('│ Endpoint     │ Description                │ Status  │ TTFB     │ Result    │');
  console.log('├──────────────┼────────────────────────────┼─────────┼──────────┼───────────┤');

  let failedCount = 0;

  for (const r of results) {
    const statusCol = String(r.status).padEnd(7);
    const durationStr = `${r.duration}ms`.padEnd(8);
    const pathCol = r.path.padEnd(12).slice(0, 12);
    const descCol = r.description.padEnd(26).slice(0, 26);
    
    let resultCol = `${colors.green}PASS${colors.reset}    `;
    if (!r.passed) {
      resultCol = `${colors.red}FAIL${colors.reset}    `;
      failedCount++;
    } else if (r.duration > MAX_TTFB_MS) {
      resultCol = `${colors.yellow}SLOW${colors.reset}    `;
    }

    console.log(`│ ${pathCol} │ ${descCol} │ ${statusCol} │ ${durationStr} │ ${resultCol}│`);
  }
  console.log('└──────────────┴────────────────────────────┴─────────┴──────────┴───────────┘');

  // 5. Print Security Header Audit
  console.log('\n' + colors.bright + '🛡️   SECURITY HEADERS AUDIT:' + colors.reset);
  for (const h of headerChecks) {
    const icon = h.valid ? `${colors.green}✔ PASS${colors.reset}` : `${colors.yellow}⚠ NOTE${colors.reset}`;
    console.log(`  ${icon}  ${h.header.padEnd(26)} -> ${colors.dim}${h.value.slice(0, 60)}${colors.reset}`);
  }

  // 6. Latency & TTFB Check
  const validDurations = results.filter(r => typeof r.duration === 'number' && r.duration > 0).map(r => r.duration);
  const avgTTFB = validDurations.length ? Math.round(validDurations.reduce((a, b) => a + b, 0) / validDurations.length) : 0;
  const maxTTFB = validDurations.length ? Math.max(...validDurations) : 0;

  console.log('\n' + colors.bright + '⚡  PERFORMANCE & LATENCY:' + colors.reset);
  console.log(`  • Average TTFB:      ${avgTTFB < MAX_TTFB_MS ? colors.green : colors.yellow}${avgTTFB}ms${colors.reset}`);
  console.log(`  • Max TTFB:          ${maxTTFB < MAX_TTFB_MS ? colors.green : colors.yellow}${maxTTFB}ms${colors.reset} (Threshold: ${MAX_TTFB_MS}ms)`);

  // 7. Final Assessment & Exit Code
  console.log(`\n${colors.cyan}══════════════════════════════════════════════════════════════════${colors.reset}`);
  if (failedCount === 0) {
    console.log(`${colors.green}${colors.bright}✅  SMOKE TEST PASSED: Production deployment is healthy & verified!${colors.reset}`);
    console.log(`${colors.cyan}══════════════════════════════════════════════════════════════════${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}${colors.bright}❌  SMOKE TEST COMPLETED: ${failedCount} endpoint check(s) did not return expected status.${colors.reset}`);
    console.log(`${colors.cyan}══════════════════════════════════════════════════════════════════${colors.reset}\n`);
    process.exit(1);
  }
}

runSmokeTests();
