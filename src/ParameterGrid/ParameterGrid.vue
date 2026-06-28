<template>
	<ul class="TqParameterGrid">
		<slot />
	</ul>
</template>

<style lang="stylus" scoped>

.TqParameterGrid
	display grid
	// The value column is minmax(0, 1fr) — without the 0 minimum its content's
	// intrinsic width keeps the column from shrinking, so a narrow panel pushes
	// the inputs out instead of letting them shrink.
	grid-template-columns minmax(60px, max-content) minmax(0, 1fr)
	grid-gap var(--tq-gap-control)
	padding-left 3px
	align-items start
</style>
