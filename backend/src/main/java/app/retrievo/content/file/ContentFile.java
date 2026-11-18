package app.retrievo.content.file;

import java.util.List;

/**
 * 콘텐츠 저장소의 문제 파일 하나 (레슨 하나). 형식은 docs/content-format.md에 있다.
 * 키는 파일 안에서만 짧게 쓰고, 가져올 때 "주제/레슨/키"로 이어 붙여 전역 키를 만든다.
 */
public record ContentFile(
        SubjectDef subject,
        LessonDef lesson,
        List<ConceptDef> concepts,
        List<QuestionDef> questions) {

    public record SubjectDef(String key, String name) {
    }

    public record LessonDef(String key, String title, String unit, Integer order) {
    }

    public record ConceptDef(String key, String name) {
    }

    public record QuestionDef(
            String key,
            String concept,
            String type,
            String status,
            Integer difficulty,
            String body,
            String code,
            List<String> choices,
            String answer,
            String explanation,
            List<String> checklist,
            String source) {
    }
}
