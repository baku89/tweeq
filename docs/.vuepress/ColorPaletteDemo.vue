<script setup lang="ts">
import * as Tq from 'tweeq'
import {computed, ref, watch} from 'vue'

import {
	buildSemanticColors,
	type ColorMode,
	generateRadixScale,
	generateThemeColorsRadix,
	PALETTE,
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

// Each curated palette hue, fit to a 12-step scale (pure — no accent nudge).
const paletteScales = computed(() =>
	Object.entries(PALETTE).map(([name, seed]) => ({
		name,
		seed,
		scale: generateRadixScale({
			appearance: appearance.value,
			background: background.value,
			seed,
		}).scale,
	}))
)

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

const steps = Array.from({length: 12}, (_, i) => i + 1)
</script>

<template>
	<div
		class="ColorPaletteDemo"
		:style="{background: radix.background, color: radix.grayScale[11]}"
	>
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

		<h3>Accent &amp; Gray scales</h3>
		<div class="scale">
			<div
				v-for="(c, i) in radix.accentScale"
				:key="'a' + i"
				class="swatch"
				:style="{background: c}"
				:title="`accent ${i + 1}: ${c}`"
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
				:title="`gray ${i + 1}: ${c}`"
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
				<code>{{ row.text }}</code>
			</div>
		</div>

		<h3>Palette <small>(pure — used for editor syntax)</small></h3>
		<div class="palette">
			<div v-for="hue in paletteScales" :key="hue.name" class="hue">
				<div class="hue-label">
					<span class="dot" :style="{background: hue.seed}" />
					{{ hue.name }}
				</div>
				<div class="scale">
					<div
						v-for="(c, i) in hue.scale"
						:key="i"
						class="swatch"
						:style="{background: c}"
						:title="`${hue.name} ${i + 1}: ${c}`"
					>
						<span>{{ steps[i] }}</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped lang="stylus">
.ColorPaletteDemo
	border-radius var(--tq-radius-pane)
	padding 1.5rem
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

	code
		font-size 0.75rem
		opacity 0.7

.palette
	display flex
	flex-direction column
	gap 0.35rem

.hue
	display grid
	grid-template-columns 6rem 1fr
	align-items center
	gap 0.75rem

.hue-label
	display flex
	align-items center
	gap 0.4rem
	font-size 0.85rem

	.dot
		width 0.9rem
		height 0.9rem
		border-radius 50%
</style>
