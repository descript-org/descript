// @ts-check

import eslint from '@eslint/js';
import globals from 'globals';
import stylistic from '@stylistic/eslint-plugin';
import tseslint from 'typescript-eslint';
import vitest from '@vitest/eslint-plugin';

export default tseslint.config(
    eslint.configs.recommended,
    tseslint.configs.recommended,
    stylistic.configs[ 'recommended-flat' ],
    {
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
        linterOptions: {
            reportUnusedInlineConfigs: 'error',
        },
        plugins: {
            '@stylistic': stylistic,
        },
        rules: {
            'no-console': 'error',
            'no-empty': [ 'error', { allowEmptyCatch: true } ],

            '@stylistic/array-bracket-spacing': [ 'error', 'always' ],
            '@stylistic/arrow-parens': [ 'error', 'always' ],
            '@stylistic/brace-style': [ 'error', '1tbs' ],
            '@stylistic/computed-property-spacing': [ 'error', 'always' ],
            '@stylistic/indent': [ 'error', 4, {
                SwitchCase: 1,
            } ],
            '@stylistic/member-delimiter-style': [ 'error', {
                multiline: {
                    delimiter: 'semi',
                    requireLast: true,
                },
                singleline: {
                    delimiter: 'semi',
                    requireLast: false,
                },
                multilineDetection: 'brackets',
            } ],
            '@stylistic/operator-linebreak': [ 'error', 'after' ],
            '@stylistic/padded-blocks': 'off',
            '@stylistic/quote-props': [ 'error', 'as-needed', {
                keywords: true,
                numbers: false,
            } ],
            '@stylistic/semi': [ 'error', 'always' ],
            '@stylistic/space-before-function-paren': [ 'error', 'never' ],
            '@stylistic/template-curly-spacing': [ 'error', 'always' ],

            '@typescript-eslint/no-explicit-any': 'warn',
        },
    },
    {
        files: [ 'tests/**' ],
        plugins: {
            vitest,
        },
        rules: {
            ...vitest.configs.recommended.rules,
        },
    },
    {
        files: [ 'docs/typescript-examples/**' ],
        rules: {
            '@typescript-eslint/no-unused-expressions': 'off',
        },
    },
);
