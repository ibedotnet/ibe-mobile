# Coding Standards – ibe-mobile (React Native, Expo)

## ✨ JavaScript / React Native Style Guide

We follow the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript), with a few custom rules and preferences for React Native.

---

### ✅ General Rules

- Use **ES6+** syntax (const/let, arrow functions, destructuring).
- Prefer `const` over `let` when variables don’t change.
- Always use **semi-colons (`;`)**.
- Use **trailing commas** in multi-line objects/arrays.
- Always use **single quotes** (`'`) for strings.

---

### 🧱 Project Structure & Conventions

- Screens go in `/src/screens/`
- Components go in `/src/components/`
- Custom hooks in `/src/hooks/`
- Common utilities in `/src/utils/`

---

### 🔤 Naming Conventions

| Entity     | Convention          | Example                  |
|------------|---------------------|---------------------------|
| Files      | `camelCase` or `PascalCase.js` | `loginScreen.js` or `LoginScreen.js` |
| Components | `PascalCase`        | `LoginForm`, `UserCard`  |
| Hooks      | `useCamelCase`      | `useAuth`, `useFetch`    |
| Constants  | `UPPER_SNAKE_CASE`  | `MAX_ATTEMPTS`           |
| Variables  | `camelCase`         | `userName`               |
| Functions  | `camelCase`         | `handleSubmit`           |

---

### 🎨 Styling

- Use `StyleSheet.create()` — avoid inline styles.
- Group style properties logically (layout → color → font).
- Shared styles go in `/src/styles/`.

---

### 🔍 Imports

- Use **absolute imports** with `babel-plugin-module-resolver`.
- Import order:
  1. External libraries (React, lodash)
  2. Components/screens/hooks from `src`
  3. Constants and styles
  4. Relative imports

```js
import React from 'react';
import { View } from 'react-native';
import Button from 'components/Button';
import useAuth from 'hooks/useAuth';
import { COLORS } from 'constants';
import styles from './styles';

---

### 💬 Comments

- Use comments only when necessary.
- Prefer self-documenting code.
- For TODOs, use:  
  `// TODO (your-name): explain what needs to be done`

---

### 🧪 Testing

- Place tests under `__tests__/` or next to the component.
- Use `jest` and `@testing-library/react-native`.
- Focus on testing user interaction and behavior, not internals.

---

### 🚫 Common Don'ts

- ❌ No `console.log` in committed code
- ❌ No commented-out unused code
- ❌ No hardcoded magic strings or numbers — use constants

---

## 🔧 Tooling & Automation

We enforce code quality using:

- [ESLint](https://eslint.org/)
- [Prettier](https://prettier.io/)
- [Husky](https://typicode.github.io/husky/)
- [lint-staged](https://github.com/okonet/lint-staged)

These tools are configured in:

- `.eslintrc.js`
- `.prettierrc`
- `.husky/pre-commit`
- `package.json`

---

## 👥 Contributor Checklist

Before creating a pull request:

- [ ] Run `npm run lint` and fix any errors
- [ ] Run `npm run format` to apply Prettier
- [ ] Ensure tests cover your changes
- [ ] Remove all debug logs and commented-out code
