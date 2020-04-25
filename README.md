
## Overview

Skischool is a front-end solution for skischools lessons booking. It is based on admin interfaces based on [vue-typescript-admin-template](http://armour.github.io/vue-typescript-admin-template), many thanks to him for the awesome open source project! :)

## Related Projects
[vue-typescript-admin-template](http://armour.github.io/vue-typescript-admin-template) \
[vue](https://github.com/vuejs/vue) \
[typescript](https://www.typescriptlang.org/)   
[element-ui](https://github.com/ElemeFE/element) \
[gantt scheduler](https://github.com/neuronetio/gantt-schedule-timeline-calendar) - [web](https://neuronetio.github.io/gantt-schedule-timeline-calendar/) (main screen calendar) \
[vue gantt scheduler](https://github.com/neuronetio/vue-gantt-schedule-timeline-calendar) (vue wrapper)


## Preparation

You need to install [node](http://nodejs.org/) and [git](https://git-scm.com/) locally. The project is based on [typescript](https://www.typescriptlang.org/), [vue](https://vuejs.org/index.html), [vuex](https://vuex.vuejs.org/), [vue-router](https://router.vuejs.org/), [vue-cli](https://github.com/vuejs/vue-cli) , [axios](https://github.com/axios/axios) and [element-ui](https://github.com/ElemeFE/element), all request data is from backend of this project, which is in my private repo (contact me if you are interested).

## Project setup

With [yarn](https://yarnpkg.com/lang/en/) or [npm](https://www.npmjs.com/get-npm)

#### Install dependencies

```bash
yarn install
```

#### Compiles and hot-reloads for development

```bash
yarn run serve
```

#### Compiles and minifies for production

```bash
yarn run build:prod
```

#### Lints and fixes files

```bash
yarn run lint
```

#### Run your unit tests

```bash
yarn run test:unit
```

#### Run your end-to-end tests

```bash
yarn run test:e2e
```

#### Generate all svg components

```bash
yarn run svg
```

#### Customize Vue configuration

See [Configuration Reference](https://cli.vuejs.org/config/).

## Browsers support

Modern browsers and Internet Explorer 10+. (Taken from [vue-typescript-admin-template](http://armour.github.io/vue-typescript-admin-template), didn't test it myself)

| [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/edge/edge_48x48.png" alt="IE / Edge" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>IE / Edge | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png" alt="Firefox" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>Firefox | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png" alt="Chrome" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>Chrome | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/safari/safari_48x48.png" alt="Safari" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>Safari |
| --------- | --------- | --------- | --------- |
| IE10, IE11, Edge| last 2 versions| last 2 versions| last 2 versions

## Known issues

- [ ] Need to change Date class to moment or similar (doesn't work in safari)
- [ ] Fix typescript issues in lessons component (doesn't effect functionality)

## Screenshots  
![Gif](https://raw.githubusercontent.com/simonharvan/skischool-frontend/master/docs/animation.gif)
![Gif 2](https://raw.githubusercontent.com/simonharvan/skischool-frontend/master/docs/animation2.gif)
![Gif 3](https://raw.githubusercontent.com/simonharvan/skischool-frontend/master/docs/animation3.gif)
![Screenshot 1](https://raw.githubusercontent.com/simonharvan/skischool-frontend/master/docs/screenshot1.png)
![Screenshot 2](https://raw.githubusercontent.com/simonharvan/skischool-frontend/master/docs/screenshot2.png)
![Screenshot 3](https://raw.githubusercontent.com/simonharvan/skischool-frontend/master/docs/screenshot3.png)

## Model 
![model](https://github.com/simonharvan/skischool-frontend/raw/master/docs/screenshot4.png)
