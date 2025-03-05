<script lang="ts" setup></script>

<template>
	<div class="TqViewport">
		<slot />
	</div>
</template>

<style lang="stylus" scoped>
@layer tweeq
	.TqViewport
		line-height 1
		margin 0
		padding 0
		border 0
		vertical-align baseline
		font inherit
		font-size var(--tq-rem)
		user-select none

		*, *:before, *:after
			content unset
			margin 0
			padding 0
			border 0
			vertical-align baseline
			font inherit
			font-size inherit
			box-sizing border-box
			font-weight inherit
			font-style normal
			list-style none
			outline none
			cursor inherit
			background transparent

		::selection
			background var(--tq-color-accent)
			color var(--tq-color-on-accent)

		::-webkit-scrollbar
			width var(--tq-scrollbar-width)
			height var(--tq-scrollbar-width)
			background transparent

		::-webkit-scrollbar-thumb
				border-radius 9999px
				background 'color-mix(in srgb, var(--tq-color-on-background) 20%, transparent)' % ''
</style>
