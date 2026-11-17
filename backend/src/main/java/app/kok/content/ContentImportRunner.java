package app.kok.content;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.stream.Stream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * 시작할 때 kok.content.import-dir 아래의 문제 파일(*.yaml)을 모두 가져온다.
 * 예: 배포 시 dev-lessons의 content/questions를 내려받아 이 경로로 넘긴다.
 * 형식이 틀린 파일이 있으면 시작을 멈춘다 (틀린 문제가 조용히 빠지지 않게).
 */
@Component
@ConditionalOnProperty(name = "kok.content.import-dir")
public class ContentImportRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(ContentImportRunner.class);

    private final ContentImporter importer;
    private final Path dir;

    public ContentImportRunner(ContentImporter importer, @Value("${kok.content.import-dir}") String dir) {
        this.importer = importer;
        this.dir = Path.of(dir);
    }

    @Override
    public void run(ApplicationArguments args) throws IOException {
        List<Path> files;
        try (Stream<Path> walk = Files.walk(dir)) {
            files = walk.filter(Files::isRegularFile)
                    .filter(p -> p.toString().endsWith(".yaml") || p.toString().endsWith(".yml"))
                    .sorted()
                    .toList();
        }
        if (files.isEmpty()) {
            log.warn("문제 파일이 없다: {}", dir);
            return;
        }
        for (Path file : files) {
            ImportReport report = importer.importYaml(dir.relativize(file).toString(), Files.readString(file));
            log.info("문제 가져오기 {}: 새 문제 {}, 새 버전 {}, 그대로 {}, 숨김 {}",
                    report.source(), report.created(), report.newVersions(), report.unchanged(), report.hidden());
            report.warnings().forEach(w -> log.warn("{}: {}", report.source(), w));
        }
    }
}
