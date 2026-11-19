package app.retrievo.learning;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import app.retrievo.content.ContentImporter;
import app.retrievo.support.IntegrationTest;
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
 * 핵심 루프: 레슨 문제 보기(정답 없이) → 확신도와 함께 답 내기 → 채점·해설 → 배운 날 3번 정답이면 지연 확인 예약
 * → 3일·7일·21일 뒤 다른 문제로 확인 → 세 번 통과하면 졸업 (ADR-017).
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
    void 레슨_목록은_주제를_뺀_레슨_키와_판정_문제_수를_준다() throws Exception {
        JsonNode lessons = getJson("/api/lessons");

        assertThat(lessons).hasSize(1);
        assertThat(lessons.get(0).get("key").asText()).isEqualTo("n-plus-1");
        assertThat(lessons.get(0).get("questionCount").asInt()).isEqualTo(3);
    }

    @Test
    void 레슨_본문이_없으면_steps는_null이고_있으면_일곱_단계를_준다() throws Exception {
        JsonNode before = getJson("/api/lessons/" + lessonId);
        assertThat(before.get("key").asText()).isEqualTo("n-plus-1");
        assertThat(before.get("steps").isNull()).isTrue();

        String withSteps = new ClassPathResource("content/n-plus-1.yaml").getContentAsString(StandardCharsets.UTF_8)
                + new ClassPathResource("content-fragments/n-plus-1-steps.yaml").getContentAsString(StandardCharsets.UTF_8);
        importer.importYaml("n-plus-1.yaml", withSteps);

        JsonNode steps = getJson("/api/lessons/" + lessonId).get("steps");
        assertThat(steps.get("predict").get("answer").asInt()).isEqualTo(2);
        assertThat(steps.get("practice").get("runs")).hasSize(1);
        assertThat(steps.get("interview").get("points")).hasSize(2);
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

        mvc.perform(post("/api/submissions").header("X-Dev-User-Id", userId).with(csrf())
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
        assertThat(count("concept_progress")).isEqualTo(1);
    }

    @Test
    void 배운_날_3번_맞히면_3일_뒤_첫_확인이_잡힌다() throws Exception {
        submit(version("lazy-loop-count"), "4", "SURE", null).andExpect(status().isOk());
        submit(version("lazy-loop-ox"), "O", "SURE", null).andExpect(status().isOk()); // 틀린 답은 세지 않는다
        submit(version("lazy-loop-ox"), "X", "SURE", null).andExpect(status().isOk());
        assertThat(progress("lazy-loop")).isEqualTo(new Progress(0, null, null));

        submit(version("lazy-loop-count"), "4", "UNSURE", null).andExpect(status().isOk());
        assertThat(progress("lazy-loop")).isEqualTo(new Progress(1, DAY0, DAY0.plusDays(3)));

        // 다음 날 같은 개념을 레슨에서 또 풀어도 일정은 그대로다
        clock.advance(Duration.ofDays(1));
        submit(version("lazy-loop-ox"), "X", "SURE", null).andExpect(status().isOk());
        assertThat(progress("lazy-loop")).isEqualTo(new Progress(1, DAY0, DAY0.plusDays(3)));
    }

    @Test
    void 배운_날_기준은_같은_날_정답만_센다() throws Exception {
        submit(version("lazy-loop-count"), "4", "SURE", null).andExpect(status().isOk());
        submit(version("lazy-loop-ox"), "X", "SURE", null).andExpect(status().isOk());
        clock.advance(Duration.ofDays(1));
        submit(version("lazy-loop-count"), "4", "SURE", null).andExpect(status().isOk());

        assertThat(progress("lazy-loop").stage()).isZero();
    }

    @Test
    void 사흘째에_처음과_다른_문제로_다시_묻는다() throws Exception {
        learn("lazy-loop-count", "4");

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
    void 지연_확인을_맞히면_다음_단계로_가고_오늘_목록에서_빠진다() throws Exception {
        learn("lazy-loop-count", "4");
        clock.advance(Duration.ofDays(3));

        submit(version("lazy-loop-ox"), "X", "UNSURE", "DELAYED_CHECK").andExpect(status().isOk())
                .andExpect(jsonPath("$.correct").value(true))
                .andExpect(jsonPath("$.delayedCheck").value(true));

        assertThat(progress("lazy-loop")).isEqualTo(new Progress(2, DAY0, DAY0.plusDays(7)));
        assertThat(jdbc.queryForList("""
                select attempt_no || ' ' || result || ' ' || stage_after from delayed_check where user_id = ?
                """, String.class, userId)).containsExactly("1 CORRECT 2");
        assertThat(getJson("/api/me/delayed-checks/today")).isEmpty();
    }

    @Test
    void 재확인_세_번을_모두_통과하면_졸업하고_더는_묻지_않는다() throws Exception {
        learn("lazy-loop-count", "4");

        clock.advance(Duration.ofDays(3));
        checkToday("lazy-loop", true, "SURE");
        clock.advance(Duration.ofDays(4));
        assertThat(getJson("/api/me/delayed-checks/today").get(0).get("attemptNo").asInt()).isEqualTo(2);
        checkToday("lazy-loop", true, "SURE");
        clock.advance(Duration.ofDays(14));
        assertThat(getJson("/api/me/delayed-checks/today").get(0).get("attemptNo").asInt()).isEqualTo(3);
        checkToday("lazy-loop", true, "SURE");

        assertThat(progress("lazy-loop")).isEqualTo(new Progress(4, DAY0, null));
        clock.advance(Duration.ofDays(100));
        assertThat(getJson("/api/me/delayed-checks/today")).isEmpty();

        JsonNode concepts = getJson("/api/me/concepts");
        assertThat(concepts).hasSize(1);
        assertThat(concepts.get(0).get("graduated").asBoolean()).isTrue();
        assertThat(concepts.get(0).get("stage").asInt()).isEqualTo(4);
        assertThat(concepts.get(0).get("graduatedAt").isNull()).isFalse();
    }

    @Test
    void 기록은_실제_풀이와_확인에서_센_값만_준다() throws Exception {
        // 배운 날: 맞힘 3 + 틀림 1 (확실했는데 틀림)
        learn("lazy-loop-count", "4");
        submit(version("fetch-join-predict"), "2", "SURE", null).andExpect(status().isOk());
        // 3일 확인 맞힘, 7일 확인 틀림(애매)
        clock.advance(Duration.ofDays(3));
        checkToday("lazy-loop", true, "SURE");
        clock.advance(Duration.ofDays(4));
        checkToday("lazy-loop", false, "UNSURE");

        JsonNode report = getJson("/api/me/report");

        assertThat(report.get("today").asText()).isEqualTo(DAY0.plusDays(7).toString());
        assertThat(report.get("retrievals").asInt()).isEqualTo(6);
        JsonNode curve = report.get("curve");
        assertThat(curve.get("learnedDay").get("correct").asInt()).isEqualTo(3);
        assertThat(curve.get("learnedDay").get("total").asInt()).isEqualTo(4);
        assertThat(curve.get("day3").get("correct").asInt()).isEqualTo(1);
        assertThat(curve.get("day7").get("correct").asInt()).isZero();
        assertThat(curve.get("day7").get("total").asInt()).isEqualTo(1);
        assertThat(curve.get("day21").get("total").asInt()).isZero();
        // lazy-loop는 7일 확인에서 틀려 1단계로, fetch-join은 배우는 중
        assertThat(report.get("stages").get("passed1").asInt()).isEqualTo(1);
        assertThat(report.get("stages").get("learning").asInt()).isEqualTo(1);
        // 확신도 순서는 확실 → 애매 → 모름이고 답이 없는 확신도도 0으로 온다
        JsonNode confidence = report.get("confidence");
        assertThat(confidence.get(0).get("confidence").asText()).isEqualTo("SURE");
        assertThat(confidence.get(0).get("correct").asInt()).isEqualTo(4);
        assertThat(confidence.get(0).get("total").asInt()).isEqualTo(5);
        assertThat(confidence.get(1).get("total").asInt()).isEqualTo(1);
        assertThat(confidence.get(2).get("total").asInt()).isZero();
        // 답을 낸 날은 배운 날, 3일 뒤, 7일 뒤
        assertThat(report.get("activity")).hasSize(3);
        assertThat(report.get("activity").get(0).get("count").asInt()).isEqualTo(4);
    }

    @Test
    void 마지막_확인에만_가르치듯_말해_볼_서술형_질문을_함께_준다() throws Exception {
        learn("fetch-join-predict", "1");
        clock.advance(Duration.ofDays(3));
        assertThat(getJson("/api/me/delayed-checks/today").get(0).get("teach").isNull()).isTrue();
        checkToday("fetch-join", true, "SURE");
        clock.advance(Duration.ofDays(4));
        checkToday("fetch-join", true, "SURE");
        clock.advance(Duration.ofDays(14));

        JsonNode last = getJson("/api/me/delayed-checks/today").get(0);
        assertThat(last.get("attemptNo").asInt()).isEqualTo(3);
        JsonNode teach = last.get("teach");
        assertThat(teach.get("body").asText()).isEqualTo("N+1 문제가 무엇이고 어떻게 해결하는지 면접에서 답하듯 설명해 보세요.");
        assertThat(teach.get("checklist")).hasSize(4);
        assertThat(teach.get("questionVersionId").asLong()).isEqualTo(version("fetch-join-explain"));
    }

    @Test
    void 서술형_문제가_없는_개념은_마지막_확인에도_teach가_없다() throws Exception {
        learn("lazy-loop-count", "4");
        clock.advance(Duration.ofDays(3));
        checkToday("lazy-loop", true, "SURE");
        clock.advance(Duration.ofDays(4));
        checkToday("lazy-loop", true, "SURE");
        clock.advance(Duration.ofDays(14));

        JsonNode last = getJson("/api/me/delayed-checks/today").get(0);
        assertThat(last.get("attemptNo").asInt()).isEqualTo(3);
        assertThat(last.get("teach").isNull()).isTrue();
    }

    @Test
    void 내_프로필은_닉네임과_가입한_날부터_며칠째인지_준다() throws Exception {
        jdbc.update("update users set created_at = ? where id = ?",
                java.sql.Timestamp.from(START.minus(Duration.ofDays(2))), userId);

        JsonNode me = getJson("/api/me");

        assertThat(me.get("nickname").asText()).isEqualTo("tester");
        assertThat(me.get("joinedOn").asText()).isEqualTo(DAY0.minusDays(2).toString());
        assertThat(me.get("days").asLong()).isEqualTo(3);
    }

    @Test
    void 재확인에서_틀리면_한_단계_돌아간다() throws Exception {
        learn("lazy-loop-count", "4");
        clock.advance(Duration.ofDays(3));
        checkToday("lazy-loop", true, "SURE");
        clock.advance(Duration.ofDays(4));

        checkToday("lazy-loop", false, "UNSURE");

        assertThat(progress("lazy-loop")).isEqualTo(new Progress(1, DAY0, DAY0.plusDays(10)));
    }

    @Test
    void 확실했는데_틀린_개념은_다음_날_다른_개념보다_먼저_묻는다() throws Exception {
        learn("fetch-join-predict", "1");
        learn("lazy-loop-count", "4");
        clock.advance(Duration.ofDays(3));

        // fetch-join은 오늘 확인하지 않고 미룬다. lazy-loop은 확실하다고 했는데 틀린다
        checkToday("lazy-loop", false, "SURE");
        assertThat(progress("lazy-loop")).isEqualTo(new Progress(1, DAY0, DAY0.plusDays(4)));

        clock.advance(Duration.ofDays(1));
        JsonNode today = getJson("/api/me/delayed-checks/today");
        assertThat(today).hasSize(2);
        assertThat(today.get(0).get("conceptName").asText()).isEqualTo("지연 로딩 컬렉션을 루프에서 읽을 때 생기는 추가 쿼리");
        assertThat(today.get(0).get("sureWrong").asBoolean()).isTrue();
        assertThat(today.get(1).get("sureWrong").asBoolean()).isFalse();
        assertThat(today.get(1).get("learnedOn").asText()).isEqualTo(DAY0.toString());
    }

    @Test
    void 예정되지_않은_지연_확인은_받지_않는다() throws Exception {
        submit(version("lazy-loop-count"), "4", "SURE", null).andExpect(status().isOk());

        submit(version("lazy-loop-ox"), "X", "SURE", "DELAYED_CHECK").andExpect(status().isConflict());
        assertThat(count("answer_submission")).isEqualTo(1);

        // 배운 날 기준을 통과해도 사흘이 지나기 전에는 받지 않는다
        learn("lazy-loop-count", "4");
        clock.advance(Duration.ofDays(2));
        submit(version("lazy-loop-ox"), "X", "SURE", "DELAYED_CHECK").andExpect(status().isConflict());
    }

    @Test
    void 새벽_4시_전에_푼_문제는_전날_공부로_센다() throws Exception {
        clock.set(Instant.parse("2026-11-16T18:30:00Z")); // 2026-11-17 03:30 KST

        learn("lazy-loop-count", "4");

        assertThat(jdbc.queryForList("select distinct service_date from answer_submission", LocalDate.class))
                .containsExactly(LocalDate.of(2026, 11, 16));
        assertThat(progress("lazy-loop"))
                .isEqualTo(new Progress(1, LocalDate.of(2026, 11, 16), LocalDate.of(2026, 11, 19)));
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
        return mvc.perform(post("/api/submissions").header("X-Dev-User-Id", userId).with(csrf())
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

    /** 레슨에서 같은 문제를 세 번 맞혀 배운 날 기준을 통과한다 */
    private void learn(String questionKey, String answer) throws Exception {
        for (int i = 0; i < 3; i++) {
            submit(version(questionKey), answer, "SURE", null).andExpect(status().isOk());
        }
    }

    /** 오늘 목록에서 이 개념의 문제를 찾아 맞히거나 틀린다 */
    private void checkToday(String conceptKey, boolean correct, String confidence) throws Exception {
        long conceptId = jdbc.queryForObject("select id from concept where external_key = ?", Long.class,
                "dev/n-plus-1/" + conceptKey);
        JsonNode question = null;
        for (JsonNode check : getJson("/api/me/delayed-checks/today")) {
            if (check.get("conceptId").asLong() == conceptId) {
                question = check.get("question");
            }
        }
        assertThat(question).as("오늘 확인할 개념에 " + conceptKey + "가 있다").isNotNull();
        long versionId = question.get("questionVersionId").asLong();
        String answer = jdbc.queryForObject("select answer from question_version where id = ?", String.class, versionId);
        String selected = correct ? answer : wrongAnswer(question.get("type").asText(), answer);
        submit(versionId, selected, confidence, "DELAYED_CHECK").andExpect(status().isOk())
                .andExpect(jsonPath("$.correct").value(correct));
    }

    private static String wrongAnswer(String type, String answer) {
        if (type.equals("OX")) {
            return answer.equals("O") ? "X" : "O";
        }
        return answer.equals("1") ? "2" : "1";
    }

    record Progress(int stage, LocalDate learnedOn, LocalDate dueDate) {
    }

    private Progress progress(String conceptKey) {
        return jdbc.queryForObject("""
                select p.stage, p.learned_on, p.due_date from concept_progress p join concept c on c.id = p.concept_id
                where p.user_id = ? and c.external_key = ?
                """, (rs, n) -> new Progress(rs.getInt("stage"), rs.getObject("learned_on", LocalDate.class),
                rs.getObject("due_date", LocalDate.class)), userId, "dev/n-plus-1/" + conceptKey);
    }

    private int count(String table) {
        return jdbc.queryForObject("select count(*) from " + table, Integer.class);
    }
}
