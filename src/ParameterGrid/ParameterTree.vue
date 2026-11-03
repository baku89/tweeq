<script setup lang="ts">
import ParameterGrid from './ParameterGrid.vue'
</script>

<template>
	<!-- Rows of one tree sit closer than one tree does to the next. -->
	<ParameterGrid class="TqParameterTree">
		<slot />
	</ParameterGrid>
</template>

<style scoped>
.TqParameterGrid.TqParameterTree {
	row-gap: var(--tq-gap-related);
}
</style>
