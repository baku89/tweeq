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
		<template v-for="(ic, index) in icon">
			<span v-if="typeof ic === 'string'" :key="index + 'text'">{{ ic }}</span>
			<Icon
				v-else-if="ic.type === 'iconify'"
				:key="index + '_iconify'"
				:icon="ic.icon"
			/>
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
