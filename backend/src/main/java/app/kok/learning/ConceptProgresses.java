package app.kok.learning;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/**
 * 사용자별 개념 진행 상태(concept_progress)와 확인 기록(delayed_check). 단계 계산은 {@link ReviewSchedule}이 한다.
 * 같은 사용자의 같은 개념에 답이 동시에 와도 단계가 두 번 오르지 않도록 진행 상태 행을 잠그고 바꾼다.
 */
@Repository
class ConceptProgresses {

    private final JdbcClient jdbc;

    ConceptProgresses(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    /** 오늘 확인할 개념. learnedOn은 배운 날 기준을 통과한 날 */
    record Due(long conceptId, String conceptName, int stage, LocalDate dueDate, LocalDate learnedOn,
            boolean sureWrong) {
    }

    /** 개념 하나의 진행 상태 (레슨·기록 화면용) */
    record Progress(long conceptId, String conceptName, long lessonId, String lessonTitle, int stage,
            LocalDate learnedOn, LocalDate dueDate, boolean sureWrong, Instant graduatedAt) {
    }

    /**
     * 레슨에서 낸 답을 반영한다. 처음 푼 개념이면 배우는 중(0단계)으로 만들고,
     * 배우는 중인 개념을 오늘 3번 맞혔으면 1단계로 올려 3일 뒤 확인을 잡는다.
     * 이미 1단계 이상인 개념은 레슨에서 다시 풀어도 일정이 바뀌지 않는다.
     */
    void recordLessonAnswer(long userId, long conceptId, boolean correct, LocalDate today, Instant now) {
        jdbc.sql("""
                        insert into concept_progress (user_id, concept_id, stage, updated_at)
                        values (?, ?, 0, ?)
                        on conflict do nothing
                        """)
                .params(userId, conceptId, Timestamp.from(now))
                .update();
        if (!correct) {
            return;
        }
        int stage = lockStage(userId, conceptId);
        if (stage != ReviewSchedule.LEARNING) {
            return;
        }
        // 방금 저장한 이 답도 센다 (같은 트랜잭션)
        int correctToday = jdbc.sql("""
                        select count(*) from answer_submission s
                        join question_version v on v.id = s.question_version_id
                        join question q on q.id = v.question_id
                        where s.user_id = ? and q.concept_id = ? and s.service_date = ?
                          and s.correct and not s.is_delayed_check
                        """)
                .params(userId, conceptId, today)
                .query(Integer.class)
                .single();
        if (correctToday >= ReviewSchedule.CORRECT_TO_LEARN) {
            ReviewSchedule.Next next = ReviewSchedule.learned(today);
            jdbc.sql("""
                            update concept_progress
                            set stage = ?, learned_on = ?, due_date = ?, sure_wrong = false, updated_at = ?
                            where user_id = ? and concept_id = ?
                            """)
                    .params(next.stage(), today, next.dueDate(), Timestamp.from(now), userId, conceptId)
                    .update();
        }
    }

    /** 잠근 재확인 대상. stage는 확인 전 단계(1~3) */
    record Scheduled(int stage, LocalDate dueDate) {
    }

    /** 오늘까지 확인이 예정된 개념이면 잠그고 현재 단계와 예정일을 돌려준다 */
    Optional<Scheduled> lockDue(long userId, long conceptId, LocalDate today) {
        return jdbc.sql("""
                        select stage, due_date from concept_progress
                        where user_id = ? and concept_id = ? and due_date <= ?
                        for update
                        """)
                .params(userId, conceptId, today)
                .query((rs, n) -> new Scheduled(rs.getInt("stage"), rs.getObject("due_date", LocalDate.class)))
                .optional();
    }

    /** 재확인 결과를 반영하고 확인 기록을 남긴다 */
    void recordCheck(long userId, long conceptId, Scheduled before, ReviewSchedule.Next next, boolean correct,
            long questionVersionId, Instant now) {
        jdbc.sql("""
                        update concept_progress
                        set stage = ?, due_date = ?, sure_wrong = ?, updated_at = ?,
                            graduated_at = case when ? then ? else graduated_at end
                        where user_id = ? and concept_id = ?
                        """)
                .params(next.stage(), next.dueDate(), next.sureWrong(), Timestamp.from(now),
                        next.graduated(), Timestamp.from(now), userId, conceptId)
                .update();
        jdbc.sql("""
                        insert into delayed_check
                            (user_id, concept_id, attempt_no, due_date, result, checked_at, question_version_id, stage_after)
                        values (?, ?, ?, ?, ?, ?, ?, ?)
                        """)
                .params(userId, conceptId, before.stage(), before.dueDate(), correct ? "CORRECT" : "WRONG",
                        Timestamp.from(now), questionVersionId, next.stage())
                .update();
    }

    /** 오늘 확인할 개념. 확실했는데 틀린 개념을 먼저, 그다음 오래 밀린 순 */
    List<Due> due(long userId, LocalDate today) {
        return jdbc.sql("""
                        select p.concept_id, c.name, p.stage, p.due_date, p.learned_on, p.sure_wrong
                        from concept_progress p join concept c on c.id = p.concept_id
                        where p.user_id = ? and p.due_date <= ?
                        order by p.sure_wrong desc, p.due_date, p.concept_id
                        """)
                .params(userId, today)
                .query((rs, n) -> new Due(
                        rs.getLong("concept_id"), rs.getString("name"), rs.getInt("stage"),
                        rs.getObject("due_date", LocalDate.class), rs.getObject("learned_on", LocalDate.class),
                        rs.getBoolean("sure_wrong")))
                .list();
    }

    /** 사용자가 풀어 본 모든 개념의 진행 상태. 레슨 순서대로 */
    List<Progress> all(long userId) {
        return jdbc.sql("""
                        select p.concept_id, c.name, l.id as lesson_id, l.title as lesson_title, p.stage,
                               p.learned_on, p.due_date, p.sure_wrong, p.graduated_at
                        from concept_progress p
                        join concept c on c.id = p.concept_id
                        join lesson l on l.id = c.lesson_id
                        join unit u on u.id = l.unit_id
                        where p.user_id = ?
                        order by u.sort_order, l.sort_order, l.id, c.id
                        """)
                .param(userId)
                .query((rs, n) -> {
                    Timestamp graduatedAt = rs.getTimestamp("graduated_at");
                    return new Progress(
                            rs.getLong("concept_id"), rs.getString("name"), rs.getLong("lesson_id"),
                            rs.getString("lesson_title"), rs.getInt("stage"),
                            rs.getObject("learned_on", LocalDate.class), rs.getObject("due_date", LocalDate.class),
                            rs.getBoolean("sure_wrong"), graduatedAt == null ? null : graduatedAt.toInstant());
                })
                .list();
    }

    private int lockStage(long userId, long conceptId) {
        return jdbc.sql("select stage from concept_progress where user_id = ? and concept_id = ? for update")
                .params(userId, conceptId)
                .query(Integer.class)
                .single();
    }
}
