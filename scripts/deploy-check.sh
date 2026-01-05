#!/bin/bash

# 🏭 Production Deployment Readiness Check
# Heinicus Mobile Mechanic App
# Run this before deploying to production

set -e

echo "🔍 Heinicus Mobile Mechanic - Production Readiness Check"
echo "=========================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0
WARNINGS=0

# Helper functions
pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

echo "📋 1. Environment Configuration"
echo "--------------------------------"

# Check if .env exists
if [ -f ".env" ]; then
    pass ".env file exists"

    # Check for required variables
    required_vars=(
        "NODE_ENV"
        "EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY"
        "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY"
        "EXPO_PUBLIC_FIREBASE_API_KEY"
    )

    for var in "${required_vars[@]}"; do
        if grep -q "^$var=" .env; then
            pass "$var is set"
        else
            fail "$var is missing from .env"
        fi
    done

    # Check for test mode keys (should not be in production)
    if grep -q "pk_test_" .env; then
        warn "Stripe test key detected (pk_test_). Use live keys for production."
    fi

    # Check for demo passwords (should not be in production)
    if grep -q "EXPO_PUBLIC_ADMIN_PASSWORD" .env; then
        fail "Demo admin password found in .env - REMOVE for production"
    fi

else
    fail ".env file not found - copy from .env.example and configure"
fi

echo ""
echo "🔐 2. Security Checks"
echo "---------------------"

# Check if bcrypt is installed
if grep -q "bcryptjs" package.json; then
    pass "bcryptjs installed for password hashing"
else
    fail "bcryptjs not installed - passwords not secure!"
fi

# Check for hardcoded secrets
if grep -r "sk_live_" --exclude-dir=node_modules --exclude="*.md" --exclude="deploy-check.sh" .; then
    fail "Hardcoded Stripe secret key found in code!"
else
    pass "No hardcoded Stripe secrets found"
fi

# Check for .gitignore
if [ -f ".gitignore" ]; then
    if grep -q ".env" .gitignore; then
        pass ".env is in .gitignore"
    else
        fail ".env not in .gitignore - secrets will be committed!"
    fi
else
    fail ".gitignore file not found"
fi

echo ""
echo "📦 3. Dependencies"
echo "------------------"

# Check if node_modules exists
if [ -d "node_modules" ]; then
    pass "node_modules installed"
else
    fail "node_modules not found - run 'npm install'"
fi

# Check for outdated critical packages
echo "Checking for security updates..."
npm audit --audit-level=high > /dev/null 2>&1
if [ $? -eq 0 ]; then
    pass "No high-severity vulnerabilities"
else
    warn "High-severity vulnerabilities found - run 'npm audit fix'"
fi

echo ""
echo "🏗️ 4. Build Configuration"
echo "-------------------------"

# Check eas.json
if [ -f "eas.json" ]; then
    pass "eas.json exists"

    # Check for production profile
    if grep -q '"production"' eas.json; then
        pass "Production build profile configured"
    else
        fail "Production build profile missing in eas.json"
    fi
else
    fail "eas.json not found - EAS builds not configured"
fi

# Check app.json
if [ -f "app.json" ]; then
    pass "app.json exists"

    # Check version
    VERSION=$(grep '"version"' app.json | head -1 | cut -d'"' -f4)
    if [ ! -z "$VERSION" ]; then
        pass "App version: $VERSION"
    else
        warn "App version not found in app.json"
    fi
else
    fail "app.json not found"
fi

echo ""
echo "🧪 5. Testing"
echo "-------------"

# Check if tests exist
if [ -d "__tests__" ]; then
    pass "Test directory exists"

    # Try running tests (with timeout)
    echo "Running tests..."
    timeout 60s npm test -- --passWithNoTests > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        pass "Tests passing"
    else
        warn "Some tests failing - review before deployment"
    fi
else
    warn "No test directory found"
fi

echo ""
echo "📱 6. Mobile Database"
echo "---------------------"

# Check if mobile database exists
if [ -f "lib/mobile-database.ts" ]; then
    pass "Mobile database implementation exists"

    # Check for bcrypt usage
    if grep -q "bcrypt" lib/mobile-database.ts; then
        pass "Database uses bcrypt for passwords"
    else
        fail "Database not using bcrypt - passwords insecure!"
    fi
else
    fail "Mobile database not found"
fi

echo ""
echo "🔌 7. API Backend"
echo "-----------------"

# Check backend directory
if [ -d "backend" ]; then
    pass "Backend directory exists"

    # Check for API routes
    if [ -d "backend/trpc/routes" ]; then
        pass "tRPC routes configured"
    else
        warn "tRPC routes directory not found"
    fi
else
    warn "Backend directory not found - API may not be ready"
fi

echo ""
echo "📄 8. Documentation"
echo "-------------------"

# Check for README
if [ -f "README.md" ]; then
    pass "README.md exists"
else
    warn "README.md not found"
fi

# Check for production readiness doc
if [ -f "PRODUCTION_READINESS.md" ]; then
    pass "Production readiness checklist exists"
else
    warn "PRODUCTION_READINESS.md not found"
fi

echo ""
echo "=========================================================="
echo "📊 Summary"
echo "=========================================================="
echo -e "${GREEN}Passed:${NC} $PASSED"
echo -e "${YELLOW}Warnings:${NC} $WARNINGS"
echo -e "${RED}Failed:${NC} $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "${GREEN}✓ ALL CHECKS PASSED${NC} - Ready for deployment!"
        exit 0
    else
        echo -e "${YELLOW}⚠ PASSED WITH WARNINGS${NC} - Review warnings before deployment"
        exit 0
    fi
else
    echo -e "${RED}✗ DEPLOYMENT BLOCKED${NC} - Fix failed checks before deploying"
    echo ""
    echo "To fix issues:"
    echo "  1. Review the failed checks above"
    echo "  2. Address each issue"
    echo "  3. Run this script again"
    echo ""
    echo "For help, see: PRODUCTION_READINESS.md"
    exit 1
fi
