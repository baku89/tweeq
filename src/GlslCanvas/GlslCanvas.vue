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

const draw = useReglContextStore().createDraw()

const $img = ref<null | HTMLImageElement>(null)

watch(
	() => [props.fragmentString, props.uniforms, $img.value] as const,
	([frag, uniforms, $img]) => {
		if (!$img) return

		draw(frag, uniforms, $img)
	},
	{immediate: true, flush: 'post'}
)
</script>

<template>
	<img ref="$img" class="TqGlslCanvas" />
</template>

<style lang="stylus" scoped>

.TqGlslCanvas
	pointer-events none
</style>
