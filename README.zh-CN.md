<p align="center">
  <img src="public/sg-air-lockup.png" alt="SG Air 标识" width="180" />
</p>

<h1 align="center">SG Air</h1>

<p align="center">新加坡 PM2.5 空气质量，一览即知。</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-界面-61DAFB?logo=react&logoColor=20232A" alt="React" />
  <img src="https://img.shields.io/badge/Vite-开发工具-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/D3.js-区域地图-F9A03C?logo=d3.js&logoColor=white" alt="D3.js" />
  <img src="https://img.shields.io/badge/Web-PWA-2563EB" alt="网页与 PWA" />
  <a href="https://data.gov.sg/"><img src="https://img.shields.io/badge/Data.gov.sg-PM2.5-15803D" alt="新加坡 Data.gov.sg PM2.5 数据" /></a>
</p>

<p align="center"><a href="README.md">English</a></p>

SG Air 是一款响应式空气质量仪表盘，帮助用户快速查看新加坡最新的 PM2.5 数据。页面将全国平均值、五个区域的读数和区域地图整合在一起，适合在手机和桌面设备上随时查看。

界面以清晰的数值、区域状态标签和颜色编码地图呈现空气质量，并采用轻透的玻璃面板视觉风格。品牌视觉由 SG Air 定制 SVG 标识，以及适用于浏览器、PWA 和 Apple 主屏幕的配套图标组成。

## 功能亮点

- **全国与区域概览：** 同时查看全国平均值，以及北部、南部、东部、西部和中部的 PM2.5 读数。
- **可交互区域地图：** 点击区域卡片可将主读数和地图标记切换到该区域；点击主读数可返回全国视图。
- **状态一目了然：** 读数分为 Normal、Elevated、High 和 Very High 四个等级。地图颜色、状态标签和页面主题会随当前选中的读数变化。
- **响应式界面：** 页面适配窄屏和桌面显示，提供紧凑的区域卡片和独立的全国数据摘要。
- **连接状态提示：** 提供加载、同步和离线状态，说明数据正在获取或暂不可用。
- **支持安装与离线访问：** Web App Manifest 和 Service Worker 支持添加到主屏幕，并缓存应用界面资源以便再次访问。实时读数仍需要网络连接。

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

## 品牌与应用图标

SG Air 使用一组风格统一的图标，让品牌在页面顶部、浏览器标签和设备主屏幕上保持清晰易辨：

- `public/icons/air-logo.svg`：可缩放的 SVG 标识，用于页面顶部和 SVG 网站图标
- `public/icons/sg-air-icon-192.png`：192 × 192 浏览器及应用图标
- `public/icons/sg-air-icon-512.png`：512 × 512 PWA 图标，同时配置普通和自适应图标用途
- `public/icons/apple-touch-icon.png`：添加到 Apple 设备主屏幕时使用的图标
- `public/sg-air-lockup.png`：SG Air 品牌组合标识素材
- `public/icons/sg-air-icon-source.png`：应用图标源图
- `docs/sg-air-logo-options.png`：品牌标识方案参考图

## 项目结构

- `src/App.jsx`：数据请求、区域读数展示和地图交互
- `src/styles.css`：应用样式和响应式布局
- `public/manifest.webmanifest`：可安装应用的配置
- `public/sw.js`：Service Worker 和应用资源缓存
