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
		<div class="left">
			<slot name="left" />
		</div>
		<div class="spacer" />
		<div class="right">
			<slot name="right" />
		</div>
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
	gap 9px
	padding 6px
	-webkit-app-region: drag;
	app-region: drag;
	line-height calc(var(--titlebar-area-height) - 12px)

	--tq-input-height calc(var(--titlebar-area-height) - 12px)

	@media (display-mode: window-controls-overlay)
		background linear-gradient(to bottom, var(--tq-color-bg) 20%, transparent), linear-gradient(to right, var(--tq-color-bg) 0, transparent 15%, transparent 85%, var(--tq-color-bg) 100%)

.left, .right
	display flex
	gap 9px
	-webkit-app-region: drag;
	app-region no-drag

.icon
	height calc(var(--titlebar-area-height) - .8rem)

.app-name
	font-weight bold

.spacer
	flex-grow 1
</style>
