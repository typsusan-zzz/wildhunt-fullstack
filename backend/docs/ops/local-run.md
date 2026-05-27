# Local Run

Run from the fullstack repository root unless a command says otherwise.

```powershell
$env:JAVA_HOME = "<path-to-jdk-17>"
$env:MAVEN_HOME = "<path-to-maven>"
$env:Path = "$env:JAVA_HOME\bin;$env:MAVEN_HOME\bin;$env:Path"
$env:MYSQL_URL = "jdbc:mysql://localhost:3306/wildhunt?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&useSSL=false&allowPublicKeyRetrieval=true"
$env:MYSQL_USERNAME = "root"
$env:MYSQL_PASSWORD = "<local-mysql-password>"
$env:WILDHUNT_JWT_SECRET = "replace-with-a-local-secret"

java -version
mvn -v
```

```sql
CREATE DATABASE IF NOT EXISTS wildhunt
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;
```

Database setup options:

- Empty database: set `SPRING_FLYWAY_ENABLED=true` and let Flyway apply `backend/wildhunt-web/src/main/resources/db/migration/`.
- Full local snapshot: import `backend/docs/init_sql/wildhunt.sql`, then keep `SPRING_FLYWAY_ENABLED=false` when starting the backend.

```powershell
Get-Content -Encoding UTF8 .\backend\docs\init_sql\wildhunt.sql | mysql --default-character-set=utf8mb4 -u root -p wildhunt
```

```powershell
cd <repo-root>\backend
$env:SPRING_FLYWAY_ENABLED = "true" # Use false after importing backend/docs/init_sql/wildhunt.sql.
mvn clean package
java -jar .\wildhunt-web\target\wildhunt-web-0.1.0-SNAPSHOT.jar
```

Or run the web module directly:

```powershell
cd <repo-root>\backend\wildhunt-web
mvn spring-boot:run
```
