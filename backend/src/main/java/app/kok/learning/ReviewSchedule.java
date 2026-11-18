package app.kok.learning;

import java.time.LocalDate;

/**
 * 복습 기준 (ADR-017). 상태 저장 없이 다음 단계와 날짜만 계산한다.
 *
 * <ul>
 *   <li>단계 = 통과한 확인 수. 0 = 배우는 중, 1~3 = 재확인 중, 4 = 졸업
 *   <li>배운 날: 같은 날 레슨에서 3번 맞히면 1단계. 3일 뒤 첫 재확인을 잡는다
 *   <li>재확인을 맞히면 다음 단계. 간격은 3일 → 4일 → 14일이라, 제때 확인하면 배운 날부터 3일·7일·21일 뒤가 된다
 *   <li>틀리면 한 단계 돌아간다(1단계 아래로는 내려가지 않는다). 확실했는데 틀렸으면 다음 날 먼저 다시 묻는다
 *   <li>4단계(재확인 세 번 통과)면 졸업. 더는 묻지 않는다
 * </ul>
 *
 * 근거: 첫 세션 3번 정답 + 넓은 간격의 재학습 3번(Rawson &amp; Dunlosky 2011), 간격의 모양보다 총 간격(Karpicke &amp;
 * Bauernschmidt 2011), 확신했던 오답의 교정(Butterfield &amp; Metcalfe 2001). 3·7·21일이라는 날짜 자체는 직접 정한 값이다.
 */
final class ReviewSchedule {

    static final int LEARNING = 0;
    static final int GRADUATED = 4;
    /** 배운 날 이만큼 맞히면 1단계를 통과한다 */
    static final int CORRECT_TO_LEARN = 3;
    /** 확실했는데 틀린 개념은 다음 날 다시 묻는다 */
    static final int SURE_WRONG_GAP_DAYS = 1;

    private ReviewSchedule() {
    }

    /** 확인 뒤 상태. 졸업했으면 dueDate는 null */
    record Next(int stage, LocalDate dueDate, boolean sureWrong) {

        boolean graduated() {
            return stage == GRADUATED;
        }
    }

    /** 단계 stage에 막 올라섰을 때 다음 확인까지의 날 수 */
    static int gapDays(int stage) {
        return switch (stage) {
            case 1 -> 3;
            case 2 -> 4;
            case 3 -> 14;
            default -> throw new IllegalArgumentException("재확인 단계는 1~3이다: " + stage);
        };
    }

    /** 배운 날 기준을 통과했을 때 */
    static Next learned(LocalDate today) {
        return new Next(1, today.plusDays(gapDays(1)), false);
    }

    /** 재확인 결과에 따른 다음 상태. stage는 확인 전 단계(1~3) */
    static Next afterCheck(int stage, boolean correct, Confidence confidence, LocalDate today) {
        if (stage < 1 || stage > 3) {
            throw new IllegalArgumentException("재확인 단계는 1~3이다: " + stage);
        }
        if (correct) {
            int next = stage + 1;
            return next == GRADUATED
                    ? new Next(GRADUATED, null, false)
                    : new Next(next, today.plusDays(gapDays(next)), false);
        }
        int back = Math.max(1, stage - 1);
        if (confidence == Confidence.SURE) {
            return new Next(back, today.plusDays(SURE_WRONG_GAP_DAYS), true);
        }
        return new Next(back, today.plusDays(gapDays(back)), false);
    }
}
