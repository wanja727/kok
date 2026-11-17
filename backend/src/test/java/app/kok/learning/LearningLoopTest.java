package app.kok.learning;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import app.kok.content.ContentImporter;
import app.kok.support.IntegrationTest;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

/**
 * 핵심 루프: 레슨 문제 보기(정답 없이) → 확신도와 함께 답 내기 → 채점·해설 → 지연 확인 예약 → 3일 뒤 다른 문제로 확인.
 * 시작 시각은 2026-11-17 10:00 KST (서비스 날짜 2026-11-17).
 */
class LearningLoopTest extends IntegrationTest {

    private static final LocalDate DAY0 = LocalDate.of(2026, 11, 17);

    @Autowired
    MockMvc mvc;

    @Autowired
    ObjectMapper json;

    @Autowired
    ContentImporter importer;

    long userId;
    long lessonId;

    @BeforeEach
    void setUp() throws Exception {
        importer.importYaml("n-plus-1.yaml",
                new ClassPathResource("content/n-plus-1.yaml").getContentAsString(StandardCharsets.UTF_8));
        userId = createUser("tester");
        lessonId = jdbc.queryForObject("select id from lesson where external_key = 'dev/n-plus-1'", Long.class);
    }

    @Test
    void 레슨_문제에는_정답과_해설이_없다() throws Exception {
        JsonNode questions = getJson("/api/lessons/" + lessonId + "/questions");

        // 판정 문제 3개만 보인다. 서술형(연습)은 자기 채점 화면을 만들 때 연다
        assertThat(questions).hasSize(3);
        for (JsonNode q : questions) {
            assertThat(q.has("answer")).isFalse();
            assertThat(q.has("explanation")).isFalse();
            assertThat(q.has("body")).isTrue();
        }
        assertThat(questions.get(0).get("choices")).hasSize(4);
        assertThat(questions.get(1).get("type").asText()).isEqualTo("OX");
    }

    @Test
    void 답을_내야_정답과_해설을_받는다() throws Exception {
        submit(version("lazy-loop-count"), "4", "SURE", null).andExpect(status().isOk())
                .andExpect(jsonPath("$.correct").value(true))
                .andExpect(jsonPath("$.answer").value("4"))
                .andExpect(jsonPath("$.explanation").value("팀 목록 1번, 팀마다 members 1번씩 10번. 합쳐서 11번이다."));

        submit(version("lazy-loop-ox"), "o", "SURE", null).andExpect(status().isOk())
                .andExpect(jsonPath("$.correct").value(false))
                .andExpect(jsonPath("$.selected").value("O"))
                .andExpect(jsonPath("$.answer").value("X"));
    }

    @Test
    void 확신도를_고르지_않으면_답을_받지_않는다() throws Exception {
        String body = """
                {"clientSubmissionId": "%s", "questionVersionId": %d, "selected": "4"}
                """.formatted(UUID.randomUUID(), version("lazy-loop-count"));

        mvc.perform(post("/api/submissions").header("X-Dev-User-Id", userId)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest());
        assertThat(count("answer_submission")).isZero();
    }

    @Test
    void 보기에_없는_번호는_거부한다() throws Exception {
        submit(version("lazy-loop-count"), "5", "SURE", null).andExpect(status().isBadRequest());
        submit(version("lazy-loop-ox"), "Y", "SURE", null).andExpect(status().isBadRequest());
        assertThat(count("answer_submission")).isZero();
    }

    @Test
    void 같은_제출을_다시_보내면_처음_결과를_돌려주고_한번만_기록한다() throws Exception {
        UUID clientId = UUID.randomUUID();
        JsonNode first = body(submit(clientId, version("lazy-loop-count"), "4", "SURE", null));
        // 재시도에 다른 답이 실려 와도 처음 결과를 돌려준다
        JsonNode retry = body(submit(clientId, version("lazy-loop-count"), "1", "UNSURE", null));

        assertThat(retry).isEqualTo(first);
        assertThat(count("answer_submission")).isEqualTo(1);
    }

    @Test
    void 같은_제출이_동시에_와도_한번만_기록한다() throws Exception {
        UUID clientId = UUID.randomUUID();
        long versionId = version("lazy-loop-count");
        int threads = 8;
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<JsonNode>> results = new ArrayList<>();
        try {
            for (int i = 0; i < threads; i++) {
                Callable<JsonNode> task = () -> {
                    start.await();
                    return body(submit(clientId, versionId, "4", "SURE", null));
                };
                results.add(pool.submit(task));
            }
            start.countDown();
            List<Long> ids = new ArrayList<>();
            for (Future<JsonNode> f : results) {
                ids.add(f.get().get("submissionId").asLong());
            }
            assertThat(ids).hasSize(threads).containsOnly(ids.get(0));
        } finally {
            pool.shutdownNow();
        }
        assertThat(count("answer_submission")).isEqualTo(1);
        assertThat(count("delayed_check")).isEqualTo(2);
    }

