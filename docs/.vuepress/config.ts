import {viteBundler} from '@vuepress/bundler-vite'
import {defaultTheme} from '@vuepress/theme-default'
import {fileURLToPath} from 'url'
import glsl from 'vite-plugin-glsl'
import {defineUserConfig} from 'vuepress'

export default defineUserConfig({
	title: 'Tweeq',
	base: '/tweeq/',
	head: [
		['link', {rel: 'icon', href: './logo.svg'}],
		['link', {rel: 'preconnect', href: 'https://fonts.googleapis.com'}],
		[
			'link',
			{rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: true},
		],
		['link', {rel: 'stylesheet', href: 'https://use.typekit.net/xhr6teg.css'}],
		[
			'link',
			{
				rel: 'stylesheet',
				href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200',
				crossorigin: 'anonymous',
			},
		],
		[
			'link',
			{
				rel: 'stylesheet',
				href: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200',
				crossorigin: 'anonymous',
			},
		],
	],
	theme: defaultTheme({
		navbar: [
			{
				text: 'Home',
				link: '/',
			},
			{
				text: 'Components',
				link: '/components/',
			},
			{
				text: 'Example',
				link: '/example',
			},
		],
		logo: './logo.svg',
		repo: 'baku89/tweeq',
	}),
	locales: {
		'/': {
			lang: 'English',
			title: 'Tweeq',
			description:
				'A collection of Vue.js components for designers and artists',
		},
	},
	bundler: viteBundler({
		viteOptions: {
			plugins: [glsl()],
			resolve: {
				alias: [
					{
						find: 'tweeq',
						replacement: fileURLToPath(new URL('../../src', import.meta.url)),
					},
				],
			},
		},
	}),
	markdown: {
		linkify: true,
		typographer: true,
	},
})
