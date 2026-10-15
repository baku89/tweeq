<script setup lang="ts">
import {computed, inject, ref, watch} from 'vue'

import {Icon} from '../Icon'
import {useAppConfigStore} from '../stores/appConfig'
import ParameterHeading from './ParameterHeading.vue'
import {ParameterGroupCollapsibleKey, ParameterGroupProps} from './types'

const props = withDefaults(defineProps<ParameterGroupProps>(), {
	// Not `false` (Vue's cast for an absent Boolean prop): absent means "ask
	// the container".
	collapsible: undefined,
})

defineSlots<{
	default: void
	headingRight: void
}>()

const appConfig = useAppConfigStore()

const inheritedCollapsible = inject(ParameterGroupCollapsibleKey, true)
const collapsible = computed(() => props.collapsible ?? inheritedCollapsible)

// A group that can't collapse is always open, whatever was stored for it
// while it could.
const stored = appConfig.ref(props.name, true)
const expanded = computed(() => !collapsible.value || stored.value)

function toggle() {
	if (collapsible.value) stored.value = !stored.value
}

// The 0fr↔1fr collapse needs overflow:hidden to clip the content, but that also
// crops focus outlines of inputs once the group is open. So clip only while
// collapsed or mid-animation: clip immediately on collapse, then unclip once the
// expand transition finishes.
const clipped = ref(!expanded.value)

watch(expanded, expanded => {
	if (!expanded) clipped.value = true
})

function onTransitionEnd(e: TransitionEvent) {
	if (e.propertyName === 'grid-template-rows') {
		clipped.value = !expanded.value
	}
}
</script>

<template>
	<div
		class="ParameterGroup"
		:class="{collapsed: !expanded}"
		@transitionend="onTransitionEnd">
		<ParameterHeading>
			<template #default>
				<div class="heading" :class="{collapsible}" @click="toggle">
					<Icon v-if="collapsible" class="chevron" icon="mdi:chevron-down" />
					<span>{{ label }}</span>
				</div>
			</template>
			<template #right>
				<slot v-if="expanded" name="headingRight" />
			</template>
		</ParameterHeading>
		<!-- Always rendered; the 0fr↔1fr grid-row animates the height. -->
		<div class="content" :class="{clipped}">
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

// The subgrid of parameters, and the clip child of the 0fr↔1fr trick: min-height
// 0 so the row can hug 0 when collapsed. overflow:hidden only while clipped (i.e.
// collapsed or mid-animation) so a fully-expanded group doesn't crop the focus
// outlines of its inputs. The heading↔content gap is this padding-top; it's
// animated to 0 on collapse because, with box-sizing:border-box, the padding
// would otherwise linger inside the 0fr row (leaving a gap under a collapsed
// heading). Group↔group spacing stays the grid gap alone, so it isn't doubled.
// Column subgrid keeps the alignment.
.content
	display grid
	grid-template-columns subgrid
	grid-column 1 / 3
	gap var(--tq-gap-control)
	padding-top var(--tq-gap-control)
	min-height 0
	transition padding-top var(--tq-hover-transition-duration) ease

	&.clipped
		overflow hidden

	.collapsed &
		padding-top 0

.chevron
	margin 0 0 0 -4px
	transition transform var(--tq-hover-transition-duration) ease

	.collapsed &
		transform rotate(-90deg)

.heading
	display flex
	align-items center
	gap 0.25em
	color var(--tq-color-text-mute)
	hover-transition(color)

	&.collapsible
		cursor pointer

		&:hover
			color var(--tq-color-text)
</style>
