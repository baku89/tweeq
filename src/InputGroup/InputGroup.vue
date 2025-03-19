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
	gap 1px
</style>
