<script setup lang="ts">
import {useEventListener} from '@vueuse/core'
import {onBeforeUnmount, ref} from 'vue'

import {InputButton} from '../InputButton'
import {InputComplex} from '../InputComplex'
import {PaneModal} from '../PaneModal'
import {useModalStore} from '../stores/modal'
import {Tab, Tabs} from '../Tabs'
import type {ModalTab, TabsShowOptions} from './types'

const modal = useModalStore()

const open = ref(false)
const desc = ref<{tabs: ModalTab[]; options?: TabsShowOptions} | null>(null)

// Live values for the form (scheme) tabs, keyed by tab id.
const values = ref<Record<string, Record<string, unknown>>>({})

let endEdit: () => void = () => {}

function promptTabsImpl(
	tabs: ModalTab[],
	options?: TabsShowOptions
): Promise<void> {
	if (desc.value) endEdit()

	desc.value = {tabs, options}
	values.value = Object.fromEntries(
		tabs
			.filter((t): t is Extract<ModalTab, {scheme: unknown}> => 'scheme' in t)
			.map(t => [t.id, {...t.value}])
	)
	open.value = true

	return new Promise<void>(resolve => {
		endEdit = () => {
			open.value = false
			endEdit = () => {}
			resolve()
		}
	})
}

modal.registerPromptTabs(promptTabsImpl)
onBeforeUnmount(() => modal.registerPromptTabs(null))

function onFormInput(tab: ModalTab, value: Record<string, unknown>) {
	if (!('scheme' in tab)) return
	values.value[tab.id] = value
	tab.onInput?.(value as never)
}

// Done keeps the (already live-applied) edits. Cancel reverts them by re-applying
// each form tab's opening value through its onInput; component tabs own their own
// state, so Cancel can't undo those.
function onCancel() {
	for (const tab of desc.value?.tabs ?? []) {
		if ('scheme' in tab) tab.onInput?.(tab.value)
	}
	endEdit()
}

function isMultilineTarget(target: EventTarget | null) {
	const el = target as HTMLElement | null
	return (
		!!el &&
		(el.tagName === 'TEXTAREA' ||
			el.isContentEditable ||
			!!el.closest?.('.monaco-editor'))
	)
}

// The modal is a manual popover, so the platform handles neither key: wire Esc to
// cancel and Enter to finish here. A nested popover (a dropdown/menu open over the
// modal) owns them first — the modal is one `:popover-open`, so >1 means nested.
useEventListener('keydown', (e: KeyboardEvent) => {
	if (!open.value) return
	if (document.querySelectorAll(':popover-open').length > 1) return

	if (e.key === 'Escape') {
		e.preventDefault()
		onCancel()
	} else if (e.key === 'Enter') {
		if (e.isComposing || isMultilineTarget(e.target)) return
		e.preventDefault()
		endEdit()
	}
})
</script>

<template>
	<PaneModal v-model:open="open">
		<div v-if="desc" class="TqPaneModalTabs">
			<div v-if="desc.options?.title" class="title">
				{{ desc.options.title }}
			</div>
			<Tabs
				:name="`modal-${desc.options?.title ?? 'tabs'}`"
				vertical
				class="body"
			>
				<Tab v-for="tab in desc.tabs" :key="tab.id" :name="tab.title">
					<InputComplex
						v-if="'scheme' in tab"
						:scheme="tab.scheme"
						:modelValue="values[tab.id]"
						@update:modelValue="onFormInput(tab, $event)"
					/>
					<component :is="tab.component" v-else v-bind="tab.props" />
				</Tab>
			</Tabs>
			<div class="footer">
				<InputButton subtle label="Cancel" @click="onCancel" />
				<InputButton label="Done" @click="endEdit" />
			</div>
		</div>
	</PaneModal>
</template>

<style lang="stylus" scoped>
.TqPaneModalTabs
	display flex
	flex-direction column
	gap var(--tq-gap-section)
	min-height 0
	width 44rem
	max-width 100%

	.title
		font-family var(--tq-font-heading)
		font-size 14px
		font-weight bold

	// The tabs fill the space (the right-hand panel scrolls internally); the
	// footer stays pinned.
	.body
		flex 1 1 auto
		min-height 0

	.footer
		flex 0 0 auto
		display flex
		justify-content flex-end
		gap var(--tq-gap-control)
</style>
