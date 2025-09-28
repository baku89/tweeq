---
title: 'Tweeq: UIST 2025 Presentation'
sidebar: false
pageClass: user-study
---


<MultiSelectPopup />

<ExampleContainer
	:initialValue="{opacity: 10}"
	:presentationMode="true"
	:scheme="{
		opacity: {type: 'number', min: 0, max: 100, suffix: '%'},
	}"
/>

- - -

<ExampleContainer
	:initialValue="{color: '#ff0000'}"
	:presentationMode="true"
	:scheme="{
		color: {type: 'string', ui: 'color'},
	}"
/>

- - -

<ExampleContainer
	:initialValue="{rotation: 0}"
	:presentationMode="true"
	:scheme="{
		rotation: {type: 'number', ui: 'angle'},
	}"
/>

- - -

<ExampleContainer
	:initialValue="{position: [0, 0], time: 120, switch: true, checkbox: true}"
	:presentationMode="true"
	:scheme="{
		position: {type: 'vec2', ui: 'position', min: -100, max: 100},
		time: {type: 'number', ui: 'time'},
		switch: {type: 'boolean'},
		checkbox: {type: 'boolean', ui: 'checkbox'},
	}"
/>

- - -

<PresentationThreePointLighting />