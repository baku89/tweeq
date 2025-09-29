---
title: 'Tweeq: UIST 2025 Presentation'
sidebar: false
pageClass: presentation
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
	:initialValue="{color: '#0100DC'}"
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
		time: {type: 'number', ui: 'time', min: 0},
		switch: {type: 'boolean'},
		checkbox: {type: 'boolean', ui: 'checkbox'},
	}"
/>

- - -

<h3 style="margin-bottom: 0">Three Point Lighting</h3>

<PresentationThreePointLighting  />