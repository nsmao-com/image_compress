# 部署指南 🚀

本文档详细介绍了如何在不同环境下部署图片压缩工具。

## 📋 部署前准备

确保已安装以下工具：
- Node.js 18+ 
- pnpm (推荐) 或 npm
- Docker (Docker 部署)
- Git

## 🐳 Docker 部署

### 方式一：Docker Compose（推荐）

```bash
# 1. 克隆项目
git clone <repository-url>
cd tool-web

# 2. 使用 Docker Compose 部署
docker-compose up -d

# 3. 查看运行状态
docker-compose ps

# 4. 查看日志
docker-compose logs -f

# 5. 停止服务
docker-compose down
```

访问地址：`http://localhost:8080`

### 方式二：手动 Docker

```bash
# 1. 构建镜像
docker build -t tool-web .

# 2. 运行容器
docker run -d \
  --name tool-web \
  -p 8080:80 \
  --restart unless-stopped \
  tool-web

# 3. 查看容器状态
docker ps

# 4. 查看日志
docker logs -f tool-web

# 5. 停止容器
docker stop tool-web
docker rm tool-web
```

### Docker 配置说明

#### Dockerfile 特性
- **多阶段构建**：减小镜像体积
- **Alpine Linux**：轻量级基础镜像
- **Nginx**：高性能 Web 服务器
- **生产优化**：Gzip 压缩、缓存策略

#### 自定义配置

修改 `nginx.conf` 来自定义 Nginx 配置：

```nginx
# 自定义缓存策略
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# 自定义安全头
add_header Content-Security-Policy "default-src 'self'" always;
```

## ☁️ Vercel 部署

### 一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=<your-repo-url>)

### 手动部署

1. **准备仓库**
   ```bash
   # Fork 项目到你的 GitHub 账户
   # 或者推送到你的仓库
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Vercel 配置**
   - 访问 [vercel.com](https://vercel.com)
   - 点击 "New Project"
   - 选择你的 GitHub 仓库
   - 保持默认设置（已包含 `vercel.json`）
   - 点击 "Deploy"

3. **自定义域名**（可选）
   ```bash
   # 在 Vercel 面板中添加自定义域名
   # 配置 DNS 记录
   ```

### Vercel 配置详解

`vercel.json` 配置说明：

```json
{
  "buildCommand": "pnpm build",      // 构建命令
  "outputDirectory": "dist",         // 输出目录
  "installCommand": "pnpm install",  // 安装命令
  "framework": "vite",               // 框架检测
  "rewrites": [...],                 // SPA 路由重写
  "headers": [...]                   // 安全头和缓存策略
}
```

## 🌐 传统 Web 服务器部署

### Nginx 部署

1. **构建项目**
   ```bash
   pnpm install
   pnpm build
   ```

2. **配置 Nginx**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       root /path/to/tool-web/dist;
       index index.html;
       
       # SPA 路由支持
       location / {
           try_files $uri $uri/ /index.html;
       }
       
       # 静态资源缓存
       location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }
   }
   ```

3. **重启 Nginx**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

### Apache 部署

1. **构建并复制文件**
   ```bash
   pnpm build
   cp -r dist/* /var/www/html/
   ```

2. **配置 `.htaccess`**
   ```apache
   RewriteEngine On
   RewriteRule ^index\.html$ - [L]
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule . /index.html [L]
   
   # 缓存静态资源
   <FilesMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2)$">
       ExpiresActive On
       ExpiresDefault "access plus 1 year"
   </FilesMatch>
   ```

## 🔧 环境配置

### 环境变量

创建 `.env` 文件：

```bash
# 应用配置
VITE_APP_TITLE=图片压缩工具
VITE_APP_DESCRIPTION=专业的在线图片压缩优化工具

# 功能开关
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=false
```

### 生产环境优化

1. **启用 HTTPS**
   ```bash
   # 使用 Let's Encrypt
   certbot --nginx -d your-domain.com
   ```

2. **配置 CDN**
   - 将静态资源上传到 CDN
   - 修改构建配置指向 CDN

3. **监控和日志**
   ```bash
   # Docker 日志
   docker logs -f tool-web
   
   # Nginx 访问日志
   tail -f /var/log/nginx/access.log
   ```

## 🚀 CI/CD 自动部署

### GitHub Actions + Vercel

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install pnpm
        run: npm install -g pnpm
        
      - name: Install dependencies
        run: pnpm install
        
      - name: Build
        run: pnpm build
        
      - name: Deploy to Vercel
        uses: vercel/action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

### GitHub Actions + Docker

```yaml
name: Build and Deploy Docker

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: docker build -t tool-web .
        
      - name: Deploy to server
        run: |
          # 部署到你的服务器
          # 可以使用 Docker Registry 或直接 SSH
```

## 🔍 故障排除

### 常见问题

1. **构建失败**
   ```bash
   # 清理缓存
   rm -rf node_modules
   rm pnpm-lock.yaml
   pnpm install
   ```

2. **Docker 容器无法启动**
   ```bash
   # 查看详细日志
   docker logs tool-web
   
   # 检查端口占用
   netstat -tulpn | grep :8080
   ```

3. **Vercel 部署失败**
   - 检查 `vercel.json` 配置
   - 确认依赖版本兼容性
   - 查看 Vercel 构建日志

4. **路由 404 错误**
   - 确认 SPA 路由配置
   - 检查 `try_files` 规则
   - 验证 `rewrites` 配置

### 性能优化

1. **启用 Gzip 压缩**
2. **配置静态资源缓存**
3. **使用 CDN 加速**
4. **优化图片资源**
5. **启用 HTTP/2**

### 安全配置

1. **配置安全头**
2. **启用 HTTPS**
3. **定期更新依赖**
4. **配置防火墙规则**

## 📞 支持

如果在部署过程中遇到问题：

1. 查看项目 [Issues](../../issues)
2. 阅读相关文档
3. 提交新的 Issue 描述问题

---

**✅ 部署完成后，记得测试所有功能是否正常工作！**
