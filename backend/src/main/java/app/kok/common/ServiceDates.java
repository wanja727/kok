package app.kok.common;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

/**
 * 서비스 날짜("오늘")는 이 클래스에서만 계산한다.
 * 하루는 한국 시간 새벽 4시에 바뀐다. 자정 넘어 공부해도 같은 날로 센다.
 */
public final class ServiceDates {

    public static final ZoneId ZONE = ZoneId.of("Asia/Seoul");
    public static final int DAY_START_HOUR = 4;

    private ServiceDates() {
    }

    public static LocalDate of(Instant instant) {
        return instant.atZone(ZONE).minusHours(DAY_START_HOUR).toLocalDate();
    }

    public static LocalDate today(Clock clock) {
        return of(clock.instant());
    }
}
