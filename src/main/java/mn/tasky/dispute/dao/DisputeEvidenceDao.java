package mn.tasky.dispute.dao;

import static mn.tasky.common.persistence.UuidHelper.required;

import java.util.List;
import java.util.UUID;
import mn.tasky.dispute.dto.DisputeEvidence;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

@RegisterConstructorMapper(DisputeEvidence.class)
public interface DisputeEvidenceDao {

    default void insert(String id, String disputeId, String type, String storageKey, String textPayload) {
        insert(required(id, "id"), required(disputeId, "disputeId"), type, storageKey, textPayload);
    }

    @SqlUpdate("INSERT INTO dispute_evidence (id, dispute_id, type, storage_key, text_payload) "
            + "VALUES (:id, :disputeId, :type, :storageKey, :textPayload)")
    void insert(
            @Bind("id") UUID id,
            @Bind("disputeId") UUID disputeId,
            @Bind("type") String type,
            @Bind("storageKey") String storageKey,
            @Bind("textPayload") String textPayload);

    default List<DisputeEvidence> findByDisputeId(String disputeId) {
        return findByDisputeId(required(disputeId, "disputeId"));
    }

    @SqlQuery("SELECT * FROM dispute_evidence WHERE dispute_id = :disputeId ORDER BY created_at DESC")
    List<DisputeEvidence> findByDisputeId(@Bind("disputeId") UUID disputeId);

    default int countByDisputeId(String disputeId) {
        return countByDisputeId(required(disputeId, "disputeId"));
    }

    @SqlQuery("SELECT COUNT(*) FROM dispute_evidence WHERE dispute_id = :disputeId")
    int countByDisputeId(@Bind("disputeId") UUID disputeId);
}
