<script setup lang="ts">
import ColorIcon from '../ColorIcon'

interface Props {
	name: string
	icon: string
}
defineProps<Props>()

defineSlots<{
	left(): any
	right(): any
}>()
</script>

<template>
	<div class="TitleBar">
		<ColorIcon class="icon" :src="icon" />
		<span class="app-name">{{ name }}</span>
		<slot name="left" />
		<div class="spacer" />
		<slot name="right" />
	</div>
</template>

<style lang="stylus" scoped>
.TitleBar
	display flex
	left env(titlebar-area-x, 0)
	top env(titlebar-area-y, 0)
	width env(titlebar-area-width, 100%)
	height var(--titlebar-area-height)
	z-index 100
	user-select none
	position fixed
	background linear-gradient(to bottom, var(--tq-color-bg), transparent)
	backdrop-filter blur(2px)
	gap .6rem
	padding .4rem .4rem .4rem .6rem
	-webkit-app-region: drag;
	app-region: drag;
	line-height calc(var(--titlebar-area-height) - 0.8rem)

	@media (display-mode: window-controls-overlay)
		background linear-gradient(to bottom, var(--tq-color-bg) 20%, transparent), linear-gradient(to right, var(--tq-color-bg) 0, transparent 15%, transparent 85%, var(--tq-color-bg) 100%)


.icon
	height calc(var(--titlebar-area-height) - .8rem)

.app-name
	font-weight bold

.spacer
	flex-grow 1
</style>