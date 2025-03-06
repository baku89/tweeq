export interface PaneSplitProps {
	name: string
	direction: 'horizontal' | 'vertical'
	size?: number
	scroll?: [boolean, boolean]
}
