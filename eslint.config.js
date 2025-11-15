import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                // Browser
                window: 'readonly',
                document: 'readonly',
                navigator: 'readonly',
                console: 'readonly',
                // Node
                process: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                module: 'readonly',
                require: 'readonly',
                // Custom globals
                Hands: 'readonly',
                Camera: 'readonly',
                drawConnectors: 'readonly',
                drawLandmarks: 'readonly',
                HAND_CONNECTIONS: 'readonly'
            }
        },
        rules: {
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unsafe-function-type': 'warn',
            '@typescript-eslint/no-empty-object-type': 'warn',
            '@typescript-eslint/no-unused-vars': ['warn', {
                'argsIgnorePattern': '^_',
                'varsIgnorePattern': '^_'
            }],
            'no-case-declarations': 'warn',
            'no-useless-catch': 'warn',
            'indent': ['error', 4, { 'SwitchCase': 1 }],
            'linebreak-style': ['error', 'unix'],
            'quotes': ['error', 'single', { 'avoidEscape': true }],
            'semi': ['error', 'always'],
            'no-unused-vars': 'off',
            'no-console': ['warn', {
                'allow': ['warn', 'error', 'info']
            }],
            'no-debugger': 'error',
            'no-alert': 'warn',
            'prefer-const': 'error',
            'no-var': 'error',
            'eqeqeq': ['error', 'always'],
            'curly': ['warn', 'all'],
            'brace-style': ['warn', '1tbs'],
            'comma-dangle': ['error', 'never'],
            'arrow-spacing': ['error', { 'before': true, 'after': true }],
            'object-curly-spacing': ['error', 'always'],
            'array-bracket-spacing': ['error', 'never'],
            'no-multiple-empty-lines': ['error', { 'max': 2, 'maxEOF': 1 }],
            'space-before-function-paren': ['error', {
                'anonymous': 'always',
                'named': 'never',
                'asyncArrow': 'always'
            }],
            'keyword-spacing': ['error', { 'before': true, 'after': true }]
        }
    },
    {
        ignores: [
            'node_modules/',
            'dist/',
            'docs/',
            'build/',
            'playwright-report/',
            'test-results/',
            '*.config.js',
            '*.min.js'
        ]
    }
];
