<script setup lang="ts">
import ColorIcon from '../ColorIcon'

interface Props {
	name: string
	icon: string
}
defineProps<Props>()

defineSlots<{
	left(): any
	center(): any
	right(): any
}>()
</script>

<template>
	<div class="TitleBar">
		<div class="left">
			<ColorIcon class="icon" :src="icon" />
			<span class="app-name">{{ name }}</span>
			<slot name="left" />
		</div>
		<div class="center">
			<slot name="center" />
		</div>
		<div class="right">
			<slot name="right" />
		</div>
	</div>
</template>

<style lang="stylus" scoped>
.TitleBar
	display grid
	grid-template-columns 1fr min-content 1fr
	left env(titlebar-area-x, 0)
	top env(titlebar-area-y, 0)
	width env(titlebar-area-width, 100%)
	height var(--titlebar-area-height)
	z-index 100
	user-select none
	position fixed
	background linear-gradient(to bottom, var(--tq-color-background), transparent)
	backdrop-filter blur(2px)
	gap 9px
	padding 6px
	-webkit-app-region: drag;
	app-region: drag;
	line-height calc(var(--titlebar-area-height) - 12px)

	--tq-input-height calc(var(--titlebar-area-height) - 12px)

	@media (display-mode: window-controls-overlay)
		background linear-gradient(to bottom, var(--tq-color-background) 20%, transparent), linear-gradient(to right, var(--tq-color-background) 0, transparent 15%, transparent 85%, var(--tq-color-background) 100%)


.left, .center, .right
	display flex
	gap 9px

	& > :deep(*)
		-webkit-app-region no-drag
		app-region no-drag

.right
	flex-direction row-reverse

.icon
	height calc(var(--titlebar-area-height) - .8rem)

.app-name
	font-weight bold
</style>
