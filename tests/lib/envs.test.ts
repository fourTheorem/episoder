import { assert, test } from 'vitest'
import envs from '../../lib/envs'

process.env.EXAMPLE_KEY_1 = 'test'

test('envs retrieves environment variables if available', async () => {
  assert.equal(envs.EXAMPLE_KEY_1, 'test')
})

test('envs throws an error if an environment variable is missing', async () => {
  assert.throws(() => envs.EXAMPLE_KEY_2)
})
