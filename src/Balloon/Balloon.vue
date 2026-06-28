<script lang="ts" setup>
import {useElementSize} from '@vueuse/core'
import {computed, useTemplateRef} from 'vue'

type ArrowSide = 'top' | 'bottom' | 'left' | 'right'

const props = withDefaults(
	defineProps<{
		// Edge the arrow protrudes from. Omit for a plain (arrowless) balloon.
		arrowSide?: ArrowSide | null
		// Arrow centre in px along that edge, measured from the box's top-left
		// (x for top/bottom, y for left/right). Clamped to the straight run.
		arrowOffset?: number
		radius?: number
		// Inner padding around the slotted content.
		padding?: string
		// Attention flash: pulse the whole balloon (scale + accent drop-shadow +
		// glowing border). Driven by a boolean so re-arming restarts the keyframes.
		flash?: boolean
	}>(),
	{
		arrowSide: null,
		arrowOffset: 0,
		flash: false,
		// Concentric with the content: inner control radius (4) + popup padding
		// (9), matching --tq-radius-popup.
		radius: 13,
		padding: 'var(--tq-popup-padding)',
	}
)

// Arrow base width / protrusion depth / tip rounding — fixed to the visual
// language; the balloon shape itself is generated from the measured content.
const AW = 14
const AH = 7
const TIP = 1.5

const $content = useTemplateRef<HTMLElement>('$content')
const {width, height} = useElementSize(
	$content,
	{width: 0, height: 0},
	{box: 'border-box'}
)

const arrowDepth = (side: ArrowSide) => (props.arrowSide === side ? AH : 0)

const layer = computed(() => ({
	width: width.value + arrowDepth('left') + arrowDepth('right'),
	height: height.value + arrowDepth('top') + arrowDepth('bottom'),
}))

// Rounded rect (content-sized) with one outward arrow, walked clockwise. The
// layer expands by AH on the arrow side; the body sits at (ox, oy) inside it,
// matching the wrapper's arrow-side padding so path coords line up 1:1 with the
// absolutely-positioned fill/stroke layers.
const d = computed(() => {
	const w = width.value
	const h = height.value
	if (w === 0 || h === 0) return ''

	const side = props.arrowSide
	const offset = props.arrowOffset
	const r = Math.min(props.radius, w / 2, h / 2)
	const a = AW / 2
	const ox = side === 'left' ? AH : 0
	const oy = side === 'top' ? AH : 0
	const cx = (x: number) => Math.max(ox + r + a, Math.min(ox + w - r - a, x))
	const cy = (y: number) => Math.max(oy + r + a, Math.min(oy + h - r - a, y))
	const p = [`M ${ox + r},${oy}`]

	if (side === 'top') {
		const c = cx(ox + offset)
		p.push(
			`H ${c - a}`,
			`L ${c - TIP},${oy - AH + TIP}`,
			`Q ${c},${oy - AH} ${c + TIP},${oy - AH + TIP}`,
			`L ${c + a},${oy}`
		)
	}
	p.push(`H ${ox + w - r}`, `A ${r} ${r} 0 0 1 ${ox + w},${oy + r}`)

	if (side === 'right') {
		const c = cy(oy + offset)
		p.push(
			`V ${c - a}`,
			`L ${ox + w + AH - TIP},${c - TIP}`,
			`Q ${ox + w + AH},${c} ${ox + w + AH - TIP},${c + TIP}`,
			`L ${ox + w},${c + a}`
		)
	}
	p.push(`V ${oy + h - r}`, `A ${r} ${r} 0 0 1 ${ox + w - r},${oy + h}`)

	if (side === 'bottom') {
		const c = cx(ox + offset)
		p.push(
			`H ${c + a}`,
			`L ${c + TIP},${oy + h + AH - TIP}`,
			`Q ${c},${oy + h + AH} ${c - TIP},${oy + h + AH - TIP}`,
			`L ${c - a},${oy + h}`
		)
	}
	p.push(`H ${ox + r}`, `A ${r} ${r} 0 0 1 ${ox},${oy + h - r}`)

	if (side === 'left') {
		const c = cy(oy + offset)
		p.push(
			`V ${c + a}`,
			`L ${ox - AH + TIP},${c + TIP}`,
			`Q ${ox - AH},${c} ${ox - AH + TIP},${c - TIP}`,
			`L ${ox},${c - a}`
		)
	}
	p.push(`V ${oy + r}`, `A ${r} ${r} 0 0 1 ${ox + r},${oy}`, 'Z')

	return p.join(' ')
})

