<template lang='pug'>
dl.SchemeViewer
	div
		dt.border(style='background: rgb(var(--base00))') 00
		dd BG
	div
		dt(style='background: rgb(var(--base01))') 01
		dd Input BG
	div
		dt(style='background: rgb(var(--base02))') 02
		dd Selection
	div
		dt(style='background: rgb(var(--base03))') 03
		dd Comments, Line Highlighting
	div
		dt.invert(style='background: rgb(var(--base04))') 04
		dd Text, Label
	div
		dt.invert(style='background: rgb(var(--base05))') 05
		dd FG, Caret, Delimiters, Operators
	div
		dt.invert(style='background: rgb(var(--base06))') 06
		dd Input Value
	div
		dt.invert(
			:class='{accent: baseAccentName === "07"}',
			style='background: rgb(var(--base07))'
		).
			07
		dd Light BG
	div
		dt.invert(
			style='background: rgb(var(--base08))',
			:class='{accent: baseAccentName === "08"}'
		).
			08

		dd Variables, Deleted
	div
		dt.invert(
			style='background: rgb(var(--base09))',
			:class='{accent: baseAccentName === "09"}'
		).
			09

		dd Integers, Boolean, Constants
	div
		dt.invert(
			style='background: rgb(var(--base0A))',
			:class='{accent: baseAccentName === "0A"}'
		).
			0A

		dd Classes, Markup Bold, Search Text Background
	div
		dt.invert(
			style='background: rgb(var(--base0B))',
			:class='{accent: baseAccentName === "0B"}'
		).
			0B

		dd Strings, Inserted
	div
		dt.invert(
			style='background: rgb(var(--base0C))',
			:class='{accent: baseAccentName === "0C"}'
		).
			0C

		dd Support, Regular Expressions, Escape Characters
	div
		dt.invert(
			style='background: rgb(var(--base0D))',
			:class='{accent: baseAccentName === "0D"}'
		).
			0D

		dd Functions, Headings
	div
		dt.invert(
			style='background: rgb(var(--base0E))',
			:class='{accent: baseAccentName === "0E"}'
		).
			0E

		dd Keywords, Changed
	div
		dt.invert(
			style='background: rgb(var(--base0F))',
			:class='{accent: baseAccentName === "0F"}'
		).
			0F
		dd Deprecated
</template>

<script lang="ts">
import {defineComponent} from 'vue'

export default defineComponent({
	props: {
		baseAccentName: {
			type: String,
			required: true,
		},
	},
})
</script>

<style lang="stylus">
@import '@/common.styl'

.SchemeViewer
	position relative
	display grid
	grid-template-columns 100%
	grid-template-rows repeat(16, 3em)
	grid-auto-flow column
	gap 0.3em

	div
		display grid
		grid-template-columns 3em 1fr

	dt
		border-radius var(--input-border-radius)
		text-align center
		font-size 1.4em
		line-height: (3em / @font-size)
		font-heading()

		&.border
			border 1px solid base16('05', 0.2)

		&.invert
			color base16('00')

		&.accent
			box-shadow inset 0 0 0 1px base16('04'), 0 0 0 1px base16('04'), inset 0 0 0 2px base16('00')

	dd
		padding-left 1em
</style>
