package app.retrievo.learning;

import app.retrievo.common.ServiceDates;
import app.retrievo.content.QuestionCatalog;
import app.retrievo.content.QuestionCatalog.GradableQuestion;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * 답안 제출 (가장 중요한 쓰기 경로). 한 트랜잭션 안에서 채점 → 제출 기록 → 개념 진행 상태 갱신.
 * 레슨 답은 배운 날 기준(판정 문제 모두 정답)을 세고, 지연 확인 답은 단계를 올리거나 내린다. 연습 답은 기록만 한다
 * (ADR-017, ADR-021, {@link ReviewSchedule}).
 * XP·스트릭은 2주차에 이 트랜잭션에 더한다.
 */
@Service
class SubmissionService {

    private final AnswerSubmissionRepository submissions;
    private final QuestionCatalog catalog;
    private final ConceptProgresses progresses;
    private final Clock clock;

    SubmissionService(AnswerSubmissionRepository submissions, QuestionCatalog catalog,
            ConceptProgresses progresses, Clock clock) {
        this.submissions = submissions;
        this.catalog = catalog;
        this.progresses = progresses;
        this.clock = clock;
    }

    @Transactional
    public SubmissionResult submit(long userId, SubmitRequest request) {
        Optional<AnswerSubmission> existing =
                submissions.findByUserIdAndClientSubmissionId(userId, request.clientSubmissionId());
        if (existing.isPresent()) {
            return toResult(existing.get());
        }

        GradableQuestion question = catalog.findGradable(request.questionVersionId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "풀 수 있는 문제가 아니다"));
        String selected = Grading.normalize(question, request.selected());
        boolean correct = selected.equals(question.answer());

        Instant now = clock.instant();
        LocalDate today = ServiceDates.of(now);
        SubmissionMode mode = request.modeOrDefault();
        boolean delayedCheck = mode == SubmissionMode.DELAYED_CHECK;
        // 지연 확인 답은 그날의 측정이라 늘 첫 시도. 연습은 첫 시도가 아니다. 레슨은 이 문제를 처음 푼 답일 때만
        boolean firstAttempt = switch (mode) {
            case DELAYED_CHECK -> true;
            case PRACTICE -> false;
            case LESSON -> !progresses.answeredBefore(userId, question.versionId());
        };

        // 제출 기록을 먼저 넣는다. 같은 제출이 동시에 오면 여기서 유니크 제약에 걸려 뒤의 작업을 하지 않는다
        AnswerSubmission submission = submissions.saveAndFlush(new AnswerSubmission(
                userId, question.versionId(), request.clientSubmissionId(), selected,
                request.confidence(), correct, delayedCheck, firstAttempt, today, now));

        if (mode == SubmissionMode.PRACTICE) {
            // 연습은 기록만 한다. 배운 적 없는 개념은 연습할 수 없다 (레슨에서 배운다)
            if (!progresses.learned(userId, question.conceptId())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "아직 배우는 중인 개념은 레슨에서 푼다");
            }
        } else if (delayedCheck) {
            ConceptProgresses.Scheduled scheduled = progresses.lockDue(userId, question.conceptId(), today)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT,
                            "이 개념은 오늘 지연 확인이 예정되어 있지 않다"));
            ReviewSchedule.Next next =
                    ReviewSchedule.afterCheck(scheduled.stage(), correct, request.confidence(), today);
            progresses.recordCheck(userId, question.conceptId(), scheduled, next, correct, question.versionId(), now);
        } else {
            progresses.recordLessonAnswer(userId, question.conceptId(), correct, today, now);
        }

        return toResult(submission, question);
    }

    @Transactional(readOnly = true)
    public Optional<SubmissionResult> findExisting(long userId, UUID clientSubmissionId) {
        return submissions.findByUserIdAndClientSubmissionId(userId, clientSubmissionId).map(this::toResult);
    }

    private SubmissionResult toResult(AnswerSubmission submission) {
        GradableQuestion question = catalog.findAnswered(submission.getQuestionVersionId()).orElseThrow();
        return toResult(submission, question);
    }

    private static SubmissionResult toResult(AnswerSubmission submission, GradableQuestion question) {
        return new SubmissionResult(
                submission.getId(),
                submission.isCorrect(),
                submission.getSelected(),
                question.answer(),
                submission.getConfidence(),
                question.explanation(),
                question.sourceUrl(),
                submission.isDelayedCheck());
    }
}
