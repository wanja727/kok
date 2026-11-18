package app.retrievo.learning;

import app.retrievo.auth.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SubmissionController {

    private final SubmissionService submissions;

    SubmissionController(SubmissionService submissions) {
        this.submissions = submissions;
    }

    /**
     * 같은 clientSubmissionId가 동시에 두 번 오면 한쪽은 유니크 제약에 걸린다.
     * 그 트랜잭션은 롤백되었으므로, 새 트랜잭션에서 먼저 저장된 결과를 읽어 그대로 돌려준다.
     */
    @PostMapping("/api/submissions")
    public SubmissionResult submit(@CurrentUser long userId, @Valid @RequestBody SubmitRequest request) {
        try {
            return submissions.submit(userId, request);
        } catch (DataIntegrityViolationException e) {
            return submissions.findExisting(userId, request.clientSubmissionId()).orElseThrow(() -> e);
        }
    }
}
