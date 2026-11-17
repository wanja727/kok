package app.kok.learning;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import app.kok.content.QuestionCatalog.GradableQuestion;
import app.kok.content.QuestionType;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

class GradingTest {

    private static final GradableQuestion LINES = new GradableQuestion(
            1L, 1L, QuestionType.LINE_PICK, "a\nb\nc\nd\n", null, "2,3", "해설", null);

    @Test
    void 줄_고르기는_고른_줄의_집합으로_채점한다() {
        assertThat(Grading.normalize(LINES, "3, 2")).isEqualTo(LINES.answer());
        assertThat(Grading.normalize(LINES, "2")).isNotEqualTo(LINES.answer());
    }

    @Test
    void 코드에_없는_줄은_거부한다() {
        assertThatThrownBy(() -> Grading.normalize(LINES, "5"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("1~4");
    }
}
