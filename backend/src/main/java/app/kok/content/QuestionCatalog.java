package app.kok.content;

import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 다른 모듈(learning)이 채점에 쓰는 문제 정보. 다른 모듈은 엔티티 대신 이 서비스만 쓴다 (모듈 경계).
 */
@Service
@Transactional(readOnly = true)
public class QuestionCatalog {

    private final QuestionRepository questions;
    private final QuestionVersionRepository versions;

    public QuestionCatalog(QuestionRepository questions, QuestionVersionRepository versions) {
        this.questions = questions;
        this.versions = versions;
    }

    /** 채점할 수 있는 문제 버전. 이전 버전이어도 문제가 검수 완료 상태면 그 버전으로 채점한다 */
    public record GradableQuestion(
            long versionId,
            long conceptId,
            QuestionType type,
            String code,
            List<String> choices,
            String answer,
            String explanation,
            String sourceUrl) {
    }

    public Optional<GradableQuestion> findGradable(long versionId) {
        return find(versionId, true);
    }

    /** 이미 낸 답의 결과를 다시 보여줄 때. 그 사이 문제가 숨겨졌어도 찾는다 */
    public Optional<GradableQuestion> findAnswered(long versionId) {
        return find(versionId, false);
    }

    private Optional<GradableQuestion> find(long versionId, boolean onlyReviewed) {
        return versions.findById(versionId).flatMap(version -> questions.findById(version.getQuestionId())
                .filter(q -> !onlyReviewed || q.getStatus() == QuestionStatus.REVIEWED)
                .filter(q -> q.getPurpose() == QuestionPurpose.JUDGMENT)
                .map(q -> new GradableQuestion(
                        version.getId(),
                        q.getConceptId(),
                        version.getType(),
                        version.getCode(),
                        version.getChoices(),
                        version.getAnswer(),
                        version.getExplanation(),
                        version.getSourceUrl())));
    }
}
