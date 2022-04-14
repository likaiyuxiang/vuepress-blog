module.exports = {
    title: '雨巷',
    description: '如逆旅，似行人',
    dest: './dist',
    port: '7777',
	palette:'./styles/palette.styl', //palette.style就是styles里边的文件，此文件就是写的自定义主题样式
    head: [
        ['link', {rel: 'icon', href: '/image/logo.jpg'}]
    ],
    markdown: {
        lineNumbers: true
    },
    themeConfig: {
        nav: require("./nav.js"),
        sidebar: require("./sidebar.js"),
        sidebarDepth: 10,
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