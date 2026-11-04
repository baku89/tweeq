/** As many options as a row can show before a list is easier to look through. */
const MAX_ICONS_IN_ROW = 5
const MAX_LABELS_IN_ROW = 3
/**
 * How many characters of labels fit in a row in a narrow panel. Past this InputRadio
 * would stack its options, which takes more room than the list it was to save.
 */
const MAX_LABEL_LENGTH_IN_ROW = 18

/** Whether options are better laid out in a row than kept in a dropdown. */
export function fitsInRow(labels: readonly string[], hasIcons: boolean): boolean {
	return hasIcons
		? labels.length <= MAX_ICONS_IN_ROW
		: labels.length <= MAX_LABELS_IN_ROW &&
				labels.join('').length <= MAX_LABEL_LENGTH_IN_ROW
}
