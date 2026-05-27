<p align="right">
  <strong>中文</strong> | <a href="./README.en.md">English</a>
</p>

# WildHunt 荒野追猎

一款基于 Web 的多人非对称追猎游戏：狼在有限时间内识别并扑杀真人鹿，鹿则混入 AI 鹿群、维持状态、观察威胁，并用一次性的烟雾分身技能制造误导。

![WildHunt key art](docs/images/wildhunt-keyart.png)

## 在线体验

- 推荐入口：<https://wildhunt-backend-production.up.railway.app>
- API 文档：<https://wildhunt-backend-production.up.railway.app/swagger-ui.html>
- 国内仓库（Gitee）：<https://gitee.com/susantyp/wildhunt-fullstack>
- 国外仓库（GitHub）：<https://github.com/typsusan-zzz/wildhunt-fullstack>

> 当前线上环境基于 Railway 免费资源部署，冷启动、数据库访问和多人对局同步可能偏慢。想要稳定体验，建议拉取仓库后按“本地开发”运行。

## 游戏截图

| 登录 | 大厅 | 对局 |
| --- | --- | --- |
| ![登录页](docs/images/wildhunt-login.png) | ![大厅](docs/images/wildhunt-lobby.png) | ![对局](docs/images/wildhunt-game.png) |

## 玩法概览

WildHunt 的核心体验是“伪装、观察、判断和反判断”。

- 狼方目标：在倒计时结束前找出所有真人鹿。狼可以移动、嗅探、扑咬，但误判 AI 鹿或分身会浪费机会。
- 鹿方目标：混入鹿群并存活到时间结束。鹿可以进食维持饥饿值、环顾观察狼的位置，并在关键时刻使用烟雾分身。
- 烟雾分身：鹿每局只能使用一次。技能由后端权威确认，释放后原地生成烟雾和两只服务器同步的鹿分身。分身不是玩家、不计入胜负，狼扑中分身只会驱散它。
- 匹配与房间：支持游客登录、账号登录、自定义房间、房间聊天、好友邀请、快速匹配和正式对局恢复。
- 成长系统：包含赛季通行证、每日签到、活动奖励、排行榜和玩家资料。

![技能与图标](docs/images/wildhunt-skill-icons.png)

![大厅图标素材](docs/images/wildhunt-lobby-icons.png)

## 技术架构

```mermaid
flowchart LR
  Browser["Browser / Three.js Client"]
  RailwayWeb["Railway Spring Boot Web"]
  GameRuntime["Authoritative Match Runtime"]
  MySQL["Railway MySQL"]

  Browser -- "Static assets / HTTPS REST" --> RailwayWeb
  Browser -- "WSS /ws/lobby /ws/room /ws/game" --> RailwayWeb
  RailwayWeb --> GameRuntime
  RailwayWeb -- "MyBatis-Plus" --> MySQL
  RailwayWeb -- "Flyway migrations" --> MySQL
```

```mermaid
sequenceDiagram
  participant C as Client
  participant W as WebSocket Handler
  participant M as GameMatchService
  participant R as RuntimeMatch

  C->>W: PLAYER_INPUT
  W->>M: applyInput(matchId, userId, input)
  M->>R: synchronized runtime.apply(...)
  R-->>M: GameRealtimeUpdate
  M-->>W: snapshot + skillConfirm
  W-->>C: authoritative state broadcast
```

## 前端架构

- Vite + TypeScript 构建浏览器客户端。
- Three.js 负责 3D 场景、鹿群、狼、地形、自然物和烟雾 VFX。
- 输入层将移动、冲刺和一次性动作拆开处理；一次性动作使用序号保证 WebSocket 至少发送一次。
- 网络层通过 REST 处理登录、房间、匹配、奖励等业务，通过 WebSocket 接收正式对局快照。
- 生产构建可由 Spring Boot 后端同域名托管，也可按需要独立托管。

关键目录：

```text
frontend/src/api/       REST API client
frontend/src/net/       WebSocket client and protocol types
frontend/src/game/      3D game scene, input, network sync, VFX
frontend/public/        Public static assets
```

## 后端架构

- Spring Boot 3 + Java 17 提供 REST API 和 WebSocket。
- `wildhunt-web`：控制器、WebSocket handler、CORS 配置和应用入口。
- `wildhunt-service`：用户、好友、房间、匹配、对局、奖励、签到、活动等领域逻辑。
- `wildhunt-dal`：MyBatis-Plus 实体、Mapper 和数据库访问。
- `wildhunt-common`：通用 API 响应、工具和共享模型。
- MySQL 使用 Flyway 迁移维护 schema；本地无 MySQL 时，部分服务保留内存兜底以便开发和测试。

关键目录：

```text
backend/wildhunt-web/
backend/wildhunt-service/
backend/wildhunt-dal/
backend/wildhunt-common/
backend/wildhunt-web/src/main/resources/db/migration/
backend/docs/init_sql/wildhunt.sql
```

## 本地开发

要求：

- Node.js 22+
- JDK 17
- Maven 3.9+
- MySQL 8+

初始化脚本位于 `backend/docs/init_sql/wildhunt.sql`。如果想快速恢复一份完整本地库结构，可以导入该脚本；如果从空库启动，也可以直接让 Flyway 迁移自动建表。

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
$env:SPRING_FLYWAY_ENABLED = "true" # 空库用 true；导入初始化脚本后改为 false
mvn test
mvn package
```

本地数据库：

```sql
CREATE DATABASE IF NOT EXISTS wildhunt
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;
```

导入初始化脚本时，在仓库根目录运行：

```powershell
Get-Content -Encoding UTF8 .\backend\docs\init_sql\wildhunt.sql | mysql --default-character-set=utf8mb4 -u root -p wildhunt
```

导入脚本后运行后端可保持 `SPRING_FLYWAY_ENABLED=false`；使用空库让 Flyway 自动迁移时再设为 `true`。

## 部署说明

生产环境当前使用：

- Railway：Spring Boot 后端、WebSocket、MySQL、同域名前端静态资源。
- 线上环境基于免费资源部署，冷启动和对局同步可能较慢；推荐本地运行游玩。

后端需要的环境变量：

```env
MYSQL_URL=jdbc:mysql://<host>:<port>/<database>?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&useSSL=false&allowPublicKeyRetrieval=true
MYSQL_USERNAME=<mysql-user>
MYSQL_PASSWORD=<mysql-password>
SPRING_FLYWAY_ENABLED=true
SPRING_PROFILES_ACTIVE=prod
WILDHUNT_JWT_SECRET=<long-random-secret>
PORT=<provided-by-platform>
```

前端独立部署时需要的构建变量：

```env
VITE_API_BASE_URL=https://wildhunt-backend-production.up.railway.app
VITE_WS_BASE_URL=wss://wildhunt-backend-production.up.railway.app
```

## 验证

```powershell
cd backend
mvn test package

cd ../frontend
npm run build
```

当前线上验证点：

- `/api/health` 返回 `UP`
- 游客登录可写入 MySQL 并返回 token
- `/ws/lobby` 可以建立 WebSocket 连接
- 根地址 `/` 返回前端页面
