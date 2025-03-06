<script setup lang="ts">
import {Icon} from '@iconify/vue'

interface Props {
	label?: string
	icon?: string
}

defineProps<Props>()

defineSlots<{
	default: void
	label: void
}>()
</script>
<template>
	<li class="Parameter">
		<div class="label">
			<slot name="label">
				<Icon v-if="icon" :icon="icon" />
				<template v-if="label">{{ label }}</template>
			</slot>
		</div>
		<div class="input">
			<slot />
		</div>
	</li>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

.Parameter
	display grid
	grid-column 1 / 3
	grid-template-columns subgrid

.label
	line-height var(--tq-input-height)
	align-items center
	display flex
	gap 4px
	color var(--tq-color-text-mute)

.label
	height var(--tq-input-height)

.input
	display grid
	gap 6px
	align-items center
</style>
