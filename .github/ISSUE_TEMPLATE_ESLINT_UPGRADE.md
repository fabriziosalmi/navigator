---
name: "[TECH-DEBT] Upgrade to ESLint v9 and re-enable linting in CI"
about: Track the upgrade to ESLint v9 to resolve AJV compatibility issues
title: "[TECH-DEBT] Upgrade to ESLint v9 and re-enable linting in CI"
labels: tech-debt, ci, linting
assignees: ''
---

## 🔧 Technical Debt Issue

### Context

Currently, the **lint step is disabled** in our CI pipeline (`validation.yml` and `ci.yml`) due to a known compatibility issue between **ESLint v8.x** and its dependency **ajv**.

**Evidence:**
- `.github/workflows/validation.yml` (line 77-78):
  ```yaml
  # Temporarily disabled - ESLint/AJV compatibility issue
  # - name: Run linting
  #   run: ./scripts/validators/run-lint.sh
  ```
- `.github/workflows/ci.yml` (line 64-66):
  ```yaml
  - name: Run ESLint
    run: pnpm run lint
    continue-on-error: true  # Temporarily allow failures (ESLint 8.x + AJV issue)
  ```

This is a **temporary workaround** to unblock the CI pipeline while we prepare for the upgrade.

---

### 🎯 Action Items

#### 1. **Upgrade ESLint to v9**
- [ ] Update `eslint` dependency to `^9.0.0` in all `package.json` files
- [ ] Review and update ESLint configuration files (`.eslintrc.*` or `eslint.config.js`)
- [ ] Migrate to the new [Flat Config format](https://eslint.org/docs/latest/use/configure/configuration-files-new) if needed

#### 2. **Update ESLint Plugins**
- [ ] Check compatibility of all ESLint plugins with v9:
  - `@typescript-eslint/eslint-plugin`
  - `@typescript-eslint/parser`
  - Any other project-specific plugins
- [ ] Upgrade all plugins to compatible versions

#### 3. **Resolve New Linting Errors**
- [ ] Run `pnpm lint` locally to identify new errors introduced by stricter rules
- [ ] Fix all linting errors OR update rules to match project coding standards
- [ ] Document any rule changes in `.eslintrc.*` with comments explaining the rationale

#### 4. **Re-enable Linting in CI**
- [ ] Uncomment the lint step in `.github/workflows/validation.yml`
- [ ] Remove `continue-on-error: true` from `.github/workflows/ci.yml`
- [ ] Verify that the CI pipeline passes with linting enabled

#### 5. **Update Documentation**
- [ ] Update `CONTRIBUTING.md` with any new linting requirements
- [ ] Document the ESLint v9 migration in the project changelog

---

### 📚 Resources

- [ESLint v9 Migration Guide](https://eslint.org/docs/latest/use/migrate-to-9.0.0)
- [Flat Config Migration](https://eslint.org/docs/latest/use/configure/migration-guide)
- [TypeScript ESLint v9 Compatibility](https://typescript-eslint.io/blog/announcing-typescript-eslint-v8/)

---

### ⚠️ Priority

**High Priority** - This task should be completed **after the current PR (#8) is merged** to restore our full quality gate and prevent technical debt from accumulating.

---

### ✅ Acceptance Criteria

- [ ] ESLint v9 is installed across the entire monorepo
- [ ] All packages pass `pnpm lint` with zero errors
- [ ] Linting is re-enabled in both CI workflows
- [ ] CI pipeline runs successfully with all checks enabled
- [ ] Documentation is updated to reflect the changes

---

**Created as part of CI stabilization efforts in PR #8**
