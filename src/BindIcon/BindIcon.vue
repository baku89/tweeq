<script setup lang="ts">
import {Icon} from '@iconify/vue'
import {Emitter} from 'bndr-js'

interface Props {
	icon: typeof Emitter.icon
}

defineProps<Props>()
</script>

<template>
	<div class="BindIcon">
		<template v-for="(ic, index) in icon">
			<span v-if="typeof ic === 'string'" :key="index">{{ ic }}</span>
			<Icon v-if="ic.type === 'iconify'" :key="index" :icon="ic.icon" />
		</template>
	</div>
</template>

<style lang="stylus" scoped>

.BindIcon
	display flex
	align-items center

	.iconify
		width 1em
</style>
