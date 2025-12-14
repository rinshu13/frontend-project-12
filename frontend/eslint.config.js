// eslint.config.js
import stylistic from '@stylistic/eslint-plugin'

export default [
  {
    files: ['**/*.js', '**/*.jsx'],
    plugins: {
      '@stylistic': stylistic,
    },
    rules: {
      // Включаем все рекомендуемые stylistic правила (это покрывает ваши ошибки)
      ...stylistic.configs['recommended-flat'].rules,

      // Дополнительно усиливаем некоторые, если нужно (по вашим ошибкам)
      '@stylistic/brace-style': 'error',
      '@stylistic/arrow-parens': 'error',
      '@stylistic/comma-dangle': ['error', 'always-multiline'],
      '@stylistic/indent': ['error', 2], // или 4, если у вас отступы по 4
      '@stylistic/quotes': ['error', 'single'],
      '@stylistic/no-trailing-spaces': 'error',
      '@stylistic/eol-last': 'error',
      '@stylistic/multiline-ternary': ['error', 'always-multiline'],
      '@stylistic/jsx-one-expression-per-line': 'error',

      // Удаление неиспользуемых переменных (включая React)
      'no-unused-vars': 'error',
    },
  },
]
