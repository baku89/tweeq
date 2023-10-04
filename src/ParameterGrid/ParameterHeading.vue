<script setup lang="ts">
defineSlots<{
	default: void
}>()
</script>
<template>
	<li class="ParameterHeading">
		<slot />
	</li>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

.ParameterHeading
	height var(--tq-input-height)
	line-height var(--tq-input-height)
	font-size 14px
	font-weight bold

	grid-column 1 / 3
</style>
