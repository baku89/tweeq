import type {Component} from 'vue'

import type {Scheme} from '../InputComplex'

/** A tab backed by an InputComplex scheme (applied live via `onInput`). */
export interface ModalFormTab<T extends Record<string, unknown> = any> {
	id: string
	title: string
	scheme: Scheme<T>
	value: T
	onInput?: (value: T) => void
}

/** A tab rendering an arbitrary component (it owns its own state/actions). */
export interface ModalComponentTab {
	id: string
	title: string
	component: Component
	props?: Record<string, unknown>
}

export type ModalTab = ModalFormTab | ModalComponentTab

export interface TabsShowOptions {
	readonly title?: string
}

export type PromptTabsFn = (
	tabs: ModalTab[],
	options?: TabsShowOptions
) => Promise<void>
