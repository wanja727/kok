package app.retrievo.learning;

/**
 * LESSON: 레슨에서 풀기. 배우는 중인 개념이면 배운 날 기준을 센다.
 * DELAYED_CHECK: 오늘 예정된 지연 확인에 답하기. 단계를 올리거나 내린다.
 * PRACTICE: 연습. 지연 확인에서 틀린 뒤 다시 배우기, 끝낸 레슨 다시 풀기. 기록만 하고 일정은 바꾸지 않는다 (ADR-021)
 */
public enum SubmissionMode {
    LESSON,
    DELAYED_CHECK,
    PRACTICE
}
