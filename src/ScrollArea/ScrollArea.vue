<template>
	<div class="TqScrollArea">
		<slot />
	</div>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

// Scrolls, with what goes out of it fading rather than being cut off.
.TqScrollArea
	min-height 0
	overflow-y auto
	scroll-fade-mask()
</style>
