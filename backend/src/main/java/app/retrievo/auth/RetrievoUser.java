package app.retrievo.auth;

import java.io.Serializable;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;

/**
 * 로그인한 사용자. 세션(Postgres)에 직렬화되어 저장되므로 Retrievo 사용자 id만 담는다.
 * 카카오에서 받은 다른 정보(닉네임 등)는 가입할 때 한 번만 쓰고 세션에 두지 않는다.
 */
public record RetrievoUser(long userId) implements OAuth2User, Serializable {

    @Override
    public Map<String, Object> getAttributes() {
        return Map.of("userId", userId);
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_USER"));
    }

    /** 세션의 principal_name. 사용자 id로 둔다 */
    @Override
    public String getName() {
        return Long.toString(userId);
    }
}
