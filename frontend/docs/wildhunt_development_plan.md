# WildHunt 全栈联机化开发计划

> 文档用途：给 Codex / 开发者作为可执行开发计划使用。  
> 当前默认英文项目名：`wildhunt`。  
> 后端同级目录名：`wildhunt-admin`。  
> 目标：把当前 Three.js 单机原型升级为带匹配大厅、房间、好友邀请、排行榜、联机对局、后端持久化的 1 狼多鹿网页游戏。

---

## 0. 一句话总提示词（给 Codex 先读）

你是资深全栈游戏工程师。请在当前前端项目基础上，将项目英文命名为 `wildhunt`，并在当前项目同级目录新建 Spring Boot 单体多模块后端 `wildhunt-admin`。后端使用 JDK 17、Maven、Spring Boot、MyBatis-Plus、MySQL，负责用户、匹配大厅、房间、邀请好友、排行榜、对局记录、WebSocket 实时同步。前端保留 Three.js 游戏主体，但新增匹配大厅、狼匹配、鹿匹配、新建房间、房间等待页、邀请好友入口、排行榜页，并删除游戏中“真假鹿捉迷藏原型”文案。整体游戏架构为每个房间最多 10 名真人玩家，固定 1 名狼，其余真人玩家为鹿，同时保留 AI 鹿用于伪装和补充场景。请按照本文任务清单逐项开发，每个任务完成后勾选，保证前后端可本地运行、数据库表结构闭合、接口清晰、WebSocket 房间状态可同步、npm build 和 mvn test/package 通过。

---

## 1. 当前约束与设计决策

### 1.1 已知用户约束

- [x] 项目英文名称统一为：`wildhunt`。
- [x] 后端项目名称统一为：`wildhunt-admin`。
- [x] 后端目录与当前前端项目保持同级。
- [x] 后端 JDK 使用本机 Java 17 路径。
- [x] 后端 Maven 使用本机路径：`C:\apache-maven-3.9.10`。
- [x] 后端技术栈：`Spring Boot + MyBatis-Plus + MySQL`。
- [x] 后端形态：单体项目，可以多模块。
- [x] 本地 MySQL 可使用：`root / 123456`。
- [x] 数据库凭据只能用于本地开发，不能硬编码到 Java 代码里，不能提交到公开仓库。
- [x] 前端新增匹配大厅。
- [x] 匹配大厅包含：狼匹配、鹿匹配、新建房间、邀请好友、排行榜。
- [x] 后续要预留微信好友邀请 API 对接能力。
- [x] 每个房间一般最多 10 人一起玩。
- [x] 对局结构：1 头狼，其他真人玩家为鹿，并保留 AI 鹿。
- [x] 删除游戏里的文字：“真假鹿捉迷藏原型”。
- [x] 当前阶段不要再继续投入瀑布，如果水面/瀑布几何体影响体验，优先移除或隐藏。

### 1.2 技术版本建议

- [x] MVP 后端优先使用 Spring Boot 3.5.x，而不是直接上 Spring Boot 4。
  - 原因：MyBatis-Plus 当前有 `mybatis-plus-spring-boot3-starter`，与 Spring Boot 3 生态兼容更稳。
  - Spring Boot 4 虽然已是新主线，但需要确认 MyBatis-Plus starter、Spring Security、WebSocket、Jakarta 依赖迁移兼容后再升级。
- [x] MyBatis-Plus starter 采用 `com.baomidou:mybatis-plus-spring-boot3-starter:3.5.16`。
- [x] Java 固定 17。
- [x] Maven 使用本机 3.9.10；该版本满足 Spring Boot 对 Maven 3.6.3+ 的构建要求。
- [x] MySQL 版本建议 8.0+。
- [x] 数据库字符集统一：`utf8mb4`。
- [x] 时间字段统一使用 UTC 或服务端本地时间，但接口返回 ISO-8601 字符串。
- [x] 金额/分数/排名积分使用整数，避免浮点误差。
- [x] WebSocket 第一期使用 Spring WebSocket 原生能力；不引入 Redis。
- [x] 如果后续要多实例部署，再引入 Redis Pub/Sub 或消息队列。

### 1.3 为什么这样做

- [x] 当前前端已经是一个 Three.js 游戏原型，直接重写风险大，应保留游戏主体，只新增联机入口和网络同步层。
- [x] 先做单体多模块，开发速度快，适合当前阶段；模块边界清晰，后期可以拆服务。
- [x] 房间、匹配、排行榜、邀请都需要持久化；MySQL 足够支撑 MVP。
- [x] WebSocket 用于游戏实时状态，REST 用于登录、排行榜、房间列表、邀请、历史记录。
- [x] 1 狼多鹿是核心玩法，房间表和对局表必须从一开始就支持角色分配、房主、准备状态、断线重连、结算。
- [x] 微信好友邀请属于外部平台能力，先抽象邀请表和 inviteCode，后续再接微信 API。

---

## 2. 目标目录结构

### 2.1 同级目录规划

假设当前目录是：

```text
D:\projects\wildhunt
```

则后端应创建为：

```text
D:\projects\wildhunt-admin
```

最终结构：

```text
D:\projects
├── wildhunt
│   ├── package.json
│   ├── vite.config.ts
│   ├── src
│   │   ├── main.ts
│   │   ├── style.css
│   │   ├── api
│   │   ├── lobby
│   │   ├── net
│   │   ├── game
│   │   ├── ui
│   │   └── types
│   └── public
│       └── models
└── wildhunt-admin
    ├── pom.xml
    ├── wildhunt-common
    ├── wildhunt-dal
    ├── wildhunt-service
    ├── wildhunt-web
    └── docs
```

### 2.2 前端目录改造

- [x] 将当前项目目录重命名为 `wildhunt`。
- [x] 修改 `package.json` 中的 `"name"` 为 `"wildhunt"`。
- [x] 修改 `index.html` 的 `<title>` 为 `WildHunt`。
- [x] 在 `src` 下新增目录：

```text
src
├── api
│   ├── http.ts
│   ├── auth-api.ts
│   ├── lobby-api.ts
│   ├── room-api.ts
│   ├── leaderboard-api.ts
│   └── friend-api.ts
├── net
│   ├── ws-client.ts
│   ├── protocol.ts
│   ├── room-channel.ts
│   └── game-channel.ts
├── lobby
│   ├── lobby-page.ts
│   ├── room-list.ts
│   ├── match-panel.ts
│   ├── create-room-dialog.ts
│   ├── invite-panel.ts
│   └── leaderboard-panel.ts
├── game
│   ├── game-scene.ts
│   ├── game-state.ts
│   ├── game-input.ts
│   ├── game-sync.ts
│   ├── game-hud.ts
│   └── game-config.ts
├── ui
│   ├── router.ts
│   ├── dialog.ts
│   ├── toast.ts
│   └── loading.ts
└── types
    ├── api.ts
    ├── room.ts
    ├── match.ts
    └── user.ts
```

- [x] 如果暂时不想大拆 `main.ts`，可以先创建上述目录并逐步迁移。
- [x] 第一阶段只要求能进入大厅、进入房间、开始本地游戏；第二阶段再做实时同步。

### 2.3 后端多模块结构

```text
wildhunt-admin
├── pom.xml                         # 父 POM
├── wildhunt-common                 # 通用枚举、异常、响应体、工具类
│   └── src/main/java/com/wildhunt/common
├── wildhunt-dal                    # MyBatis-Plus Entity / Mapper / XML
│   └── src/main/java/com/wildhunt/dal
├── wildhunt-service                # 业务服务：匹配、房间、对局、排行榜、好友
│   └── src/main/java/com/wildhunt/service
├── wildhunt-web                    # Spring Boot 启动类、Controller、WebSocket
│   └── src/main/java/com/wildhunt/web
└── docs
    ├── db
    │   ├── V1__init_schema.sql
    │   └── schema-notes.md
    ├── api
    │   ├── rest-api.md
    │   └── websocket-protocol.md
    └── ops
        └── local-run.md
```

- [x] 父 POM 管理依赖版本。
- [x] `wildhunt-web` 依赖 `wildhunt-service`。
- [x] `wildhunt-service` 依赖 `wildhunt-dal` 和 `wildhunt-common`。
- [x] `wildhunt-dal` 依赖 `wildhunt-common`。
- [x] 不要在 `wildhunt-common` 反向依赖业务模块。

---

## 3. 本地开发环境配置

### 3.1 Windows PowerShell 环境变量

- [x] 新建 `docs/ops/local-run.md`。
- [x] 写入以下本地启动说明：

```powershell
$env:JAVA_HOME = "<path-to-jdk-17>"
$env:MAVEN_HOME = "C:\apache-maven-3.9.10"
$env:Path = "$env:JAVA_HOME\bin;$env:MAVEN_HOME\bin;$env:Path"

java -version
mvn -v
```

### 3.2 Windows CMD 环境变量

```bat
set JAVA_HOME=<path-to-jdk-17>
set MAVEN_HOME=C:\apache-maven-3.9.10
set PATH=%JAVA_HOME%\bin;%MAVEN_HOME%\bin;%PATH%

java -version
mvn -v
```

以上操作不要设置全局，你当前就是临时开发

### 3.3 MySQL 本地配置

- [x] 创建数据库：

```sql
CREATE DATABASE IF NOT EXISTS wildhunt
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;
```

- [x] 本地开发连接参数：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/wildhunt?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&useSSL=false&allowPublicKeyRetrieval=true
    username: ${MYSQL_USERNAME:root}
    password: ${MYSQL_PASSWORD:123456}
