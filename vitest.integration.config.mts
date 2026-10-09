import { loadEnv } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

// ローカルの Supabase(npx supabase start)に、実際にリクエストを送るテスト
export default defineConfig(({ mode }) => ({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    env: loadEnv(mode, process.cwd(), ''),
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
}))
