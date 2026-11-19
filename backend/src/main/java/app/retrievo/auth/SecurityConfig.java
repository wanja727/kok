package app.retrievo.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.logout.HttpStatusReturningLogoutSuccessHandler;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;

/**
 * 로그인: 카카오 OAuth2만 (ADR-010). 로그인 상태는 세션 쿠키(SESSION, Postgres 저장).
 *
 * <ul>
 *   <li>요청을 막는 일은 컨트롤러의 {@link CurrentUser}가 한다. 로그인 없이 보는 API(레슨 목록 등)도 있어서
 *       필터에서는 모두 통과시키고, 사용자가 필요한 곳에서 401을 낸다</li>
 *   <li>프론트가 /oauth2/**와 /login/oauth2/**를 이 서버로 넘긴다. 브라우저에는 프론트 도메인 하나로 보인다</li>
 *   <li>세션 쿠키를 쓰므로 CSRF를 켠다. 토큰은 XSRF-TOKEN 쿠키 → X-XSRF-TOKEN 헤더</li>
 * </ul>
 */
@Configuration
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, KakaoUserService kakaoUsers,
            @Value("${retrievo.public-url}") String publicUrl) throws Exception {
        http
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
                .csrf(csrf -> csrf
                        .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                        .csrfTokenRequestHandler(new SpaCsrfTokenRequestHandler()))
                .oauth2Login(login -> login
                        // 로그인 화면은 프론트에 있다. 스프링 기본 로그인 페이지를 만들지 않는다
                        .loginPage(publicUrl + "/login")
                        .userInfoEndpoint(user -> user.userService(kakaoUsers))
                        .defaultSuccessUrl(publicUrl + "/", true)
                        .failureUrl(publicUrl + "/login?error"))
                .logout(logout -> logout
                        .logoutUrl("/api/logout")
                        .logoutSuccessHandler(new HttpStatusReturningLogoutSuccessHandler(HttpStatus.NO_CONTENT)))
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable);
        return http.build();
    }
}