```

- [x] 不要把生产密码写入代码。
- [x] `application-local.yml` 可以保留在本地，但如果里面有真实密码，需要加入 `.gitignore`。
- [x] 推荐提交 `application-local.example.yml`，不提交 `application-local.yml`。
- [x] 后端启动时使用 profile：`local`。

### 3.4 Maven 启动命令

```powershell
cd D:\projects\wildhunt-admin
mvn clean package -DskipTests
mvn -pl wildhunt-web spring-boot:run -Dspring-boot.run.profiles=local
```

---

## 4. 后端工程搭建任务

### 4.1 初始化 `wildhunt-admin`

- [x] 在当前前端项目同级目录创建 `wildhunt-admin`。
- [x] 新建父级 `pom.xml`。
- [x] 设置 `groupId`：`com.wildhunt`。
- [x] 设置 `artifactId`：`wildhunt-admin`。
- [x] 设置 `version`：`0.1.0-SNAPSHOT`。
- [x] 设置 `packaging`：`pom`。
- [x] 新建子模块：
  - [x] `wildhunt-common`
  - [x] `wildhunt-dal`
  - [x] `wildhunt-service`
  - [x] `wildhunt-web`
- [x] 父 POM 统一配置 Java 17。
- [x] 父 POM 统一配置编码 UTF-8。
- [x] 父 POM 统一配置 Maven Compiler Plugin。
- [x] 父 POM 统一配置 Surefire Plugin。
- [x] 父 POM 统一配置 Spring Boot Maven Plugin，只在 `wildhunt-web` 使用。

### 4.2 推荐依赖

- [x] `spring-boot-starter-web`
- [x] `spring-boot-starter-websocket`
- [x] `spring-boot-starter-validation`
- [x] `spring-boot-starter-security`
- [x] `mybatis-plus-spring-boot3-starter`
- [x] `mysql-connector-j`
- [x] `jjwt-api / jjwt-impl / jjwt-jackson` 或 Spring Security 自定义 JWT
- [x] `lombok`
- [x] `mapstruct` 或先手写 converter
- [x] `flyway-core` 或 `liquibase-core`
- [x] `spring-boot-starter-test`
- [x] `springdoc-openapi-starter-webmvc-ui`，可选，用于接口文档

### 4.3 模块职责

#### `wildhunt-common`

- [x] 定义统一响应体 `ApiResponse<T>`。
- [x] 定义分页响应 `PageResponse<T>`。
- [x] 定义业务异常 `BizException`。
- [x] 定义错误码 `ErrorCode`。
- [x] 定义枚举：
  - [x] `RoleType`: `WOLF`, `DEER`, `SPECTATOR`
  - [x] `RoomStatus`: `WAITING`, `READY_CHECK`, `LOADING`, `PLAYING`, `SETTLEMENT`, `CLOSED`
  - [x] `MatchStatus`: `CREATED`, `PLAYING`, `FINISHED`, `ABORTED`
  - [x] `QueueType`: `WOLF`, `DEER`, `AUTO`
  - [x] `InviteChannel`: `LINK`, `CODE`, `WECHAT`
  - [x] `InviteStatus`: `PENDING`, `ACCEPTED`, `EXPIRED`, `CANCELLED`
  - [x] `FriendStatus`: `PENDING`, `ACCEPTED`, `BLOCKED`
  - [x] `LeaderboardType`: `RATING`, `WINS`, `WOLF_WINS`, `DEER_SURVIVAL`
- [x] 定义时间工具、ID 工具、签名工具。
- [x] 定义常量：
  - [x] `MAX_ROOM_PLAYERS = 10`
  - [x] `WOLF_COUNT = 1`
  - [x] `DEFAULT_AI_DEER_COUNT = 16`
  - [x] `ROOM_CODE_LENGTH = 6`

#### `wildhunt-dal`

- [x] Entity 与数据库表一一对应。
- [x] Mapper 使用 MyBatis-Plus BaseMapper。
- [x] 复杂查询可写 XML。
- [x] 所有表默认字段：
  - [x] `id BIGINT PRIMARY KEY`
  - [x] `created_at DATETIME(3)`
  - [x] `updated_at DATETIME(3)`
  - [x] `deleted TINYINT DEFAULT 0`
- [x] 所有重要查询字段添加索引。
- [x] 枚举字段存 VARCHAR，便于调试。

#### `wildhunt-service`

- [x] `AuthService`
- [x] `UserService`
- [x] `FriendService`
- [x] `InviteService`
- [x] `LobbyService`
- [x] `MatchmakingService`
- [x] `RoomService`
- [x] `GameMatchService`
- [x] `LeaderboardService`
- [x] `RealtimeSessionService`
- [x] `GameStateService`
- [x] `AiDeerService`

#### `wildhunt-web`

- [x] Spring Boot 启动类：`WildHuntAdminApplication`。
- [x] REST Controller。
- [x] WebSocket Handler。
- [x] JWT Filter。
- [x] 全局异常处理。
- [x] CORS 配置。
- [x] OpenAPI 配置。
- [x] 本地 profile 配置。

---

## 5. 数据库设计

### 5.1 设计原则

- [x] 账号、房间、对局、玩家表现、排行榜、邀请、好友关系必须闭合。
- [x] 房间是“进入游戏前的容器”。
- [x] 对局是“游戏开始后的记录”。
- [x] 房间可以多次开局，所以 `game_room` 与 `game_match` 是一对多。
- [x] `room_member` 表示当前房间成员。
- [x] `match_player` 表示某一局中的玩家快照和结算表现。
- [x] 实时状态大部分在内存中维护；关键事件和最终结果写 MySQL。
- [x] 不要把每帧位置都写入 MySQL。
- [x] 只保存关键事件、结算、异常断线、回放可选快照。

### 5.2 表清单

- [x] `wh_user`
- [x] `wh_user_auth_binding`
- [x] `wh_player_profile`
- [x] `wh_friend_relation`
- [x] `wh_friend_request`
- [x] `wh_room`
- [x] `wh_room_member`
- [x] `wh_room_invite`
- [x] `wh_match_queue`
- [x] `wh_game_match`
- [x] `wh_match_player`
- [x] `wh_match_event`
- [x] `wh_match_snapshot`
- [x] `wh_player_stat`
- [x] `wh_leaderboard_season`
- [x] `wh_leaderboard_entry`
- [x] `wh_notification`
- [x] `wh_system_config`

---

## 6. 数据库详细表结构

### 6.1 用户表：`wh_user`

用途：保存基础账号。

```sql
CREATE TABLE wh_user (
  id BIGINT PRIMARY KEY,
  username VARCHAR(64) NOT NULL,
  nickname VARCHAR(64) NOT NULL,
  avatar_url VARCHAR(512) NULL,
  password_hash VARCHAR(255) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  last_login_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted TINYINT NOT NULL DEFAULT 0,
  UNIQUE KEY uk_user_username (username),
  KEY idx_user_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

任务：

- [x] 创建 `UserEntity`。
- [x] 创建 `UserMapper`。
- [x] 创建 `UserService.createGuestUser()`。
- [x] 创建 `UserService.updateProfile()`。
- [x] 创建用户名唯一校验。
- [x] 创建昵称长度校验。
- [x] 支持游客账号。
- [x] 支持后续绑定微信。

### 6.2 第三方绑定表：`wh_user_auth_binding`

用途：为后续微信登录、微信好友邀请预留。

```sql
CREATE TABLE wh_user_auth_binding (
  id BIGINT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  provider VARCHAR(32) NOT NULL,
  open_id VARCHAR(128) NOT NULL,
  union_id VARCHAR(128) NULL,
  nickname VARCHAR(128) NULL,
  avatar_url VARCHAR(512) NULL,
  raw_json JSON NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted TINYINT NOT NULL DEFAULT 0,
  UNIQUE KEY uk_provider_openid (provider, open_id),
  KEY idx_binding_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

任务：

- [x] 支持 `provider = WECHAT`。
- [x] 暂时不真实调用微信 API。
- [x] 先定义接口 `WechatAuthClient`。
- [x] 使用 mock 实现。
- [x] 后续替换为真实微信 API。

### 6.3 玩家资料表：`wh_player_profile`

用途：保存玩家等级、经验、展示数据。

```sql
CREATE TABLE wh_player_profile (
  id BIGINT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  level INT NOT NULL DEFAULT 1,
  exp INT NOT NULL DEFAULT 0,
  rating INT NOT NULL DEFAULT 1000,
  title VARCHAR(64) NULL,
  preferred_role VARCHAR(32) NULL,
  total_play_seconds BIGINT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted TINYINT NOT NULL DEFAULT 0,
  UNIQUE KEY uk_profile_user (user_id),
  KEY idx_profile_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

任务：

- [x] 注册用户时自动创建 profile。
- [x] 结算时更新经验。
- [x] 结算时更新 rating。
- [x] 排行榜优先读取 profile rating。

### 6.4 好友关系表：`wh_friend_relation`

```sql
CREATE TABLE wh_friend_relation (
  id BIGINT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  friend_user_id BIGINT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'ACCEPTED',
  source VARCHAR(32) NOT NULL DEFAULT 'MANUAL',
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted TINYINT NOT NULL DEFAULT 0,
  UNIQUE KEY uk_friend_pair (user_id, friend_user_id),
  KEY idx_friend_user (user_id),
  KEY idx_friend_friend (friend_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

任务：

- [x] 好友关系双向写入两条记录。
- [x] 删除好友时双向软删除。
- [x] 支持来源：`MANUAL`、`ROOM_INVITE`、`WECHAT`。
- [x] 列表接口返回在线状态。
- [x] 在线状态来自内存 session，不写 MySQL。

### 6.5 好友申请表：`wh_friend_request`

```sql
CREATE TABLE wh_friend_request (
  id BIGINT PRIMARY KEY,
  from_user_id BIGINT NOT NULL,
  to_user_id BIGINT NOT NULL,
  message VARCHAR(255) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted TINYINT NOT NULL DEFAULT 0,
  KEY idx_friend_req_to (to_user_id, status),
  KEY idx_friend_req_from (from_user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

任务：

- [x] 发送好友申请。
- [x] 接受好友申请。
- [x] 拒绝好友申请。
- [x] 申请去重。
- [x] 被拉黑时不能申请。

### 6.6 房间表：`wh_room`

用途：等待大厅中的房间。

```sql
CREATE TABLE wh_room (
  id BIGINT PRIMARY KEY,
  room_code VARCHAR(16) NOT NULL,
  owner_user_id BIGINT NOT NULL,
  name VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL,
  max_players INT NOT NULL DEFAULT 10,
  wolf_count INT NOT NULL DEFAULT 1,
  ai_deer_count INT NOT NULL DEFAULT 16,
  password_hash VARCHAR(255) NULL,
  is_private TINYINT NOT NULL DEFAULT 0,
  current_match_id BIGINT NULL,
  version INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  closed_at DATETIME(3) NULL,
  deleted TINYINT NOT NULL DEFAULT 0,
  UNIQUE KEY uk_room_code (room_code),
  KEY idx_room_status (status),
  KEY idx_room_owner (owner_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

任务：

- [x] 新建房间时生成 6 位 `room_code`。
- [x] 房间名默认：`{nickname} 的房间`。
- [x] 房主断线时转移房主。
- [x] 房间空置超过 5 分钟自动关闭。
- [x] 房间满员后不可加入。
- [x] 私密房间不出现在公开列表，邀请码可加入。
- [x] `version` 用于乐观锁，防止并发开始游戏。

### 6.7 房间成员表：`wh_room_member`

```sql
CREATE TABLE wh_room_member (
  id BIGINT PRIMARY KEY,
  room_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  role_preference VARCHAR(32) NOT NULL DEFAULT 'AUTO',
  assigned_role VARCHAR(32) NULL,
  seat_no INT NULL,
  ready TINYINT NOT NULL DEFAULT 0,
  online TINYINT NOT NULL DEFAULT 1,
  joined_at DATETIME(3) NOT NULL,
  left_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted TINYINT NOT NULL DEFAULT 0,
  UNIQUE KEY uk_room_user_active (room_id, user_id, deleted),
  KEY idx_room_member_room (room_id),
  KEY idx_room_member_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

任务：

- [x] 同一个用户同一时间只能在一个活跃房间。
- [x] 加入房间时写入成员。
- [x] 离开房间时软删除或设置 left_at。
- [x] 断线时 online=0，不立即踢出。
- [x] 断线 60 秒内允许重连。
- [x] 准备状态通过 WebSocket 广播。
- [x] 房主可以踢人。
- [x] 房主可以转让房主。
- [x] 房主不手动指定狼时，开局随机分配 1 狼。

### 6.8 房间邀请表：`wh_room_invite`

```sql
CREATE TABLE wh_room_invite (
  id BIGINT PRIMARY KEY,
  room_id BIGINT NOT NULL,
  inviter_user_id BIGINT NOT NULL,
  invitee_user_id BIGINT NULL,
  channel VARCHAR(32) NOT NULL,
  invite_code VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  expire_at DATETIME(3) NOT NULL,
  accepted_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted TINYINT NOT NULL DEFAULT 0,
  UNIQUE KEY uk_room_invite_code (invite_code),
  KEY idx_room_invite_room (room_id),
  KEY idx_room_invite_invitee (invitee_user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

任务：

- [x] 创建房间邀请码。
- [x] 支持链接邀请。
- [x] 支持好友站内邀请。
- [x] 预留微信邀请 `channel = WECHAT`。
- [x] 邀请码默认 24 小时过期。
- [x] 接受邀请后进入房间。
- [x] 如果房间满了，返回错误。
- [x] 如果房间已开局，返回错误或允许观战，MVP 默认不允许。

### 6.9 匹配队列表：`wh_match_queue`

```sql
CREATE TABLE wh_match_queue (
  id BIGINT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  queue_type VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'WAITING',
  rating INT NOT NULL DEFAULT 1000,
  party_id BIGINT NULL,
  room_id BIGINT NULL,
  queued_at DATETIME(3) NOT NULL,
  matched_at DATETIME(3) NULL,
  cancelled_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted TINYINT NOT NULL DEFAULT 0,
  KEY idx_queue_type_status (queue_type, status, queued_at),
  KEY idx_queue_user_status (user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

任务：

- [x] 狼匹配写入 `queue_type = WOLF`。
- [x] 鹿匹配写入 `queue_type = DEER`。
- [x] 自动匹配写入 `queue_type = AUTO`。
- [x] 取消匹配更新 status。
- [x] 匹配成功创建房间或直接创建对局。
- [x] MVP 规则：1 个狼队列 + 最多 9 个鹿队列凑成房间。
- [x] 如果鹿不足，允许等待；不使用真人 AI 补玩家位。
- [x] AI 鹿只作为游戏内伪装，不算真人玩家席位。
- [x] 匹配超时 90 秒可建议玩家新建房间。

### 6.10 对局表：`wh_game_match`

```sql
CREATE TABLE wh_game_match (
  id BIGINT PRIMARY KEY,
  room_id BIGINT NOT NULL,
  status VARCHAR(32) NOT NULL,
  mode VARCHAR(32) NOT NULL DEFAULT 'CLASSIC',
  seed BIGINT NOT NULL,
  max_players INT NOT NULL,
  wolf_count INT NOT NULL,
  ai_deer_count INT NOT NULL,
  started_at DATETIME(3) NULL,
  finished_at DATETIME(3) NULL,
  duration_seconds INT NULL,
  winner_role VARCHAR(32) NULL,
  result_reason VARCHAR(128) NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted TINYINT NOT NULL DEFAULT 0,
  KEY idx_match_room (room_id),
  KEY idx_match_status (status),
  KEY idx_match_started (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

任务：

- [x] 开局时创建 `wh_game_match`。
- [x] seed 用于同步地图、鹿群初始状态、AI 随机。
- [x] 结算时更新 winner_role。
- [x] 结算时更新 result_reason。
- [x] 中途异常结束写 `ABORTED`。
- [x] 断线导致结束要记录原因。

### 6.11 对局玩家表：`wh_match_player`

```sql
CREATE TABLE wh_match_player (
  id BIGINT PRIMARY KEY,
  match_id BIGINT NOT NULL,
  room_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  role VARCHAR(32) NOT NULL,
  seat_no INT NOT NULL,
  character_id VARCHAR(64) NULL,
  survived TINYINT NOT NULL DEFAULT 1,
  is_winner TINYINT NOT NULL DEFAULT 0,
  score INT NOT NULL DEFAULT 0,
  rating_before INT NOT NULL DEFAULT 1000,
  rating_after INT NOT NULL DEFAULT 1000,
  kills INT NOT NULL DEFAULT 0,
  mistakes INT NOT NULL DEFAULT 0,
  found_real_deer INT NOT NULL DEFAULT 0,
  survival_seconds INT NOT NULL DEFAULT 0,
  disconnect_count INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted TINYINT NOT NULL DEFAULT 0,
  UNIQUE KEY uk_match_user (match_id, user_id),
  KEY idx_match_player_match (match_id),
  KEY idx_match_player_user (user_id),
  KEY idx_match_player_role (match_id, role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

任务：

- [x] 开局时为每个真人玩家创建记录。
- [x] 狼玩家 role=WOLF。
- [x] 鹿玩家 role=DEER。
- [x] AI 鹿不写入该表，除非后续做回放。
- [x] 结算时更新 score。
- [x] 结算时更新 rating_before/rating_after。
- [x] 结算时更新是否获胜。
- [x] 断线时记录 disconnect_count。

### 6.12 对局事件表：`wh_match_event`

```sql
CREATE TABLE wh_match_event (
  id BIGINT PRIMARY KEY,
  match_id BIGINT NOT NULL,
  room_id BIGINT NOT NULL,
  event_type VARCHAR(64) NOT NULL,
  actor_user_id BIGINT NULL,
  target_user_id BIGINT NULL,
  event_time_ms INT NOT NULL,
  payload JSON NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted TINYINT NOT NULL DEFAULT 0,
  KEY idx_event_match_time (match_id, event_time_ms),
  KEY idx_event_type (event_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

事件类型：

- [x] `MATCH_START`
- [x] `PLAYER_READY`
- [x] `PLAYER_DISCONNECT`
- [x] `PLAYER_RECONNECT`
- [x] `WOLF_SCENT_USED`
- [x] `WOLF_POUNCE`
- [x] `DEER_EAT`
- [x] `DEER_LOOK`
- [x] `DEER_CAMOUFLAGE`
- [x] `DEER_CAUGHT`
- [x] `WOLF_MISTAKE`
- [x] `MATCH_END`

任务：

- [x] 只记录关键事件。
- [x] 不记录每帧移动。
- [x] payload 用 JSON 保存技能细节。
- [x] 事件用于复盘、反作弊、排行榜统计。

### 6.13 对局快照表：`wh_match_snapshot`

```sql
CREATE TABLE wh_match_snapshot (
  id BIGINT PRIMARY KEY,
  match_id BIGINT NOT NULL,
  room_id BIGINT NOT NULL,
  snapshot_time_ms INT NOT NULL,
  snapshot_type VARCHAR(32) NOT NULL,
  payload JSON NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted TINYINT NOT NULL DEFAULT 0,
  KEY idx_snapshot_match_time (match_id, snapshot_time_ms)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

任务：

- [x] MVP 可以不写高频快照。
- [x] 只在开局、每 30 秒、结算写轻量快照。
- [x] 后续做回放再扩展。
- [x] payload 包括玩家位置、AI 鹿数量、剩余时间、技能状态摘要。

### 6.14 玩家统计表：`wh_player_stat`

```sql
CREATE TABLE wh_player_stat (
  id BIGINT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  total_matches INT NOT NULL DEFAULT 0,
  total_wins INT NOT NULL DEFAULT 0,
  wolf_matches INT NOT NULL DEFAULT 0,
  wolf_wins INT NOT NULL DEFAULT 0,
  deer_matches INT NOT NULL DEFAULT 0,
  deer_wins INT NOT NULL DEFAULT 0,
  total_score BIGINT NOT NULL DEFAULT 0,
  best_score INT NOT NULL DEFAULT 0,
  total_kills INT NOT NULL DEFAULT 0,
  total_mistakes INT NOT NULL DEFAULT 0,
  total_survival_seconds BIGINT NOT NULL DEFAULT 0,
  current_win_streak INT NOT NULL DEFAULT 0,
  best_win_streak INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted TINYINT NOT NULL DEFAULT 0,
  UNIQUE KEY uk_stat_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

任务：

- [x] 注册用户时创建统计记录。
- [x] 每局结束后异步或同步更新统计。
- [x] 更新总局数。
- [x] 更新狼胜率。
- [x] 更新鹿胜率。
- [x] 更新 best_score。
- [x] 更新 win_streak。
- [x] 排行榜可从这里聚合，也可写到 leaderboard_entry。

### 6.15 排行榜赛季表：`wh_leaderboard_season`

```sql
CREATE TABLE wh_leaderboard_season (
  id BIGINT PRIMARY KEY,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(128) NOT NULL,
  status VARCHAR(32) NOT NULL,
  start_at DATETIME(3) NOT NULL,
  end_at DATETIME(3) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted TINYINT NOT NULL DEFAULT 0,
  UNIQUE KEY uk_season_code (code),
  KEY idx_season_status (status, start_at, end_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

任务：

- [x] 创建默认赛季 `S0_PRESEASON`。
- [x] 如果没有活跃赛季，启动时自动创建。
- [x] 排行榜入口默认显示当前赛季。

### 6.16 排行榜条目表：`wh_leaderboard_entry`

```sql
CREATE TABLE wh_leaderboard_entry (
  id BIGINT PRIMARY KEY,
  season_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  leaderboard_type VARCHAR(32) NOT NULL,
  rank_no INT NULL,
  score BIGINT NOT NULL DEFAULT 0,
  rating INT NOT NULL DEFAULT 1000,
  matches INT NOT NULL DEFAULT 0,
  wins INT NOT NULL DEFAULT 0,
  extra JSON NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted TINYINT NOT NULL DEFAULT 0,
  UNIQUE KEY uk_lb_user_type (season_id, user_id, leaderboard_type),
  KEY idx_lb_rank (season_id, leaderboard_type, rank_no),
  KEY idx_lb_score (season_id, leaderboard_type, score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

任务：

- [x] 结算时更新当前赛季的排行榜条目。
- [x] 支持按 rating 排。
- [x] 支持按总胜场排。
- [x] 支持按狼胜场排。
- [x] 支持按鹿生存时间排。
- [x] 排行榜分页查询。
- [x] 当前用户排名查询。
- [x] 前端大厅展示 Top 10。
- [x] 玩家详情页展示自己排名。

### 6.17 通知表：`wh_notification`

```sql
CREATE TABLE wh_notification (
  id BIGINT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  type VARCHAR(64) NOT NULL,
  title VARCHAR(128) NOT NULL,
  content VARCHAR(512) NULL,
  payload JSON NULL,
  read_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted TINYINT NOT NULL DEFAULT 0,
  KEY idx_notification_user_read (user_id, read_at),
  KEY idx_notification_user_created (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

任务：

- [x] 房间邀请生成通知。
- [x] 好友申请生成通知。
- [x] 排行榜奖励可生成通知。
- [x] 前端大厅显示未读数量。
- [x] WebSocket 推送新通知。

### 6.18 系统配置表：`wh_system_config`

```sql
CREATE TABLE wh_system_config (
  id BIGINT PRIMARY KEY,
  config_key VARCHAR(128) NOT NULL,
  config_value VARCHAR(1024) NOT NULL,
  description VARCHAR(255) NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted TINYINT NOT NULL DEFAULT 0,
  UNIQUE KEY uk_config_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

配置项：

- [x] `room.maxPlayers = 10`
- [x] `room.wolfCount = 1`
- [x] `game.defaultAiDeerCount = 16`
- [x] `match.queueTimeoutSeconds = 90`
- [x] `invite.expireHours = 24`
- [x] `rating.base = 1000`

---

## 7. 后端 REST API 设计

### 7.1 统一响应格式

```json
{
  "code": 0,
  "message": "OK",
  "data": {}
}
```

任务：

- [x] 成功 code=0。
- [x] 业务错误 code 使用非 0。
- [x] 未登录返回 401。
- [x] 无权限返回 403。
- [x] 参数错误返回 400。
- [x] 服务端错误返回 500。

### 7.2 Auth API

#### `POST /api/auth/guest`

用途：快速创建游客账号或恢复本地游客账号。

请求：

```json
{
  "deviceId": "browser-fingerprint-or-local-random-id",
  "nickname": "DeerPlayer001"
}
```

响应：

```json
{
  "token": "jwt",
  "user": {
    "id": "10001",
    "nickname": "DeerPlayer001",
    "avatarUrl": "",
    "rating": 1000
  }
}
```

任务：

- [x] 如果 deviceId 已绑定游客，返回原用户。
- [x] 如果没有，创建新用户。
- [x] 生成 JWT。
- [x] 前端保存 token 到 localStorage。
- [x] 后续正式账号登录再扩展。

#### `POST /api/auth/wechat/mock-login`

用途：预留微信登录 mock。

任务：

- [x] 不接真实微信。
- [x] 用 mock openId 创建/绑定用户。
- [x] 返回 JWT。
- [x] 后续替换为微信 OAuth / 小程序登录。

### 7.3 Lobby API

#### `GET /api/lobby/summary`

返回大厅摘要：

```json
{
  "onlineUsers": 128,
  "waitingRooms": 12,
  "queueWolf": 3,
  "queueDeer": 18,
  "currentSeason": {
    "id": "1",
    "name": "Preseason"
  }
}
```

任务：

- [x] 从内存 session 统计在线人数。
- [x] 从 DB 查询等待房间数。
- [x] 从匹配队列表查询等待人数。
- [x] 返回当前赛季。

#### `GET /api/lobby/rooms`

查询公开房间：

参数：

```text
?page=1&pageSize=20&status=WAITING
```

任务：

- [x] 只返回公开房间。
- [x] 不返回已关闭房间。
- [x] 返回当前人数。
- [x] 返回房主昵称。
- [x] 支持分页。

### 7.4 Matchmaking API

#### `POST /api/matchmaking/join`

请求：

```json
{
  "queueType": "WOLF"
}
```

任务：

- [x] queueType 支持 `WOLF`、`DEER`、`AUTO`。
- [x] 用户已在房间中时不能进入匹配。
- [x] 用户已在队列中时直接返回当前队列状态。
- [x] 写入 `wh_match_queue`。
- [x] 调用匹配器尝试成房间。
- [x] 通过 WebSocket 通知匹配成功。

#### `POST /api/matchmaking/cancel`

任务：

- [x] 取消当前用户等待中的匹配。
- [x] 更新队列状态为 `CANCELLED`。
- [x] 返回大厅摘要。

#### `GET /api/matchmaking/status`

任务：

- [x] 返回当前用户是否在队列。
- [x] 返回等待时长。
- [x] 返回预估等待人数。
- [x] 匹配成功时返回 roomId。

### 7.5 Room API

#### `POST /api/rooms`

请求：

```json
{
  "name": "我的狩猎房间",
  "isPrivate": false,
  "maxPlayers": 10,
  "aiDeerCount": 16,
  "password": ""
}
```

任务：

- [x] 创建房间。
- [x] 创建房主成员。
- [x] 生成 roomCode。
- [x] 返回 roomId 和 roomCode。
- [x] WebSocket 大厅广播房间新增。

#### `GET /api/rooms/{roomId}`

任务：

- [x] 返回房间详情。
- [x] 返回成员列表。
- [x] 返回准备状态。
- [x] 返回邀请码。
- [x] 返回当前是否可开始。

#### `POST /api/rooms/{roomId}/join`

任务：

- [x] 加入房间。
- [x] 校验房间状态。
- [x] 校验人数。
- [x] 校验密码。
- [x] 写入 room_member。
- [x] WebSocket 广播成员加入。

#### `POST /api/rooms/join-by-code`

请求：

```json
{
  "roomCode": "A1B2C3",
  "password": ""
}
```

任务：

- [x] 根据房间码加入。
- [x] 私密房间可用房间码加入。
- [x] 房间不存在返回错误。
- [x] 房间已开局返回错误。

#### `POST /api/rooms/{roomId}/leave`

任务：

- [x] 成员离开房间。
- [x] 房主离开时转移房主。
- [x] 房间无人时关闭。
- [x] WebSocket 广播。

#### `POST /api/rooms/{roomId}/ready`

请求：

```json
{
  "ready": true
}
```

任务：

- [x] 更新准备状态。
- [x] WebSocket 广播。
- [x] 房主不必准备或也需要准备，MVP 选“房主也需要准备”。

#### `POST /api/rooms/{roomId}/start`

任务：

- [x] 只有房主可开始。
- [x] 至少 2 名真人玩家才可开始。
- [x] 最多 10 名真人玩家。
- [x] 固定分配 1 名狼。
- [x] 如果有玩家偏好狼，优先从偏好狼的人里随机选。
- [x] 其他人为鹿。
- [x] 创建 `wh_game_match`。
- [x] 创建 `wh_match_player`。
- [x] 房间状态改为 PLAYING。
- [x] WebSocket 推送 `GAME_START`。
- [x] 返回 matchId、seed、assignedRole。

### 7.6 Invite API

#### `POST /api/rooms/{roomId}/invites`

请求：

```json
{
  "channel": "LINK",
  "inviteeUserId": null
}
```

响应：

```json
{
  "inviteCode": "INV_xxx",
  "inviteLink": "https://example.com/invite/INV_xxx",
  "expireAt": "2026-05-25T12:00:00"
}
```

任务：

- [x] 生成 inviteCode。
- [x] 写入 room_invite。
- [x] 如果 inviteeUserId 不为空，写通知。
- [x] `WECHAT` 渠道先只生成 payload，不调用真实微信。
- [x] 前端可复制链接。
- [x] 后续微信 API 接入时，替换 `InviteShareClient` 实现。

#### `POST /api/invites/{inviteCode}/accept`

任务：

- [x] 校验邀请码存在。
- [x] 校验未过期。
- [x] 校验房间可加入。
- [x] 加入房间。
- [x] 更新邀请状态为 ACCEPTED。

### 7.7 Friend API

- [x] `GET /api/friends`
- [x] `POST /api/friends/requests`
- [x] `GET /api/friends/requests`
- [x] `POST /api/friends/requests/{id}/accept`
- [x] `POST /api/friends/requests/{id}/reject`
- [x] `DELETE /api/friends/{friendUserId}`

任务：

- [x] 好友列表返回在线状态。
- [x] 好友列表返回是否在房间中。
- [x] 支持邀请在线好友进房。
- [x] 支持后续微信好友导入。

### 7.8 Leaderboard API

#### `GET /api/leaderboards`

参数：

```text
?type=RATING&seasonId=1&page=1&pageSize=50
```

任务：

- [x] 支持 rating 排行。
- [x] 支持胜场排行。
- [x] 支持狼胜场排行。
- [x] 支持鹿生存时间排行。
- [x] 返回当前用户排名。
- [x] 返回前 50。
- [x] 大厅默认展示前 10。

#### `GET /api/leaderboards/me`

任务：

- [x] 返回当前用户各榜单排名。
- [x] 返回 rating。
- [x] 返回胜率。
- [x] 返回最近 10 局摘要。

### 7.9 Match History API

- [x] `GET /api/matches/me`
- [x] `GET /api/matches/{matchId}`
- [x] `GET /api/matches/{matchId}/events`

任务：

- [x] 玩家可查看历史对局。
- [x] 房间可查看最近几局。
- [x] 对局详情返回成员、胜负、得分、事件摘要。

---

## 8. WebSocket 设计

### 8.1 连接地址

- [x] 大厅频道：`/ws/lobby`
- [x] 房间频道：`/ws/room?roomId=xxx`
- [x] 游戏频道：`/ws/game?matchId=xxx`

### 8.2 鉴权

- [x] WebSocket 握手时携带 JWT。
- [x] 支持 query 参数：`?token=xxx`，MVP 可用。
- [x] 更推荐 header：`Authorization: Bearer xxx`。
- [x] 鉴权失败关闭连接。
- [x] 同一用户多端连接时，后来的连接可以顶掉旧连接，MVP 先允许多端但只一个 active game session。

### 8.3 消息通用格式

```json
{
  "type": "ROOM_MEMBER_JOINED",
  "requestId": "optional-client-id",
  "ts": 1710000000000,
  "payload": {}
}
```

任务：

- [x] 所有消息有 type。
- [x] 客户端请求带 requestId。
- [x] 服务端响应包含 requestId。
- [x] 心跳消息 type=`PING` / `PONG`。
- [x] 错误消息 type=`ERROR`。

### 8.4 Lobby WS 消息

服务端推送：

- [x] `LOBBY_SUMMARY_UPDATED`
- [x] `ROOM_CREATED`
- [x] `ROOM_UPDATED`
- [x] `ROOM_CLOSED`
- [x] `QUEUE_STATUS_UPDATED`
- [x] `NOTIFICATION_CREATED`

客户端发送：

- [x] `LOBBY_SUBSCRIBE`
- [x] `LOBBY_UNSUBSCRIBE`
- [x] `PING`

### 8.5 Room WS 消息

服务端推送：

- [x] `ROOM_STATE`
- [x] `ROOM_MEMBER_JOINED`
- [x] `ROOM_MEMBER_LEFT`
- [x] `ROOM_MEMBER_READY_CHANGED`
- [x] `ROOM_OWNER_CHANGED`
- [x] `ROOM_INVITE_CREATED`
- [x] `ROOM_CHAT_MESSAGE`
- [x] `GAME_STARTING`
- [x] `GAME_START`

客户端发送：

- [x] `ROOM_READY_CHANGE`
- [x] `ROOM_CHAT_SEND`
- [x] `ROOM_START_GAME`
- [x] `ROOM_LEAVE`

### 8.6 Game WS 消息

客户端发送：

```json
{
  "type": "PLAYER_INPUT",
  "payload": {
    "seq": 123,
    "moveAxis": 1,
    "turnAxis": -1,
    "sprint": true,
    "skill": "WOLF_POUNCE",
    "clientTime": 1234567
  }
}
```

服务端推送：

```json
{
  "type": "GAME_SNAPSHOT",
  "payload": {
    "serverTick": 1024,
    "timeLeft": 238.4,
    "players": [
      {
        "userId": "10001",
        "role": "WOLF",
        "x": 0,
        "y": 1.2,
        "z": 22,
        "yaw": 3.14,
        "state": "RUN"
      }
    ],
    "aiDeer": [],
    "events": []
  }
}
```

任务：

- [x] 客户端只发送输入，不直接决定最终结算。
- [x] 服务端维护权威 room/match 状态。
- [x] 服务器 tick 频率 MVP 10-20 Hz。
- [x] 客户端渲染插值。
- [x] 客户端可以本地预测玩家移动。
- [x] 服务端定期纠偏。
- [x] 关键技能如扑咬、气味、伪装由服务端判定。
- [x] 服务端广播技能事件。
- [x] 客户端负责视觉效果。
- [x] AI 鹿由服务端或服务端 seed 驱动；MVP 建议服务端模拟低频 AI，客户端插值。

### 8.7 断线重连

- [x] 玩家断线后，room_member.online=0。
- [x] 对局中断线后，match_player.disconnect_count +1。
- [x] 60 秒内重连回同一 room/match。
- [x] 重连成功后服务端发送 `GAME_FULL_STATE`。
- [x] 超时未重连，鹿玩家留在原地或由 AI 接管，MVP 先由 AI 接管。
- [x] 狼玩家断线超过 60 秒，房间可判定鹿胜或暂停，MVP 先判定鹿胜，后续再做暂停投票。

---

## 9. 匹配与房间规则

### 9.1 狼匹配

- [x] 玩家点击“狼匹配”。
- [x] 前端调用 `POST /api/matchmaking/join`，queueType=WOLF。
- [x] 后端写入队列。
- [x] 匹配器寻找等待中的鹿玩家。
- [x] 满足条件时创建房间或直接进入准备房间。
- [x] 狼队列人数多时按排队时间优先。
- [x] 同一用户不能重复排队。
- [x] 取消匹配必须清理队列状态。

### 9.2 鹿匹配

- [x] 玩家点击“鹿匹配”。
- [x] 前端调用 queueType=DEER。
- [x] 匹配器寻找等待中的狼。
- [x] 满足条件时创建房间。
- [x] 鹿不足时继续等待。
- [x] 鹿玩家可以邀请好友组队，MVP 先不做 party 队伍。

### 9.3 新建房间

- [x] 玩家点击“新建房间”。
- [x] 填写房间名。
- [x] 选择公开/私密。
- [x] 选择最大人数，默认 10。
- [x] 选择 AI 鹿数量，默认 16。
- [x] 创建成功进入房间等待页。
- [x] 房间等待页显示房间码。
- [x] 支持复制邀请链接。
- [x] 房主可开始游戏。
- [x] 房主可踢人。
- [x] 房主离开时转移房主。

### 9.4 角色分配

- [x] 每局固定 1 名狼。
- [x] 如果房间只有 2 人，也可以开始：1 狼 1 鹿 + AI 鹿。
- [x] 如果房间 10 人：1 狼 9 鹿 + AI 鹿。
- [x] 如果多人选择狼偏好，则从偏好狼的人中随机。
- [x] 如果无人选择狼偏好，则全员随机 1 人为狼。
- [x] 已分配角色写入 `room_member.assigned_role` 和 `match_player.role`。
- [x] 开局后前端按自己的角色加载对应 HUD 和技能。
- [x] 非自己角色身份可部分隐藏，避免狼人过早知道真人鹿身份。

### 9.5 AI 鹿规则

- [x] AI 鹿数量不占房间真人玩家名额。
- [x] AI 鹿数量由 room.ai_deer_count 决定。
- [x] 开局时根据 seed 生成 AI 鹿。
- [x] AI 鹿用于混淆狼。
- [x] 服务端保留 AI 鹿基本状态。
- [x] 客户端只做视觉插值和动画。
- [x] 鹿玩家需要混入 AI 鹿群。
- [x] 狼击中 AI 鹿算误伤。
- [x] 狼击中真人鹿算命中。
- [x] 真人鹿被抓时，服务端广播事件。

---

## 10. 排行榜机制

### 10.1 积分建议

初始 rating：1000。

狼方：

- [x] 抓到真人鹿：+25 分。
- [x] 抓错 AI 鹿：-12 分。
- [x] 全部抓完获胜：额外 +40 分。
- [x] 时间结束失败：-20 分。
- [x] 中途断线失败：-40 分。

鹿方：

- [x] 存活到结束：+35 分。
- [x] 被抓：-15 分。
- [x] 高可疑度但仍存活：额外 +10 分。
- [x] 成功使用伪装摆脱狼：+5 分，单局最多 +20。
- [x] 中途断线：-30 分。

通用：

- [x] 胜利 + rating。
- [x] 失败 - rating。
- [x] 结算时同时更新 `player_stat` 和 `leaderboard_entry`。
- [x] MVP 可以先用简单加减分，不做 Elo。
- [x] 第二阶段可改为 Elo 或 Glicko。

### 10.2 排行榜类型

- [x] 总 rating 榜。
- [x] 总胜场榜。
- [x] 狼胜场榜。
- [x] 鹿生存时间榜。
- [x] 本周榜，后续加。
- [x] 好友榜，后续加。

### 10.3 前端展示

- [x] 大厅右侧显示排行榜 Top 10。
- [x] 可切换榜单类型。
- [x] 显示自己当前排名。
- [x] 排名项显示头像、昵称、分数、胜率。
- [x] 点击玩家可查看简易资料。
- [x] 如果未登录游客，仍可上榜，但昵称标记“游客”。

---

## 11. 前端匹配大厅设计

### 11.1 页面结构

```text
┌──────────────────────────────────────────────┐
│ WildHunt                                     │
│ 在线人数 / 当前赛季 / 我的昵称 / 设置          │
├───────────────┬──────────────────────────────┤
│ 快速开始       │ 房间列表                       │
│ [狼匹配]       │ 房间名 / 人数 / 状态 / 加入       │
│ [鹿匹配]       │ ...                            │
│ [新建房间]     │                                │
│ [邀请好友]     │                                │
├───────────────┴──────────────────────────────┤
│ 排行榜 Top 10 / 我的排名                       │
└──────────────────────────────────────────────┘
```

任务：

- [x] 新建 `lobby-page.ts`。
- [x] 默认进入大厅，不直接弹“选择阵营”。
- [x] 未登录时自动游客登录。
- [x] 大厅显示在线人数。
- [x] 大厅显示匹配队列人数。
- [x] 大厅显示公开房间列表。
- [x] 大厅显示排行榜。
- [x] 大厅有设置按钮。
- [x] 大厅有“开始本地调试”入口，可选，仅开发模式显示。

### 11.2 快速匹配按钮

- [x] `狼匹配` 按钮调用 queueType=WOLF。
- [x] `鹿匹配` 按钮调用 queueType=DEER。
- [x] 匹配中按钮变为“取消匹配”。
- [x] 显示等待时长。
- [x] 匹配成功自动进入房间页。
- [x] 匹配失败或取消显示 toast。

### 11.3 新建房间弹窗

字段：

- [x] 房间名。
- [x] 是否私密。
- [x] 最大人数，默认 10。
- [x] AI 鹿数量，默认 16。
- [x] 密码，可选。
- [x] 创建按钮。
- [x] 取消按钮。

校验：

- [x] 房间名 1-64 字符。
- [x] 最大人数 2-10。
- [x] AI 鹿数量 0-30。
- [x] 密码最长 32 字符。
- [x] 创建中禁用按钮。

### 11.4 房间等待页

页面内容：

- [x] 房间名。
- [x] 房间码。
- [x] 复制邀请链接按钮。
- [x] 成员列表。
- [x] 房主标记。
- [x] 准备状态。
- [x] 角色偏好选择：狼 / 鹿 / 自动。
- [x] 准备按钮。
- [x] 开始游戏按钮，只有房主可见。
- [x] 离开房间按钮。
- [x] 简易聊天，可选。

任务：

- [x] 新建 `room-page.ts` 或 `room-list.ts` 中扩展。
- [x] 进入房间后连接 `/ws/room`。
- [x] 成员变更实时刷新。
- [x] 准备状态实时刷新。
- [x] 房主开始后收到 `GAME_START` 进入游戏。

### 11.5 邀请好友

- [x] 大厅里有“邀请好友”入口。
- [x] 房间页里有“邀请好友”入口。
- [x] MVP 实现复制邀请链接。
- [x] MVP 实现站内好友邀请。
- [x] 预留微信邀请按钮。
- [x] 点击微信邀请时，如果未接 API，提示“微信邀请接口待接入”。
- [x] 邀请链接格式：`/invite/{inviteCode}`。
- [x] 打开邀请链接时自动接受邀请并进入房间。

### 11.6 删除旧标题文案

- [x] 全局搜索：`真假鹿捉迷藏原型`。
- [x] 删除或替换为 `WildHunt`。
- [x] 全局搜索：`荒野追猎 Three.js 原型`。
- [x] 替换为 `WildHunt Game Canvas` 或中文可访问描述。
- [x] 开始弹窗从“选择阵营”改为大厅入口。
- [x] 不再直接在首页显示“作为狼开始 / 作为鹿开始”作为主入口。
- [x] 开发调试模式可以保留本地单机开始按钮，但不能作为正式首页主流程。

---

## 12. 前端游戏联机改造

### 12.1 当前单机状态需要替换

- [x] 不再由前端固定 `REAL_DEER_COUNT`、`AI_DEER_COUNT` 决定联机玩家数量。
- [x] 从后端 `GAME_START` 消息读取：
  - [x] matchId
  - [x] roomId
  - [x] seed
  - [x] assignedRole
  - [x] players
  - [x] aiDeerCount
  - [x] gameConfig
- [x] 前端本地只负责渲染和预测。
- [x] 结算以服务端 `MATCH_END` 为准。
- [x] 狼是否抓到真人鹿由服务端确认。
- [x] 鹿是否被抓由服务端确认。
- [x] 气味、进食、伪装、扑咬技能由服务端确认后播放效果。

### 12.2 输入上报

- [x] 新建 `game-input.ts`。
- [x] 将键盘输入转换为 `InputCommand`。
- [x] 每条输入包含 seq。
- [x] 每条输入包含 moveAxis。
- [x] 每条输入包含 turnAxis。
- [x] 每条输入包含 sprint。
- [x] 技能输入只发送一次触发事件。
- [x] 每秒上报 20-30 次。
- [x] 如果 WebSocket 断开，停止正式对局输入。
- [x] 本地调试模式仍允许单机输入。

### 12.3 状态插值

- [x] 新建 `game-sync.ts`。
- [x] 维护 serverSnapshots ring buffer。
- [x] 渲染时使用 100ms 插值延迟。
- [x] 自己角色可以本地预测。
- [x] 其他玩家和 AI 鹿使用插值。
- [x] 如果服务器纠偏超过阈值，平滑拉回。
- [x] 瞬移阈值例如 4m。
- [x] 断线重连收到 `GAME_FULL_STATE` 后重建场景。

### 12.4 对局开始流程

- [x] 用户在房间点击准备。
- [x] 房主点击开始。
- [x] 后端创建 match。
- [x] 后端广播 `GAME_START`。
- [x] 前端销毁大厅 DOM 或隐藏。
- [x] 前端初始化 Three.js 场景。
- [x] 前端加载模型。
- [x] 前端按 seed 生成地形和 AI 鹿初始外观。
- [x] 前端连接 `/ws/game`。
- [x] 前端开始发送输入。
- [x] 前端等待服务端快照。
- [x] 收到第一帧快照后解除 loading。

### 12.5 对局结算流程

- [x] 服务端判断胜负。
- [x] 服务端写入 match / match_player / events。
- [x] 服务端更新 player_stat。
- [x] 服务端更新 leaderboard_entry。
- [x] 服务端广播 `MATCH_END`。
- [x] 前端展示结算弹窗。
- [x] 用户点击“返回房间”。
- [x] 房间状态回到 WAITING。
- [x] 成员可重新准备。

---

## 13. 好友与微信邀请预留

### 13.1 站内好友

- [x] 玩家可以搜索昵称。
- [x] 玩家可以发送好友请求。
- [x] 玩家可以接受好友请求。
- [x] 玩家可以删除好友。
- [x] 大厅显示好友在线状态。
- [x] 房间页可邀请在线好友。
- [x] 被邀请好友收到通知。
- [x] 点击通知进入房间。

### 13.2 微信好友预留

- [x] 定义接口 `WechatInviteClient`。
- [x] 方法：`createSharePayload(roomInvite)`。
- [x] 方法：`verifyCallback(payload)`，后续扩展。
- [x] MVP 不实现真实微信 API。
- [x] 前端点击“微信邀请”时调用后端生成分享 payload。
- [x] 如果未配置微信 appId，则返回 `WECHAT_NOT_CONFIGURED`。
- [x] 前端展示“微信接口待接入，已复制邀请链接”。
- [x] 后续接微信 JS-SDK 或小程序能力。

### 13.3 邀请安全

- [x] inviteCode 随机生成，避免可枚举。
- [x] 邀请过期。
- [x] 私密房间只允许邀请码或好友邀请进入。
- [x] 邀请接受时检查房间是否满。
- [x] 邀请接受时检查房间是否已开局。
- [x] 邀请接受时记录 accepted_at。
- [x] 邀请只用于加入房间，不自动加好友。
- [x] 用户可从同房间玩家发起好友申请。

---

## 14. 后端业务服务细节

### 14.1 `RoomService`

方法：

- [x] `createRoom(CreateRoomCommand command)`
- [x] `joinRoom(JoinRoomCommand command)`
- [x] `joinByCode(JoinByCodeCommand command)`
- [x] `leaveRoom(Long roomId, Long userId)`
- [x] `changeReady(Long roomId, Long userId, boolean ready)`
- [x] `changeRolePreference(Long roomId, Long userId, RolePreference preference)`
- [x] `startRoom(Long roomId, Long ownerUserId)`
- [x] `closeRoom(Long roomId, String reason)`
- [x] `getRoomDetail(Long roomId)`
- [x] `listPublicRooms(RoomQuery query)`

边界条件：

- [x] 房间不存在。
- [x] 房间已关闭。
- [x] 房间已开局。
- [x] 房间满员。
- [x] 密码错误。
- [x] 用户已在其他房间。
- [x] 非房主开始游戏。
- [x] 成员未准备。
- [x] 人数不足。
- [x] 并发开始游戏。

### 14.2 `MatchmakingService`

方法：

- [x] `joinQueue(userId, queueType)`
- [x] `cancelQueue(userId)`
- [x] `getQueueStatus(userId)`
- [x] `tryMatch()`
- [x] `createMatchedRoom(wolfUser, deerUsers)`

匹配逻辑：

- [x] 优先取等待最久狼。
- [x] 取最多 9 个等待最久鹿。
- [x] 如果鹿数量 >= 1，可创建房间，MVP 允许少人数开局。
- [x] 如果要强制更热闹，可设置至少 3 名鹿再匹配，MVP 默认 1。
- [x] 自动匹配用户可补狼或鹿短缺。
- [x] 匹配成功后清理 queue 状态。
- [x] 通过 WebSocket 推送匹配成功。

### 14.3 `GameMatchService`

方法：

- [x] `startMatch(roomId)`
- [x] `assignRoles(roomMembers)`
- [x] `createMatchPlayers(match, assignedMembers)`
- [x] `finishMatch(matchId, result)`
- [x] `recordEvent(matchId, event)`
- [x] `handlePlayerDisconnect(matchId, userId)`
- [x] `handlePlayerReconnect(matchId, userId)`

结算：

- [x] 计算胜利阵营。
- [x] 计算每个玩家得分。
- [x] 更新 match_player。
- [x] 更新 player_stat。
- [x] 更新 leaderboard_entry。
- [x] 广播 MATCH_END。

### 14.4 `RealtimeSessionService`

职责：

- [x] 维护 userId -> WebSocketSession。
- [x] 维护 roomId -> sessions。
- [x] 维护 matchId -> sessions。
- [x] 广播到大厅。
- [x] 广播到房间。
- [x] 广播到对局。
- [x] 断开时更新在线状态。
- [x] 重连时恢复订阅。
- [x] 心跳超时关闭连接。

### 14.5 `GameStateService`

职责：

- [x] 维护活跃对局内存状态。
- [x] 处理玩家输入。
- [x] 运行服务器 tick。
- [x] 计算技能结果。
- [x] 计算 AI 鹿。
- [x] 生成快照。
- [x] 判断胜负。
- [x] 把关键事件交给 `GameMatchService` 记录。

状态对象：

```java
class RuntimeMatchState {
    Long matchId;
    Long roomId;
    long seed;
    MatchStatus status;
    double timeLeft;
    Map<Long, RuntimePlayerState> players;
    List<RuntimeAiDeerState> aiDeer;
    List<RuntimeEvent> pendingEvents;
}
```

---

## 15. WebSocket 实时游戏规则细化

### 15.1 坐标与地图

- [x] 前端和后端使用相同 seed。
- [x] 服务端可以不复刻完整 Three.js 地形，但必须有简化碰撞/距离规则。
- [x] MVP 服务端碰撞先用 2D 圆形碰撞。
- [x] 前端复杂地形用于视觉。
- [x] 服务端判定以玩家水平位置和半径为主。
- [x] 后续再把地形采样算法共享到后端或导出地图碰撞数据。

### 15.2 狼技能

- [x] 狼移动。
- [x] 狼冲刺。
- [x] 狼扑咬。
- [x] 狼气味追踪一局一次。
- [x] 气味方向由服务端返回最近真人鹿的大致方向。
- [x] 服务端不直接暴露真人鹿精确位置给前端，返回方向向量和强度。
- [x] 前端根据方向生成气味粒子。
- [x] 扑咬命中由服务端判定距离、朝向、速度。
- [x] 命中真人鹿，真人鹿状态变 caught/dead。
- [x] 命中 AI 鹿，狼 mistakes +1。

### 15.3 鹿技能

- [x] 鹿移动。
- [x] 鹿小跑。
- [x] 鹿进食。
- [x] 鹿环顾。
- [x] 鹿伪装。
- [x] 进食恢复饥饿，由服务端确认。
- [x] 环顾返回狼大致方向和距离段。
- [x] 伪装降低被狼 AI 或判定锁定概率。
- [x] 鹿技能冷却由服务端维护。
- [x] 前端只展示技能动画和 UI。

### 15.4 AI 鹿

- [x] 服务端生成 AI 鹿 ID。
- [x] AI 鹿状态：wander/graze/look/startled/dead。
- [x] 服务端每 tick 或低频更新 AI 鹿。
- [x] 客户端插值 AI 鹿位置。
- [x] AI 鹿被狼咬到时广播 `AI_DEER_HIT`。
- [x] AI 鹿行为要与真人鹿相似，帮助伪装。

---

## 16. 前端 UI 任务清单

### 16.1 全局外观

- [x] 更新顶部标题为 `WildHunt`。
- [x] 删除“真假鹿捉迷藏原型”。
- [x] 删除或隐藏旧单机“选择阵营”作为主流程。
- [x] 新增大厅主页面。
- [x] 新增房间等待页。
- [x] 新增排行榜面板。
- [x] 新增好友邀请面板。
- [x] 新增通知 toast。
- [x] 新增 loading 状态。
- [x] 新增断线重连提示。

### 16.2 路由

页面：

- [x] `/`：大厅。
- [x] `/rooms/:roomId`：房间等待页。
- [x] `/invite/:inviteCode`：接受邀请。
- [x] `/game/:matchId`：游戏页。
- [x] `/leaderboard`：排行榜，可弹窗也可页面。
- [x] `/profile/:userId`：玩家资料，后续。

任务：

- [x] 如果仍是纯 TS，不引入复杂路由库，写简单 hash router。
- [x] 支持 `location.hash = "#/rooms/123"`。
- [x] 页面切换时清理旧 WebSocket 订阅。
- [x] 进入游戏页时隐藏大厅 DOM。
- [x] 退出游戏返回房间。

### 16.3 API 客户端

- [x] 新建 `http.ts`。
- [x] 封装 baseURL。
- [x] 自动带 JWT。
- [x] 401 时重新游客登录或跳回登录。
- [x] 统一处理 `ApiResponse`。
- [x] 网络错误 toast。
- [x] 支持 AbortController。

### 16.4 WebSocket 客户端

- [x] 新建 `ws-client.ts`。
- [x] 自动重连。
- [x] 心跳。
- [x] requestId 回调。
- [x] 订阅消息类型。
- [x] 断线状态 UI。
- [x] 重连成功后重新订阅当前 room/match。
- [x] 进入游戏时切换到 game channel。
- [x] 离开页面时关闭连接。

---

## 17. 清理当前游戏遗留问题

### 17.1 文案清理

- [x] 全局搜索并删除 `真假鹿捉迷藏原型`。
- [x] 全局搜索并替换 `荒野追猎 Three.js 原型`。
- [x] 全局搜索 `原型`，正式 UI 不再出现。
- [x] 全局搜索 `点击 攻击`，正式 UI 不再出现。
- [x] 全局搜索 `嗅探`，狼模式可以叫“气味追踪”，大厅不显示旧文案。
- [x] 更新 `aria-label`，保持可访问性。

### 17.2 瀑布/水面处理

- [x] 全局搜索 `waterfall`。
- [x] 全局搜索 `Waterfall`。
- [x] 全局搜索 `createWater`。
- [x] 如果仍看到水色几何体，先删除 `createWater(58, -48, 42)`。
- [x] 删除蓝色透明水面圆盘。
- [x] 保留地形低洼可以，但不要显示会切山的透明水面。
- [x] 后续如果重新做湖面，必须用真实湖盆地形和边界裁剪。

### 17.3 单机调试入口

- [x] 保留 `DEV_LOCAL_MODE`。
- [x] 开发环境可显示“本地单机调试”按钮。
- [x] 生产环境隐藏本地单机调试。
- [x] 本地调试不写排行榜。
- [x] 正式对局必须由后端房间启动。

---

## 18. 安全与防作弊

### 18.1 鉴权

- [x] JWT 登录。
- [x] 游客账号也有 JWT。
- [x] WebSocket 鉴权。
- [x] REST 鉴权。
- [x] 不信任客户端 userId。
- [x] userId 从 token 中取。

### 18.2 输入校验

- [x] 限制输入频率。
- [x] 限制速度。
- [x] 限制技能冷却。
- [x] 限制气味一局一次。
- [x] 限制扑咬距离。
- [x] 限制鹿技能冷却。
- [x] 检测位置异常跳跃。
- [x] 异常超过阈值记录 match_event。

### 18.3 房间权限

- [x] 只有房主可开始。
- [x] 只有房主可踢人。
- [x] 非房间成员不能订阅房间 WS。
- [x] 非对局成员不能订阅游戏 WS。
- [x] 私密房间只能邀请码加入。
- [x] 房间已开局不能加入。

### 18.4 数据库安全

- [x] 密码哈希存储。
- [x] 本地 root/123456 只用于 local profile。
- [x] 不提交真实密码。
- [x] 生产环境使用独立 MySQL 用户。
- [x] 生产环境最小权限。
- [x] 日志不打印 JWT。
- [x] 日志不打印数据库密码。

---

## 19. 测试计划

### 19.1 后端单元测试

- [x] `RoomServiceTest`
- [x] `MatchmakingServiceTest`
- [x] `GameMatchServiceTest`
- [x] `LeaderboardServiceTest`
- [x] `InviteServiceTest`
- [x] `FriendServiceTest`

覆盖场景：

- [x] 创建房间。
- [x] 加入房间。
- [x] 房间满员。
- [x] 房主离开。
- [x] 准备状态。
- [x] 非房主开始失败。
- [x] 开局角色分配。
- [x] 匹配成房。
- [x] 取消匹配。
- [x] 结算更新排行榜。
- [x] 邀请过期。
- [x] 接受邀请进入房间。

### 19.2 后端集成测试

- [x] 使用 test profile。
- [x] 使用测试数据库。
- [x] 测 REST API。
- [x] 测 WebSocket 连接。
- [x] 测断线重连。
- [x] 测并发加入房间。
- [x] 测并发开始游戏。
- [x] 测重复排队。

### 19.3 前端测试

- [x] 大厅渲染。
- [x] 游客登录。
- [x] 狼匹配按钮。
- [x] 鹿匹配按钮。
- [x] 取消匹配。
- [x] 新建房间。
- [x] 加入房间。
- [x] 准备状态。
- [x] 开始游戏。
- [x] 排行榜加载。
- [x] 邀请链接复制。
- [x] WebSocket 断线提示。
- [x] 删除旧文案检查。

### 19.4 手工联调

- [x] 打开 2 个浏览器窗口。
- [x] 两个游客登录。
- [x] A 新建房间。
- [x] B 用房间码加入。
- [x] A/B 准备。
- [x] A 开始游戏。
- [x] 确认 1 狼 1 鹿。
- [x] 确认 AI 鹿存在。
- [x] 确认狼输入只控制狼。
- [x] 确认鹿输入只控制鹿。
- [x] 确认服务端结算。
- [x] 确认排行榜更新。
- [x] 确认返回房间可再开一局。

### 19.5 构建检查

前端：

```powershell
cd D:\projects\wildhunt
npm install
npm run build
```

后端：

```powershell
cd D:\projects\wildhunt-admin
mvn clean test
mvn clean package
```

数据库：

- [x] 空库执行迁移成功。
- [x] 重复启动不重复建表失败。
- [x] 本地连接 root/123456 可用。
- [x] application-local.example.yml 不含真实生产密码。

---

## 20. 里程碑计划

### Milestone 0：准备与命名

- [x] 备份当前前端项目。
- [x] 新建 git 分支：`feature/fullstack-multiplayer-lobby`。
- [x] 将当前项目目录改为 `wildhunt`。
- [x] 修改 `package.json` 项目名。
- [x] 修改 `index.html` 标题。
- [x] 全局搜索删除“真假鹿捉迷藏原型”。
- [x] 创建同级目录 `wildhunt-admin`。
- [x] 写入本地环境文档。
- [x] 确认 JDK 路径可用。
- [x] 确认 Maven 路径可用。
- [x] 确认 MySQL 可用。

验收：

- [x] `npm run build` 通过。
- [x] `java -version` 显示 17。
- [x] `mvn -v` 使用指定 Maven。
- [x] 页面不再出现“真假鹿捉迷藏原型”。

### Milestone 1：后端骨架

- [x] 创建父 POM。
- [x] 创建四个后端模块。
- [x] 创建 Spring Boot 启动类。
- [x] 创建 local profile。
- [x] 集成 MyBatis-Plus。
- [x] 集成 MySQL。
- [x] 集成 Flyway 或 Liquibase。
- [x] 创建统一响应体。
- [x] 创建全局异常处理。
- [x] 创建健康检查接口：`GET /api/health`。

验收：

- [x] `mvn clean package` 通过。
- [x] `GET /api/health` 返回 OK。
- [x] 数据库能连接。
- [x] 迁移脚本能执行。

### Milestone 2：数据库闭合

- [x] 创建所有 V1 表。
- [x] 创建 Entity。
- [x] 创建 Mapper。
- [x] 创建枚举。
- [x] 创建基础 CRUD 测试。
- [x] 创建默认赛季。
- [x] 创建系统配置默认值。

验收：

- [x] 空库启动后自动建表。
- [x] 表索引存在。
- [x] 默认赛季存在。
- [x] 测试通过。

### Milestone 3：用户与游客登录

- [x] 实现游客登录。
- [x] 实现 JWT。
- [x] 实现用户资料接口。
- [x] 前端启动时自动游客登录。
- [x] 前端保存 token。
- [x] WebSocket 握手支持 token。

验收：

- [x] 打开前端自动有用户。
- [x] 刷新后仍是同一游客。
- [x] API 请求带 token。
- [x] 未登录 API 被拦截。

### Milestone 4：大厅和房间

- [x] 后端实现房间 API。
- [x] 后端实现大厅摘要 API。
- [x] 后端实现公开房间列表。
- [x] 前端实现大厅页。
- [x] 前端实现新建房间。
- [x] 前端实现房间等待页。
- [x] 前端实现加入房间。
- [x] 前端实现准备状态。
- [x] WebSocket 广播房间成员变化。

验收：

- [x] 两个浏览器可以进入同一房间。
- [x] 准备状态实时刷新。
- [x] 房主可开始按钮出现。
- [x] 房间列表实时更新或刷新可见。

### Milestone 5：匹配系统

- [x] 实现匹配队列表。
- [x] 实现狼匹配。
- [x] 实现鹿匹配。
- [x] 实现取消匹配。
- [x] 实现匹配成功创建房间。
- [x] 前端显示匹配中状态。
- [x] 匹配成功自动进入房间。

验收：

- [x] A 点狼匹配，B 点鹿匹配，可进入同一房间。
- [x] 取消匹配后不再被匹配。
- [x] 重复点击不会重复入队。
- [x] 匹配队列状态正确。

### Milestone 6：邀请和好友基础

- [x] 实现房间邀请码。
- [x] 实现复制邀请链接。
- [x] 实现接受邀请。
- [x] 实现好友申请。
- [x] 实现好友列表。
- [x] 实现站内邀请好友。
- [x] 预留微信邀请接口。

验收：

- [x] 复制链接打开后能进入房间。
- [x] 好友能收到邀请通知。
- [x] 微信按钮不报错，提示待接入。

### Milestone 7：开局与角色分配

- [x] 实现房主开始游戏。
- [x] 校验人数。
- [x] 校验准备状态。
- [x] 分配 1 狼，其余鹿。
- [x] 创建 game_match。
- [x] 创建 match_player。
- [x] 广播 GAME_START。
- [x] 前端进入游戏场景。
- [x] 前端按 assignedRole 设置 HUD。

验收：

- [x] 2-10 名真人都能开局。
- [x] 每局只有 1 狼。
- [x] 其他玩家都是鹿。
- [x] AI 鹿仍存在。
- [x] 前端自己的角色正确。

### Milestone 8：实时游戏同步 MVP

- [x] 建立 `/ws/game`。
- [x] 前端发送输入。
- [x] 服务端接收输入。
- [x] 服务端维护玩家位置。
- [x] 服务端广播快照。
- [x] 前端插值渲染其他玩家。
- [x] 实现断线重连。
- [x] 实现基本胜负事件。

验收：

- [x] 两个浏览器能看到彼此移动。
- [x] 狼和鹿位置同步。
- [x] 断线重连后恢复。
- [x] 服务端结算能触发前端结果弹窗。

### Milestone 9：技能服务端判定

- [x] 狼气味追踪由服务端判定方向。
- [x] 狼扑咬由服务端判定命中。
- [x] 鹿进食由服务端判定恢复。
- [x] 鹿环顾由服务端返回狼方向。
- [x] 鹿伪装影响狼 AI/锁定。
- [x] 技能事件写入 match_event。
- [x] 前端根据事件播放效果。

验收：

- [x] 狼气味不能无限使用。
- [x] 狼扑咬不能靠客户端作弊命中。
- [x] 鹿技能有服务端冷却。
- [x] 技能事件可在历史中看到。

### Milestone 10：排行榜与结算

- [x] 实现结算算法。
- [x] 更新 match_player。
- [x] 更新 player_stat。
- [x] 更新 leaderboard_entry。
- [x] 实现排行榜 API。
- [x] 前端大厅显示排行榜。
- [x] 前端结算显示得分变化。
- [x] 前端显示当前用户排名。

验收：

- [x] 完成一局后排行榜变化。
- [x] 胜负双方得分合理。
- [x] 玩家历史记录可查。
- [x] 大厅排行榜展示正常。

### Milestone 11：清理与体验优化

- [x] 删除瀑布和水色几何体。
- [x] 修复树叶描边。
- [x] 优化草、树密度。
- [x] 优化气味可读性。
- [x] 优化鹿技能反馈。
- [x] 优化远景泛白。
- [x] 保持性能。
- [x] 清理无用代码。
- [x] 拆分 `main.ts`。

验收：

- [x] 不再看到瀑布/水盘穿地形。
- [x] 树叶没有明显透明描边。
- [x] 鹿技能有明显作用。
- [x] 气味方向 0.5 秒内可读。
- [x] 画面不过曝。
- [x] 前端 build 通过。

### Milestone 12：最终联调

- [x] 10 个浏览器或模拟客户端进入同一房间。
- [x] 1 狼 9 鹿开局。
- [x] AI 鹿正常出现。
- [x] 技能同步正常。
- [x] 断线重连正常。
- [x] 排行榜更新正常。
- [x] 邀请链接正常。
- [x] 房间二次开局正常。
- [x] 后端无明显异常日志。
- [x] 前端无明显控制台错误。

验收：

- [x] 完整跑通 3 局。
- [x] 每局结算正确。
- [x] 数据库记录闭合。
- [x] 主要操作没有阻塞 bug。
- [x] 文档更新完成。

---

## 21. 给 Codex 的分阶段执行提示词

### 21.1 第一阶段提示词：项目重命名与后端骨架

```text
请基于当前项目执行第一阶段：项目重命名与后端骨架搭建。

要求：
1. 当前前端项目英文名统一为 wildhunt。
2. 修改 package.json name、index.html title、页面标题。
3. 全局删除“真假鹿捉迷藏原型”文案。
4. 在当前项目同级目录创建 wildhunt-admin。
5. wildhunt-admin 使用 JDK 17、Maven、Spring Boot、MyBatis-Plus、MySQL。
6. Maven 路径是 C:\apache-maven-3.9.10。
7. JDK 路径使用本机 Java 17 安装目录。
8. 后端采用单体多模块：wildhunt-common、wildhunt-dal、wildhunt-service、wildhunt-web。
9. 创建 /api/health。
10. 创建 application-local.example.yml。
11. 本地 MySQL 可使用 root/123456，但不要硬编码进 Java 代码，不要提交真实生产密码。
12. npm run build 和 mvn clean package 必须通过。
```

### 21.2 第二阶段提示词：数据库和基础账号

```text
请执行第二阶段：数据库表结构、迁移、游客登录。

要求：
1. 使用 MySQL 数据库 wildhunt。
2. 创建 wh_user、wh_user_auth_binding、wh_player_profile、wh_friend_relation、wh_friend_request、wh_room、wh_room_member、wh_room_invite、wh_match_queue、wh_game_match、wh_match_player、wh_match_event、wh_match_snapshot、wh_player_stat、wh_leaderboard_season、wh_leaderboard_entry、wh_notification、wh_system_config。
3. 所有表有 created_at、updated_at、deleted。
4. 使用 MyBatis-Plus Entity 和 Mapper。
5. 实现游客登录 POST /api/auth/guest。
6. 返回 JWT。
7. 前端启动时自动游客登录并保存 token。
8. 创建默认赛季 S0_PRESEASON。
9. 单元测试覆盖用户创建和默认 profile 创建。
10. mvn test 通过。
```

### 21.3 第三阶段提示词：大厅、房间、匹配

```text
请执行第三阶段：匹配大厅、房间、匹配队列。

要求：
1. 前端新增大厅页面，不再默认进入单机选择阵营。
2. 大厅包含狼匹配、鹿匹配、新建房间、房间列表、邀请好友、排行榜入口。
3. 后端实现大厅摘要、房间列表、新建房间、加入房间、离开房间、准备、开始游戏 API。
4. 实现狼匹配和鹿匹配。
5. 每个房间最多 10 名真人玩家。
6. 每局固定 1 名狼，其余真人为鹿。
7. AI 鹿数量作为 room.ai_deer_count 配置，默认 16，不占真人座位。
8. 房间通过 WebSocket 广播成员变化和准备状态。
9. 两个浏览器可以进入同一房间并看到对方。
10. 前后端 build/test 通过。
```

### 21.4 第四阶段提示词：WebSocket 对局同步

```text
请执行第四阶段：WebSocket 对局同步 MVP。

要求：
1. 新增 /ws/game。
2. 房主开始游戏后，后端创建 game_match 和 match_player。
3. 后端分配 1 狼，其余鹿，并广播 GAME_START。
4. 前端进入 Three.js 游戏场景，按服务端 assignedRole 初始化 HUD。
5. 客户端只发送输入 PLAYER_INPUT。
6. 服务端维护权威玩家状态。
7. 服务端 10-20Hz 广播 GAME_SNAPSHOT。
8. 前端插值渲染其他玩家。
9. 实现断线重连。
10. 服务端负责结算并广播 MATCH_END。
11. 当前本地单机逻辑保留为 DEV_LOCAL_MODE，不作为正式流程。
```

### 21.5 第五阶段提示词：排行榜、好友、邀请

```text
请执行第五阶段：排行榜、好友和邀请。

要求：
1. 实现房间邀请码和邀请链接。
2. 实现站内好友申请、好友列表、邀请好友进房。
3. 预留微信邀请接口，但不真实调用微信 API。
4. 实现排行榜赛季。
5. 对局结算更新 player_stat 和 leaderboard_entry。
6. 大厅展示排行榜 Top 10 和我的排名。
7. 玩家可以查看历史对局。
8. 邀请链接打开后自动加入房间。
9. 微信邀请按钮如果未配置，提示“微信接口待接入，已复制邀请链接”。
```

### 21.6 第六阶段提示词：游戏体验收口

```text
请执行第六阶段：游戏体验收口。

要求：
1. 全局删除“真假鹿捉迷藏原型”。
2. 全局移除瀑布和水色几何体，不再显示可穿越瀑布或蓝色水平水盘。
3. 检查 createWater/waterfall 相关代码，正式场景不调用。
4. 修复树叶透明描边和树叶阴影轮廓。
5. 提升树、草、灌木高低层次和密度，但保持性能。
6. 鹿技能必须有明确反馈和实际作用。
7. 气味效果要在 0.5 秒内看出方向，持续 8 秒以上。
8. 远景不要泛白，不靠高 Bloom 提亮。
9. 保持狼/鹿输入分离。
10. 保持碰撞和持续转向控制。
11. npm run build 通过。
```

---

## 22. Definition of Done

### 22.1 前端完成标准

- [x] 项目名为 `wildhunt`。
- [x] 首页进入匹配大厅。
- [x] 大厅有狼匹配。
- [x] 大厅有鹿匹配。
- [x] 大厅有新建房间。
- [x] 大厅有房间列表。
- [x] 大厅有邀请好友入口。
- [x] 大厅有排行榜。
- [x] 房间等待页可查看成员。
- [x] 房间等待页可准备。
- [x] 房主可开始。
- [x] 游戏场景按服务端角色启动。
- [x] 删除“真假鹿捉迷藏原型”。
- [x] 不显示可穿越瀑布或蓝色几何水盘。
- [x] `npm run build` 通过。

### 22.2 后端完成标准

- [x] 后端目录为 `wildhunt-admin`。
- [x] JDK 17 可运行。
- [x] Maven 可构建。
- [x] MySQL 可连接。
- [x] 多模块结构清晰。
- [x] 数据库表完整。
- [x] 游客登录可用。
- [x] JWT 鉴权可用。
- [x] 房间 API 可用。
- [x] 匹配 API 可用。
- [x] 邀请 API 可用。
- [x] 好友 API 可用。
- [x] 排行榜 API 可用。
- [x] WebSocket 房间广播可用。
- [x] WebSocket 游戏同步 MVP 可用。
- [x] `mvn clean package` 通过。

### 22.3 玩法完成标准

- [x] 一个房间最多 10 名真人玩家。
- [x] 每局固定 1 名狼。
- [x] 其他真人玩家为鹿。
- [x] AI 鹿正常出现并用于伪装。
- [x] 狼玩家只能使用狼技能。
- [x] 鹿玩家只能使用鹿技能。
- [x] 狼气味一局一次。
- [x] 狼扑咬由服务端判定。
- [x] 鹿进食、环顾、伪装由服务端判定。
- [x] 结算结果以服务端为准。
- [x] 排行榜更新正确。
- [x] 断线重连可恢复。

---

## 23. 风险与规避

### 23.1 实时同步复杂度风险

- [x] 风险：当前游戏大量逻辑在前端，直接服务端权威改造工作量大。
- [x] 规避：分两步做。
  - [x] 第一步：房间、角色、开局、结算由服务端负责。
  - [x] 第二步：移动和技能逐步迁移为服务端权威。
  - [x] 第三步：再做完整反作弊。

### 23.2 AI 鹿同步风险

- [x] 风险：AI 鹿太多会增加网络负担。
- [x] 规避：
  - [x] 服务端低频更新 AI 鹿。
  - [x] 客户端插值。
  - [x] 只同步附近或关键 AI 鹿。
  - [x] 远处 AI 鹿可由 seed 本地预测。

### 23.3 数据库压力风险

- [x] 风险：每帧写数据库会爆炸。
- [x] 规避：
  - [x] 不写每帧位置。
  - [x] 只写关键事件和结算。
  - [x] 快照低频写。

### 23.4 微信 API 风险

- [x] 风险：微信 API 资质、域名、JS-SDK 配置可能后续才有。
- [x] 规避：
  - [x] 先用邀请链接和站内好友。
  - [x] 抽象 `WechatInviteClient`。
  - [x] 后续替换实现。

### 23.5 Spring Boot 版本兼容风险

- [x] 风险：Spring Boot 4 与部分 starter 兼容性需要验证。
- [x] 规避：
  - [x] MVP 使用 Spring Boot 3.5.x。
  - [x] 依赖稳定后再评估升级 4.x。
  - [x] 版本统一写在父 POM。

---

## 24. 交付清单

- [x] `wildhunt` 前端项目。
- [x] `wildhunt-admin` 后端项目。
- [x] `wildhunt-admin/docs/db/V1__init_schema.sql`。
- [x] `wildhunt-admin/docs/api/rest-api.md`。
- [x] `wildhunt-admin/docs/api/websocket-protocol.md`。
- [x] `wildhunt-admin/docs/ops/local-run.md`。
- [x] 前端大厅页面。
- [x] 前端房间页面。
- [x] 前端排行榜页面/面板。
- [x] 前端邀请好友面板。
- [x] 后端健康检查。
- [x] 后端游客登录。
- [x] 后端房间 API。
- [x] 后端匹配 API。
- [x] 后端邀请 API。
- [x] 后端好友 API。
- [x] 后端排行榜 API。
- [x] 后端 WebSocket。
- [x] 前端 WebSocket 客户端。
- [x] 端到端联调记录。
- [x] 构建通过截图或日志。

---

## 25. 最终验收脚本

### 25.1 后端启动

```powershell
cd D:\projects\wildhunt-admin

$env:JAVA_HOME = "<path-to-jdk-17>"
$env:MAVEN_HOME = "C:\apache-maven-3.9.10"
$env:Path = "$env:JAVA_HOME\bin;$env:MAVEN_HOME\bin;$env:Path"
$env:MYSQL_USERNAME = "root"
$env:MYSQL_PASSWORD = "123456"

mvn clean test
mvn -pl wildhunt-web spring-boot:run -Dspring-boot.run.profiles=local
```

### 25.2 前端启动

```powershell
cd D:\projects\wildhunt
npm install
npm run dev
```

### 25.3 验收流程

- [x] 浏览器 A 打开前端。
- [x] 浏览器 B 打开前端。
- [x] 两边自动游客登录。
- [x] A 新建公开房间。
- [x] B 在大厅看到房间。
- [x] B 加入房间。
- [x] A/B 设置准备。
- [x] A 开始游戏。
- [x] A/B 看到不同角色。
- [x] 如果 A 是狼，B 是鹿；或者相反。
- [x] 两边能看到对方移动。
- [x] 狼可以使用气味。
- [x] 狼可以扑咬。
- [x] 鹿可以进食、环顾、伪装。
- [x] 游戏能结算。
- [x] 结算后排行榜更新。
- [x] 返回房间可再开一局。
- [x] 页面没有“真假鹿捉迷藏原型”。
- [x] 页面没有可穿越瀑布。
- [x] 控制台无严重错误。
- [x] 后端无严重异常日志。

---

## 26. 备注

- [x] 本文是开发计划，不要求一次性全部完成。
- [x] 推荐顺序：项目命名 → 后端骨架 → 数据库 → 登录 → 大厅 → 房间 → 匹配 → WebSocket → 游戏同步 → 排行榜 → 好友邀请 → 体验收口。
- [x] 每个里程碑完成后都要单独提交 git commit。
- [x] 每次让 Codex 做任务时，只复制对应阶段提示词，避免一次性改太多。
- [x] 如果 Codex 大范围重构 `main.ts`，必须先保证 `npm run build` 通过。
- [x] 如果后端数据库表需要调整，优先追加迁移脚本，不要手改已执行的生产迁移。

