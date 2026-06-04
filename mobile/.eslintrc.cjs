module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
  plugins: ['@typescript-eslint', 'react', 'react-native'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-native/all',
    'prettier',
  ],
  settings: { react: { version: 'detect' } },
  rules: {
    // ── React ──────────────────────────────────────────────────────────────
    'react/react-in-jsx-scope': 'off',
    // TypeScript enforces prop types — the runtime prop-types check is redundant
    'react/prop-types': 'off',
    // Apostrophes and quotes in JSX text are fine in React Native (no HTML entities needed)
    'react/no-unescaped-entities': 'off',
    // react-hooks plugin is not installed — disable the rule
    'react-hooks/exhaustive-deps': 'off',
    // ── React Native ───────────────────────────────────────────────────────
    // The codebase uses inline styles for dynamic theming via useThemedStyles /
    // useTheme — disabling the static-analysis rule that conflicts with this pattern.
    'react-native/no-inline-styles': 'off',
    'react-native/no-color-literals': 'off',
    'react-native/sort-styles': 'off',
    // ── TypeScript ─────────────────────────────────────────────────────────
    '@typescript-eslint/consistent-type-imports': 'error',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },
  ignorePatterns: ['node_modules', 'dist', '.expo'],
};
