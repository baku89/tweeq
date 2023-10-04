<script setup lang="ts">
import {Icon} from '@iconify/vue'

interface Props {
	label?: string
	icon?: string
}

defineProps<Props>()
</script>
<template>
	<li class="Parameter">
		<label class="label">
			<Icon v-if="icon" class="icon" :icon="icon" />
			<span v-if="label" class="text">{{ label }}</span>
		</label>
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
	display flex
	gap 4px
	height var(--tq-input-height)
	color var(--tq-color-gray-on-background)

.text
	display inline-block
	line-height var(--tq-input-height)
	vertical-align middle
</style>
