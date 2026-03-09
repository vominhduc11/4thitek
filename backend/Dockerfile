FROM maven:3.9.8-eclipse-temurin-17 AS builder

WORKDIR /app

COPY pom.xml ./
RUN mvn -B -DskipTests dependency:go-offline

COPY src ./src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:17-jre-alpine AS runner

WORKDIR /app

RUN addgroup -S spring && adduser -S spring -G spring \
    && mkdir -p /app/uploads \
    && chown -R spring:spring /app

COPY --from=builder /app/target/*.jar /app/app.jar

ENV SERVER_PORT=8080
ENV SPRING_H2_CONSOLE_ENABLED=false
ENV APP_SEED_DEMO_DATA=false
ENV UPLOAD_DIR=/app/uploads
ENV UPLOAD_BASE_URL=/uploads

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=5 \
  CMD wget -qO- http://localhost:8080/actuator/health >/dev/null || exit 1

USER spring

CMD ["java", "-jar", "/app/app.jar"]
