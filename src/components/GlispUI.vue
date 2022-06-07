<template lang='pug'>
.GlispUI(:style='style')
	slot
</template>

<script lang="ts">
import {computed, defineComponent} from 'vue'
import {chain, fromPairs, mapKeys} from 'lodash'
import {useLocalStorage} from '@vueuse/core'
import chroma from 'chroma-js'

import {Theme} from '@/Theme'

import '@/Typekit'

/**
 * Manages UI Scheme for the whole library
 */
export default defineComponent({
	name: 'GlispUI',
	setup() {
		const theme = useLocalStorage('GlispUI', {
			name: 'Default Light',
			author: 'Chris Kempson <http://chriskempson.com>',
			colors: {
				base00: '#181818',
				base01: '#151515',
				base02: '#464646',
				base03: '#747474',
				base04: '#B9B9B9',
				base05: '#D0D0D0',
				base06: '#E8E8E8',
				base07: '#EEEEEE',
				base08: '#FD886B',
				base09: '#FC4769',
				base0A: '#FECB6E',
				base0B: '#32CCDC',
				base0C: '#ACDDFD',
				base0D: '#20BCFC',
				base0E: '#BA8CFC',
				base0F: '#B15F4A',
			},
		} as Theme)

		const style = computed(() => {
			return chain(theme.value.colors)
				.toPairs()
				.map(([k, v]) => [`--${k}`, chroma(v).rgb().join(',')])
				.fromPairs()
				.value()
		})

		return {
			style,
		}
	},
})
</script>

<style lang="stylus">
@import url('https://cdn.jsdelivr.net/npm/firacode@6.2.0/distr/fira_code.css')
@import url('https://fonts.googleapis.com/css2?family=Inter&display=swap')
@import '@/common.styl'
@import '@/root.styl'

.GlispUI
	glisp-ui-root()
	background base16('00')
	font-ui()

	::selection
		background base16('accent', 0.2)

	overscroll-behavior none
	--input-border-radius 2px
	--input-height 1.8em
	--input-horiz-margin 0.6em
	--popup-border-radius 4px
</style>