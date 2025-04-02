<script setup lang="ts">
import {Viewport} from '../Viewport'
import {CommandPalette} from '../CommandPalette'
import {PaneModalComplex} from '../PaneModalComplex'
import {MultiSelectPopup} from '../MultiSelectPopup'

defineSlots<{
	title: () => any
	default: () => any
}>()
</script>

<template>
	<Viewport class="TqApp">
		<CommandPalette />
		<PaneModalComplex />
		<MultiSelectPopup />
		<slot name="title" />
		<main class="main">
			<slot />
		</main>
	</Viewport>
</template>

<style lang="stylus" scoped>

.TqApp
	--titlebar-area-height: env(titlebar-area-height, 38px)

	position fixed
	inset 0
	background var(--tq-color-background)

.main
	position fixed
	inset var(--titlebar-area-height) 0 0
</style>
