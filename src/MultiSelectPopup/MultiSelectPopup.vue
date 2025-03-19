<script setup lang="ts">
import {autoUpdate, useFloating} from '@floating-ui/vue'
import {onMounted, shallowRef, toRef, watchEffect} from 'vue'

import {useMultiSelectStore} from '../stores/multiSelect'
import MultiSelectHorizontalSlider from './MultiSelectHorizontalSlider.vue'
import MultiSelectSwap from './MultiSelectSwap.vue'

const multiSelect = useMultiSelectStore()

const $root = shallowRef<HTMLElement | null>(null)

onMounted(() => {
	if (!$root.value) return
	multiSelect.setPopupEl($root.value)
})

const {floatingStyles} = useFloating(
	toRef(multiSelect, 'focusedElement'),
	$root,
	{placement: 'bottom-end', whileElementsMounted: autoUpdate}
)

const adder = (px: number) => (value: number) => value + px / 100
const multiplier = (px: number) => {
	const scale = Math.max(0, px / 100 + 1)
	return (value: number) => value * scale
}

watchEffect(() => {
	$root.value?.togglePopover(multiSelect.popupVisible)
})
</script>

<template>
	<div
		ref="$root"
		:class="{visible: multiSelect.popupVisible}"
		class="MultiSelectPopup"
		:style="floatingStyles"
		popover="manual"
	>
		<MultiSelectHorizontalSlider :updator="adder" icon="material-symbols:add" />
		<MultiSelectHorizontalSlider :updator="multiplier" icon="mdi:multiply" />
		<MultiSelectSwap v-if="multiSelect.focusCount === 2" />
	</div>
</template>

<style lang="stylus">
@import '../common.styl'

.MultiSelectPopup
	position fixed
	popup-style()
	margin 0
	top 0
	left 0
	z-index 1000
	visibility hidden
	display flex
	padding 4px
	border-color var(--tq-color-accent)
	box-shadow none

	&.visible
		visibility visible
</style>
