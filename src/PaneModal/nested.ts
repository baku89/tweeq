// Whether a popover opened from inside the modal — a dropdown, menu or colour
// picker anchored to one of the modal's own controls — is showing on top of it.
// Those own Esc / Enter before the modal does. Popovers that may be open at any
// time regardless of the modal (the shoot-alert balloon, title-bar popups, the
// tooltip, the multi-select popup, the tweak overlay) don't count: counting
// every `:popover-open` made Esc / Enter dead in the modal whenever an alert
// balloon was showing. `Popover` stamps `data-tq-nested` on itself when its
// reference element sits inside a `.TqPaneModal` (and it isn't `passive`).
export function hasNestedPopover() {
	return !!document.querySelector(':popover-open[data-tq-nested]')
}
