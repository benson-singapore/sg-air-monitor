# SG Air

[English](README.md)

SG Air 是一个适配手机和桌面的可安装网页应用，用于查看新加坡最新的 PM2.5 数据。页面展示全国平均值，以及北部、南部、东部、西部和中部各区域的数据。点击区域卡片可切换地图和主读数；点击主读数可返回全国平均值。

## 数据来源

数据来自[新加坡政府 Data API](https://api.data.gov.sg/v1/environment/pm25)。应用每 15 分钟自动刷新，也可以手动刷新。更新时间使用新加坡时间。如果 API 未提供全国读数，应用会根据可用的区域读数计算平均值。

## 本地运行

需要安装 Node.js 和 npm。

```sh
npm install
npm run dev
```

Vite 会在终端显示本地开发网址。

构建并预览生产版本：

```sh
npm run build
npm run preview
```

## 安装为应用

项目包含 Web App Manifest 和 Service Worker。在支持的浏览器中打开网页，然后选择浏览器提供的“安装应用”或“添加到主屏幕”。离线时可以从缓存加载此前访问过的应用文件；获取实时 PM2.5 数据仍需要网络连接。

## 项目结构

- `src/App.jsx`：数据请求、区域读数展示和地图交互
- `src/styles.css`：应用样式和响应式布局
- `public/manifest.webmanifest`：可安装应用的配置
- `public/sw.js`：Service Worker 和应用资源缓存
