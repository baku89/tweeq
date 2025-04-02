<script lang="ts" setup>
defineSlots<{
	default: () => any
}>()
</script>

<template>
	<div class="TqTooltip">
		<slot />
	</div>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

.TqTooltip
	padding .2em .5em
	border-radius 9999px
	border 1px solid var(--tq-color-border)
	background var(--tq-color-surface)
	color var(--tq-color-text)
	backdrop-filter blur(3px)
	font-size .9em
	font-numeric()

	:deep(label)
		color var(--tq-color-text-mute)
</style>
