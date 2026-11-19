package app.retrievo.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;
import org.springframework.web.server.ResponseStatusException;

/**
 * {@link CurrentUser} 파라미터에 로그인한 사용자 id를 넣는다. 로그인하지 않았으면 401.
 * <ol>
 *   <li>카카오로 로그인한 세션이 있으면 그 사용자 ({@link RetrievoUser})</li>
 *   <li>retrievo.auth.dev-header=true(로컬·테스트)일 때만 X-Dev-User-Id 헤더의 사용자. 운영에서는 꺼져 있다</li>
 * </ol>
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
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof RetrievoUser user && exists(user.userId())) {
            return user.userId();
        }
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
        if (!exists(userId)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "없는 사용자다");
        }
        return userId;
    }

    private boolean exists(long userId) {
        return jdbc.sql("select exists (select 1 from users where id = ?)")
                .param(userId)
                .query(Boolean.class)
                .single();
    }
}
