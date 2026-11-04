import {extendRef} from '@vueuse/core'
import {defineStore} from 'pinia'
import {effectScope, type MaybeRef, ref, unref, watch} from 'vue'

const makeConfig = <T>(defaultValue: T) =>
	extendRef(ref(defaultValue), {default: ref(defaultValue)})

/** One to each key, so that what shares a key shows the same, as soon as it changes. */
const configs = new Map<string, unknown>()

function createGroup(path: MaybeRef<string>) {
	function _ref<T>(name: string, defaultValue: T) {
		const key = `${unref(path)}.${name}`

		const existing = configs.get(key)
		if (existing) return existing as ReturnType<typeof makeConfig<T>>

		const config = makeConfig(defaultValue)
		configs.set(key, config)

		const stored = localStorage.getItem(key)
		if (stored !== null) {
			config.value = JSON.parse(stored)
		}

		// Outliving whichever component happened to ask first.
		effectScope(true).run(() => {
			watch(
				() => config.value,
				value => {
					if (value === config.default) {
						localStorage.removeItem(key)
					} else {
						localStorage.setItem(key, JSON.stringify(value))
					}
				}
			)

			watch(
				() => config.default,
				defaultValue => {
					const stored = JSON.parse(localStorage.getItem(key) ?? 'null')
					if (stored === null) {
						config.value = defaultValue
					} else if (stored === defaultValue) {
						localStorage.removeItem(key)
					}
				}
			)
		})

		return config
	}

	function reset() {
		for (const key in localStorage) {
			if (key.startsWith(unref(path))) {
				localStorage.removeItem(key)
			}
		}
	}

	function group(name: string) {
		return createGroup(`${unref(path)}.${name}`)
	}

	return {ref: _ref, reset, group}
}

export const useAppConfigStore = defineStore('appConfig', () => {
	const appId = ref('tweeq')

	return {appId, ...createGroup(appId)}
})
