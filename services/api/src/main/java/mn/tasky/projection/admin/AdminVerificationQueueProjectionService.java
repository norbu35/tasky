package mn.tasky.projection.admin;

import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class AdminVerificationQueueProjectionService {

    private final AdminVerificationQueueProjectionDao projectionDao;

    public AdminVerificationQueueProjectionService(AdminVerificationQueueProjectionDao projectionDao) {
        this.projectionDao = projectionDao;
    }

    public List<AdminVerificationQueueRow> listPending(String cursor, int limit) {
        return projectionDao.findPending(cursor, limit);
    }
}
