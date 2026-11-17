package app.kok.content;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import app.kok.content.file.ContentValidationException;
import app.kok.support.IntegrationTest;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;

class ContentImporterTest extends IntegrationTest {

    private static final String SOURCE = "n-plus-1.yaml";

    @Autowired
    ContentImporter importer;

    @Test
    void 가져오면_주제_단원_레슨_개념_문제가_생긴다() throws IOException {
        ImportReport report = importer.importYaml(SOURCE, fixture());

        assertThat(report.created()).isEqualTo(4);
        assertThat(count("subject")).isEqualTo(1);
        assertThat(count("unit")).isEqualTo(1);
        assertThat(count("lesson")).isEqualTo(1);
        assertThat(count("concept")).isEqualTo(2);
        assertThat(count("question_version")).isEqualTo(4);

        // 키는 주제/레슨/문제로 이어 붙인다. 용도는 형태에서 정해진다
        List<Map<String, Object>> rows = jdbc.queryForList(
                "select external_key, purpose, status from question order by sort_order");
        assertThat(rows).extracting(r -> r.get("external_key")).containsExactly(
                "dev/n-plus-1/lazy-loop-count", "dev/n-plus-1/lazy-loop-ox",
                "dev/n-plus-1/fetch-join-predict", "dev/n-plus-1/fetch-join-explain");
        assertThat(rows).extracting(r -> r.get("purpose")).containsExactly(
                "JUDGMENT", "JUDGMENT", "JUDGMENT", "PRACTICE");
    }

    @Test
    void 같은_파일을_다시_가져오면_아무것도_바뀌지_않는다() throws IOException {
        importer.importYaml(SOURCE, fixture());
        ImportReport again = importer.importYaml(SOURCE, fixture());

        assertThat(again.created()).isZero();
        assertThat(again.newVersions()).isZero();
        assertThat(again.unchanged()).isEqualTo(4);
        assertThat(count("question")).isEqualTo(4);
        assertThat(count("question_version")).isEqualTo(4);
    }

    @Test
    void 문제_내용이_바뀌면_새_버전이_생기고_이전_버전은_남는다() throws IOException {
        importer.importYaml(SOURCE, fixture());
        long v1 = currentVersionId("dev/n-plus-1/lazy-loop-ox");

        String edited = fixture().replace(
                "FetchType.EAGER로 바꾸면 N+1 문제가 사라진다.",
                "연관관계를 FetchType.EAGER로 바꾸면 N+1 문제가 사라진다.");
        ImportReport report = importer.importYaml(SOURCE, edited);

        assertThat(report.newVersions()).isEqualTo(1);
        assertThat(report.unchanged()).isEqualTo(3);
        long v2 = currentVersionId("dev/n-plus-1/lazy-loop-ox");
        assertThat(v2).isNotEqualTo(v1);
        assertThat(jdbc.queryForList(
                "select version_no from question_version where question_id = "
                        + "(select id from question where external_key = 'dev/n-plus-1/lazy-loop-ox') "
                        + "order by version_no", Integer.class))
                .containsExactly(1, 2);
        assertThat(jdbc.queryForObject("select body from question_version where id = ?", String.class, v1))
                .isEqualTo("FetchType.EAGER로 바꾸면 N+1 문제가 사라진다.");
    }

    @Test
    void 검수_상태만_바뀌면_새_버전을_만들지_않는다() throws IOException {
        importer.importYaml(SOURCE, fixture().replaceFirst("status: reviewed", "status: draft"));
        ImportReport report = importer.importYaml(SOURCE, fixture());

        assertThat(report.newVersions()).isZero();
        assertThat(jdbc.queryForObject(
                "select status from question where external_key = 'dev/n-plus-1/lazy-loop-count'", String.class))
                .isEqualTo("REVIEWED");
    }

    @Test
    void 파일에서_빠진_문제는_지우지_않고_숨긴다() throws IOException {
        importer.importYaml(SOURCE, fixture());

        String withoutOx = fixture().replaceAll("(?s)  - key: lazy-loop-ox.*?(?=  - key: fetch-join-predict)", "");
        ImportReport report = importer.importYaml(SOURCE, withoutOx);

        assertThat(report.hidden()).isEqualTo(1);
        assertThat(count("question")).isEqualTo(4);
        assertThat(jdbc.queryForObject(
                "select status from question where external_key = 'dev/n-plus-1/lazy-loop-ox'", String.class))
                .isEqualTo("HIDDEN");
    }

    @Test
    void 형식이_틀리면_아무것도_넣지_않고_이유를_한번에_모두_알려준다() throws IOException {
        String broken = fixture()
                .replace("    answer: 4\n", "    answer: 5\n")
                .replace("    concept: fetch-join\n    type: code_predict", "    concept: no-such\n    type: code_predict");

        assertThatThrownBy(() -> importer.importYaml(SOURCE, broken))
                .isInstanceOfSatisfying(ContentValidationException.class, e -> assertThat(e.getErrors())
                        .anyMatch(m -> m.contains("lazy-loop-count") && m.contains("answer는 보기 번호(1~4)"))
                        .anyMatch(m -> m.contains("fetch-join-predict") && m.contains("concept 'no-such'")));
        assertThat(count("question")).isZero();
    }

    @Test
    void 모르는_항목이_있으면_오타로_보고_거부한다() throws IOException {
        String typo = fixture().replace("    explanation: 팀 목록", "    explaination: 팀 목록");

        assertThatThrownBy(() -> importer.importYaml(SOURCE, typo))
                .isInstanceOfSatisfying(ContentValidationException.class,
                        e -> assertThat(e.getErrors()).anyMatch(m -> m.contains("explaination")));
    }

    @Test
    void 지연_확인에_쓸_판정_문제가_모자란_개념은_경고한다() throws IOException {
        ImportReport report = importer.importYaml(SOURCE, fixture());

        // fetch-join 개념은 판정 문제가 1개(코드 예측)뿐이다. 서술형은 판정 문제가 아니다
        assertThat(report.warnings()).anyMatch(w -> w.contains("'fetch-join'") && w.contains("1개"));
        assertThat(report.warnings()).noneMatch(w -> w.contains("'lazy-loop'"));
    }

    private String fixture() throws IOException {
        return new ClassPathResource("content/n-plus-1.yaml").getContentAsString(StandardCharsets.UTF_8);
    }

    private int count(String table) {
        return jdbc.queryForObject("select count(*) from " + table, Integer.class);
    }

    private long currentVersionId(String key) {
        return jdbc.queryForObject("select current_version_id from question where external_key = ?", Long.class, key);
    }
}
