package app.retrievo.auth;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 로그인 수단(카카오 등)과 사용자를 잇는다. 비밀번호는 두지 않는다 (ADR-010).
 * 같은 (provider, provider_user_id)로 다시 로그인하면 처음 만든 사용자를 돌려준다.
 */
@Service
public class UserAccounts {

    /** 카카오 닉네임을 받지 못했을 때 쓰는 이름 */
    static final String DEFAULT_NICKNAME = "학습자";
    private static final int NICKNAME_MAX = 50;

    private final JdbcClient jdbc;

    UserAccounts(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional
    public long findOrCreate(String provider, String providerUserId, String nickname) {
        Long existing = findUserId(provider, providerUserId);
        if (existing != null) {
            return existing;
        }
        long userId = jdbc.sql("insert into users (nickname) values (?) returning id")
                .param(cleanNickname(nickname))
                .query(Long.class)
                .single();
        // 같은 계정으로 동시에 처음 로그인하면 한쪽만 들어간다. 진 쪽은 만든 사용자를 지우고 이긴 쪽 사용자를 쓴다
        int inserted = jdbc.sql("""
                        insert into user_identity (user_id, provider, provider_user_id) values (?, ?, ?)
                        on conflict (provider, provider_user_id) do nothing
                        """)
                .params(userId, provider, providerUserId)
                .update();
        if (inserted == 1) {
            return userId;
        }
        jdbc.sql("delete from users where id = ?").param(userId).update();
        return findUserId(provider, providerUserId);
    }

    private Long findUserId(String provider, String providerUserId) {
        return jdbc.sql("select user_id from user_identity where provider = ? and provider_user_id = ?")
                .params(provider, providerUserId)
                .query(Long.class)
                .optional()
                .orElse(null);
    }

    static String cleanNickname(String nickname) {
        if (nickname == null || nickname.isBlank()) {
            return DEFAULT_NICKNAME;
        }
        String trimmed = nickname.strip();
        return trimmed.length() > NICKNAME_MAX ? trimmed.substring(0, NICKNAME_MAX) : trimmed;
    }
}
