package app.kok.learning;

import app.kok.auth.CurrentUser;
import app.kok.common.ServiceDates;
import app.kok.content.LessonQueryService;
import app.kok.content.QuestionView;
import java.time.Clock;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DelayedCheckController {

    private final DelayedChecks delayedChecks;
    private final LessonQueryService lessons;
    private final Clock clock;

    DelayedCheckController(DelayedChecks delayedChecks, LessonQueryService lessons, Clock clock) {
        this.delayedChecks = delayedChecks;
        this.lessons = lessons;
        this.clock = clock;
    }

    /** 오늘 확인할 개념과, 개념마다 처음과 다른 문제 하나. 답은 mode=DELAYED_CHECK로 제출한다 */
    public record TodayCheck(long conceptId, String conceptName, int attemptNo, LocalDate dueDate,
            QuestionView question) {
    }

    @GetMapping("/api/me/delayed-checks/today")
    public List<TodayCheck> today(@CurrentUser long userId) {
        LocalDate today = ServiceDates.today(clock);
        return delayedChecks.due(userId, today).stream()
                .sorted(Comparator.comparing(DelayedChecks.Due::dueDate).thenComparing(DelayedChecks.Due::conceptId))
                .map(due -> toCheck(userId, due))
                .flatMap(Optional::stream)
                .toList();
    }

    private Optional<TodayCheck> toCheck(long userId, DelayedChecks.Due due) {
        return lessons.questionForDelayedCheck(userId, due.conceptId())
                .map(q -> new TodayCheck(due.conceptId(), due.conceptName(), due.attemptNo(), due.dueDate(), q));
    }
}
