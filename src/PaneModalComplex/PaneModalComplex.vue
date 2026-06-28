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

// Cancel restores the value the modal opened with; Save keeps the edits. The
// modal can't be light-dismissed, so these buttons are the only way out.
function onCancel() {
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
	<PaneModal v-model:open="open">
		<div v-if="desc" class="TqPaneModalComplex">
			<div class="body">
				<InputComplex
					:title="desc.options?.title"
					:scheme="desc.scheme"
					:modelValue="desc.value"
					@update:modelValue="onUpdate"
				/>
			</div>
			<div class="footer">
				<InputButton subtle label="Cancel" @click="onCancel" />
				<InputButton label="Save" @click="onConfirm" />
			</div>
		</div>
	</PaneModal>
</template>

<style lang="stylus" scoped>
.TqPaneModalComplex
	display flex
	flex-direction column
	gap var(--tq-gap-section)
	// Fill the height the PaneModal allows so the form can scroll within it.
	min-height 0
	flex 1

	// The form scrolls; the footer below stays pinned and always reachable.
	.body
		min-height 0
		overflow-y auto
		// Room so focus rings / inputs aren't clipped by the scroll edge.
		margin-right calc(-1 * var(--tq-pane-padding))
		padding-right var(--tq-pane-padding)

	.footer
		display flex
		gap var(--tq-gap-control)

		// Split the width evenly between Cancel and Save.
		> *
			flex 1
</style>
