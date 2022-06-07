<template lang='pug'>
.GlispUI(:style='style')
	slot
</template>

<script lang="ts">
import {computed, defineComponent} from 'vue'
import {mapKeys} from 'lodash'
import {useLocalStorage} from '@vueuse/core'

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
				base00: '#f8f8f8',
				base01: '#e8e8e8',
				base02: '#d8d8d8',
				base03: '#b8b8b8',
				base04: '#585858',
				base05: '#383838',
				base06: '#282828',
				base07: '#181818',
				base08: '#ab4642',
				base09: '#dc9656',
				base0A: '#f7ca88',
				base0B: '#a1b56c',
				base0C: '#86c1b9',
				base0D: '#7cafc2',
				base0E: '#ba8baf',
				base0F: '#a16946',
			},
		} as Theme)

		const style = computed(() => {
			return mapKeys(theme.value.colors, (_, key) => `--${key}`)
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
	background var(--base00)
	font-ui()
	overscroll-behavior none
	--input-border-radius 2px
	--input-height 1.8em
	--input-horiz-margin 0.6em
	--popup-border-radius 4px
</style>