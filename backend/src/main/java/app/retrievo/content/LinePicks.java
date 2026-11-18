package app.retrievo.content;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.TreeSet;
import java.util.stream.Collectors;

/**
 * 줄 고르기 답 표기. "8, 7" 같은 입력을 정렬하고 중복을 없앤 "7,8"로 바꾼다.
 * 정답과 사용자의 답을 같은 방식으로 바꾼 뒤 문자열로 비교한다 (집합 비교).
 */
public final class LinePicks {

    private LinePicks() {
    }

    public static int lineCount(String code) {
        if (code == null || code.isEmpty()) {
            return 0;
        }
        String trimmed = code.endsWith("\n") ? code.substring(0, code.length() - 1) : code;
        return trimmed.split("\n", -1).length;
    }

    /** 1~lineCount 범위의 줄 번호 집합으로 바꾼다. 형식이 틀리거나 범위를 벗어나면 비어 있다 */
    public static Optional<String> normalize(String raw, int lineCount) {
        if (raw == null || raw.isBlank()) {
            return Optional.empty();
        }
        TreeSet<Integer> lines = new TreeSet<>();
        for (String part : raw.split(",")) {
            try {
                int line = Integer.parseInt(part.trim());
                if (line < 1 || line > lineCount) {
                    return Optional.empty();
                }
                lines.add(line);
            } catch (NumberFormatException e) {
                return Optional.empty();
            }
        }
        return Optional.of(lines.stream().map(String::valueOf).collect(Collectors.joining(",")));
    }

    public static List<Integer> parse(String normalized) {
        List<Integer> lines = new ArrayList<>();
        for (String part : normalized.split(",")) {
            lines.add(Integer.parseInt(part));
        }
        return lines;
    }
}
