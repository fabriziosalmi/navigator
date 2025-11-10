#!/usr/bin/env bash

# ==========================================
# Navigator Ecosystem Validator
# Step 2.5: Code Quality & Complexity Analysis
# ==========================================

set -e

echo ""
echo "=================================================="
echo "📊 CODE QUALITY & COMPLEXITY ANALYSIS"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ==========================================
# Step 1: Check if required tools are installed
# ==========================================

echo -e "${BLUE}🔍 Checking required tools...${NC}"

if ! command -v pnpm &> /dev/null; then
  echo -e "${RED}❌ pnpm not found. Please install pnpm first.${NC}"
  exit 1
fi

echo -e "${GREEN}✓ pnpm found${NC}"
echo ""

# ==========================================
# Step 2: Analyze Cognitive Complexity
# ==========================================

echo -e "${BLUE}🧠 Analyzing cognitive complexity...${NC}"
echo ""
echo "⚙️  Complexity thresholds:"
echo "   • Cognitive complexity: max 15 per function"
echo "   • Cyclomatic complexity: max 10 per function"
echo "   • Max nested callbacks: 3 levels"
echo ""

# Check if eslint-plugin-sonarjs is installed
if ! pnpm list eslint-plugin-sonarjs --depth=0 &> /dev/null; then
  echo -e "${YELLOW}⚠️  eslint-plugin-sonarjs not installed${NC}"
  echo -e "${YELLOW}   Installing as dev dependency...${NC}"
  pnpm add -D eslint-plugin-sonarjs -w
  echo ""
fi

# Create temporary ESLint config for complexity analysis
cat > .eslintrc.complexity.json <<EOF
{
  "extends": ["./.eslintrc.json"],
  "plugins": ["sonarjs"],
  "rules": {
    "sonarjs/cognitive-complexity": ["error", 15],
    "sonarjs/no-duplicate-string": ["warn", 5],
    "sonarjs/no-identical-functions": "error",
    "sonarjs/max-switch-cases": ["error", 10],
    "complexity": ["error", 10]
  }
}
EOF

# Run complexity analysis on packages
echo -e "${BLUE}📦 Analyzing packages...${NC}"
echo ""

COMPLEXITY_FAILED=0

# Analyze each package
for pkg in packages/*; do
  if [ -d "$pkg" ] && [ -d "$pkg/src" ]; then
    PKG_NAME=$(basename "$pkg")
    echo -e "${BLUE}  Checking $PKG_NAME...${NC}"
    
    # Run ESLint with complexity rules
    if pnpm eslint "$pkg/src" --config .eslintrc.complexity.json --max-warnings 10 2>&1 | grep -E "error|warning" || true; then
      # Check exit code
      if [ ${PIPESTATUS[0]} -ne 0 ]; then
        echo -e "${YELLOW}  ⚠️  Complexity warnings found in $PKG_NAME${NC}"
        COMPLEXITY_FAILED=$((COMPLEXITY_FAILED + 1))
      else
        echo -e "${GREEN}  ✓ $PKG_NAME passed${NC}"
      fi
    else
      echo -e "${GREEN}  ✓ $PKG_NAME passed${NC}"
    fi
    echo ""
  fi
done

# Clean up temporary config
rm -f .eslintrc.complexity.json

# ==========================================
# Step 3: Check for Code Smells
# ==========================================

echo -e "${BLUE}👃 Checking for common code smells...${NC}"
echo ""

SMELLS_FOUND=0

# Check for large files (over 500 lines)
echo "  Checking for large files (>500 lines)..."
LARGE_FILES=$(find packages/*/src -name "*.ts" -o -name "*.tsx" | xargs wc -l | awk '$1 > 500 {print}' | grep -v total || true)

if [ -n "$LARGE_FILES" ]; then
  echo -e "${YELLOW}  ⚠️  Large files detected:${NC}"
  echo "$LARGE_FILES" | while read line; do
    echo "     $line"
  done
  SMELLS_FOUND=$((SMELLS_FOUND + 1))
else
  echo -e "${GREEN}  ✓ No excessively large files${NC}"
fi
echo ""

# Check for TODO/FIXME comments
echo "  Checking for TODO/FIXME comments..."
TODO_COUNT=$(grep -r "TODO\|FIXME" packages/*/src --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l || echo "0")

if [ "$TODO_COUNT" -gt 0 ]; then
  echo -e "${YELLOW}  ⚠️  Found $TODO_COUNT TODO/FIXME comments${NC}"
  echo -e "${YELLOW}     Consider creating GitHub issues for these${NC}"
else
  echo -e "${GREEN}  ✓ No TODO/FIXME comments${NC}"
fi
echo ""

# Check for console.log statements (except in test files)
echo "  Checking for console.log statements..."
CONSOLE_COUNT=$(grep -r "console\\.log" packages/*/src --include="*.ts" --include="*.tsx" --exclude="*.spec.ts" --exclude="*.test.ts" 2>/dev/null | wc -l || echo "0")

if [ "$CONSOLE_COUNT" -gt 5 ]; then
  echo -e "${YELLOW}  ⚠️  Found $CONSOLE_COUNT console.log statements${NC}"
  echo -e "${YELLOW}     Consider using a proper logger${NC}"
else
  echo -e "${GREEN}  ✓ Minimal console.log usage${NC}"
fi
echo ""

# ==========================================
# Step 4: Summary
# ==========================================

echo ""
echo "=================================================="
echo "📊 CODE QUALITY SUMMARY"
echo "=================================================="
echo ""

if [ $COMPLEXITY_FAILED -eq 0 ] && [ $SMELLS_FOUND -eq 0 ]; then
  echo -e "${GREEN}✅ Code quality check passed!${NC}"
  echo ""
  echo "All functions are within complexity thresholds."
  echo "No critical code smells detected."
  echo ""
  exit 0
else
  echo -e "${YELLOW}⚠️  Code quality check completed with warnings${NC}"
  echo ""
  
  if [ $COMPLEXITY_FAILED -gt 0 ]; then
    echo -e "${YELLOW}  • $COMPLEXITY_FAILED package(s) with complexity warnings${NC}"
  fi
  
  if [ $SMELLS_FOUND -gt 0 ]; then
    echo -e "${YELLOW}  • Code smells detected${NC}"
  fi
  
  echo ""
  echo "These are warnings, not errors. Consider refactoring complex code."
  echo ""
  
  # Don't fail the build, just warn
  exit 0
fi
