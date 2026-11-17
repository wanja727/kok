package app.kok.learning;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnswerSubmissionRepository extends JpaRepository<AnswerSubmission, Long> {

    Optional<AnswerSubmission> findByUserIdAndClientSubmissionId(Long userId, UUID clientSubmissionId);
}
