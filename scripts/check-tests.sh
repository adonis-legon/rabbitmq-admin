#!/bin/bash

# Script to check which tests would be run with different profiles
# Usage: ./check-tests.sh [all|unit|integration]

set -e

MODE=${1:-unit}

echo "Checking test discovery for mode: $MODE"
echo "========================================"

cd backend

case $MODE in
  "all")
    echo "All tests that would be discovered:"
    mvn test-compile surefire:test -DdryRun=true 2>/dev/null | grep "Running\|Test" || echo "No test output found"
    ;;
  "unit")
    echo "Unit tests that would be discovered with unit-test-only profile:"
    mvn test-compile surefire:test -Punit-test-only -DdryRun=true 2>/dev/null | grep -E "(Running|Test|Excluded)" || echo "No test output found"
    
    echo ""
    echo "Searching for integration test files that should be excluded:"
    find src/test -name "*Integration*Test.java" -o -name "*IT.java" -o -name "*IntegrationTest.java" | head -10
    
    echo ""
    echo "Checking Surefire configuration for unit-test-only profile:"
    mvn help:effective-pom -Punit-test-only | grep -A 20 -B 5 "maven-surefire-plugin" || echo "Surefire config not found in effective POM"
    ;;
  "integration")
    echo "Looking for integration tests in the project:"
    find src/test -type f -name "*.java" | xargs grep -l "@SpringBootTest\|@Testcontainers\|@IntegrationTest" | head -10
    ;;
  *)
    echo "Invalid mode. Use: all, unit, or integration"
    exit 1
    ;;
esac

echo ""
echo "Test discovery check completed."