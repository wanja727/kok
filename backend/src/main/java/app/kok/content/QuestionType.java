package app.kok.content;

/**
 * 문제 형태. 형태가 용도를 정한다.
 * 객관식·OX·코드 결과 예측·줄 고르기는 정답이 하나로 정해져 자동 채점하는 판정 문제,
 * 서술형은 체크리스트로 스스로 채점하는 연습 문제다.
 */
public enum QuestionType {
    MULTIPLE_CHOICE(QuestionPurpose.JUDGMENT),
    OX(QuestionPurpose.JUDGMENT),
    CODE_PREDICT(QuestionPurpose.JUDGMENT),
    /** 코드에서 줄을 고른다 (한 줄 또는 여러 줄). 정답은 줄 번호 집합 "7,8" */
    LINE_PICK(QuestionPurpose.JUDGMENT),
    DESCRIPTIVE(QuestionPurpose.PRACTICE);

    private final QuestionPurpose purpose;

    QuestionType(QuestionPurpose purpose) {
        this.purpose = purpose;
    }

    public QuestionPurpose purpose() {
        return purpose;
    }

    /** 보기 중에서 고르는 형태인가 (정답은 보기 번호) */
    public boolean hasChoices() {
        return this == MULTIPLE_CHOICE || this == CODE_PREDICT;
    }
}
