<script setup lang="ts">
import type {IconSequence} from 'bndr-js'
import {computed, ref, useTemplateRef} from 'vue'

import {BindIcon} from '../BindIcon'
import {Icon} from '../Icon'
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
	children: MenuItem[]
}

// A non-interactive divider between groups of items.
export interface MenuSeparator {
	separator: true
}

export type MenuItem = MenuCommand | MenuGroup | MenuSeparator

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

const $menuRoot = useTemplateRef<HTMLElement>('$menuRoot')
const $lists = useTemplateRef('$lists')
const $childMenu = useTemplateRef<{getRoot: () => HTMLElement | null}>(
	'$childMenu'
)

// Expose the root <ul> so a parent menu can measure this submenu for its safe
// triangle (the component is multi-root, so $el isn't reliably the <ul>).
defineExpose({getRoot: () => $menuRoot.value})

const $childReference = computed(() => {
	if (hoverIndex.value === -1) return null

	return $lists.value?.[hoverIndex.value] ?? null
})

const childItems = computed(() => {
	const item = props.items[hoverIndex.value]
	return item && 'children' in item ? (item.children ?? null) : null
})

// --- "Safe triangle" submenu navigation ---------------------------------------
// While a submenu is open, let the cursor cut diagonally across sibling items to
// reach it without the submenu closing. Each move we test whether the cursor is
// travelling *into* the submenu: it's inside the triangle (beam) fanned from the
// previous cursor position to the submenu's near edge. While so, sibling hovers
// are ignored; the moment the cursor leaves that beam, the hovered sibling wins.
type Pt = {x: number; y: number}
let pointer: Pt = {x: 0, y: 0}
let prevPointer: Pt = {x: 0, y: 0}
// Item currently under the cursor (may differ from hoverIndex while in the beam).
const candidateIndex = ref(-1)

function submenuIsOpen() {
	const cur = props.items[hoverIndex.value]
	return hoverIndex.value !== -1 && !!cur && 'children' in cur && !!cur.children
}

// The submenu's vertical edge facing the cursor (handles a left-flipped submenu).
function submenuEdge(): {c1: Pt; c2: Pt} | null {
	const el = $childMenu.value?.getRoot()
	if (!el) return null
	const r = el.getBoundingClientRect()
	const edgeX = r.left >= pointer.x ? r.left : r.right
	return {c1: {x: edgeX, y: r.top}, c2: {x: edgeX, y: r.bottom}}
}

// Is the cursor travelling toward the submenu — i.e. inside the beam fanned from
// the previous cursor position to the submenu's near edge?
function headingToSubmenu(at: Pt): boolean {
	const e = submenuEdge()
	return !!e && inTriangle(at, prevPointer, e.c1, e.c2)
}

function commitHover(index: number) {
	hoverIndex.value = index
}

function onItemEnter(index: number, e: PointerEvent) {
	candidateIndex.value = index
	pointer = {x: e.clientX, y: e.clientY}
	if (!submenuIsOpen() || !headingToSubmenu(pointer)) commitHover(index)
}

function onPointerMove(e: PointerEvent) {
	pointer = {x: e.clientX, y: e.clientY}

	// Left the beam toward the submenu → let the item the cursor is actually over
	// take over.
	if (
		submenuIsOpen() &&
		!headingToSubmenu(pointer) &&
		candidateIndex.value !== -1 &&
		candidateIndex.value !== hoverIndex.value
	) {
		commitHover(candidateIndex.value)
	}

	prevPointer = pointer
}

function onPointerLeave() {
	candidateIndex.value = -1
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
</script>

<template>
	<ul
		ref="$menuRoot"
		class="TqMenu"
		@pointermove="onPointerMove"
		@pointerleave="onPointerLeave"
	>
		<template v-for="(menu, index) in items" :key="index + '_item'">
			<li v-if="'separator' in menu" ref="$lists" class="separator" />
			<li
				v-else
				ref="$lists"
				class="menu"
				:class="{
					active: index === hoverIndex && candidateIndex === index,
					'submenu-open':
						index === hoverIndex &&
						candidateIndex !== index &&
						'children' in menu,
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
		</template>
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

.separator
	grid-column 1 / 3
	height 1px
	margin 3px 6px
	background var(--tq-color-border)

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
