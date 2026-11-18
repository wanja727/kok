package app.retrievo.content.file;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

/**
 * 문제 파일 여러 개를 함께 검사한다. 파일 하나씩의 검사(ContentValidator)에 더해
 * 파일 사이의 충돌(같은 레슨 키가 두 파일에, 같은 주제 키에 다른 이름)을 찾는다.
 * 앱이 시작할 때 가져오기 전에, 그리고 콘텐츠 저장소의 CI(ContentCheck)에서 같은 규칙으로 쓴다.
 */
public final class ContentSetValidator {

    /** 파일별 결과. 파일 사이 충돌은 해당 파일의 오류로 넣는다 */
    public record FileResult(String source, ContentFile file, List<String> errors, List<String> warnings) {
    }

    public record Result(List<FileResult> files) {

        public boolean hasErrors() {
            return files.stream().anyMatch(f -> !f.errors().isEmpty());
        }

        public int errorCount() {
            return files.stream().mapToInt(f -> f.errors().size()).sum();
        }

        public int warningCount() {
            return files.stream().mapToInt(f -> f.warnings().size()).sum();
        }

        public int questionCount() {
            return files.stream().filter(f -> f.file() != null && f.file().questions() != null)
                    .mapToInt(f -> f.file().questions().size()).sum();
        }
    }

    private ContentSetValidator() {
    }

    /** 디렉터리 아래의 *.yaml, *.yml을 모두 찾는다 (정렬된 순서) */
    public static List<Path> findFiles(Path dir) {
        try (Stream<Path> walk = Files.walk(dir)) {
            return walk.filter(Files::isRegularFile)
                    .filter(p -> p.toString().endsWith(".yaml") || p.toString().endsWith(".yml"))
                    .sorted()
                    .toList();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    /** source(표시용 이름) → YAML 내용 */
    public static Result validate(Map<String, String> sources) {
        List<FileResult> results = new ArrayList<>();
        for (Map.Entry<String, String> entry : sources.entrySet()) {
            String source = entry.getKey();
            try {
                ContentFile file = ContentFileParser.parse(source, entry.getValue());
                ContentValidator.Result r = ContentValidator.validate(file);
                results.add(new FileResult(source, file, new ArrayList<>(r.errors()), r.warnings()));
            } catch (ContentValidationException e) {
                results.add(new FileResult(source, null, new ArrayList<>(e.getErrors()), List.of()));
            }
        }

        Map<String, String> lessonOwner = new HashMap<>();
        Map<String, String> subjectNames = new LinkedHashMap<>();
        for (FileResult r : results) {
            ContentFile f = r.file();
            if (f == null || f.subject() == null || f.lesson() == null) {
                continue;
            }
            String subjectKey = f.subject().key();
            String name = subjectNames.putIfAbsent(subjectKey, f.subject().name());
            if (name != null && !name.equals(f.subject().name())) {
                r.errors().add("주제 '" + subjectKey + "'의 이름이 파일마다 다르다: '" + name + "' / '"
                        + f.subject().name() + "'");
            }
            String lessonKey = subjectKey + "/" + f.lesson().key();
            String owner = lessonOwner.putIfAbsent(lessonKey, r.source());
            if (owner != null) {
                r.errors().add("레슨 키 '" + lessonKey + "'가 " + owner + "에도 있다. 레슨 하나는 파일 하나다");
            }
        }
        return new Result(results);
    }

    public static Result validateDirectory(Path dir) {
        Map<String, String> sources = new LinkedHashMap<>();
        for (Path file : findFiles(dir)) {
            try {
                sources.put(dir.relativize(file).toString().replace('\\', '/'), Files.readString(file));
            } catch (IOException e) {
                throw new UncheckedIOException(e);
            }
        }
        return validate(sources);
    }
}
