<script setup lang="ts">
import {computedInject} from '@vueuse/core'

import {InputColorPresetsKey} from './useInputColor'

interface Props {
	presets?: string[]
}

const props = withDefaults(defineProps<Props>(), {
	presets: () => [],
})

const emit = defineEmits<{
	'update:modelValue': [string]
}>()

const presetsMerged = computedInject(InputColorPresetsKey, injectedPresets => {
	return [...(injectedPresets ?? []), ...props.presets]
})
</script>

<template>
	<div class="TqInputColorPresets">
		<button
			v-for="preset in presetsMerged"
			:key="preset"
			:style="{background: preset}"
			@click="emit('update:modelValue', preset)"
		/>
	</div>
</template>

<style lang="stylus" scoped>
@import './common.styl'

.TqInputColorPresets
	display flex
	align-items start
	gap var(--tq-gap-related)

// As large as an input, and smaller for as many as there are to fit.
button
	flex 0 1 var(--tq-input-height)
	min-width 0
	aspect-ratio 1
	border-radius var(--tq-radius-input)
</style>
./useInputColor
