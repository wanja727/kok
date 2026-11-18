package app.retrievo.content.file;

import java.nio.file.Files;
import java.nio.file.Path;

/**
 * 문제 파일 형식 검사기 (명령줄). 스프링과 DB 없이 돈다.
 * 콘텐츠 저장소의 CI에서 이 저장소를 내려받아 실행한다:
 *
 * <pre>gradle -p retrievo/backend checkContent -PcontentDir=/path/to/content/questions</pre>
 *
 * 오류가 있으면 종료 코드 1. 경고만 있으면 0.
 */
public final class ContentCheck {

    private ContentCheck() {
    }

    public static void main(String[] args) {
        if (args.length == 0) {
            System.err.println("사용법: ContentCheck <문제 파일 디렉터리>...");
            System.exit(2);
        }
        int errors = 0;
        int warnings = 0;
        int files = 0;
        int questions = 0;
        for (String arg : args) {
            Path dir = Path.of(arg);
            if (!Files.isDirectory(dir)) {
                System.err.println("디렉터리가 아니다: " + dir);
                System.exit(2);
            }
            ContentSetValidator.Result result = ContentSetValidator.validateDirectory(dir);
            for (ContentSetValidator.FileResult file : result.files()) {
                file.errors().forEach(e -> System.out.println("오류 " + file.source() + ": " + e));
                file.warnings().forEach(w -> System.out.println("경고 " + file.source() + ": " + w));
            }
            errors += result.errorCount();
            warnings += result.warningCount();
            files += result.files().size();
            questions += result.questionCount();
        }
        System.out.printf("파일 %d개, 문제 %d개, 오류 %d개, 경고 %d개%n", files, questions, errors, warnings);
        if (files == 0) {
            System.out.println("오류: 문제 파일이 하나도 없다");
            System.exit(1);
        }
        System.exit(errors > 0 ? 1 : 0);
    }
}
