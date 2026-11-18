package app.retrievo.content;

import java.util.List;

/**
 * 답을 내기 전에 보여주는 문제. 정답과 해설은 일부러 담지 않는다 (답 먼저).
 * 풀 때는 이 버전 id로 제출한다. 그 사이 문제가 고쳐져도 본 버전으로 채점한다.
 */
public record QuestionView(
        long questionVersionId,
        long conceptId,
        QuestionType type,
        String body,
        String code,
        List<String> choices) {
}
