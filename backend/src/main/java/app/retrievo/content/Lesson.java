package app.retrievo.content;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

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

    protected Lesson() {
    }

    public Lesson(String externalKey, Long unitId, String title, int sortOrder) {
        this.externalKey = externalKey;
        this.unitId = unitId;
        this.title = title;
        this.sortOrder = sortOrder;
    }

    public void update(Long unitId, String title, int sortOrder) {
        this.unitId = unitId;
        this.title = title;
        this.sortOrder = sortOrder;
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
}
