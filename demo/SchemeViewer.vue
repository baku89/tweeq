<template lang='pug'>
ul.SchemeViewer
	li
		.color.border(style='background: rgb(var(--base00))') 00
		.caption BG
	li
		.color(style='background: rgb(var(--base01))') 01
		.caption Input BG
	li
		.color(style='background: rgb(var(--base02))') 02
		.caption Selection
	li
		.color(style='background: rgb(var(--base03))') 03
		.caption Comments, Invisibles, Line Highlighting
	li
		.color.invert(style='background: rgb(var(--base04))') 04
		.caption Dark FG, Status Bar
	li
		.color.invert(style='background: rgb(var(--base05))') 05
		.caption FG, Caret, Delimiters, Operators
	li
		.color.invert(style='background: rgb(var(--base06))') 06
		.caption Light FG
	li
		.color.invert(style='background: rgb(var(--base07))').
			07
		.caption Light BG
	li
		.color.invert(style='background: rgb(var(--base08))').
			08

		.caption Variables, Deleted
	li
		.color.invert(style='background: rgb(var(--base09))').
			09

		.caption Integers, Boolean, Constants
	li
		.color.invert(style='background: rgb(var(--base0A))').
			0A

		.caption Classes, Markup Bold, Search Text Background
	li
		.color.invert(style='background: rgb(var(--base0B))').
			0B

		.caption Strings, Inserted
	li
		.color.invert(style='background: rgb(var(--base0C))').
			0C

		.caption Support, Regex, Escape Characters
	li
		.color.invert(style='background: rgb(var(--base0D))').
			0D

		.caption Functions, Headings
	li
		.color.invert(style='background: rgb(var(--base0E))').
			0E

		.caption Keywords, Changed
	li
		.color.invert(style='background: rgb(var(--base0F))').
			0F
		.caption Deprecated
</template>

<script lang="ts">
import {defineComponent} from 'vue'

export default defineComponent({
	name: 'SchemeViewer',
})
</script>

<style lang="stylus">
@import '@/common.styl'

.SchemeViewer
	position relative
	column-width 25em
	column-fill balance-all

	li
		display grid
		margin-bottom 0.3em
		break-inside avoid
		grid-template-columns 3em 1fr

	.color
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

	.caption
		padding-left 0.5em
</style>
