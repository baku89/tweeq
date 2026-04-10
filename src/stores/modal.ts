import {defineStore} from 'pinia'
import {ref} from 'vue'

import {type Scheme} from '../InputComplex'
import {type ShowOptions} from '../PaneModalComplex/types'

export type PromptFn = <T extends Record<string, unknown>>(
	defaultValue: T,
	scheme: Scheme<T>,
	options?: ShowOptions
) => Promise<T | null>

export const useModalStore = defineStore('modal', () => {
	const delegate = ref<PromptFn | null>(null)

	function registerPrompt(fn: PromptFn | null) {
		delegate.value = fn
	}

	const prompt: PromptFn = async (defaultValue, scheme, options) => {
		if (typeof window === 'undefined') {
			throw new Error('modal.prompt is only available in the browser')
		}
		const fn = delegate.value
		if (!fn) {
			throw new Error(
				'No modal UI. Wrap your app with TweeqProvider once, or use the App / Viewport layout which includes it.'
			)
		}
		return fn(defaultValue, scheme, options)
	}

	return {prompt, registerPrompt}
})
