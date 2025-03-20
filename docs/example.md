<MultiSelectPopup />

# Examples

## 3-Channel DMX

<Sandbox
	:initialValue="{ch1: 0, ch2: 64, ch3: 128}"
	:scheme="{
		ch1: {label: 'Key Light', type: 'number', min: 0, max: 255, icon: 'mdi-lightbulb'},
		ch2: {label: 'Fill Light', type: 'number', min: 0, max: 255, icon: 'mdi-lightbulb'},
		ch3: {label: 'Back Light', type: 'number', min: 0, max: 255, icon: 'mdi-lightbulb'},
	}"
/>