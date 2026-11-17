package app.kok.content;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuestionVersionRepository extends JpaRepository<QuestionVersion, Long> {

    List<QuestionVersion> findByQuestionIdOrderByVersionNo(Long questionId);
}
