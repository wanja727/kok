package app.retrievo.learning;

/** 답을 낸 뒤에야 받는 결과. 정답과 해설은 여기서 처음 보인다 */
public record SubmissionResult(
        long submissionId,
        boolean correct,
        String selected,
        String answer,
        Confidence confidence,
        String explanation,
        String sourceUrl,
        boolean delayedCheck) {
}
