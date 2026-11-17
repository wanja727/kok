package app.kok.content;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class LinePicksTest {

    @Test
    void 순서와_중복과_공백에_상관없이_같은_답으로_본다() {
        assertThat(LinePicks.normalize("8, 7, 8", 10)).contains("7,8");
        assertThat(LinePicks.normalize("7,8", 10)).contains("7,8");
    }

    @Test
    void 범위를_벗어나거나_숫자가_아니면_받지_않는다() {
        assertThat(LinePicks.normalize("0", 10)).isEmpty();
        assertThat(LinePicks.normalize("11", 10)).isEmpty();
        assertThat(LinePicks.normalize("7번", 10)).isEmpty();
        assertThat(LinePicks.normalize(" ", 10)).isEmpty();
    }

    @Test
    void 마지막_줄바꿈은_줄로_세지_않는다() {
        assertThat(LinePicks.lineCount("a\nb\nc\n")).isEqualTo(3);
        assertThat(LinePicks.lineCount("a\nb\nc")).isEqualTo(3);
        assertThat(LinePicks.lineCount(null)).isZero();
    }
}
