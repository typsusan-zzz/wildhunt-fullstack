FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /workspace
COPY pom.xml .
COPY wildhunt-common ./wildhunt-common
COPY wildhunt-dal ./wildhunt-dal
COPY wildhunt-service ./wildhunt-service
COPY wildhunt-web ./wildhunt-web
RUN mvn -DskipTests package

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /workspace/wildhunt-web/target/wildhunt-web-*.jar /app/wildhunt-web.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/wildhunt-web.jar"]
