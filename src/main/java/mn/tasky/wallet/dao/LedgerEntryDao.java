package mn.tasky.wallet.dao;

import mn.tasky.wallet.dto.LedgerEntry;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.time.Instant;
import java.util.List;

@RegisterConstructorMapper(LedgerEntry.class)
public interface LedgerEntryDao {

    @SqlUpdate("INSERT INTO ledger_entries (id, user_id, amount, type, reference_id, description, created_at) "
             + "VALUES (:id, :userId, :amount, :type, :referenceId, :description, :createdAt)")
    void insert(@Bind("id") String id,
                @Bind("userId") String userId,
                @Bind("amount") int amount,
                @Bind("type") String type,
                @Bind("referenceId") String referenceId,
                @Bind("description") String description,
                @Bind("createdAt") Instant createdAt);

    @SqlQuery("SELECT * FROM ledger_entries WHERE user_id = :userId ORDER BY created_at DESC")
    List<LedgerEntry> findByUserId(@Bind("userId") String userId);
}
