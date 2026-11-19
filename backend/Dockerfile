# 운영 이미지 (Cloud Run). 빌드: docker build -t retrievo-api backend
# content/에 dev-lessons의 문제 파일(content/questions)을 넣고 빌드하면 시작할 때 가져온다. 비어 있으면 건너뛴다

FROM eclipse-temurin:21-jdk AS build
WORKDIR /src
COPY gradlew settings.gradle build.gradle ./
COPY gradle gradle
# 의존성만 먼저 받아 레이어 캐시를 쓴다
RUN sh ./gradlew --no-daemon dependencies > /dev/null
COPY src src
RUN sh ./gradlew --no-daemon bootJar && cp build/libs/*.jar app.jar

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd --system --uid 10001 retrievo
COPY --from=build /src/app.jar app.jar
COPY content/ content/
USER retrievo
ENV SPRING_PROFILES_ACTIVE=prod \
    JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:+UseSerialGC -XX:TieredStopAtLevel=1"
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
