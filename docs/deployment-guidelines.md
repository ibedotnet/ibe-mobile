# Deployment Guidelines – ibe-mobile

This document describes the Git-based deployment workflow for the **ibe-mobile** React Native project. It ensures consistency, stability, and clear handoffs between developers, QA, and production.

---

## Branching Strategy

We follow a multi-environment flow using the following permanent branches:

| Branch     | Purpose                                   |
|------------|-------------------------------------------|
| `develop`  | Developer integration, internal testing   |
| `staging`  | QA/UAT testing (prior to production)      |
| `main`     | Stable, production-ready code             |

---

## Deployment Process (Git Flow)

### 1. Feature Development
- Developers branch from `develop`:
  ```bash
  git checkout develop
  git pull origin develop
  git checkout -b feature/your-feature-name
  ```
- Implement changes and open a **Pull Request (PR)** into `develop`.
- All PRs must pass **CI checks** (lint, build, tests) and be reviewed.

---

### 2. Internal QA (Develop Environment)
- Merge **feature branches** into `develop` via PR.
- Test **individual features** and **integration flows** in the `develop` environment.

---

### 3. QA/UAT Testing (Staging)
- Once `develop` is stable (end of sprint/release candidate), merge `develop` → `staging`.
- The **QA team** conducts user testing on `staging` builds.

---

### 4. Production (Main)
- After QA sign-off, merge `staging` → `main`.
- Tag the release for traceability:
  ```bash
  git checkout main
  git merge staging
  git tag -a v1.2.0 -m "Release v1.2.0"
  git push origin main --tags
  ```

---

### 5. Hotfixes
- For urgent production issues:
  - Branch from `main` → fix → merge back into **both** `main` and `develop`.
  - Tag and release as a patch version (`v1.2.1`).

---

## Remote Tracking (One-Time Setup)
Make sure local branches track the correct remotes:

```bash
git checkout develop
git branch --set-upstream-to=origin/develop

git checkout staging
git branch --set-upstream-to=origin/staging

git checkout main
git branch --set-upstream-to=origin/main
```

This avoids confusion and ensures clean push/pull operations.

---

## Recommended Merge Schedule

| Environment | Suggested Frequency                |
|-------------|-------------------------------------|
| `develop`   | Daily (as features are completed)   |
| `staging`   | Weekly (end of sprint or QA cycle)  |
| `main`      | Monthly or post-release validation  |

> Adjust frequency based on release cycles, sprint reviews, or customer requirements.

---

## Best Practices
- Always branch from `develop` for features
- Keep `main` clean and always deployable
- Enforce PR reviews + CI checks before merging
- Tag every production release (`vX.Y.Z`)
- Avoid force pushes on shared branches
- Automate builds:
  - **Develop → internal build**
  - **Staging → QA build**
  - **Main → production release**

---

_This document is subject to change as the team scales or the release strategy evolves._