    @Test
    void 개념을_처음_풀면_3일_7일_뒤_지연_확인이_잡힌다() throws Exception {
        submit(version("lazy-loop-count"), "4", "SURE", null).andExpect(status().isOk());

        assertThat(dueDates("lazy-loop")).containsExactly(DAY0.plusDays(3), DAY0.plusDays(7));

        // 다음 날 같은 개념을 또 풀어도 일정은 처음 그대로다
        clock.advance(Duration.ofDays(1));
        submit(version("lazy-loop-ox"), "X", "SURE", null).andExpect(status().isOk());
        assertThat(dueDates("lazy-loop")).containsExactly(DAY0.plusDays(3), DAY0.plusDays(7));
    }

    @Test
    void 사흘째에_처음과_다른_문제로_다시_묻는다() throws Exception {
        submit(version("lazy-loop-count"), "4", "SURE", null).andExpect(status().isOk());

        clock.advance(Duration.ofDays(2));
        assertThat(getJson("/api/me/delayed-checks/today")).isEmpty();

        clock.advance(Duration.ofDays(1));
        JsonNode today = getJson("/api/me/delayed-checks/today");
        assertThat(today).hasSize(1);
        assertThat(today.get(0).get("conceptName").asText()).isEqualTo("지연 로딩 컬렉션을 루프에서 읽을 때 생기는 추가 쿼리");
        assertThat(today.get(0).get("attemptNo").asInt()).isEqualTo(1);
        // 처음 푼 객관식이 아니라 아직 안 푼 OX 문제를 낸다
        assertThat(today.get(0).get("question").get("questionVersionId").asLong()).isEqualTo(version("lazy-loop-ox"));
        assertThat(today.get(0).get("question").has("answer")).isFalse();
    }

    @Test
    void 지연_확인_결과를_기록하면_오늘_목록에서_빠진다() throws Exception {
        submit(version("lazy-loop-count"), "4", "SURE", null).andExpect(status().isOk());
        clock.advance(Duration.ofDays(3));

        submit(version("lazy-loop-ox"), "X", "UNSURE", "DELAYED_CHECK").andExpect(status().isOk())
                .andExpect(jsonPath("$.correct").value(true))
                .andExpect(jsonPath("$.delayedCheck").value(true));

        assertThat(jdbc.queryForList(
                "select result from delayed_check where user_id = ? order by attempt_no", String.class, userId))
                .containsExactly("CORRECT", null);
        assertThat(getJson("/api/me/delayed-checks/today")).isEmpty();
    }

    @Test
    void 예정되지_않은_지연_확인은_받지_않는다() throws Exception {
        submit(version("lazy-loop-count"), "4", "SURE", null).andExpect(status().isOk());

        submit(version("lazy-loop-ox"), "X", "SURE", "DELAYED_CHECK").andExpect(status().isConflict());
        assertThat(count("answer_submission")).isEqualTo(1);
    }

    @Test
    void 새벽_4시_전에_푼_문제는_전날_공부로_센다() throws Exception {
        clock.set(Instant.parse("2026-11-16T18:30:00Z")); // 2026-11-17 03:30 KST

        submit(version("lazy-loop-count"), "4", "SURE", null).andExpect(status().isOk());

        assertThat(jdbc.queryForObject("select service_date from answer_submission", LocalDate.class))
                .isEqualTo(LocalDate.of(2026, 11, 16));
        assertThat(dueDates("lazy-loop")).containsExactly(LocalDate.of(2026, 11, 19), LocalDate.of(2026, 11, 23));
    }

    @Test
    void 로그인하지_않으면_401() throws Exception {
        mvc.perform(get("/api/me/delayed-checks/today")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/me/delayed-checks/today").header("X-Dev-User-Id", 9999))
                .andExpect(status().isUnauthorized());
    }

    private ResultActions submit(long versionId, String selected, String confidence, String mode) throws Exception {
        return submit(UUID.randomUUID(), versionId, selected, confidence, mode);
    }

    private ResultActions submit(UUID clientId, long versionId, String selected, String confidence, String mode)
            throws Exception {
        String body = """
                {"clientSubmissionId": "%s", "questionVersionId": %d, "selected": "%s", "confidence": "%s", "mode": %s}
                """.formatted(clientId, versionId, selected, confidence, mode == null ? "null" : "\"" + mode + "\"");
        return mvc.perform(post("/api/submissions").header("X-Dev-User-Id", userId)
                .contentType(MediaType.APPLICATION_JSON).content(body));
    }

    private JsonNode body(ResultActions result) throws Exception {
        String content = result.andExpect(status().isOk()).andReturn().getResponse()
                .getContentAsString(StandardCharsets.UTF_8);
        return json.readTree(content);
    }

    private JsonNode getJson(String url) throws Exception {
        return body(mvc.perform(get(url).header("X-Dev-User-Id", userId)));
    }

    private long version(String questionKey) {
        return jdbc.queryForObject("select current_version_id from question where external_key = ?",
                Long.class, "dev/n-plus-1/" + questionKey);
    }

    private List<LocalDate> dueDates(String conceptKey) {
        return jdbc.queryForList("""
                select dc.due_date from delayed_check dc join concept c on c.id = dc.concept_id
                where dc.user_id = ? and c.external_key = ? order by dc.attempt_no
                """, LocalDate.class, userId, "dev/n-plus-1/" + conceptKey);
    }

    private int count(String table) {
        return jdbc.queryForObject("select count(*) from " + table, Integer.class);
    }
}
