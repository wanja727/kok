package app.retrievo.common;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class ServiceDatesTest {

    @Test
    void 한국시간_새벽_4시_전은_전날이다() {
        // 2026-11-18 03:59 KST = 2026-11-17 18:59 UTC
        assertThat(ServiceDates.of(Instant.parse("2026-11-17T18:59:00Z")))
                .isEqualTo(LocalDate.of(2026, 11, 17));
    }

    @Test
    void 한국시간_새벽_4시부터_새_날이다() {
        // 2026-11-18 04:00 KST = 2026-11-17 19:00 UTC
        assertThat(ServiceDates.of(Instant.parse("2026-11-17T19:00:00Z")))
                .isEqualTo(LocalDate.of(2026, 11, 18));
    }

    @Test
    void UTC_날짜가_전날이어도_한국_기준으로_센다() {
        // 2026-11-18 08:00 KST = 2026-11-17 23:00 UTC
        assertThat(ServiceDates.of(Instant.parse("2026-11-17T23:00:00Z")))
                .isEqualTo(LocalDate.of(2026, 11, 18));
    }
}
