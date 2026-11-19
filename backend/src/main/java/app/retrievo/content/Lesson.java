package app.retrievo.content;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "lesson")
public class Lesson {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long unitId;

    private String externalKey;

    private String title;

    private int sortOrder;

    /** 본문 7단계 JSON (LessonSteps). 본문이 아직 없으면 null */
    @JdbcTypeCode(SqlTypes.JSON)
    private String body;

    protected Lesson() {
    }

    public Lesson(String externalKey, Long unitId, String title, int sortOrder) {
        this.externalKey = externalKey;
        this.unitId = unitId;
        this.title = title;
        this.sortOrder = sortOrder;
    }

    public void update(Long unitId, String title, int sortOrder, String body) {
        this.unitId = unitId;
        this.title = title;
        this.sortOrder = sortOrder;
        this.body = body;
    }

    public Long getId() {
        return id;
    }

    public Long getUnitId() {
        return unitId;
    }

    public String getExternalKey() {
        return externalKey;
    }

    public String getTitle() {
        return title;
    }

    public int getSortOrder() {
        return sortOrder;
    }

    public String getBody() {
        return body;
    }
}
