package app.retrievo.content;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UnitRepository extends JpaRepository<Unit, Long> {

    Optional<Unit> findBySubjectIdAndTitle(Long subjectId, String title);
}
