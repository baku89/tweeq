<script setup lang="ts">
import {
	computed,
	inject,
	onBeforeMount,
	onBeforeUnmount,
	provide,
	useTemplateRef,
	watch,
} from 'vue'

import {ParameterGroupCollapsibleKey} from '../ParameterGrid/types'
import {type PaneTabProps, PaneTabsKey} from './types'

const props = defineProps<PaneTabProps>()

defineSlots<{default: () => any}>()

const tabs = inject(PaneTabsKey)
if (!tabs) throw new Error('PaneTab must be placed inside PaneTabs')

const active = computed(() => tabs.activeId.value === props.id)

// One panel shows at a time, so its groups have nothing to make room for:
// they are a heading over their contents, always laid out in full.
provide(ParameterGroupCollapsibleKey, false)

onBeforeMount(() => tabs.add(props))
onBeforeUnmount(() => tabs.remove(props))

// Each tab scrolls on its own, and a hidden box forgets its scroll offset:
// note it on the way out, put it back on the way in.
const $root = useTemplateRef('$root')
let scrollTop = 0

watch(
	active,
	active => {
		if (!active && $root.value) scrollTop = $root.value.scrollTop
	},
	{flush: 'pre'}
)

watch(
	active,
	active => {
		if (active && $root.value) $root.value.scrollTop = scrollTop
	},
	{flush: 'post'}
)
</script>

<template>
	<!-- Hidden, not unmounted: a panel keeps its local state across tabs. -->
	<section
		v-show="active"
		ref="$root"
		class="TqPaneTab"
		role="tabpanel"
		:aria-label="label"
	>
		<slot />
	</section>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

.TqPaneTab
	height 100%
	overflow-y scroll
	// The scrollbar takes its width out of the right padding.
	padding var(--tq-pane-padding) calc(var(--tq-pane-padding) - var(--tq-scrollbar-width)) var(--tq-pane-padding) var(--tq-pane-padding)
	scroll-fade-mask()
</style>
