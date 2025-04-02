<template>
	<svg
		class="TqSvgIcon"
		xmlns="http://www.w3.org/2000/svg"
		:class="{
			inline: mode === 'inline',
			block: mode === 'block',
			'non-stroke-scaling': nonStrokeScaling,
		}"
		viewBox="0 0 32 32"
		width="32"
		height="32"
		:style="{strokeWidth}"
	>
		<slot />
	</svg>
</template>

<script lang="ts">
import {defineComponent, type PropType} from 'vue'

export default defineComponent({
	name: 'SvgIcon',
	props: {
		mode: {
			type: String as PropType<'inline' | 'block'>,
			default: 'inline',
		},
		strokeWidth: {
			type: Number,
		},
		nonStrokeScaling: {
			type: Boolean,
		},
	},
})
</script>

<style lang="stylus" scoped>
.TqSvgIcon
	fill none
	stroke currentColor
	stroke-linecap butt
	stroke-linejoin miter
	stroke-width 2

	&.inline
		display inline-block
		width 1em
		height 1em
		vertical-align middle

	&.block
		display block

	&.non-stroke-scaling
		*
			vector-effect non-scaling-stroke
</style>
