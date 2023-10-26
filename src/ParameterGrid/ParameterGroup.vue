<script setup lang="ts">
import {Icon} from '@iconify/vue'

import {useAppConfigStore} from '../stores/appConfig'
import ParameterHeading from './ParameterHeading.vue'

interface Props {
	name: string
	label: string
	icon?: string
}

const props = defineProps<Props>()

defineSlots<{
	default: void
	headingRight: void
}>()

const appConfig = useAppConfigStore()

const expanded = appConfig.ref(props.name, true)
</script>

<template>
	<div class="ParameterGroup">
		<ParameterHeading>
			<template #default>
				<div class="heading" @click="expanded = !expanded">
					<Icon
						class="chevron"
						:icon="expanded ? 'mdi:chevron-down' : 'mdi:chevron-right'"
					/>
					<span>{{ label }}</span>
				</div>
			</template>
			<template #right>
				<slot v-if="expanded" name="headingRight" />
			</template>
		</ParameterHeading>
		<div v-if="expanded" class="content">
			<slot />
		</div>
	</div>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

.ParameterGroup, .content
	display grid
	grid-template-columns subgrid
	grid-gap var(--tq-input-gap)
	grid-column 1 / 3

.chevron
	margin 0 0 0 -4px

.heading
	display flex
	align-items center
</style>
