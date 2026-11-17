package app.kok.content;

import java.util.List;

/**
 * 문제 파일 하나를 가져온 결과.
 * created: 새 문제, newVersions: 내용이 바뀌어 새 버전을 만든 문제, unchanged: 내용이 같은 문제,
 * hidden: 파일에서 빠져 숨긴 문제
 */
public record ImportReport(
        String source,
        int created,
        int newVersions,
        int unchanged,
        int hidden,
        List<String> warnings) {
}
