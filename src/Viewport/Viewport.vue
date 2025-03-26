<script lang="ts" setup>
import {initTweeq} from '../useTweeq'

initTweeq('viewport')
</script>

<template>
	<div class="TqViewport">
		<slot />
	</div>
</template>

<style lang="stylus">
@import '../common.styl'

reset-viewport('.TqViewport')
</style>
