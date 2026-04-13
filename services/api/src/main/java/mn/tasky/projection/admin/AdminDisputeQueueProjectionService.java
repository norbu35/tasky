package mn.tasky.projection.admin;

import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class AdminDisputeQueueProjectionService {

    private final AdminDisputeQueueProjectionDao projectionDao;

    public AdminDisputeQueueProjectionService(AdminDisputeQueueProjectionDao projectionDao) {
        this.projectionDao = projectionDao;
    }

    public List<AdminDisputeQueueRow> listPending(String cursor, int limit) {
        return projectionDao.findPending(cursor, limit);
    }
}
