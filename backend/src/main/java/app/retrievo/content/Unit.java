package app.retrievo.content;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** 단원. 순서는 단원에 속한 레슨 중 가장 앞선 레슨의 순서를 따른다 */
@Entity
@Table(name = "unit")
public class Unit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long subjectId;

    private String title;

    private int sortOrder;

    protected Unit() {
    }

    public Unit(Long subjectId, String title, int sortOrder) {
        this.subjectId = subjectId;
        this.title = title;
        this.sortOrder = sortOrder;
    }

    public void includeLessonOrder(int lessonOrder) {
        this.sortOrder = Math.min(this.sortOrder, lessonOrder);
    }

    public Long getId() {
        return id;
    }

    public Long getSubjectId() {
        return subjectId;
    }

    public String getTitle() {
        return title;
    }

    public int getSortOrder() {
        return sortOrder;
    }
}
