<script setup lang="ts">
import type {IconSequence} from 'bndr-js'

import {BindIcon} from '../BindIcon'
import {Icon} from '../Icon'
import {computed, onUnmounted, ref, useTemplateRef} from 'vue'
import Popover from '../Popover/Popover.vue'
import {useThemeStore} from '../stores/theme'

interface BaseMenu {
	icon?: string
	label: string
	shortLabel?: string
	perform?: () => void
	children?: MenuItem[]
}

export interface MenuCommand extends BaseMenu {
	perform: () => void
	bindIcon?: IconSequence
}

export interface MenuGroup extends BaseMenu {
	children: (MenuGroup | MenuCommand)[]
}

export type MenuItem = MenuCommand | MenuGroup

interface Props {
	items: MenuItem[]
}

const props = defineProps<Props>()

// Bubbles up when a command is chosen, so the whole menu chain can close (this
// replaces floating-vue's v-close-popper.all now that menus use Tweeq Popover).
const emit = defineEmits<{close: []}>()

function onClick(menu: MenuItem) {
	if ('perform' in menu && menu.perform) {
		menu.perform()
		emit('close')
	}
}

const theme = useThemeStore()

const hoverIndex = ref(-1)

const $lists = useTemplateRef('$lists')
const $childMenu = useTemplateRef<{$el: HTMLElement}>('$childMenu')

const $childReference = computed(() => {
	if (hoverIndex.value === -1) return null

	return $lists.value?.[hoverIndex.value] ?? null
})

const childItems = computed(() => {
	return props.items[hoverIndex.value].children ?? null
})

// --- "Safe triangle" submenu navigation ---------------------------------------
// While a submenu is open, let the cursor cut diagonally across sibling items to
// reach it without the submenu closing. We keep the open item as long as the
// cursor stays inside the triangle from where it entered that item (the apex) to
// the near edge of the open submenu.
type Pt = {x: number; y: number}
let pointer: Pt = {x: 0, y: 0}
let apex: Pt = {x: 0, y: 0}
let pendingIndex = -1
let switchTimer: ReturnType<typeof setTimeout> | undefined

function submenuIsOpen() {
	const cur = props.items[hoverIndex.value]
	return hoverIndex.value !== -1 && !!cur && 'children' in cur && !!cur.children
}

function inSafeTriangle(): boolean {
	const el = $childMenu.value?.$el
	if (!el || el.nodeType !== 1) return false
	const r = el.getBoundingClientRect()
	// Use whichever vertical edge of the submenu faces the apex (handles a
	// submenu that flipped to the left).
	const edgeX = r.left >= apex.x ? r.left : r.right
	return inTriangle(pointer, apex, {x: edgeX, y: r.top}, {x: edgeX, y: r.bottom})
}

function commitHover(index: number) {
	clearTimeout(switchTimer)
	switchTimer = undefined
	pendingIndex = -1
	hoverIndex.value = index
	apex = {...pointer}
}

function onItemEnter(index: number, e: PointerEvent) {
	pointer = {x: e.clientX, y: e.clientY}
	if (index !== hoverIndex.value && submenuIsOpen() && inSafeTriangle()) {
		// Heading toward the open submenu — defer the switch (a timeout still
		// commits if the cursor just parks on the sibling).
		pendingIndex = index
		clearTimeout(switchTimer)
		switchTimer = setTimeout(() => commitHover(index), 300)
	} else {
		commitHover(index)
	}
}

function onPointerMove(e: PointerEvent) {
	pointer = {x: e.clientX, y: e.clientY}
	if (pendingIndex !== -1 && !inSafeTriangle()) commitHover(pendingIndex)
}

function inTriangle(p: Pt, a: Pt, b: Pt, c: Pt): boolean {
	const cross = (p1: Pt, p2: Pt, p3: Pt) =>
		(p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y)
	const d1 = cross(p, a, b)
	const d2 = cross(p, b, c)
	const d3 = cross(p, c, a)
	const neg = d1 < 0 || d2 < 0 || d3 < 0
	const pos = d1 > 0 || d2 > 0 || d3 > 0
	return !(neg && pos)
}

onUnmounted(() => clearTimeout(switchTimer))
</script>

<template>
	<ul class="TqMenu" @pointermove="onPointerMove">
		<li
			ref="$lists"
			v-for="(menu, index) in items"
			:key="index + '_item'"
			class="menu"
			:class="{
				active: index === hoverIndex && !('children' in menu),
				'submenu-open': index === hoverIndex && 'children' in menu,
			}"
			@click="onClick(menu)"
			@pointerenter="onItemEnter(index, $event)"
		>
			<Icon v-if="menu.icon" class="icon" :icon="menu.icon" />
			<span v-else />
			<div class="label-container">
				<span class="label">{{ menu.shortLabel ?? menu.label }}</span>
				<BindIcon
					v-if="'bindIcon' in menu && menu.bindIcon"
					class="bind-icon"
					:icon="menu.bindIcon"
				/>
				<Icon
					v-if="'children' in menu"
					class="group-chevron"
					icon="mdi:chevron-right"
				/>
			</div>
		</li>
	</ul>
	<Popover
		v-if="$childReference && childItems"
		:reference="$childReference"
		placement="right-start"
		:open="true"
		:offset="{crossAxis: -theme.popupPadding}"
		:lightDismiss="false"
	>
		<Menu ref="$childMenu" :items="childItems" @close="emit('close')" />
	</Popover>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

.TqMenu
	display flex
	flex-direction column
	popup-style()
	display grid
	grid-template-columns min-content 1fr

.menu
	grid-column 1 / 3
	display grid
	grid-template-columns subgrid
	padding 2px 6px
	height calc(var(--tq-input-height) + 4px)
	line-height var(--tq-input-height)
	align-items center
	border-radius var(--tq-radius-input)

	// Highlight is driven by hoverIndex (not :hover) so the safe-triangle can keep
	// the open item lit while the cursor cuts across siblings toward the submenu.
	// Open-submenu parent: neutral; a plain focused command: accent.
	&.submenu-open
		background var(--tq-color-neutral)

	&.active
		background var(--tq-color-accent)
		color var(--tq-color-on-accent)

.icon
	margin-right 8px

.label-container
	display flex
	justify-content center
	align-items center

.label
	flex-grow 1
	margin-right 1em

.bind-icon
	opacity .5

.group-chevron
	margin-right -6px
</style>
