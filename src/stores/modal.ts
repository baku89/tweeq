import {defineStore} from 'pinia'
import {ref} from 'vue'

import {type Scheme} from '../InputComplex'
import {type ShowOptions} from '../PaneModalComplex/types'
import {
	type ModalTab,
	type PromptTabsFn,
	type TabsShowOptions,
} from '../PaneModalTabs/types'

export type PromptFn = <T extends Record<string, unknown>>(
	defaultValue: T,
	scheme: Scheme<T>,
	options?: ShowOptions
) => Promise<T | null>

const NO_UI =
	'No modal UI. Wrap your app with TweeqProvider once, or use the App / Viewport layout which includes it.'

export const useModalStore = defineStore('modal', () => {
	const delegate = ref<PromptFn | null>(null)
	const tabsDelegate = ref<PromptTabsFn | null>(null)

	function registerPrompt(fn: PromptFn | null) {
		delegate.value = fn
	}

	function registerPromptTabs(fn: PromptTabsFn | null) {
		tabsDelegate.value = fn
	}

	const prompt: PromptFn = async (defaultValue, scheme, options) => {
		if (typeof window === 'undefined') {
			throw new Error('modal.prompt is only available in the browser')
		}
		const fn = delegate.value
		if (!fn) throw new Error(NO_UI)
		return fn(defaultValue, scheme, options)
	}

	// A tabbed modal: each tab is either an InputComplex scheme (applied live) or
	// an arbitrary component. Resolves when the modal is closed.
	async function promptTabs(tabs: ModalTab[], options?: TabsShowOptions) {
		if (typeof window === 'undefined') {
			throw new Error('modal.promptTabs is only available in the browser')
		}
		const fn = tabsDelegate.value
		if (!fn) throw new Error(NO_UI)
		return fn(tabs, options)
	}

	return {prompt, promptTabs, registerPrompt, registerPromptTabs}
})
