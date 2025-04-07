import {defineStore} from 'pinia'
import {ref} from 'vue'

export const usePersonalInfo = defineStore('personalInfo', () => {
	const name = ref('')

	return {name}
})
