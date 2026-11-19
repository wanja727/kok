package app.retrievo.auth;

import java.util.Map;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

/** 카카오가 준 사용자 정보로 Retrievo 사용자를 찾거나 만든다 */
@Service
public class KakaoUserService extends DefaultOAuth2UserService {

    static final String PROVIDER = "KAKAO";

    private final UserAccounts accounts;

    KakaoUserService(UserAccounts accounts) {
        this.accounts = accounts;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest request) {
        return toUser(super.loadUser(request).getAttributes());
    }

    /**
     * 카카오 사용자 정보: {"id": 123, "kakao_account": {"profile": {"nickname": "..."}}}.
     * 닉네임은 동의 항목이라 없을 수 있다
     */
    RetrievoUser toUser(Map<String, Object> attributes) {
        Object id = attributes.get("id");
        if (id == null) {
            throw new IllegalStateException("카카오 사용자 id가 없다");
        }
        long userId = accounts.findOrCreate(PROVIDER, id.toString(), nickname(attributes));
        return new RetrievoUser(userId);
    }

    private static String nickname(Map<String, Object> attributes) {
        if (attributes.get("kakao_account") instanceof Map<?, ?> account
                && account.get("profile") instanceof Map<?, ?> profile
                && profile.get("nickname") instanceof String nickname) {
            return nickname;
        }
        if (attributes.get("properties") instanceof Map<?, ?> properties
                && properties.get("nickname") instanceof String nickname) {
            return nickname;
        }
        return null;
    }
}
