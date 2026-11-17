package app.kok.content;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuestionRepository extends JpaRepository<Question, Long> {

    Optional<Question> findByExternalKey(String externalKey);

    List<Question> findByLessonId(Long lessonId);
}
