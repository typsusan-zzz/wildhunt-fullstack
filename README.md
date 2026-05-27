# WildHunt 荒野追猎

多人狼鹿追猎游戏。玩家可以匹配为狼追踪真人鹿，也可以匹配为鹿混入鹿群、进食、环顾和使用烟雾分身逃脱。

## 在线体验

- 前端：<https://wildhunt-backend-production.up.railway.app>
- Cloudflare Pages 镜像：<https://wildhunt-fullstack.pages.dev>
- 后端健康检查：<https://wildhunt-backend-production.up.railway.app/api/health>
- API 文档：<https://wildhunt-backend-production.up.railway.app/swagger-ui.html>

## 预览

![登录页](docs/images/wildhunt-login.png)

![大厅](docs/images/wildhunt-lobby.png)

![游戏实机](docs/images/wildhunt-game.png)

## 技术栈

- 前端：Vite、TypeScript、Three.js、Cloudflare Pages
- 后端：Java 17、Spring Boot 3、WebSocket、MyBatis-Plus、Flyway、Railway
- 数据库：MySQL

## 仓库结构

```text
frontend/  Vite + TypeScript 游戏客户端
backend/   Spring Boot Maven 多模块后端
docs/      README 截图和项目说明资源
```

## 本地运行

前端：

```powershell
cd frontend
npm install
$env:VITE_API_BASE_URL = "http://localhost:8080"
$env:VITE_WS_BASE_URL = "ws://localhost:8080"
npm run dev
```

后端：

```powershell
cd backend
$env:JAVA_HOME = "<path-to-jdk-17>"
$env:MYSQL_URL = "jdbc:mysql://localhost:3306/wildhunt?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&useSSL=false&allowPublicKeyRetrieval=true"
$env:MYSQL_USERNAME = "root"
$env:MYSQL_PASSWORD = "<local-mysql-password>"
$env:WILDHUNT_JWT_SECRET = "replace-with-a-local-secret"
mvn test
mvn package
```

## 生产环境变量

前端构建时需要：

```env
VITE_API_BASE_URL=https://wildhunt-backend-production.up.railway.app
VITE_WS_BASE_URL=wss://wildhunt-backend-production.up.railway.app
```

后端部署时需要：

```env
MYSQL_URL=jdbc:mysql://<host>:<port>/<database>?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&useSSL=false&allowPublicKeyRetrieval=true
MYSQL_USERNAME=<mysql-user>
MYSQL_PASSWORD=<mysql-password>
SPRING_FLYWAY_ENABLED=true
SPRING_PROFILES_ACTIVE=prod
WILDHUNT_JWT_SECRET=<long-random-secret>
PORT=<provided-by-platform>
```

## 部署

后端部署在 Railway，服务名为 `wildhunt-backend`，MySQL 使用 Railway 托管服务。仓库中的 [backend/Dockerfile](backend/Dockerfile) 会打包 Maven 多模块项目并运行 `wildhunt-web`。

生产后端同时托管 `frontend/dist` 静态产物，所以 `https://wildhunt-backend-production.up.railway.app` 可以直接打开游戏，并与 API/WebSocket 共用同一个域名。

前端也部署了 Cloudflare Pages 镜像；如果 `pages.dev` 在当前网络不可达，请使用 Railway 后端根地址。

Cloudflare Pages 重新部署时先使用生产环境变量构建，再上传 `frontend/dist`：

```powershell
cd frontend
$env:VITE_API_BASE_URL = "https://wildhunt-backend-production.up.railway.app"
$env:VITE_WS_BASE_URL = "wss://wildhunt-backend-production.up.railway.app"
npm run build
npx wrangler pages deploy dist --project-name wildhunt-fullstack --branch main
```

Railway 独立前端也可以使用 [frontend/Dockerfile](frontend/Dockerfile) 以 Nginx 静态服务运行。

## 安全说明

- 不要把 Cloudflare、Railway、GitHub token 写入源码或 README。
- 不要提交 `.env`、数据库密码、JWT 密钥或任何生产凭据。
- 生产密钥只应配置在 Railway / Cloudflare 的环境变量或 Secrets 中。
- 当前 `.gitignore` 已排除 `.env`、`.env.*`、构建产物、日志和本地配置文件。

## 验证命令

```powershell
cd backend
mvn test package

cd ../frontend
npm run build
```
