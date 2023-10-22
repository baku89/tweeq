<script lang="ts" setup>
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

watch(
	() => [props.fragmentString, props.uniforms, $img.value] as const,
	([frag, uniforms, $img]) => {
		if (!$img) return

		reglContext.draw(frag, uniforms, $img)
	},
	{immediate: true}
)
</script>

<template>
	<img ref="$img" />
</template>
