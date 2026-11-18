package app.retrievo.content;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConceptRepository extends JpaRepository<Concept, Long> {

    Optional<Concept> findByExternalKey(String externalKey);
}
