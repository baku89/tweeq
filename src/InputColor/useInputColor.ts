import {type InjectionKey, provide, type Ref, ref} from 'vue'

import {PALETTE} from '../theme/palette'
import {type ColorSpace} from './types'

export const InputColorPresetsKey: InjectionKey<string[]> = Symbol(
	'InputColorPresetsKey'
)

export const InputColorSpaceKey: InjectionKey<Ref<ColorSpace>> =
	Symbol('InputColorSpaceKey')

/** App-wide InputColor presets, propagated to every picker via provide/inject. */
export const DefaultColorPresets: string[] = Object.values(PALETTE)

/**
 * Provide app-wide InputColor state (presets + color space). Call once at the
 * app root (initTweeq does this). `presets` defaults to the theme palette; every
 * InputColor merges these with its own `presets` prop.
 */
export function useInputColor(presets: string[] = DefaultColorPresets) {
	provide(InputColorPresetsKey, presets)

	const colorSpace = ref<ColorSpace>('hsv')

	provide(InputColorSpaceKey, colorSpace)
}
