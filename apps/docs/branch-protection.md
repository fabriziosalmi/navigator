# Branch Protection Configuration Guide

**Goal**: Protect the `main` branch to prevent broken code from being merged.

**Location**: GitHub Repository Settings → Branches → Branch protection rules

---

## 🛡️ Recommended Protection Rules for `main`

Navigate to: `https://github.com/fabriziosalmi/navigator/settings/branch_protection_rules/new`

### Rule Configuration

#### 1. Branch Name Pattern
```
main
```

#### 2. Protect Matching Branches

**✅ Required Status Checks (CRITICAL)**
- [x] **Require status checks to pass before merging**
- [x] **Require branches to be up to date before merging**

Select these status checks:
- `lint_and_unit_test` (from Smart CI)
- `build_and_size_check` (from Smart CI)
- `e2e_test` (from Smart CI)

**Why**: Ensures all validation jobs pass before merge. Since jobs run in parallel, any failure blocks the merge.

---

**✅ Require Pull Request Reviews**
- [x] **Require a pull request before merging**
- [ ] **Require approvals** (optional - set to 1 if working with team)
- [x] **Dismiss stale pull request approvals when new commits are pushed**
- [ ] **Require review from Code Owners** (optional - requires CODEOWNERS file)

**Why**: Enforces code review process, ensures eyes on every change.

---

**✅ Require Conversation Resolution**
- [x] **Require conversation resolution before merging**

**Why**: Forces resolution of all review comments before merge.

---

**✅ Additional Settings**
- [x] **Require linear history** (prevents merge commits, cleaner git log)
- [x] **Include administrators** (protection applies to repo admins too)
- [ ] **Allow force pushes** (keep DISABLED for main)
- [ ] **Allow deletions** (keep DISABLED for main)

---

## 🔧 Optional: Protection Rules for `develop`

Same configuration as `main`, but you might want to:
- Reduce required approvals to 0 (faster iteration)
- Still require status checks
- Allow force pushes for rebasing (team preference)

---

## 📋 CODEOWNERS File (Optional)

If you enable "Require review from Code Owners", create `.github/CODEOWNERS`:

```gitignore
# Navigator CODEOWNERS
# Syntax: <pattern> <github-username>

# Default owners for everything
* @fabriziosalmi

# Core packages require core team review
/packages/core/** @fabriziosalmi
/packages/pdk/** @fabriziosalmi

# Infrastructure and CI
/.github/** @fabriziosalmi
/scripts/** @fabriziosalmi

# Documentation can be reviewed by docs team
/docs/** @fabriziosalmi
*.md @fabriziosalmi
```

---

## 🚀 Verification Steps

After configuring protection rules:

### 1. Test Protection is Working

```bash
# Create a test branch with intentional error
git checkout -b test-protection
echo "console.log('broken code')" >> packages/core/src/index.ts
git add -A
git commit -m "test: intentional error"
git push origin test-protection
```

Then create a PR to `main`. You should see:
- ❌ Status checks failing
- 🚫 Merge button disabled with message "Required status checks must pass"

### 2. Test Successful Merge

```bash
# Fix the error
git checkout test-protection
git revert HEAD
git push origin test-protection
```

Now you should see:
- ✅ All status checks passing
- 🟢 Merge button enabled

### 3. Clean Up Test Branch

```bash
git checkout main
git branch -D test-protection
git push origin --delete test-protection
```

---

## 📊 Expected Behavior

### ✅ What WILL be allowed:
- PRs with all status checks passing
- PRs from up-to-date branches
- PRs with resolved conversations (if enabled)
- PRs with required approvals (if enabled)

### ❌ What will be BLOCKED:
- PRs with failing lint/tests/build/e2e
- PRs from stale branches (behind main)
- Direct pushes to main (must use PR)
- Force pushes to main
- Branch deletion of main

---

## 🎯 Benefits After Configuration

1. **Zero broken code on main**: Status checks prevent merge of failing code
2. **Cleaner history**: Linear history requirement prevents messy merge commits
3. **Better reviews**: Conversation resolution ensures all feedback is addressed
4. **Protected infrastructure**: Admins also follow rules, no exceptions
5. **Automatic enforcement**: GitHub blocks bad merges, no manual intervention

---

## 🔗 Quick Links

- [GitHub Branch Protection Docs](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [CODEOWNERS Syntax](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
- [Navigator Validation System](./VALIDATION.md)

---

## ⚠️ Important Notes

1. **Initial Setup**: When first enabling protection, existing PRs might need updating
2. **Emergencies**: Temporarily disable protection rules if you need to hotfix (re-enable after)
3. **Team Onboarding**: Ensure team members understand PR workflow before enabling
4. **CI Costs**: More strict rules = more CI runs. Monitor GitHub Actions usage.

---

**Status**: ⏳ **Manual Configuration Required**

This cannot be automated via code. You must configure it in GitHub UI:
`Settings → Branches → Add rule → Configure as above → Save`

**Estimated Time**: 5 minutes

---

**After Configuration**: Update this file to track when protection was enabled and any customizations made.
