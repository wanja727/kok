package app.kok.support;

import java.time.Instant;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

/**
 * 통합 테스트 기반. 실제 PostgreSQL(Testcontainers)에 Flyway 마이그레이션을 적용한 상태에서 돈다.
 * 테스트마다 모든 테이블을 비우고, 시각은 2026-11-17 10:00 KST에서 시작한다.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import({TestcontainersConfig.class, IntegrationTest.ClockOverride.class})
public abstract class IntegrationTest {

    public static final Instant START = Instant.parse("2026-11-17T01:00:00Z");

    @Autowired
    protected JdbcTemplate jdbc;

    @Autowired
    protected MutableClock clock;

    @BeforeEach
    void resetDatabaseAndClock() {
        jdbc.execute("""
                truncate table concept_progress, delayed_check, answer_submission, question_version, question,
                    concept, lesson, unit, subject, user_identity, users
                restart identity cascade
                """);
        clock.set(START);
    }

    protected long createUser(String nickname) {
        return jdbc.queryForObject(
                "insert into users (nickname) values (?) returning id", Long.class, nickname);
    }

    @TestConfiguration(proxyBeanMethods = false)
    static class ClockOverride {

        @Bean
        @Primary
        MutableClock mutableClock() {
            return new MutableClock(START);
        }
    }
}
