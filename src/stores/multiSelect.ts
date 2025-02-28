import {useKeyModifier} from '@vueuse/core'
import {defineStore} from 'pinia'
import {type Ref} from 'vue'

interface MultiSelectSource {
	el: Ref<HTMLElement>
	getValue: () => number
	setValue: (value: number) => void
}

export const useMultiSelectStore = defineStore('multiSelect', () => {
	const command = useKeyModifier('Meta')

	function add(source: MultiSelectSource) {
		if (!command.value) return

		console.log(source)
	}

	return {add}
})
