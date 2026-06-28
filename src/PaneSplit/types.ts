export interface PaneSplitProps {
	name: string
	direction: 'horizontal' | 'vertical'
	/**
	 * Initial size of the controlled pane. Interpreted as a percentage of the
	 * split (the default proportional mode), or as absolute pixels when `fixed`
	 * names a pane.
	 */
	size?: number
	scroll?: [boolean, boolean]
	/**
	 * Pin one pane to an absolute pixel size (stored & resizable via the
	 * divider); the other pane flex-grows to fill the rest. Omit for the default
	 * proportional (percentage) split where `first` holds the stored size.
	 */
	fixed?: 'first' | 'second'
}
