<script setup lang="ts">
import * as Tq from 'tweeq'
import {computed, ref, watch} from 'vue'

import {
	buildSemanticColors,
	type ColorMode,
	generateThemeColorsRadix,
	nudgePalette,
	paletteScales as buildPaletteScales,
} from '../../src/theme'

// Local, self-contained theme inputs — this demo computes scales directly and
// never touches the global theme store, so playing here doesn't reskin the docs.
const appearance = ref<ColorMode>('light')
const accent = ref('#3e63dd')
const gray = ref('#8b8d98')
const background = ref('#ffffff')

// Mirror the app: snap the background to the appearance default on toggle.
watch(appearance, mode => {
	background.value = mode === 'light' ? '#ffffff' : '#111111'
})

const radix = computed(() =>
	generateThemeColorsRadix({
		appearance: appearance.value,
		background: background.value,
		accent: accent.value,
		gray: gray.value,
	})
)

const semantics = computed(() =>
	buildSemanticColors({
		appearance: appearance.value,
		background: background.value,
		accent: accent.value,
	})
)

// The themed palette: each hue nudged toward the accent, then fit to a 12-step
// scale. Semantic colors are extracted from this same source.
const paletteScales = computed(() => {
	const scales = buildPaletteScales(
		nudgePalette(accent.value),
		appearance.value,
		background.value
	)
	return Object.entries(scales).map(([name, scale]) => ({
		name,
		scale: scale.scale,
	}))
})

const semanticRows = computed(() => {
	const s = semantics.value
	return [
		{name: 'error', text: s.colorError, soft: s.colorErrorSoft},
		{name: 'warning', text: s.colorWarning, soft: s.colorWarningSoft},
		{name: 'success', text: s.colorSuccess, soft: s.colorSuccessSoft},
		{name: 'info', text: s.colorInfo, soft: null},
		{name: 'rec (solid)', text: s.colorRec, soft: null},
	]
})
</script>

<template>
	<!--
		Inline Tweeq usage: wrap the subtree in Tq.Viewport (it runs initTweeq and
		scopes the CSS reset + theme variables), rather than theming the whole app.
	-->
	<Tq.Viewport class="ColorPaletteDemo">
		<div class="controls">
			<label>
				<span>Appearance</span>
				<Tq.InputRadio v-model="appearance" :options="['light', 'dark']" />
			</label>
			<label>
				<span>Accent</span>
				<Tq.InputColor v-model="accent" />
			</label>
			<label>
				<span>Gray</span>
				<Tq.InputColor v-model="gray" />
			</label>
			<label>
				<span>Background</span>
				<Tq.InputColor v-model="background" />
			</label>
		</div>

		<!-- Swatches sit on the chosen background, which may differ from the docs theme. -->
		<div
			class="preview"
			:style="{background: radix.background, color: radix.grayScale[11]}"
		>
			<h3>Accent &amp; Gray scales</h3>
			<div class="scale">
				<div
					v-for="(c, i) in radix.accentScale"
					:key="'a' + i"
					class="swatch"
					:style="{background: c}"
				>
					<span>{{ i + 1 }}</span>
				</div>
			</div>
			<div class="scale">
				<div
					v-for="(c, i) in radix.grayScale"
					:key="'g' + i"
					class="swatch"
					:style="{background: c}"
				>
					<span>{{ i + 1 }}</span>
				</div>
			</div>

			<h3>Semantic colors <small>(palette hue, nudged toward accent)</small></h3>
			<div class="semantics">
				<div
					v-for="row in semanticRows"
					:key="row.name"
					class="semantic"
					:style="{
						background: row.soft ?? 'transparent',
						borderColor: row.text,
					}"
				>
					<span class="sample" :style="{color: row.text}">Aa</span>
					<span class="name">{{ row.name }}</span>
				</div>
			</div>

			<h3>
				Palette
				<small>(themed hues — semantic &amp; editor syntax draw from these)</small>
			</h3>
			<div class="palette-row">
				<div v-for="hue in paletteScales" :key="hue.name" class="palette-chip">
					<span class="chip-swatch" :style="{background: hue.scale[8]}" />
					<span class="chip-label">{{ hue.name }}</span>
				</div>
			</div>
		</div>
	</Tq.Viewport>
</template>

<style scoped lang="stylus">
.ColorPaletteDemo
	border-radius var(--tq-radius-pane)
	padding 1.5rem
	display flex
	flex-direction column
	gap 0.5rem

.preview
	border-radius var(--tq-radius-input)
	padding 1.25rem
	display flex
	flex-direction column
	gap 0.5rem

.controls
	display flex
	flex-wrap wrap
	gap 1rem
	margin-bottom 1rem

	label
		display flex
		flex-direction column
		gap 0.3rem
		font-size 0.8rem

	// Keep the three color pickers a uniform width (their hex labels otherwise
	// size them differently).
	:deep(.TqInputColor)
		width 9rem

h3
	margin 0.75rem 0 0.25rem
	font-size 0.95rem

	small
		font-weight normal
		opacity 0.6

.scale
	display grid
	grid-template-columns repeat(12, 1fr)
	gap 2px

.swatch
	aspect-ratio 1 / 1.4
	border-radius 3px
	display flex
	align-items flex-end
	justify-content center
	min-width 0

	span
		font-size 9px
		opacity 0.5
		mix-blend-mode difference
		color #fff
		padding-bottom 2px

.semantics
	display flex
	flex-wrap wrap
	gap 0.5rem

.semantic
	display flex
	align-items center
	gap 0.5rem
	padding 0.4rem 0.7rem
	border 2px solid
	border-radius var(--tq-radius-input)

	.sample
		font-weight bold
		font-size 1.1rem

	.name
		font-size 0.85rem

.palette-row
	display flex
	flex-wrap wrap
	gap 0.75rem

.palette-chip
	display flex
	flex-direction column
	align-items center
	gap 0.3rem
	font-size 0.8rem

	.chip-swatch
		width 2.5rem
		height 2.5rem
		border-radius var(--tq-radius-input)
</style>
