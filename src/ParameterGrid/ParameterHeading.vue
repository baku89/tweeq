<script setup lang="ts">
defineSlots<{
	default: void
	right: void
}>()
</script>
<template>
	<li class="TqParameterHeading">
		<div class="heading">
			<slot />
		</div>
		<div class="right">
			<slot name="right" />
		</div>
	</li>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

.TqParameterHeading
	display flex
	height var(--tq-input-height)
	line-height var(--tq-input-height)
	grid-column 1 / 3

.heading
	font-family var(--tq-font-heading)
	font-size 14px
	font-weight bold
	flex-grow 1
</style>
