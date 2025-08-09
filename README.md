# 图片压缩工具 🖼️

一个现代化的在线图片压缩优化工具，支持多种格式和专业的压缩选项。

## ✨ 功能特性

### 🎯 支持格式
- **PNG** - 无损压缩，保持透明度
- **JPEG** - 高质量有损压缩
- **WebP** - 现代格式，优秀压缩比
- **GIF** - 专业动画压缩，基于 Gifsicle 引擎

### 🔧 GIF 专业压缩功能
基于工业级标准 [Gifsicle](https://www.lcdf.org/gifsicle/) 引擎：

- **优化级别控制** (1-3级)
- **有损压缩** (0-100级别)
- **精确颜色控制** (2-256色)
- **三种颜色算法** (Diversity/Blend-Diversity/Median-Cut)
- **动画控制** (帧延迟、循环次数)
- **元数据处理** (移除注释、扩展数据)
- **高级选项** (交错模式、背景优化、抖动控制)

### 🚀 技术亮点
- **纯前端处理** - 无文件上传，保护隐私
- **实时预览** - 即时查看压缩效果
- **智能参数** - 基于官方文档的专业配置
- **响应式设计** - 支持桌面和移动设备

## 🛠️ 技术栈

- **Vue 3** - 现代前端框架
- **TypeScript** - 类型安全
- **Vite** - 快速构建工具
- **Ant Design Vue** - UI 组件库
- **UnoCSS** - 原子化 CSS
- **Gifsicle WASM** - 专业 GIF 压缩引擎

## 🚀 快速开始

### 本地开发

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd tool-web
   ```

2. **安装依赖**
   ```bash
   pnpm install
   ```

3. **启动开发服务器**
   ```bash
   pnpm dev
   ```

4. **打开浏览器**
   ```
   http://localhost:5173
   ```

### 构建生产版本

```bash
# 构建
pnpm build

# 预览构建结果
pnpm preview
```

## 🐳 Docker 部署

### 使用 Docker Compose（推荐）

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

服务将在 `http://localhost:8080` 启动。

### 手动 Docker 部署

```bash
# 构建镜像
docker build -t tool-web .

# 运行容器
docker run -d -p 8080:80 --name tool-web tool-web
```

## ☁️ Vercel 部署

### 一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=<your-repo-url>)

### 手动部署

1. **Fork 项目到你的 GitHub**

2. **连接 Vercel**
   - 在 [Vercel](https://vercel.com) 导入项目
   - 选择 Fork 的仓库
   - 保持默认配置（已包含 `vercel.json`）

3. **自动部署**
   - 每次 push 到 main 分支自动部署
   - 支持预览部署（PR）

## 📁 项目结构

```
tool-web/
├── src/
│   ├── components/          # 可复用组件
│   │   └── NavBar.vue      # 导航栏
│   ├── pages/              # 页面组件
│   │   ├── Compress.vue    # 压缩页面（主要功能）
│   │   ├── Convert.vue     # 格式转换页面
│   │   ├── Edit.vue        # 编辑页面
│   │   └── Home.vue        # 首页
│   ├── style/              # 样式文件
│   │   └── index.css       # 全局样式
│   ├── App.vue             # 根组件
│   ├── main.ts             # 入口文件
│   └── router.ts           # 路由配置
├── public/                 # 静态资源
├── docker-compose.yml      # Docker Compose 配置
├── Dockerfile              # Docker 构建文件
├── nginx.conf              # Nginx 配置
├── vercel.json             # Vercel 部署配置
└── package.json            # 项目配置
```

## ⚙️ 配置说明

### 环境变量

复制 `.env.example` 为 `.env` 并根据需要修改：

```bash
cp .env.example .env
```

### Nginx 配置

生产环境使用 Nginx 提供以下优化：
- Gzip 压缩
- 静态资源缓存
- SPA 路由支持
- 安全头设置

### Vercel 配置

`vercel.json` 提供：
- SPA 路由重写
- 静态资源缓存策略
- 安全头配置

## 🔧 开发指南

### 添加新功能

1. **创建新页面**
   ```bash
   # 在 src/pages/ 创建新的 Vue 组件
   touch src/pages/NewFeature.vue
   ```

2. **添加路由**
   ```typescript
   // src/router.ts
   {
     path: '/new-feature',
     component: () => import('./pages/NewFeature.vue')
   }
   ```

3. **更新导航**
   ```vue
   <!-- src/components/NavBar.vue -->
   <router-link to="/new-feature">新功能</router-link>
   ```

### 代码规范

- 使用 TypeScript 编写
- 遵循 Vue 3 Composition API
- 使用 UnoCSS 进行样式开发
- 组件命名使用 PascalCase

## 📝 API 文档

### 压缩参数说明

#### GIF 压缩参数

基于 [Gifsicle 官方文档](https://www.lcdf.org/gifsicle/man.html)：

| 参数 | 类型 | 范围 | 说明 |
|------|------|------|------|
| `optimize` | number | 1-3 | 优化级别：1=基础，2=标准，3=最佳 |
| `lossy` | number | 0-100 | 有损压缩级别，0=关闭 |
| `colors` | number | 2-256 | 颜色数量限制 |
| `color-method` | string | diversity/blend-diversity/median-cut | 颜色选择算法 |
| `delay` | number | 0-6553 | 帧延迟（1/100秒） |
| `loopcount` | number | -1/0/1+ | 循环次数：-1=不修改，0=无限 |

## 🤝 贡献指南

1. **Fork 项目**
2. **创建特性分支** (`git checkout -b feature/AmazingFeature`)
3. **提交更改** (`git commit -m 'Add some AmazingFeature'`)
4. **推送分支** (`git push origin feature/AmazingFeature`)
5. **创建 Pull Request**

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Gifsicle](https://www.lcdf.org/gifsicle/) - 专业的 GIF 优化工具
- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Ant Design Vue](https://antdv.com/) - 企业级 UI 组件库
- [UnoCSS](https://unocss.dev/) - 即时原子化 CSS 引擎

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 创建 [Issue](../../issues)
- 发起 [Discussion](../../discussions)

---

**⭐ 如果这个项目对你有帮助，请给它一个星标！**