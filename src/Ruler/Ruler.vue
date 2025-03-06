<script setup lang="ts">
import {type MaybeElementRef, useElementBounding} from '@vueuse/core'
import * as Bndr from 'bndr-js'
import {scalar, vec2} from 'linearly'
import {range as _range} from 'lodash-es'
import {computed, ref} from 'vue'

import {useBndr} from '../use/useBndr'

type Scale = {value: number; label?: string; opacity?: number}

const props = defineProps<{
	range: vec2
	scales?: Scale[]
}>()

const emit = defineEmits<{
	drag: [value: number]
}>()

const $root: MaybeElementRef = ref(null)

const {width: rootWidth} = useElementBounding($root)

function defaultScaleComputed() {
	const start = Math.ceil(props.range[0])
	const end = Math.floor(props.range[1])
	return _range(start, end + 1).map(value => ({value}))
}

const pixelsPerUnit = computed(
	() => rootWidth.value / (props.range[1] - props.range[0])
)

const rootStyle = computed(() => ({
	'background-size': `${pixelsPerUnit.value}px 100%`,
	'background-position': `${-props.range[0] * pixelsPerUnit.value}px 0`,
}))

const _scales = computed<Scale[]>(() => {
	return props.scales ?? defaultScaleComputed()
})

function scaleToStyle(scale: Scale) {
	return {
		transform: `translateX(${toPixels(scale.value)}px)`,
		opacity: scale.opacity ?? 1,
	}
}

function toPixels(value: number) {
	return (value - props.range[0]) * pixelsPerUnit.value
}

useBndr($root, el => {
	Bndr.pointer(el)
		.drag({pointerCapture: true, coordinate: 'offset'})
		.on(d => {
			const x = d.current[0]
			const value = scalar.fit(x, 0, rootWidth.value, ...props.range)
			emit('drag', value)
		})
})
</script>
<template>
	<div ref="$root" class="TqRuler" :style="rootStyle">
		<div class="content">
			<slot />
		</div>
		<div
			v-for="scale in _scales"
			:key="scale.value"
			class="scale"
			:style="scaleToStyle(scale)"
		>
			{{ scale.label ?? scale.value }}
		</div>
	</div>
</template>

<style lang="stylus" scoped>
.TqRuler
	position relative
	background-image linear-gradient(to right, var(--tq-color-border) 1px, transparent 1px)

.content, .scale
	position absolute
	inset 0

.scale
	border-left 1px solid var(--tq-color-text-mute)
	font-size 9px
	color var(--tq-color-text-mute)
	text-indent 0.4em
</style>
