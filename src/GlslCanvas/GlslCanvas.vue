<script lang="ts" setup>
import {throttle} from 'lodash'
import {ref, watch} from 'vue'

import {useReglContextStore} from './reglContextStore'

interface Props {
	fragmentString: string
	uniforms: Record<
		string,
		number | number[] | readonly [number, number, number, number]
	>
}

const props = withDefaults(defineProps<Props>(), {
	fragmentString: `
		precision mediump float;
		varying vec2 uv;
		void main() { gl_FragColor = vec4(uv, 0, 1); }`,
	uniforms: () => ({}),
})

const reglContext = useReglContextStore()

const $img = ref<null | HTMLImageElement>(null)

const throttleDraw = throttle(
	(frag: string, uniforms: any, img: HTMLImageElement) => {
		if (!$img.value) return

		reglContext.draw(frag, uniforms, img)
	},
	1000 / 60
)

watch(
	() => [props.fragmentString, props.uniforms, $img.value] as const,
	([frag, uniforms, $img]) => {
		if (!$img) return

		throttleDraw(frag, uniforms, $img)
	},
	{immediate: true, flush: 'post'}
)
</script>

<template>
	<img ref="$img" />
</template>
