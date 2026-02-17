package mn.tasky.wallet.dao;

import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.time.Instant;

public interface WalletDao {

    @SqlUpdate("INSERT INTO wallets (user_id, balance_mnt, held_balance_mnt, updated_at) "
             + "VALUES (CAST(:userId AS UUID), 0, 0, :now) "
             + "ON CONFLICT (user_id) DO NOTHING")
    void ensureExists(@Bind("userId") String userId, @Bind("now") Instant now);

    @SqlQuery("SELECT balance_mnt FROM wallets WHERE user_id = CAST(:userId AS UUID)")
    Long getBalance(@Bind("userId") String userId);

    @SqlQuery("SELECT held_balance_mnt FROM wallets WHERE user_id = CAST(:userId AS UUID)")
    Long getHeldBalance(@Bind("userId") String userId);

    @SqlUpdate("UPDATE wallets SET balance_mnt = balance_mnt + :amount, updated_at = :now "
             + "WHERE user_id = CAST(:userId AS UUID)")
    void addBalance(@Bind("userId") String userId, @Bind("amount") long amount, @Bind("now") Instant now);

    @SqlUpdate("UPDATE wallets SET held_balance_mnt = held_balance_mnt + :amount, updated_at = :now "
             + "WHERE user_id = CAST(:userId AS UUID)")
    void addHeldBalance(@Bind("userId") String userId, @Bind("amount") long amount, @Bind("now") Instant now);
}
