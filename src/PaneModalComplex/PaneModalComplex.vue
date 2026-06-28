<script setup lang="ts">
import {onBeforeUnmount, ref} from 'vue'

import {InputButton} from '../InputButton'
import {InputComplex, type Scheme} from '../InputComplex'
import {PaneModal} from '../PaneModal'
import {useModalStore} from '../stores/modal'
import type {ShowOptions} from './types'

const modal = useModalStore()

const desc = ref<{
	value: any
	initialValue: any
	scheme: Scheme<any>
	options?: ShowOptions
} | null>(null)

const open = ref(false)

function onUpdate(value: any) {
	desc.value!.value = value
	onInput?.(value)
}

let onInput: ((value: any) => void) | undefined = undefined
let endEdit: (value: any) => void

function promptImpl<T extends Record<string, unknown>>(
	value: T,
	scheme: Scheme<T>,
	options?: ShowOptions<T>
): Promise<T> {
	if (desc.value) {
		endEdit(desc.value.initialValue)
	}

	desc.value = {scheme, value, initialValue: value, options}
	onInput = options?.onInput
	open.value = true

	return new Promise(resolve => {
		endEdit = (value: any) => {
			open.value = false
			endEdit = () => {}
			resolve(value)
		}
	})
}

modal.registerPrompt(promptImpl)
onBeforeUnmount(() => modal.registerPrompt(null))

function onAbort() {
	endEdit(desc.value!.initialValue)
}

function onConfirm() {
	endEdit(desc.value!.value)
}

defineExpose({
	prompt: promptImpl,
})
</script>

<template>
	<PaneModal v-model:open="open" @close="onAbort">
		<div v-if="desc" class="TqPaneModalComplex">
			<div class="body">
				<InputComplex
					:title="desc.options?.title"
					:scheme="desc.scheme"
					:modelValue="desc.value"
					@update:modelValue="onUpdate"
				/>
			</div>
			<InputButton label="Save" @click="onConfirm" />
		</div>
	</PaneModal>
</template>

<style lang="stylus" scoped>
.TqPaneModalComplex
	display flex
	flex-direction column
	gap 12px
	// Fill the height the PaneModal allows so the form can scroll within it.
	min-height 0
	flex 1

	// The form scrolls; the Save button below stays pinned and always reachable.
	.body
		min-height 0
		overflow-y auto
		// Room so focus rings / inputs aren't clipped by the scroll edge.
		margin-right calc(-1 * var(--tq-pane-padding))
		padding-right var(--tq-pane-padding)
</style>
