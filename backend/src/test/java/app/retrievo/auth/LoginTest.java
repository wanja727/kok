package app.retrievo.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oauth2Login;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import app.retrievo.support.IntegrationTest;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

/** 카카오 로그인(OAuth2)과 세션, CSRF */
class LoginTest extends IntegrationTest {

    @Autowired
    MockMvc mvc;

    @Autowired
    KakaoUserService kakaoUsers;

    @Test
    void 카카오로_처음_로그인하면_사용자를_만들고_다시_로그인하면_같은_사용자다() {
        Map<String, Object> kakao = Map.of(
                "id", 4242L,
                "kakao_account", Map.of("profile", Map.of("nickname", "꺼내는사람")));

        RetrievoUser first = kakaoUsers.toUser(kakao);
        RetrievoUser again = kakaoUsers.toUser(kakao);

        assertThat(again.userId()).isEqualTo(first.userId());
        assertThat(jdbc.queryForObject("select nickname from users where id = ?", String.class, first.userId()))
                .isEqualTo("꺼내는사람");
        assertThat(jdbc.queryForObject("""
                select count(*) from user_identity where provider = 'KAKAO' and provider_user_id = '4242'
                """, Integer.class)).isEqualTo(1);
    }

    @Test
    void 닉네임_동의를_하지_않았으면_기본_이름을_쓴다() {
        RetrievoUser user = kakaoUsers.toUser(Map.of("id", 7L));

        assertThat(jdbc.queryForObject("select nickname from users where id = ?", String.class, user.userId()))
                .isEqualTo(UserAccounts.DEFAULT_NICKNAME);
    }

    @Test
    void 로그인한_세션의_사용자로_API를_쓴다() throws Exception {
        long userId = createUser("세션사용자");

        mvc.perform(get("/api/me").with(oauth2Login().oauth2User(new RetrievoUser(userId))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nickname").value("세션사용자"));
    }

    @Test
    void 카카오_로그인은_프론트_주소로_돌아오는_redirect_uri로_시작한다() throws Exception {
        String location = mvc.perform(get("/oauth2/authorization/kakao"))
                .andExpect(status().is3xxRedirection())
                .andReturn().getResponse().getHeader("Location");

        assertThat(location).startsWith("https://kauth.kakao.com/oauth/authorize");
        assertThat(location).contains("redirect_uri=http://localhost:3000/login/oauth2/code/kakao");
    }

    @Test
    void CSRF_토큰_없이_보낸_POST는_거부하고_쿠키로_토큰을_내려준다() throws Exception {
        long userId = createUser("csrf");

        mvc.perform(post("/api/submissions").with(oauth2Login().oauth2User(new RetrievoUser(userId)))
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/lessons")).andExpect(cookie().exists("XSRF-TOKEN"));
    }

    @Test
    void 로그아웃하면_204() throws Exception {
        long userId = createUser("로그아웃");

        mvc.perform(post("/api/logout").with(oauth2Login().oauth2User(new RetrievoUser(userId))).with(csrf()))
                .andExpect(status().isNoContent());
    }
}
