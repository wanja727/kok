package app.retrievo.content.file;

import app.retrievo.content.file.LessonSteps.Explain;
import app.retrievo.content.file.LessonSteps.Quiz;
import app.retrievo.content.file.LessonSteps.Recall;
import java.util.List;

/** 레슨 본문 검사. 단계가 하나라도 빠지면 오류다 (7단계를 순서대로 넘기는 화면이다) */
final class LessonStepsValidator {

    private LessonStepsValidator() {
    }

    static void validate(LessonSteps steps, List<String> errors) {
        if (steps.predict() == null) {
            errors.add("steps.predict가 없다");
        } else {
            LessonSteps.Predict p = steps.predict();
            text("steps.predict.question", p.question(), errors);
            choices("steps.predict", p.choices(), p.answer(), errors);
        }

        explain("steps.background", steps.background(), errors);
        explain("steps.pitfall", steps.pitfall(), errors);
        explain("steps.fix", steps.fix(), errors);

        if (steps.practice() == null) {
            errors.add("steps.practice가 없다");
        } else {
            LessonSteps.Practice p = steps.practice();
            text("steps.practice.title", p.title(), errors);
            text("steps.practice.text", p.text(), errors);
            if (p.runs() == null || p.runs().isEmpty()) {
                errors.add("steps.practice.runs가 비어 있다 (결과를 예상해 볼 실행이 하나 이상 필요하다)");
            } else {
                for (int i = 0; i < p.runs().size(); i++) {
                    LessonSteps.Run run = p.runs().get(i);
                    String label = "steps.practice.runs[" + i + "]";
                    text(label + ".call", run.call(), errors);
                    text(label + ".output", run.output(), errors);
                    choices(label, run.choices(), run.answer(), errors);
                }
            }
        }

        if (steps.interview() == null) {
            errors.add("steps.interview가 없다");
        } else {
            text("steps.interview.question", steps.interview().question(), errors);
            List<LessonSteps.Point> points = steps.interview().points();
            if (points == null || points.size() < 2) {
                errors.add("steps.interview.points가 2개 이상 필요하다 (모범 답변의 뼈대)");
            } else {
                for (int i = 0; i < points.size(); i++) {
                    text("steps.interview.points[" + i + "].label", points.get(i).label(), errors);
                    text("steps.interview.points[" + i + "].text", points.get(i).text(), errors);
                }
            }
        }
    }

    private static void explain(String label, Explain e, List<String> errors) {
        if (e == null) {
            errors.add(label + "가 없다");
            return;
        }
        text(label + ".title", e.title(), errors);
        text(label + ".text", e.text(), errors);
        Quiz quiz = e.quiz();
        Recall recall = e.recall();
        if ((quiz == null) == (recall == null)) {
            errors.add(label + ": 다음 단계를 여는 장치로 quiz와 recall 중 하나만 둔다");
        }
        if (quiz != null) {
            text(label + ".quiz.question", quiz.question(), errors);
            choices(label + ".quiz", quiz.choices(), quiz.answer(), errors);
        }
        if (recall != null) {
            text(label + ".recall.prompt", recall.prompt(), errors);
            text(label + ".recall.answer", recall.answer(), errors);
        }
        if (e.alternatives() != null) {
            for (int i = 0; i < e.alternatives().size(); i++) {
                text(label + ".alternatives[" + i + "].title", e.alternatives().get(i).title(), errors);
                text(label + ".alternatives[" + i + "].note", e.alternatives().get(i).note(), errors);
            }
        }
    }

    private static void choices(String label, List<String> choices, Integer answer, List<String> errors) {
        if (choices == null || choices.size() < 2) {
            errors.add(label + ": 보기(choices)가 2개 이상 필요하다");
            return;
        }
        if (choices.stream().anyMatch(c -> c == null || c.isBlank())) {
            errors.add(label + ": 빈 보기가 있다");
        }
        if (answer == null || answer < 1 || answer > choices.size()) {
            errors.add(label + ": answer는 보기 번호(1~" + choices.size() + ")다. 지금 값: " + answer);
        }
    }

    private static void text(String label, String value, List<String> errors) {
        if (value == null || value.isBlank()) {
            errors.add(label + "가 비어 있다");
        }
    }
}
