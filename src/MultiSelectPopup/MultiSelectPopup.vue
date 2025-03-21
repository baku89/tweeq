<script setup lang="ts">
import {autoUpdate, useFloating} from '@floating-ui/vue'
import {onMounted, shallowRef, toRef, watchEffect} from 'vue'

import {Icon} from '../Icon'
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
		class="TqMultiSelectPopup"
		:style="floatingStyles"
		popover="manual"
	>
		<Icon class="tune-icon" icon="lsicon:control-filled" />
		<MultiSelectHorizontalSlider :updator="adder" icon="material-symbols:add" />
		<MultiSelectHorizontalSlider :updator="multiplier" icon="mdi:multiply" />
		<MultiSelectSwap v-if="multiSelect.focusCount === 2" />
	</div>
</template>

<style lang="stylus">
@import '../common.styl'

.TqMultiSelectPopup
	position fixed
	popup-style()
	margin 3px 0
	top 0
	left 0
	z-index 1000
	visibility hidden
	display flex
	padding 4px
	border-color var(--tq-color-accent)
	box-shadow none
	overflow hidden
	hover-transition(width, height, border-radius)

	&:not(:hover)
		width calc(var(--tq-input-height) / 2)
		height calc(var(--tq-input-height) / 2)
		border-radius 99px

	&.visible
		visibility visible

.tune-icon
	position absolute
	inset 2px
	width calc(100% - 4px)
	height calc(100% - 4px)
	background var(--tq-color-background)
	color var(--tq-color-accent)
	opacity 1
	pointer-events none

	input

	.TqMultiSelectPopup:hover &
		opacity 0
</style>
