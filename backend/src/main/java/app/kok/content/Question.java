package app.kok.content;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** 문제의 정체성(키, 소속, 상태). 내용은 QuestionVersion에 있다 */
@Entity
@Table(name = "question")
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String externalKey;

    private Long lessonId;

    private Long conceptId;

    @Enumerated(EnumType.STRING)
    private QuestionPurpose purpose;

    @Enumerated(EnumType.STRING)
    private QuestionStatus status;

    private int sortOrder;

    private Long currentVersionId;

    protected Question() {
    }

    public Question(String externalKey, Long lessonId, Long conceptId, QuestionPurpose purpose,
            QuestionStatus status, int sortOrder) {
        this.externalKey = externalKey;
        this.lessonId = lessonId;
        this.conceptId = conceptId;
        this.purpose = purpose;
        this.status = status;
        this.sortOrder = sortOrder;
    }

    public void update(Long lessonId, Long conceptId, QuestionPurpose purpose, QuestionStatus status,
            int sortOrder) {
        this.lessonId = lessonId;
        this.conceptId = conceptId;
        this.purpose = purpose;
        this.status = status;
        this.sortOrder = sortOrder;
    }

    public void hide() {
        this.status = QuestionStatus.HIDDEN;
    }

    public void pointTo(QuestionVersion version) {
        this.currentVersionId = version.getId();
    }

    public Long getId() {
        return id;
    }

    public String getExternalKey() {
        return externalKey;
    }

    public Long getLessonId() {
        return lessonId;
    }

    public Long getConceptId() {
        return conceptId;
    }

    public QuestionPurpose getPurpose() {
        return purpose;
    }

    public QuestionStatus getStatus() {
        return status;
    }

    public int getSortOrder() {
        return sortOrder;
    }

    public Long getCurrentVersionId() {
        return currentVersionId;
    }
}
