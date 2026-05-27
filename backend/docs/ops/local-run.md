# Local Run

```powershell
$env:JAVA_HOME = "<path-to-jdk-17>"
$env:MAVEN_HOME = "<path-to-maven>"
$env:Path = "$env:JAVA_HOME\bin;$env:MAVEN_HOME\bin;$env:Path"
$env:MYSQL_USERNAME = "root"
$env:MYSQL_PASSWORD = "<local-mysql-password>"

java -version
mvn -v
```

```sql
CREATE DATABASE IF NOT EXISTS wildhunt
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;
```

```powershell
cd <repo-root>\backend
mvn clean package
java -jar .\wildhunt-web\target\wildhunt-web-0.1.0-SNAPSHOT.jar
```

Or run the web module directly:

```powershell
cd <repo-root>\backend\wildhunt-web
mvn spring-boot:run
```
