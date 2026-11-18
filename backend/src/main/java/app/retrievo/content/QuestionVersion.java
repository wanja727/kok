package app.retrievo.content;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.List;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * 문제 내용의 한 버전. 만든 뒤에는 바꾸지 않는다.
 * 문제를 고치면 새 버전을 만들고, 풀이 기록은 풀 당시의 버전을 계속 가리킨다.
 */
@Entity
@Table(name = "question_version")
public class QuestionVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long questionId;

    private int versionNo;

    @Enumerated(EnumType.STRING)
    private QuestionType type;

    private String body;

    private String code;

    @JdbcTypeCode(SqlTypes.JSON)
    private List<String> choices;

    /** 객관식·코드 예측은 보기 번호(1부터), OX는 "O" 또는 "X", 서술형은 없음 */
    private String answer;

    private String explanation;

    @JdbcTypeCode(SqlTypes.JSON)
    private List<String> checklist;

    private String sourceUrl;

    private int difficulty;

    private String contentHash;

    @Column(insertable = false, updatable = false)
    private Instant createdAt;

    protected QuestionVersion() {
    }

    public QuestionVersion(Long questionId, int versionNo, QuestionContent content, String contentHash) {
        this.questionId = questionId;
        this.versionNo = versionNo;
        this.type = content.type();
        this.body = content.body();
        this.code = content.code();
        this.choices = content.choices();
        this.answer = content.answer();
        this.explanation = content.explanation();
        this.checklist = content.checklist();
        this.sourceUrl = content.source();
        this.difficulty = content.difficulty();
        this.contentHash = contentHash;
    }

    public Long getId() {
        return id;
    }

    public Long getQuestionId() {
        return questionId;
    }

    public int getVersionNo() {
        return versionNo;
    }

    public QuestionType getType() {
        return type;
    }

    public String getBody() {
        return body;
    }

    public String getCode() {
        return code;
    }

    public List<String> getChoices() {
        return choices;
    }

    public String getAnswer() {
        return answer;
    }

    public String getExplanation() {
        return explanation;
    }

    public List<String> getChecklist() {
        return checklist;
    }

    public String getSourceUrl() {
        return sourceUrl;
    }

    public int getDifficulty() {
        return difficulty;
    }

    public String getContentHash() {
        return contentHash;
    }
}
