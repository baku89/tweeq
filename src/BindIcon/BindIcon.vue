<script setup lang="ts">
import type {IconSequence} from 'bndr-js'

import {Icon} from '../Icon'

interface Props {
	icon: IconSequence
}

defineProps<Props>()
</script>

<template>
	<div class="BindIcon">
		<template v-for="(ic, index) in icon" :key="index">
			<span v-if="typeof ic === 'string'">{{ ic }}</span>
			<Icon class="icon" v-else-if="ic.type === 'iconify'" :icon="ic.icon" />
		</template>
	</div>
</template>

<style lang="stylus" scoped>

.BindIcon
	display flex
	align-items center
	gap 2px

.icon
	width 1em
	height 1em
</style>
