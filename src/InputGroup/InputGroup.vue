<script setup lang="ts">
defineSlots<{
	default: () => any
}>()
</script>

<template>
	<div class="TqInputGroup">
		<slot />
	</div>
</template>

<style scoped lang="stylus">
.TqInputGroup
	display flex
	flex-grow 1
	gap 2px
</style>
