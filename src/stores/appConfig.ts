import {extendRef} from '@vueuse/core'
import {defineStore} from 'pinia'
import {MaybeRef, ref, unref, watch} from 'vue'

function createGroup(path: MaybeRef<string>) {
	function _ref<T>(name: string, defaultValue: T) {
		const key = `${unref(path)}.${name}`

		const config = extendRef(ref(defaultValue), {
			default: ref(defaultValue),
		})

		const stored = localStorage.getItem(key)
		if (stored !== null) {
			config.value = JSON.parse(stored)
		}

		watch(
			() => config.value,
			value => {
				if (value !== config.default) {
					localStorage.setItem(key, JSON.stringify(value))
				}
			}
		)

		watch(
			() => config.default,
			defaultValue => {
				if (localStorage.getItem(key) === null) {
					config.value = defaultValue
				}
			}
		)

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
