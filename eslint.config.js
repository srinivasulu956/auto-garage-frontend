import globals from 'globals';
import pluginJs from '@eslint/js';
import pluginReactConfig from 'eslint-plugin-react/configs/recommended.js';
import prettierPlugin from 'eslint-plugin-prettier';
import importPlugin from 'eslint-plugin-import';

export default [
	{ files: ['**/*.{js,mjs,cjs,jsx}'] },
	pluginJs.configs.recommended,
	pluginReactConfig,
	{
		ignores: ['dist', '.eslintrc.cjs'],
		languageOptions: {
			globals: globals.browser,
			parserOptions: {
				ecmaVersion: 'latest',
				sourceType: 'module',
				ecmaFeatures: { jsx: true },
			},
		},

		settings: {
			react: { version: 'detect', jsxRuntime: 'automatic' },
		},

		plugins: {
			prettier: prettierPlugin,
			import: importPlugin,
		},

		rules: {
			// JavaScript essentials
			'no-unused-vars': 'warn', // Warn on unused variables
			'no-case-declarations': 'error', // Error if variables are declared inside case without braces
			'no-prototype-builtins': 'off', // Allow Object.prototype methods
			'no-useless-concat': 'warn', // Warn on unnecessary string concatenation

			// React rules
			'react/prop-types': 'off', // Warn if prop-types missing
			'react/react-in-jsx-scope': 'off', // Not needed for React 17+

			// Prettier formatting
			'prettier/prettier': 'off', // Treat Prettier violations as errors

			// Import plugin rules
			// 'import/no-unresolved': 'error', // Error if module cannot be resolved
			// 'import/order': ['warn', { 'newlines-between': 'always' }], // Warn for import order
		},
	},
];
