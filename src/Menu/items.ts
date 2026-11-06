import type {MenuItem} from './Menu.vue'

/**
 * What a menu has in it, or how to make that once it is opened: a host can say what a row or a
 * field offers without working it out each time that is drawn.
 */
export type MenuItems = MenuItem[] | (() => MenuItem[])

/** What is in `items`, made now if it is made when asked for. */
export function menuItemsOf(items: MenuItems | undefined): MenuItem[] {
	if (items === undefined) return []
	return typeof items === 'function' ? items() : items
}
