import {defineStore} from 'pinia'
import {ref} from 'vue'

import {type Scheme} from '../InputComplex'
import {type ShowOptions} from '../PaneModalComplex'

export type PromptFn = <T extends Record<string, unknown>>(
	defaultValue: T,
	scheme: Scheme<T>,
	options?: ShowOptions
) => Promise<T | null>

export const useModalStore = defineStore('modal', () => {
	const prompt = ref<PromptFn>(async () => {
		throw new Error(
			'No modal provider. You need to add Tq.PaneModal to your app.'
		)
	})

	return {prompt}
})
