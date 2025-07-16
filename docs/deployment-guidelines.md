# Deployment Guidelines – ibe-mobile

This document describes the Git-based deployment workflow for the **ibe-mobile** React Native project. It ensures consistency, stability, and clear handoffs between developers, QA, and production.

---

## Branching Strategy

We follow a multi-environment flow using the following permanent branches:

| Branch        | Purpose                                 |
| ------------- | --------------------------------------- |
| `pre-staging` | Developer integration, internal testing |
| `staging`     | QA/UAT testing (prior to production)    |
| `main`        | Stable, production-ready code           |

---

## Deployment Process (Git Flow)

### 1. Feature Development

- Developers branch from `staging`:
  ```bash
  git checkout -b feature/your-feature-name staging
  ```

### 2. Internal QA (Pre-Staging)

- Merge **feature branches** into `pre-staging`.
- Test **individual features** and **component flows**.

### 3. QA/UAT Testing (Staging)

- Once stable, merge `pre-staging` → `staging`.
- **QA team** conducts user testing on staging builds.

### 4. Production (Main)

- After thorough testing (typically **weekly/monthly**), merge `staging` → `main`.
- Only **tested and verified** code should go to `main`.

---

## Remote Tracking (One-Time Setup)

If your remote is named `ibe-mobile`, you can pull/push between branches like:

```bash
git pull ibe-mobile staging
git push ibe-mobile ibe-mobile-main:pre-staging
```

- `ibe-mobile-main` is your current local branch
- `ibe-mobile` is the GitHub remote
  Adjust names based on your local branch setup and team conventions.

---

## Recommended Merge Schedule

| Environment   | Suggested Frequency                |
| ------------- | ---------------------------------- |
| `pre-staging` | Daily (as features are completed)  |
| `staging`     | Weekly (end of sprint or QA cycle) |
| `main`        | Monthly or post-release validation |

> Adjust frequency based on release cycles, sprint reviews, or customer requirements.

---

## Best Practices

- Always test features in `pre-staging` before promoting
- Use descriptive PR titles and link related issues
- Avoid force-pushes to shared branches
- Use PR reviews and CI checks before merge
- Keep `main` clean and deployable

---

_This document is subject to change as the team scales or the release strategy evolves._
