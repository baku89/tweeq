import {addIcon, getIcon, iconLoaded, loadIcon} from '@iconify/vue'

// @iconify/vue v4 dropped its built-in browser cache (enableCache/disableCache
// are no-op stubs), so every reload re-fetches icons from the API and the first
// <Icon> paint is blank until it resolves. We keep a small localStorage cache of
// the icon data ourselves and register it synchronously at import time, so cached
// icons are already in memory before the first render — no flash.

type IconData = NonNullable<ReturnType<typeof getIcon>>

const KEY = 'tq-icon-cache'

function readCache(): Record<string, IconData> {
	try {
		if (typeof localStorage === 'undefined') return {}
		return JSON.parse(localStorage.getItem(KEY) || '{}')
	} catch {
		return {}
	}
}

const cache: Record<string, IconData> = readCache()

// Hydrate synchronously: register every remembered icon so the first render finds
// it in iconify's in-memory store and paints immediately.
for (const [name, data] of Object.entries(cache)) {
	addIcon(name, data)
}

let writeTimer: ReturnType<typeof setTimeout> | undefined
function persist() {
	clearTimeout(writeTimer)
	writeTimer = setTimeout(() => {
		try {
			localStorage.setItem(KEY, JSON.stringify(cache))
		} catch {
			// Best-effort: ignore quota / unavailable storage.
		}
	}, 500)
}

function store(name: string) {
	if (cache[name]) return
	const data = getIcon(name)
	if (!data) return
	cache[name] = data
	persist()
}

/**
 * Make sure `name` is loaded and remembered for the next session. Cheap to call
 * on every render: a no-op once the icon is cached.
 */
export function rememberIcon(name: string) {
	if (cache[name]) return
	if (iconLoaded(name)) {
		store(name)
		return
	}
	loadIcon(name)
		.then(() => store(name))
		.catch(() => {
			// Unknown icon name or offline first-load — nothing to remember.
		})
}
