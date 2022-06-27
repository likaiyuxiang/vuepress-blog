---
title: vue
date: 2022-06-26
sidebar: 'auto'
categories:
 - frontEnd
tags:
 - vue
---

# vue

## 结构

### assets

静态文件，但其会被编译，最终同样会被放到pubulic目录下

### components

组件放置处

### router

路由映射文件

### views

页面文件，表示需要跳转的页面放置的位置

### 同级文件

1. app.vue:项目的主组件，所有页面都是在此组件下进行切换。
2. main.js(ts):项目主入口文件。

main.ts

```
createApp(App).use(store).use(router).use(ElementPlus).mount("#app");
```

实际上就是创建文件使用各种组件(APP.vue等)将其绑定到"#app"上，而index.html中有

index.html

```html
 <body>
    <noscript>
      <strong>We're sorry but <%= htmlWebpackPlugin.options.title %> doesn't work properly without JavaScript enabled. Please enable it to continue.</strong>
    </noscript>
    <div id="app"></div>
    <!-- built files will be auto injected -->
  </body>
```

所有结构会被放在id="app"下
