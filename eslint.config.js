import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    "ignores": [
      '.remember/',
      'coverage/',
      'compiled/',
      'dist/',
      'jing-trang/',
    ],
  },
  ...tseslint.configs.recommendedTypeChecked,
  {
    "languageOptions": {
      "parserOptions": {
        "projectService": true,
        "tsconfigRootDir": import.meta.dirname,
      },
    },
  },
  {
    /**
     * Plain JS config files sit outside the tsconfig program; lint
     * them without type information.
     */
    "files": ['**/*.js', '**/*.cjs'],
    "extends": [tseslint.configs.disableTypeChecked],
  },
  {
    /**
     * Formatting is deliberately not linted — the old
     * airbnb/hughx/lodash stack predates the conversion, the lodash
     * plugins contradicted the near-zero-dependency goal, and style
     * enforcement belongs to a formatter if it's ever wanted.
     */
    "files": ['**/*.test.ts'],
    "rules": {
      /**
       * The instantiation suites use require() + jest.resetModules for
       * module isolation (jest.mock interception only sees jest's own
       * require), which makes the imported classes `any` — the unsafe-*
       * family would flag every use.
       */
      "@typescript-eslint/no-require-imports": 'off',
      "@typescript-eslint/no-unsafe-assignment": 'off',
      "@typescript-eslint/no-unsafe-member-access": 'off',
      "@typescript-eslint/no-unsafe-argument": 'off',
      "@typescript-eslint/no-unsafe-call": 'off',
      "@typescript-eslint/no-unsafe-return": 'off',
    },
  },
);
