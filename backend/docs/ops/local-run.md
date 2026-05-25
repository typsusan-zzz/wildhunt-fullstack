# Local Run

```powershell
$env:JAVA_HOME = "C:\Users\ZhuanZ1\.jdks\ms-17.0.19"
$env:MAVEN_HOME = "C:\apache-maven-3.9.10"
$env:Path = "$env:JAVA_HOME\bin;$env:MAVEN_HOME\bin;$env:Path"
$env:MYSQL_USERNAME = "root"
$env:MYSQL_PASSWORD = "123456"

java -version
mvn -v
```

```sql
CREATE DATABASE IF NOT EXISTS wildhunt
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;
```

```powershell
cd D:\工作\game_work\wildhunt-admin
mvn clean package
java -jar .\wildhunt-web\target\wildhunt-web-0.1.0-SNAPSHOT.jar
```

Or run the web module directly:

```powershell
cd D:\工作\game_work\wildhunt-admin\wildhunt-web
mvn spring-boot:run
```
