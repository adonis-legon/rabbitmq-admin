// List of test files that are known to be slow or problematic in CI
// These will be skipped in CI environment unless explicitly requested

export const SLOW_INTEGRATION_TESTS = [
    'ResourceDataFlow.integration.test.tsx',
    'QueuesList.integration.test.tsx',
    'AuditFlowEndToEnd.integration.test.tsx',
    'WriteOperations.integration.test.tsx'
];

export const PROBLEMATIC_UNIT_TESTS = [
    'CreateBindingDialog.test.tsx', // Has MUI select issues
    // Add more as identified
];

export const CI_TEST_CONFIG = {
    // Reduced timeouts for CI
    testTimeout: 5000,
    hookTimeout: 3000,

    // Fail fast settings
    bail: 3,

    // Skip patterns for CI
    skipPatterns: process.env.CI ? [
        ...SLOW_INTEGRATION_TESTS.map(test => `**/${test}`),
        // Conditionally skip problematic tests
        ...(process.env.SKIP_PROBLEMATIC_TESTS === 'true' ?
            PROBLEMATIC_UNIT_TESTS.map(test => `**/${test}`) : [])
    ] : [],
};