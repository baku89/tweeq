<div align="center">

<img src="./docs/.vuepress/public/logo.svg" width="200" />
<h1>Tweeq</h1>

<a href="https://baku89.github.io/tweeq/">Documentation</a> ⌇ <a href="https://github.com/sponsors/baku89">Become a Sponsor</a>

</div>

Tweeq is a collection of [Vue.js](https://vuejs.org) components for design tools. The components range from fundamental UIs such as numeric sliders, color pickers, to advanced and niche controls like a cubic-bezier editor. It supports various micro-interactions suitable for creative professionals.

It has been continuously developed by the visual artist [Baku Hashimoto](https://baku89.com).

## Project Setup

```
yarn
yarn dev
yarn build
```

## Project Background

Tweeq has been developed in parallel with Baku's animation projects, as part of the design tools used in those projects ([Koma](https://github.com/baku89/koma) and [Unim](https://github.com/baku89/unim)). Many of its components follow the following design principles:

- support diverse input modalities to match users' nuanced control strategies,
- prioritize high-speed and accurate interaction for skilled users, and
- minimize visual footprint to preserve the creative workspace.

The design principles were derived from a study that sampled parameter-tuning GUI widgets from popular production software and analyzed their interaction design.

Research-wise, the project has been carried out by Baku, partly in his capacity of a collaborative researcher at AIST, in collaboration with [Jun Kato](https://junkato.jp), a senior researcher at AIST. For more details, please refer to [the project page](https://junkato.jp/tweeq) and the following open-access paper (to appear):

> Baku Hashimoto and Jun Kato. 2025. Tweeq: Parameter-Tuning GUI Widgets by/for Creative Professionals. In <i>The 38th Annual ACM Symposium on User Interface Software and Technology (UIST '25), September 28–October 01, 2025, Busan, Republic of Korea</i>. ACM, New York, NY, USA, 16 pages. https://doi.org/10.1145/3746059.3747723

```
@inproceedings{uist2025-tweeq,
  title = {Tweeq: Parameter-Tuning GUI Widgets by/for Creative Professionals},
  author = {Hashimoto, Baku and Kato, Jun},
  year = {2025},
  booktitle = {Proceedings of the 38th Annual ACM Symposium on User Interface Software and Technology},
  location = {Busan, Republic of Korea},
  publisher = {Association for Computing Machinery},
  address = {New York, NY, USA},
  series = {UIST '25},
  doi = {10.1145/3746059.3747723},
  isbn = {9798400720376},
  url = {https://doi.org/10.1145/3746059.3747723},
  numpages = {16},
  keywords = {creativity support, user interface, creative software, numeric slider, color picker}
}
```