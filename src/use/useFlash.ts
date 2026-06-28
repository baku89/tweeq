import {onScopeDispose, ref} from 'vue'

/**
 * A one-shot "attention flash". Call `flash()` to hold `flashing` true for
 * `duration` ms; bind `flashing` to a class and drive a CSS animation off it.
 * Re-arming briefly drops the flag (next frame) so the animation restarts even
 * if it was still playing.
 *
 * `duration` should be ≥ the CSS animation length so the class outlives it.
 */
export function useFlash(duration = 1200) {
	const flashing = ref(false)
	let timer: ReturnType<typeof setTimeout> | undefined

	function flash() {
		flashing.value = false
		clearTimeout(timer)
		// Re-enable next frame so a re-arm restarts the keyframes from scratch.
		requestAnimationFrame(() => {
			flashing.value = true
			timer = setTimeout(() => (flashing.value = false), duration)
		})
	}

	onScopeDispose(() => clearTimeout(timer))

	return {flashing, flash}
}
