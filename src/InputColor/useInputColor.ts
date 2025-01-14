import {type InjectionKey, provide, type Ref, ref} from 'vue'

import {type ColorSpace} from './types'

export const InputColorPresetsKey: InjectionKey<string[]> = Symbol(
	'InputColorPresetsKey'
)

export const InputColorSpaceKey: InjectionKey<Ref<ColorSpace>> =
	Symbol('InputColorSpaceKey')

export function useInputColor() {
	provide(InputColorPresetsKey, ['skyblue', 'tomato', 'gold', 'limegreen'])

	const colorSpace = ref<ColorSpace>('hsv')

	provide(InputColorSpaceKey, colorSpace)
}
