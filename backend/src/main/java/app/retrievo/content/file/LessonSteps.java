package app.retrievo.content.file;

import java.util.List;

/**
 * 레슨 본문 7단계 (레슨 표준의 순서: 예측 → 배경 → 실습 → 함정 → 해결 → 확인 → 면접 답변).
 * 확인 단계는 이 파일의 판정 문제를 그대로 풀어서 따로 적지 않는다.
 * 단계마다 다음으로 넘어가기 전에 스스로 꺼내 보는 장치(예측, 퀴즈, 결과 예상, 한 문장 답)가 있다.
 *
 * <p>text는 빈 줄로 문단을 나누고, **굵게**와 `코드`만 쓴다 (HTML은 쓰지 않는다).
 * 여기 정답은 판정에 쓰지 않는다. 본문 안의 연습이라 화면에 함께 보낸다.
 */
public record LessonSteps(
        Predict predict,
        Explain background,
        Practice practice,
        Explain pitfall,
        Explain fix,
        Interview interview) {

    /** 1 예측: 설명을 보기 전에 결과를 고른다. 함정 단계에서 내 예측과 실제를 나란히 보여준다 */
    public record Predict(String question, String text, String code, List<String> choices, Integer answer) {
    }

    /**
     * 2 배경, 4 함정, 5 해결. 설명 뒤에 quiz(보기 고르기) 또는 recall(보지 않고 한 문장으로 답하기)로 다음 단계를 연다.
     * flow: 번호 붙은 단계 목록(도식 대신). alternatives: 다른 방법과 주의할 점
     */
    public record Explain(
            String title,
            String text,
            String code,
            String codeNote,
            List<String> flow,
            List<Alternative> alternatives,
            Quiz quiz,
            Recall recall) {
    }

    public record Alternative(String title, String note) {
    }

    public record Quiz(String question, List<String> choices, Integer answer) {
    }

    /** answer는 사용자가 먼저 적은 뒤에 보여주는 예시 답 */
    public record Recall(String prompt, String answer) {
    }

    /** 3 실습: 실행 결과를 먼저 예상하고, 눌러서 실제 결과를 본다. after는 결과를 본 뒤의 한 줄 */
    public record Practice(String title, String text, String code, List<Run> runs, String after) {
    }

    /** output은 실제 결과(검증 테스트로 확인한 값). choices·answer는 결과 예상 보기 */
    public record Run(String call, String note, List<String> choices, Integer answer, String output) {
    }

    /** 7 면접 답변: 먼저 말하고, 모범 답변의 뼈대와 비교해 말한 항목을 직접 체크한다 */
    public record Interview(String question, List<Point> points) {
    }

    /** label: 정의, 원리, 해결, 경험 같은 짧은 이름 */
    public record Point(String label, String text) {
    }
}
