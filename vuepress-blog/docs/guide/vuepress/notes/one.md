---
title: vuepress
date: 2022-04-08
sidebar: 'auto'
categories:
 - frontEnd
tags:
 - vuepress
---

# vuepress的结构

最简化的结构

```
vuepress-blog
├─── docs
│   ├── README.md
│   └── .vuepress
│       ├── public
│       └── config.js
└── package.json

```

## 首页

首页是通过docs文件下的readme.md文件进行配置

```
home: true
heroImage: /image/logo.jpg
actionText: 快速上手 →
actionLink: /zh/guide/
features:
- title: 简洁至上
  details: 以 Markdown 为中心的项目结构，以最少的配置帮助你专注于写作。
- title: Vue驱动
  details: 享受 Vue + webpack 的开发体验，在 Markdown 中使用 Vue 组件，同时可以使用 Vue 来开发自定义主题。
- title: 高性能
  details: VuePress 为每个页面预渲染生成静态的 HTML，同时在页面被加载的时候，将作为 SPA 运行。
footer: MIT Licensed | Copyright © likaiyuxiang //角标

```



## config.js文件

```
module.exports = {
    title: '雨巷',
    description: '如逆旅，似行人',
    dest: './dist',
    port: '7777',
    head: [
        ['link', {rel: 'icon', href: '/image/logo.jpg'}]//自定义的favicon
    ],
    markdown: {
        lineNumbers: true
    },
    themeConfig: {
        nav: require("./nav.js"),  // 导航栏
        sidebar: require("./sidebar.js"), // 侧边栏
        sidebarDepth: 2, //侧边栏显示2级
        lastUpdated: 'Last Updated',
        searchMaxSuggestoins: 10,
        serviceWorker: {
            updatePopup: {
                message: "有新的内容.",
                buttonText: '更新'
            }
        },
        editLinks: true,
        editLinkText: '在 GitHub 上编辑此页 ！'
    }
}
```

网站标题、描述、主题等信息

## 导航栏设置

从上可以看到导航栏使用 **`./nav.js` **配置，其位置在/docs/.vuepress

```js
//nav.js
module.exports = [
    {
        text: '懵逼指南', link: '/guide/',
			items: [
            {text: 'git命令', link: '/guide/git/'},
            {text: 'vuepress搭建', link: '/guide/vuepress/'},
        ]
    },
    {
        text: 'java知识', link: '/java/',
		items: [
            {text: '初级开发篇', link: '/java/zero/'},
            {text: '中高进阶篇', link: '/java/high/'},
        ]
    },
    {
        text: '工具箱',
        items: [
			{
                text: '在线编辑',
				items: [
					{text: '图片压缩', link: 'https://tinypng.com/'}
				]
            },
			{
                text: '在线服务',
				items: [
					{text: '阿里云', link: 'https://www.aliyun.com/'},
					{text: '腾讯云', link: 'https://cloud.tencent.com/'}
				]
            },
			{
                text: '博客指南',
				items: [
					{text: '掘金', link: 'https://juejin.im/'},
					{text: 'CSDN', link: 'https://blog.csdn.net/'}
				]
            }
        ]
    }
]
```

此处的导航会指向指定目录文件下

以`/guide/vuepress/`为例，其结构为

```
guide
├─── notes //存放笔记的地方  由sidebar.js进行路由
│─── README.md //相当于vuepress这篇笔记的首页
│─── sidebar.js //侧边栏导航

```

`package.json`的配置

```json
{
  "name": "vuepress-blog",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "dev": "vuepress dev docs"  //这样npm run dev 就可以启动vuepress dev docs了
  },
  "keywords": [],
  "author": "",
  "license": "ISC"
}
```

