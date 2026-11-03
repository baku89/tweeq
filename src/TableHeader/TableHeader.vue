<script setup lang="ts">
/**
 * The header row of a table laid out on a CSS grid: one small label per column,
 * on the grid's own columns (an empty string leaves a column unlabelled).
 */
defineProps<{
	columns: readonly string[]
}>()
</script>

<template>
	<div class="TqTableHeader" role="row">
		<div v-for="(column, i) in columns" :key="i" role="columnheader">{{ column }}</div>
	</div>
</template>

<style lang="stylus" scoped>
.TqTableHeader
	display grid
	grid-column 1 / -1
	grid-template-columns subgrid
	align-items center
	font-size 0.75em
	letter-spacing 0.05em
	text-transform uppercase
	white-space nowrap
	color var(--tq-color-text-mute)
</style>
