import { defaultExclude, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    globalSetup: ['./tests/setup.ts'],
    coverage: {
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        ...defaultExclude,
        '**/test/**',
        '*/mock-utils/**',
        '.aws-sam/**',
        '**/*.js',
        '**/*.d.ts',
        '**/*-stack.ts',
      ],
      thresholds: {
        branches: 0,
        functions: 0,
        lines: 0,
        statements: 0,
      },
    },
    testTimeout: Number(process.env.TEST_TIMEOUT ?? 5000),
  },
})
