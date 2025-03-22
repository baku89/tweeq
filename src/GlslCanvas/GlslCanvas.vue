<script lang="ts" setup>
import {useTemplateRef, watch} from 'vue'

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

const $img = useTemplateRef('$img')

const draw = useReglContextStore().createDraw($img)

watch(
	() => [props.fragmentString, props.uniforms] as const,
	([frag, uniforms]) => {
		draw(frag, uniforms)
	},
	{immediate: true, flush: 'post'}
)
</script>

<template>
	<img ref="$img" class="GlslCanvas" />
</template>

<style lang="stylus" scoped>

.GlslCanvas
	pointer-events none
</style>
