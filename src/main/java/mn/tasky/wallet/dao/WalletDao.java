package mn.tasky.wallet.dao;

import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.time.Instant;
import java.util.UUID;

import static mn.tasky.common.persistence.UuidHelper.required;

public interface WalletDao {

    default void ensureExists(String userId,
                              Instant now) {
        ensureExists(required(userId,
                "userId"),
            now);
    }

    @SqlUpdate("INSERT INTO wallets (user_id, balance_mnt, held_balance_mnt, updated_at) "
        + "VALUES (:userId, 0, 0, :now) "
        + "ON CONFLICT (user_id) DO NOTHING")
    void ensureExists(@Bind("userId") UUID userId,
                      @Bind("now") Instant now);

    default Long getBalance(String userId) {
        return getBalance(required(userId,
            "userId"));
    }

    @SqlQuery("SELECT balance_mnt FROM wallets WHERE user_id = :userId")
    Long getBalance(@Bind("userId") UUID userId);

    default Long getHeldBalance(String userId) {
        return getHeldBalance(required(userId,
            "userId"));
    }

    @SqlQuery("SELECT held_balance_mnt FROM wallets WHERE user_id = :userId")
    Long getHeldBalance(@Bind("userId") UUID userId);

    default void addBalance(String userId,
                            long amount,
                            Instant now) {
        addBalance(required(userId,
                "userId"),
            amount,
            now);
    }

    @SqlUpdate("UPDATE wallets SET balance_mnt = balance_mnt + :amount, updated_at = :now "
        + "WHERE user_id = :userId")
    void addBalance(@Bind("userId") UUID userId,
                    @Bind("amount") long amount,
                    @Bind("now") Instant now);

    default void addHeldBalance(String userId,
                                long amount,
                                Instant now) {
        addHeldBalance(required(userId,
                "userId"),
            amount,
            now);
    }

    @SqlUpdate(
        "UPDATE wallets SET held_balance_mnt = held_balance_mnt + :amount, updated_at = :now "
            + "WHERE user_id = :userId")
    void addHeldBalance(@Bind("userId") UUID userId,
                        @Bind("amount") long amount,
                        @Bind("now") Instant now);
}
