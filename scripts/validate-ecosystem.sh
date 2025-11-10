#!/bin/bash
#
# Navigator Ecosystem Validation Orchestrator
# 
# Purpose: Execute comprehensive validation suite across entire monorepo
# Usage: 
#   ./scripts/validate-ecosystem.sh              # Run all checks
#   ./scripts/validate-ecosystem.sh --only=lint  # Run specific check
#   pnpm validate                                # Shortcut via package.json
#
# Exit codes:
#   0 = All validations passed
#   1 = One or more validations failed
#

set -e  # Exit immediately if any command fails
set -o pipefail  # Catch failures in pipes

# =============================================================================
# ANSI COLOR CODES
# =============================================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[1;36m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
RESET='\033[0m'

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

# Print colored header
print_header() {
  echo ""
  echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
  echo -e "${CYAN}${BOLD}🚀  $1${RESET}"
  echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
}

# Print success message
print_success() {
  echo -e "${GREEN}${BOLD}✅  $1${RESET}"
}

# Print error message
print_error() {
  echo -e "${RED}${BOLD}❌  $1${RESET}"
}

# Print warning message
print_warning() {
  echo -e "${YELLOW}${BOLD}⚠️   $1${RESET}"
}

# Print info message
print_info() {
  echo -e "${BLUE}ℹ️   $1${RESET}"
}

# Print step counter
print_step() {
  echo -e "${MAGENTA}${BOLD}[$1/$2]${RESET} $3"
}

# Execute validation step
run_validation_step() {
  local step_num=$1
  local total_steps=$2
  local step_name=$3
  local script_path=$4
  
  print_step "$step_num" "$total_steps" "$step_name"
  
  if bash "$script_path"; then
    print_success "$step_name completed successfully"
    return 0
  else
    print_error "$step_name failed"
    return 1
  fi
}

# =============================================================================
# PARSE ARGUMENTS
# =============================================================================

ONLY_CHECK=""
CI_MODE=false

for arg in "$@"; do
  case $arg in
    --only=*)
      ONLY_CHECK="${arg#*=}"
      shift
      ;;
    --ci)
      CI_MODE=true
      shift
      ;;
    --help)
      echo "Navigator Ecosystem Validation"
      echo ""
      echo "Usage:"
      echo "  ./scripts/validate-ecosystem.sh              Run all checks"
      echo "  ./scripts/validate-ecosystem.sh --only=lint  Run specific check only"
      echo "  ./scripts/validate-ecosystem.sh --ci         Run in CI mode (optimized)"
      echo ""
      echo "Available checks:"
      echo "  dependencies  - Check for outdated packages and vulnerabilities"
      echo "  lint          - Run ESLint on all code"
      echo "  test          - Run unit and integration tests"
      echo "  build         - Build all packages and apps"
      echo "  e2e           - Run end-to-end tests"
      echo "  size          - Check bundle sizes"
      exit 0
      ;;
    *)
      print_error "Unknown argument: $arg"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# =============================================================================
# VALIDATION STEPS CONFIGURATION
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VALIDATORS_DIR="$SCRIPT_DIR/validators"

# Array of validation steps: [key, name, script_path]
declare -a STEPS=(
  "dependencies:Dependency Check:$VALIDATORS_DIR/check-dependencies.sh"
  "lint:Code Linting:$VALIDATORS_DIR/run-lint.sh"
  "test:Unit & Integration Tests:$VALIDATORS_DIR/run-unit-tests.sh"
  "build:Production Build:$VALIDATORS_DIR/build-all.sh"
  "e2e:End-to-End Tests:$VALIDATORS_DIR/run-e2e-tests.sh"
  "size:Bundle Size Check:$VALIDATORS_DIR/check-bundle-size.sh"
)

# =============================================================================
# MAIN EXECUTION
# =============================================================================

# Print banner
echo ""
echo -e "${CYAN}${BOLD}"
echo "███╗   ██╗ █████╗ ██╗   ██╗██╗ ██████╗  █████╗ ████████╗ ██████╗ ██████╗ "
echo "████╗  ██║██╔══██╗██║   ██║██║██╔════╝ ██╔══██╗╚══██╔══╝██╔═══██╗██╔══██╗"
echo "██╔██╗ ██║███████║██║   ██║██║██║  ███╗███████║   ██║   ██║   ██║██████╔╝"
echo "██║╚██╗██║██╔══██║╚██╗ ██╔╝██║██║   ██║██╔══██║   ██║   ██║   ██║██╔══██╗"
echo "██║ ╚████║██║  ██║ ╚████╔╝ ██║╚██████╔╝██║  ██║   ██║   ╚██████╔╝██║  ██║"
echo "╚═╝  ╚═══╝╚═╝  ╚═╝  ╚═══╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝"
echo -e "${RESET}"
print_header "ECOSYSTEM VALIDATION ORCHESTRATOR v1.0.0"

if [ "$CI_MODE" = true ]; then
  print_info "Running in CI mode"
fi

if [ -n "$ONLY_CHECK" ]; then
  print_info "Running only: $ONLY_CHECK"
fi

# Count total steps
TOTAL_STEPS=0
for step in "${STEPS[@]}"; do
  key="${step%%:*}"
  if [ -z "$ONLY_CHECK" ] || [ "$ONLY_CHECK" = "$key" ]; then
    ((TOTAL_STEPS++))
  fi
done

# Execute validation steps
CURRENT_STEP=0
FAILED_STEPS=()

for step in "${STEPS[@]}"; do
  IFS=':' read -r key name script <<< "$step"
  
  # Skip if --only flag is set and doesn't match
  if [ -n "$ONLY_CHECK" ] && [ "$ONLY_CHECK" != "$key" ]; then
    continue
  fi
  
  ((CURRENT_STEP++))
  
  print_header "STEP $CURRENT_STEP/$TOTAL_STEPS: $name"
  
  if [ ! -f "$script" ]; then
    print_error "Validator script not found: $script"
    FAILED_STEPS+=("$name (script not found)")
    continue
  fi
  
  # Execute the validation script
  if bash "$script"; then
    print_success "$name passed"
  else
    EXIT_CODE=$?
    print_error "$name failed with exit code $EXIT_CODE"
    FAILED_STEPS+=("$name")
    
    # Fast-fail: exit immediately on first failure
    print_header "VALIDATION FAILED"
    echo ""
    print_error "Validation stopped at: $name"
    print_info "Fix the errors above and try again"
    echo ""
    exit 1
  fi
done

# =============================================================================
# FINAL SUMMARY
# =============================================================================

echo ""
echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${GREEN}${BOLD}✅  ECOSYSTEM VALIDATION COMPLETE${RESET}"
echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
print_success "All $TOTAL_STEPS validation checks passed!"
echo ""
print_info "Your code is ready to push 🚀"
echo ""

exit 0
