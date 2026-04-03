# ─── Stage 1: resolve dependencies (cached unless pom.xml changes) ────────────
FROM maven:3.9-eclipse-temurin-21-alpine AS deps
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -q

# ─── Stage 2: build ───────────────────────────────────────────────────────────
FROM deps AS build
COPY src ./src
RUN mvn package -DskipTests -q

# ─── Stage 3: run (minimal JRE image) ─────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
