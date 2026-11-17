package app.kok.content;

import java.util.List;

/**
 * 버전을 나누는 기준이 되는 문제 내용. 이 값이 바뀌면 새 버전을 만든다.
 * 상태(검수 여부)와 순서는 여기에 넣지 않는다. 검수만 끝났다고 새 버전이 생기지 않게 하려는 것이다.
 */
public record QuestionContent(
        QuestionType type,
        String body,
        String code,
        List<String> choices,
        String answer,
        String explanation,
        List<String> checklist,
        String source,
        int difficulty) {
}
