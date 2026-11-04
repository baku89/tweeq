import {createPinia, setActivePinia} from 'pinia'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {effectScope, nextTick} from 'vue'

import {useAppConfigStore} from './appConfig'

describe('a config', () => {
	const stored = new Map<string, string>()

	beforeEach(() => {
		setActivePinia(createPinia())
		stored.clear()
		vi.stubGlobal('localStorage', {
			getItem: (key: string) => stored.get(key) ?? null,
			setItem: (key: string, value: string) => void stored.set(key, value),
			removeItem: (key: string) => void stored.delete(key),
		})
	})

	it('is shared by what asks for the same key, as soon as it changes', () => {
		const config = useAppConfigStore()
		const a = config.ref('shared.width', 110)
		const b = config.ref('shared.width', 110)
		a.value = 150
		expect(b.value).toBe(150)
	})

	it('is not shared under another key', () => {
		const config = useAppConfigStore()
		const a = config.ref('apart.a', 1)
		const b = config.ref('apart.b', 1)
		a.value = 2
		expect(b.value).toBe(1)
	})

	it('is still saved once what first asked for it has gone', async () => {
		const scope = effectScope()
		const a = scope.run(() => useAppConfigStore().ref('outlives.width', 1))!
		scope.stop()
		a.value = 2
		await nextTick()
		expect(stored.get('tweeq.outlives.width')).toBe('2')
	})
})
