import {defineStore} from 'pinia'
import {ref, watch} from 'vue'

export const useAppConfigStore = defineStore('appConfig', () => {
	const appId = ref('tweeq')

	function appConfigRef<T>(name: string, defaultValue: T) {
		const key = `${appId.value}.${name}`

		const data = ref(defaultValue)

		const stored = localStorage.getItem(key)
		if (stored !== null) {
			data.value = JSON.parse(stored)
		}

		watch(data, value => {
			localStorage.setItem(key, JSON.stringify(value))
		})

		return data
	}

	function reset() {
		for (const key in localStorage) {
			if (key.startsWith(appId.value)) {
				localStorage.removeItem(key)
			}
		}
	}

	return {appId, ref: appConfigRef, reset}
})
