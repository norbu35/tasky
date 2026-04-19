package mn.tasky.auth.application;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import mn.tasky.auth.dao.BadgeDao;
import mn.tasky.auth.dao.ProfileDao;
import mn.tasky.auth.dao.UserDao;
import mn.tasky.auth.dto.AuthUser;
import mn.tasky.auth.dto.UserProfile;
import mn.tasky.auth.dto.UserProfilePage;
import mn.tasky.auth.dto.UserProfileState;
import mn.tasky.common.security.CryptoService;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * User search service.
 * Handles admin user search by phone, name, and Facebook ID.
 */
@Service
public class UserSearchService {

    private final UserDao userDao;
    private final ProfileDao profileDao;
    private final CryptoService cryptoService;
    private final BadgeDao badgeDao;
    private final UserStatusResolver userStatusResolver;

    public UserSearchService(
            UserDao userDao,
            ProfileDao profileDao,
            CryptoService cryptoService,
            BadgeDao badgeDao,
            UserStatusResolver userStatusResolver) {
        this.userDao = userDao;
        this.profileDao = profileDao;
        this.cryptoService = cryptoService;
        this.badgeDao = badgeDao;
        this.userStatusResolver = userStatusResolver;
    }

    /**
     * Searches users by exact normalized phone value and returns cursor-paged profile results.
     *
     * @param phonePart Phone input to normalize and search.
     * @param cursor    Optional UUID cursor.
     * @param limit     Page size.
     * @return Paged user profiles.
     * @throws IllegalArgumentException when cursor is not a valid UUID.
     */
    public UserProfilePage searchUsersByPhone(String phonePart, String cursor, int limit) {
        UUID cursorId = parseUserSearchCursor(cursor);
        List<UserProfile> candidates = searchUsersByPhoneExact(phonePart).stream()
                .sorted(Comparator.comparing(profile -> UUID.fromString(profile.id())))
                .filter(profile ->
                        cursorId == null || UUID.fromString(profile.id()).compareTo(cursorId) > 0)
                .limit(limit + 1L)
                .toList();

        boolean hasMore = candidates.size() > limit;
        List<UserProfile> pageData = hasMore ? candidates.subList(0, limit) : candidates;
        String nextCursor = hasMore && !pageData.isEmpty() ? pageData.getLast().id() : null;

        return new UserProfilePage(List.copyOf(pageData), nextCursor, hasMore);
    }

    /**
     * Searches users by full name prefix and returns cursor-paged profile results.
     */
    public UserProfilePage searchUsersByName(String name, String cursor, int limit) {
        if (!StringUtils.hasText(name) || name.trim().length() < 2) {
            return new UserProfilePage(List.of(), null, false);
        }
        String pattern = name.trim() + "%";
        UUID cursorId = parseUserSearchCursor(cursor);

        List<AuthUser> candidates = cursorId == null
                ? userDao.searchByName(pattern, limit + 1)
                : userDao.searchByNameAfterCursor(pattern, cursorId, limit + 1);

        List<UserProfile> profiles = candidates.stream()
                .map(user -> {
                    String effectiveStatus = userStatusResolver.resolve(user.id(), user.status());
                    AuthUser effective = new AuthUser(
                            user.id(),
                            user.phone(),
                            user.facebookId(),
                            user.role(),
                            effectiveStatus,
                            user.primaryAuth(),
                            user.createdAt(),
                            user.updatedAt());
                    return toProfile(
                            effective, profileDao.findByUserId(user.id()).orElse(UserProfileState.defaultState()));
                })
                .toList();

        boolean hasMore = profiles.size() > limit;
        List<UserProfile> pageData = hasMore ? profiles.subList(0, limit) : profiles;
        String nextCursor = hasMore && !pageData.isEmpty() ? pageData.getLast().id() : null;
        return new UserProfilePage(List.copyOf(pageData), nextCursor, hasMore);
    }

    /**
     * Searches users by exact Facebook ID and returns cursor-paged profile results.
     */
    public UserProfilePage searchUsersByFacebookId(String facebookId, String cursor, int limit) {
        if (!StringUtils.hasText(facebookId)) {
            return new UserProfilePage(List.of(), null, false);
        }
        UUID cursorId = parseUserSearchCursor(cursor);
        List<UserProfile> candidates = userDao
                .findByFacebookId(facebookId.trim())
                .map(user -> {
                    String effectiveStatus = userStatusResolver.resolve(user.id(), user.status());
                    AuthUser effective = new AuthUser(
                            user.id(),
                            user.phone(),
                            user.facebookId(),
                            user.role(),
                            effectiveStatus,
                            user.primaryAuth(),
                            user.createdAt(),
                            user.updatedAt());
                    return toProfile(
                            effective, profileDao.findByUserId(user.id()).orElse(UserProfileState.defaultState()));
                })
                .stream()
                .filter(p -> cursorId == null || UUID.fromString(p.id()).compareTo(cursorId) > 0)
                .limit(limit + 1L)
                .toList();

        boolean hasMore = candidates.size() > limit;
        List<UserProfile> pageData = hasMore ? candidates.subList(0, limit) : candidates;
        String nextCursor = hasMore && !pageData.isEmpty() ? pageData.getLast().id() : null;
        return new UserProfilePage(List.copyOf(pageData), nextCursor, hasMore);
    }

    private List<UserProfile> searchUsersByPhoneExact(String phone) {
        String normalizedPhone = normalizePhone(phone);
        if (!StringUtils.hasText(normalizedPhone)) {
            return List.of();
        }
        String blindIndex = cryptoService.blindIndex(normalizedPhone);
        return userDao
                .findByPhoneBlindIndex(blindIndex)
                .map(user -> {
                    String effectiveStatus = userStatusResolver.resolve(user.id(), user.status());
                    AuthUser effectiveUser = new AuthUser(
                            user.id(),
                            user.phone(),
                            user.facebookId(),
                            user.role(),
                            effectiveStatus,
                            user.primaryAuth(),
                            user.createdAt(),
                            user.updatedAt());
                    return toProfile(
                            effectiveUser, profileDao.findByUserId(user.id()).orElse(UserProfileState.defaultState()));
                })
                .stream()
                .toList();
    }

    private UUID parseUserSearchCursor(String cursor) {
        if (!StringUtils.hasText(cursor)) {
            return null;
        }
        try {
            return UUID.fromString(cursor.trim());
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Cursor is invalid.", exception);
        }
    }

    private String normalizePhone(String phone) {
        if (!StringUtils.hasText(phone)) {
            return "";
        }
        String digitsOnly = phone.trim().replaceAll("\\D", "");
        if (!StringUtils.hasText(digitsOnly)) {
            return "";
        }
        return "+" + digitsOnly;
    }

    private UserProfile toProfile(AuthUser user, UserProfileState profile) {
        boolean isPro =
                badgeDao.findActiveByTaskerId(user.id()).stream().anyMatch(badge -> "PRO".equals(badge.badgeType()));
        return new UserProfile(
                user.id(),
                decryptPhone(user.phone()),
                user.role(),
                user.status(),
                profile.fullName(),
                profile.avatarUrl(),
                profile.bio(),
                profile.ratingAvg(),
                profile.completedTasks(),
                isPro,
                user.createdAt().toString());
    }

    private String decryptPhone(String encryptedPhone) {
        if (!StringUtils.hasText(encryptedPhone)) {
            return null;
        }
        return cryptoService.decrypt(encryptedPhone);
    }
}
