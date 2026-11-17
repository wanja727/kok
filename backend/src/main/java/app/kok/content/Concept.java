package app.kok.content;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** 개념. 지연 확인은 개념 단위로 다른 문제를 골라 묻는다 */
@Entity
@Table(name = "concept")
public class Concept {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long lessonId;

    private String externalKey;

    private String name;

    protected Concept() {
    }

    public Concept(String externalKey, Long lessonId, String name) {
        this.externalKey = externalKey;
        this.lessonId = lessonId;
        this.name = name;
    }

    public void update(Long lessonId, String name) {
        this.lessonId = lessonId;
        this.name = name;
    }

    public Long getId() {
        return id;
    }

    public Long getLessonId() {
        return lessonId;
    }

    public String getExternalKey() {
        return externalKey;
    }

    public String getName() {
        return name;
    }
}
