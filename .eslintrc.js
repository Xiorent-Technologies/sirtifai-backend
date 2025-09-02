module.exports = {
  env: {
    browser: false,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'prettier',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: [
    'prettier',
  ],
  rules: {
    // Prettier integration
    'prettier/prettier': 'error',
    
    // General rules
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-arrow-callback': 'error',
    'arrow-spacing': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',
    
    // Code style
    'indent': ['error', 2, { SwitchCase: 1 }],
    'quotes': ['error', 'single', { avoidEscape: true }],
    'semi': ['error', 'always'],
    'comma-dangle': ['error', 'always-multiline'],
    'comma-spacing': 'error',
    'comma-style': 'error',
    'computed-property-spacing': 'error',
    'func-call-spacing': 'error',
    'key-spacing': 'error',
    'keyword-spacing': 'error',
    'object-curly-spacing': ['error', 'always'],
    'space-before-blocks': 'error',
    'space-before-function-paren': ['error', 'never'],
    'space-in-parens': 'error',
    'space-infix-ops': 'error',
    'space-unary-ops': 'error',
    'spaced-comment': 'error',
    
    // Best practices
    'eqeqeq': ['error', 'always'],
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-return-assign': 'error',
    'no-self-compare': 'error',
    'no-sequences': 'error',
    'no-throw-literal': 'error',
    'no-unmodified-loop-condition': 'error',
    'no-unused-expressions': 'error',
    'no-useless-call': 'error',
    'no-useless-concat': 'error',
    'no-useless-return': 'error',
    'radix': 'error',
    'wrap-iife': 'error',
    'yoda': 'error',
    
    // Variables
    'no-label-var': 'error',
    'no-shadow': 'error',
    'no-shadow-restricted-names': 'error',
    'no-undef-init': 'error',
    'no-use-before-define': ['error', { functions: false, classes: true, variables: true }],
    
    // Node.js specific
    'no-process-exit': 'error',
    'no-path-concat': 'error',
    'no-new-require': 'error',
    'no-mixed-requires': 'error',
    'handle-callback-err': 'error',
    'no-sync': 'warn',
  },
  overrides: [
    {
      files: ['**/*.test.js', '**/*.spec.js', 'src/tests/**/*.js'],
      env: {
        jest: true,
      },
      rules: {
        'no-console': 'off',
        'no-unused-expressions': 'off',
      },
    },
    {
      files: ['src/config/**/*.js'],
      rules: {
        'no-console': 'off',
      },
    },
  ],
  ignorePatterns: [
    'node_modules/',
    'coverage/',
    'logs/',
    'uploads/',
    'dist/',
    'build/',
    '*.min.js',
  ],
};
