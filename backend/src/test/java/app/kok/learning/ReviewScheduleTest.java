package app.kok.learning;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class ReviewScheduleTest {

    private static final LocalDate LEARNED = LocalDate.of(2026, 11, 17);

    @Test
    void 제때_확인하면_배운_날부터_3일_7일_21일_뒤에_묻고_졸업한다() {
        ReviewSchedule.Next first = ReviewSchedule.learned(LEARNED);
        assertThat(first).isEqualTo(new ReviewSchedule.Next(1, LEARNED.plusDays(3), false));

        ReviewSchedule.Next second = ReviewSchedule.afterCheck(1, true, Confidence.SURE, first.dueDate());
        assertThat(second).isEqualTo(new ReviewSchedule.Next(2, LEARNED.plusDays(7), false));

        ReviewSchedule.Next third = ReviewSchedule.afterCheck(2, true, Confidence.UNSURE, second.dueDate());
        assertThat(third).isEqualTo(new ReviewSchedule.Next(3, LEARNED.plusDays(21), false));

        ReviewSchedule.Next done = ReviewSchedule.afterCheck(3, true, Confidence.SURE, third.dueDate());
        assertThat(done.graduated()).isTrue();
        assertThat(done.dueDate()).isNull();
    }

    @Test
    void 늦게_확인해도_다음_간격은_확인한_날부터_센다() {
        LocalDate late = LEARNED.plusDays(10);
        assertThat(ReviewSchedule.afterCheck(1, true, Confidence.SURE, late))
                .isEqualTo(new ReviewSchedule.Next(2, late.plusDays(4), false));
    }

    @Test
    void 틀리면_한_단계_돌아가고_그_단계의_간격으로_다시_묻는다() {
        LocalDate day = LEARNED.plusDays(21);
        assertThat(ReviewSchedule.afterCheck(3, false, Confidence.UNSURE, day))
                .isEqualTo(new ReviewSchedule.Next(2, day.plusDays(4), false));
        assertThat(ReviewSchedule.afterCheck(2, false, Confidence.UNKNOWN, day))
                .isEqualTo(new ReviewSchedule.Next(1, day.plusDays(3), false));
    }

    @Test
    void 첫_재확인에서_틀려도_배운_날_단계_아래로는_내려가지_않는다() {
        LocalDate day = LEARNED.plusDays(3);
        assertThat(ReviewSchedule.afterCheck(1, false, Confidence.UNSURE, day))
                .isEqualTo(new ReviewSchedule.Next(1, day.plusDays(3), false));
    }

    @Test
    void 확실했는데_틀리면_다음_날_다시_묻는다() {
        LocalDate day = LEARNED.plusDays(7);
        assertThat(ReviewSchedule.afterCheck(2, false, Confidence.SURE, day))
                .isEqualTo(new ReviewSchedule.Next(1, day.plusDays(1), true));
    }

    @Test
    void 재확인_단계가_아니면_계산하지_않는다() {
        assertThatThrownBy(() -> ReviewSchedule.afterCheck(0, true, Confidence.SURE, LEARNED))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> ReviewSchedule.afterCheck(4, true, Confidence.SURE, LEARNED))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
