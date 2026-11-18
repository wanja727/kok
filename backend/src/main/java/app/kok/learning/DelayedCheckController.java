package app.kok.learning;

import app.kok.auth.CurrentUser;
import app.kok.common.ServiceDates;
import app.kok.content.LessonQueryService;
import app.kok.content.QuestionView;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DelayedCheckController {

    private final ConceptProgresses progresses;
    private final LessonQueryService lessons;
    private final Clock clock;

    DelayedCheckController(ConceptProgresses progresses, LessonQueryService lessons, Clock clock) {
        this.progresses = progresses;
        this.lessons = lessons;
        this.clock = clock;
    }

    /**
     * 오늘 확인할 개념과, 개념마다 처음과 다른 문제 하나. 답은 mode=DELAYED_CHECK로 제출한다.
     * attemptNo: 이번 확인 전까지 통과한 확인 수(1~3). 1이면 3일, 2면 7일, 3이면 21일 확인이다.
     * 통과하면 이 수가 하나 늘고, 4가 되면 졸업이다 (ADR-017)
     * sureWrong: 지난 확인에서 확실했는데 틀려서 다음 날 다시 묻는 개념. 목록 맨 앞에 온다
     */
    public record TodayCheck(long conceptId, String conceptName, int attemptNo, LocalDate dueDate,
            LocalDate learnedOn, boolean sureWrong, QuestionView question) {
    }

    @GetMapping("/api/me/delayed-checks/today")
    public List<TodayCheck> today(@CurrentUser long userId) {
        LocalDate today = ServiceDates.today(clock);
        return progresses.due(userId, today).stream()
                .map(due -> toCheck(userId, due))
                .flatMap(Optional::stream)
                .toList();
    }

    /**
     * 풀어 본 개념의 진행 상태. stage: 통과한 확인 수(0 = 배우는 중, 4 = 졸업). dueDate: 다음 확인 날.
     * 레슨별 이해도와 졸업 화면이 쓴다
     */
    public record ConceptStatus(long conceptId, String conceptName, long lessonId, String lessonTitle, int stage,
            boolean graduated, LocalDate learnedOn, LocalDate dueDate, boolean sureWrong, Instant graduatedAt) {
    }

    @GetMapping("/api/me/concepts")
    public List<ConceptStatus> concepts(@CurrentUser long userId) {
        return progresses.all(userId).stream()
                .map(p -> new ConceptStatus(p.conceptId(), p.conceptName(), p.lessonId(), p.lessonTitle(),
                        p.stage(), p.stage() == ReviewSchedule.GRADUATED, p.learnedOn(), p.dueDate(),
                        p.sureWrong(), p.graduatedAt()))
                .toList();
    }

    private Optional<TodayCheck> toCheck(long userId, ConceptProgresses.Due due) {
        return lessons.questionForDelayedCheck(userId, due.conceptId())
                .map(q -> new TodayCheck(due.conceptId(), due.conceptName(), due.stage(), due.dueDate(),
                        due.learnedOn(), due.sureWrong(), q));
    }
}
