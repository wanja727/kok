package app.retrievo.auth;

import app.retrievo.common.ServiceDates;
import java.time.Clock;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** "나" 화면의 프로필. 로그인 수단(카카오 등)이 붙으면 연결된 계정도 여기에 더한다 (ADR-010) */
@RestController
public class MeController {

    private final JdbcClient jdbc;
    private final Clock clock;

    MeController(JdbcClient jdbc, Clock clock) {
        this.jdbc = jdbc;
        this.clock = clock;
    }

    /** joinedOn: 가입한 서비스 날짜(KST 04시 기준). days: 가입한 날을 1일째로 센 오늘 */
    public record Me(long id, String nickname, LocalDate joinedOn, long days) {
    }

    @GetMapping("/api/me")
    public Me me(@CurrentUser long userId) {
        LocalDate today = ServiceDates.today(clock);
        return jdbc.sql("select id, nickname, created_at from users where id = ?")
                .param(userId)
                .query((rs, n) -> {
                    LocalDate joined = ServiceDates.of(rs.getTimestamp("created_at").toInstant());
                    return new Me(rs.getLong("id"), rs.getString("nickname"), joined,
                            ChronoUnit.DAYS.between(joined, today) + 1);
                })
                .single();
    }
}
