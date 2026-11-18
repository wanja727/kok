package app.retrievo.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;
import org.springframework.web.server.ResponseStatusException;

/**
 * 1주차 임시 로그인: X-Dev-User-Id 헤더로 사용자를 정한다.
 * retrievo.auth.dev-header=true일 때만 동작하고(로컬·테스트), 기본값은 꺼져 있다.
 * 2주차에 OAuth 로그인과 Redis 세션으로 바꾼다 (ADR-010). 컨트롤러는 @CurrentUser만 쓰므로 바뀌지 않는다.
 */
@Component
public class CurrentUserResolver implements HandlerMethodArgumentResolver {

    static final String HEADER = "X-Dev-User-Id";

    private final boolean devHeaderEnabled;
    private final JdbcClient jdbc;

    public CurrentUserResolver(@Value("${retrievo.auth.dev-header:false}") boolean devHeaderEnabled, JdbcClient jdbc) {
        this.devHeaderEnabled = devHeaderEnabled;
        this.jdbc = jdbc;
    }

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.hasParameterAnnotation(CurrentUser.class);
    }

    @Override
    public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
            NativeWebRequest request, WebDataBinderFactory binderFactory) {
        if (!devHeaderEnabled) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요하다");
        }
        String raw = request.getHeader(HEADER);
        long userId;
        try {
            userId = Long.parseLong(raw);
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요하다");
        }
        boolean exists = jdbc.sql("select exists (select 1 from users where id = ?)")
                .param(userId)
                .query(Boolean.class)
                .single();
        if (!exists) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "없는 사용자다");
        }
        return userId;
    }
}
