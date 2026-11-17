package app.kok.learning;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "answer_submission")
public class AnswerSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    private Long questionVersionId;

    private UUID clientSubmissionId;

    private String selected;

    @Enumerated(EnumType.STRING)
    private Confidence confidence;

    private boolean correct;

    @Column(name = "is_delayed_check")
    private boolean delayedCheck;

    private LocalDate serviceDate;

    private Instant submittedAt;

    protected AnswerSubmission() {
    }

    public AnswerSubmission(Long userId, Long questionVersionId, UUID clientSubmissionId, String selected,
            Confidence confidence, boolean correct, boolean delayedCheck, LocalDate serviceDate,
            Instant submittedAt) {
        this.userId = userId;
        this.questionVersionId = questionVersionId;
        this.clientSubmissionId = clientSubmissionId;
        this.selected = selected;
        this.confidence = confidence;
        this.correct = correct;
        this.delayedCheck = delayedCheck;
        this.serviceDate = serviceDate;
        this.submittedAt = submittedAt;
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public Long getQuestionVersionId() {
        return questionVersionId;
    }

    public UUID getClientSubmissionId() {
        return clientSubmissionId;
    }

    public String getSelected() {
        return selected;
    }

    public Confidence getConfidence() {
        return confidence;
    }

    public boolean isCorrect() {
        return correct;
    }

    public boolean isDelayedCheck() {
        return delayedCheck;
    }

    public LocalDate getServiceDate() {
        return serviceDate;
    }

    public Instant getSubmittedAt() {
        return submittedAt;
    }
}
