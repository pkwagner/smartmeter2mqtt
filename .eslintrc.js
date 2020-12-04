module.exports = {
  root: true,
  extends: [
    'airbnb-typescript/base',
  ],
  parserOptions: {
    project: './tsconfig.json',
    createDefaultProgram: true,
  },
  rules: {
    'no-console': 'off',
  },
};