const wrapperStyle = computed(() => {
	const side = props.arrowSide
	return {
		paddingTop: side === 'top' ? `${AH}px` : undefined,
		paddingBottom: side === 'bottom' ? `${AH}px` : undefined,
		paddingLeft: side === 'left' ? `${AH}px` : undefined,
		paddingRight: side === 'right' ? `${AH}px` : undefined,
	}
})

const fillStyle = computed(() => ({
	clipPath: d.value ? `path('${d.value}')` : undefined,
}))

// Anchor the pop-in scale at the arrow's tip so the balloon grows out of the
// point it's aimed at (falls back to centre when there's no arrow). Offset is
// measured along the arrow's edge from the box's top-left, matching the path.
const transformOrigin = computed(() => {
	const o = `${props.arrowOffset}px`
	switch (props.arrowSide) {
		case 'top':
			return `${o} 0`
		case 'bottom':
			return `${o} 100%`
		case 'left':
			return `0 ${o}`
		case 'right':
			return `100% ${o}`
		default:
			return '50% 50%'
	}
})
</script>

<template>
	<div
		class="TqBalloon"
		:class="{flash}"
		:style="[wrapperStyle, {transformOrigin}]"
	>
		<div class="fill" :style="fillStyle" />
		<svg
			class="stroke"
			:viewBox="`0 0 ${layer.width} ${layer.height}`"
			:width="layer.width"
			:height="layer.height"
		>
			<path :d="d" />
		</svg>
		<div ref="$content" class="content" :style="{padding}">
			<slot />
		</div>
	</div>
</template>

<style lang="stylus" scoped>
// A speech-balloon chrome that keeps a backdrop blur AND a crisp border around
// an arbitrary outline (incl. the arrow). Two layers share one generated path:
//   .fill   — backdrop-filter blur + surface tint, clipped to the path
//   .stroke — an SVG <path> stroke = the border, follows the whole outline
// CSS can't yet do this in one box on our Chromium (corner-shape / clip-path
// shape() are too new), and clip-path alone would clip away a CSS border.
.TqBalloon
	position relative
	display inline-block
	// Subtle pop-in: scale up from the arrow tip, in step with the popover's
	// opacity fade (same duration). Exit is instant, like the fade.
	transform scale(1)
	transition transform var(--tq-active-transition-duration) ease-out

@starting-style
	.TqBalloon
		transform scale(0.96)

.fill
	position absolute
	inset 0
	background var(--tq-color-surface)
	backdrop-filter blur(var(--tq-popup-blur))
	// Keep the drop-shadow here, NOT on .TqBalloon: a `filter` on an ancestor of
	// a backdrop-filtered element turns that ancestor into a backdrop root, which
	// blanks the blur (it samples the empty wrapper instead of the page behind
	// the balloon). On .fill itself the shadow still follows the clipped outline
	// (filters apply after clip-path) while backdrop-filter keeps working.
	filter drop-shadow(0 2px 12px var(--tq-color-shadow))

.stroke
	position absolute
	inset 0
	overflow visible
	pointer-events none

	path
		fill none
		stroke var(--tq-color-border)
		stroke-width 1

.content
	position relative
	color var(--tq-color-text)

// Attention flash: the whole balloon swells slightly while its drop-shadow and
// its outline (the SVG border that traces the speech-balloon shape, arrow and
// all) bloom to the accent colour, then settle. Each layer animates the property
// it owns; the 0%/100% frames match the resting style so it's seamless.
.TqBalloon.flash
	animation tq-balloon-flash-scale .6s ease-in-out 2

	.fill
		animation tq-balloon-flash-fill .6s ease-in-out 2

	.stroke path
		animation tq-balloon-flash-stroke .6s ease-in-out 2

@keyframes tq-balloon-flash-scale
	0%, 100%
		transform scale(1)
	50%
		transform scale(1.03)

@keyframes tq-balloon-flash-fill
	0%, 100%
		filter drop-shadow(0 2px 12px var(--tq-color-shadow))
	50%
		filter drop-shadow(0 2px 12px var(--tq-color-shadow)) drop-shadow(0 0 9px var(--tq-color-accent))

@keyframes tq-balloon-flash-stroke
	0%, 100%
		stroke var(--tq-color-border)
		filter none
	50%
		stroke var(--tq-color-accent)
		filter drop-shadow(0 0 3px var(--tq-color-accent))
</style>
