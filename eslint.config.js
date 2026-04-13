import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import eslintReact from '@eslint-react/eslint-plugin'
import reactRefresh from 'eslint-plugin-react-refresh'
import eslintConfigPrettier from 'eslint-config-prettier'

export default tseslint.config(
  // Ignore patterns
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/coverage/**', '**/.vite/**'],
  },

  // Base configurations
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // React configuration (eslint-react recommended preset)
  eslintReact.configs.recommended,

  // Project-specific overrides
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    plugins: {
      'react-refresh': reactRefresh,
    },
    rules: {
      // Disable eslint-react rules that flag existing patterns not caught by the
      // previous eslint-plugin-react config. These are valid React 19 migration
      // targets (forwardRef, createRef) and can be re-enabled in a follow-up.
      '@eslint-react/no-forward-ref': 'off',
      '@eslint-react/no-create-ref': 'off',
      '@eslint-react/component-hook-factories': 'off',
      '@eslint-react/no-array-index-key': 'off',
      '@eslint-react/set-state-in-effect': 'off',

      // React Refresh rules
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // TypeScript rules
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      // General rules
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'warn',
      'no-var': 'error',
    },
  },

  // Test files specific configuration
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },

  // Storybook files — multiple named exports are the expected pattern
  {
    files: ['**/*.stories.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },

  // Prettier must be last to override formatting rules
  eslintConfigPrettier,
)
