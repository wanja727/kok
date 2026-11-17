package app.kok.learning;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/**
 * 지연 확인 저장소. 개념을 처음 푼 날 기준 3일 뒤(attempt 1), 7일 뒤(attempt 2)에 다시 묻는다.
 * 행의 키가 (사용자, 개념, 회차)라서 같은 개념을 여러 번 풀어도 일정은 처음 한 번만 잡힌다.
 */
@Repository
class DelayedChecks {

    static final int FIRST_DAYS = 3;
    static final int SECOND_DAYS = 7;

    private final JdbcClient jdbc;

    DelayedChecks(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    record Due(long conceptId, String conceptName, int attemptNo, LocalDate dueDate) {
    }

    /** 처음 푼 개념이면 3일·7일 뒤 확인을 잡는다. 이미 잡혀 있으면 그대로 둔다 */
    void scheduleIfFirst(long userId, long conceptId, LocalDate today) {
        jdbc.sql("""
                        insert into delayed_check (user_id, concept_id, attempt_no, due_date)
                        values (?, ?, 1, ?), (?, ?, 2, ?)
                        on conflict do nothing
                        """)
                .params(userId, conceptId, today.plusDays(FIRST_DAYS),
                        userId, conceptId, today.plusDays(SECOND_DAYS))
                .update();
    }

    /** 오늘까지 예정된 확인 중 가장 앞 회차에 결과를 남긴다. 예정된 확인이 없으면 비어 있다 */
    Optional<Integer> complete(long userId, long conceptId, LocalDate today, long questionVersionId,
            boolean correct, Instant now) {
        return jdbc.sql("""
                        update delayed_check
                        set result = ?, checked_at = ?, question_version_id = ?
                        where user_id = ? and concept_id = ? and attempt_no = (
                            select min(attempt_no) from delayed_check
                            where user_id = ? and concept_id = ? and result is null and due_date <= ?
                        )
                        returning attempt_no
                        """)
                .params(correct ? "CORRECT" : "WRONG", java.sql.Timestamp.from(now), questionVersionId,
                        userId, conceptId, userId, conceptId, today)
                .query(Integer.class)
                .optional();
    }

    /** 오늘 확인할 개념. 두 회차가 모두 밀려 있으면 앞 회차만 보여준다 */
    List<Due> due(long userId, LocalDate today) {
        return jdbc.sql("""
                        select distinct on (dc.concept_id) dc.concept_id, c.name, dc.attempt_no, dc.due_date
                        from delayed_check dc join concept c on c.id = dc.concept_id
                        where dc.user_id = ? and dc.result is null and dc.due_date <= ?
                        order by dc.concept_id, dc.attempt_no
                        """)
                .params(userId, today)
                .query((rs, n) -> new Due(
                        rs.getLong("concept_id"), rs.getString("name"),
                        rs.getInt("attempt_no"), rs.getObject("due_date", LocalDate.class)))
                .list();
    }
}
