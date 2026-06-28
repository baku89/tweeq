<script setup lang="ts">
import {Icon} from '../Icon'
import {useAppConfigStore} from '../stores/appConfig'
import ParameterHeading from './ParameterHeading.vue'
import {ParameterGroupProps} from './types'

const props = defineProps<ParameterGroupProps>()

defineSlots<{
	default: void
	headingRight: void
}>()

const appConfig = useAppConfigStore()

const expanded = appConfig.ref(props.name, true)
</script>

<template>
	<div class="ParameterGroup" :class="{collapsed: !expanded}">
		<ParameterHeading>
			<template #default>
				<div class="heading" @click="expanded = !expanded">
					<Icon class="chevron" icon="mdi:chevron-down" />
					<span>{{ label }}</span>
				</div>
			</template>
			<template #right>
				<slot v-if="expanded" name="headingRight" />
			</template>
		</ParameterHeading>
		<!-- Always rendered; the 0fr↔1fr grid-row animates the height. -->
		<div class="content">
			<slot />
		</div>
	</div>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

// Rows: heading (auto) + content (animatable 1fr↔0fr). Row spacing lives in the
// content's padding so it collapses away too (no lingering gap when closed).
.ParameterGroup
	display grid
	grid-template-columns subgrid
	grid-template-rows auto 1fr
	grid-column 1 / 3
	column-gap var(--tq-gap-control)
	transition grid-template-rows var(--tq-hover-transition-duration) ease

	&.collapsed
		grid-template-rows auto 0fr

// The subgrid of parameters, and the clip child of the 0fr↔1fr trick: overflow
// hidden + min-height 0 so the row can hug 0 when collapsed. Row spacing is the
// padding-top (clipped away when closed); column subgrid keeps the alignment.
.content
	display grid
	grid-template-columns subgrid
	grid-column 1 / 3
	gap var(--tq-gap-control)
	padding-top var(--tq-gap-control)
	overflow hidden
	min-height 0

.chevron
	margin 0 0 0 -4px
	transition transform var(--tq-hover-transition-duration) ease

	.collapsed &
		transform rotate(-90deg)

.heading
	display flex
	align-items center
	cursor pointer
</style>
