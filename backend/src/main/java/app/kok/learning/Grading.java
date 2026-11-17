package app.kok.learning;

import app.kok.content.LinePicks;
import app.kok.content.QuestionCatalog.GradableQuestion;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/** 판정 문제 채점. 고른 답을 정답과 같은 표기로 바꾼 뒤 비교한다 */
final class Grading {

    private Grading() {
    }

    /** 객관식·코드 예측은 "1"~"n", OX는 "O"/"X"로 바꾼다. 형태에 맞지 않는 답은 400 */
    static String normalize(GradableQuestion question, String selected) {
        String raw = selected.trim();
        switch (question.type()) {
            case MULTIPLE_CHOICE, CODE_PREDICT -> {
                int size = question.choices().size();
                try {
                    int number = Integer.parseInt(raw);
                    if (number >= 1 && number <= size) {
                        return String.valueOf(number);
                    }
                } catch (NumberFormatException ignored) {
                    // 아래에서 거부한다
                }
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "보기 번호는 1~" + size + "이다");
            }
            case OX -> {
                String upper = raw.toUpperCase(Locale.ROOT);
                if (upper.equals("O") || upper.equals("X")) {
                    return upper;
                }
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OX 문제의 답은 O 또는 X다");
            }
            case LINE_PICK -> {
                int lines = LinePicks.lineCount(question.code());
                return LinePicks.normalize(raw, lines).orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "줄 번호(1~" + lines + ")를 쉼표로 나열한다"));
            }
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "자동 채점하는 문제가 아니다");
        }
    }
}
