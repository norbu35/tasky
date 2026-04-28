# Community 14

> 94 nodes

## Key Concepts

- **.generateUploadUrl()** (22 connections) — `services/api/src/main/java/mn/tasky/common/storage/S3PresignedUrlService.java`
- **.createKey()** (20 connections) — `services/api/src/main/java/mn/tasky/common/storage/StorageKeyPolicy.java`
- **.validateOwnedKey()** (14 connections) — `services/api/src/main/java/mn/tasky/common/storage/StorageKeyPolicy.java`
- **UpdateProfile** (13 connections) — `services/api/src/test/java/mn/tasky/auth/application/UserProfileServiceTest.java`
- **ExtractAvatarStorageKey** (13 connections) — `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/UserProfileCompositionServiceTests.java`
- **StorageKeyPolicy** (10 connections) — `services/api/src/main/java/mn/tasky/common/storage/StorageKeyPolicy.java`
- **.profileResponse()** (9 connections) — `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/UserProfileCompositionService.java`
- **CreateAvatarUploadUrl** (8 connections) — `services/api/src/test/java/mn/tasky/auth/application/UserProfileServiceTest.java`
- **CreateVerificationUploadUrl** (8 connections) — `services/api/src/test/java/mn/tasky/auth/application/VerificationServiceTest.java`
- **.updatesProfileSuccessfully()** (8 connections) — `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/UserProfileUpdateServiceTests.java`
- **.skipsAvatarValidationWhenNull()** (8 connections) — `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/UserProfileUpdateServiceTests.java`
- **.parse()** (7 connections) — `services/api/src/main/java/mn/tasky/common/storage/StorageKeyPolicy.java`
- **.updateProfile()** (7 connections) — `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/UserProfileUpdateService.java`
- **.delegatesCorrectProfileUpdate()** (7 connections) — `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/UserProfileUpdateServiceTests.java`
- **.createVerificationUploadUrl()** (6 connections) — `services/api/src/main/java/mn/tasky/auth/application/VerificationService.java`
- **.createAvatarUploadUrl()** (6 connections) — `services/api/src/main/java/mn/tasky/auth/application/UserProfileService.java`
- **.buildOwnedPhotoAccessUrl()** (6 connections) — `services/api/src/main/java/mn/tasky/task/application/TaskPhotoService.java`
- **.supportedMimeTypeReturnsUrl()** (6 connections) — `services/api/src/test/java/mn/tasky/auth/UserProfileServiceTests.java`
- **.jpegReturnsUrl()** (6 connections) — `services/api/src/test/java/mn/tasky/auth/VerificationServiceTests.java`
- **UserProfileCompositionService** (5 connections) — `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/UserProfileCompositionService.java`
- **TaskPhotoService** (5 connections) — `services/api/src/main/java/mn/tasky/task/application/TaskPhotoService.java`
- **.createPhotoUploadUrl()** (5 connections) — `services/api/src/main/java/mn/tasky/task/application/TaskPhotoService.java`
- **.returnsUploadUrlForSupportedType()** (5 connections) — `services/api/src/test/java/mn/tasky/auth/application/UserProfileServiceTest.java`
- **.normalizesContentType()** (5 connections) — `services/api/src/test/java/mn/tasky/auth/application/UserProfileServiceTest.java`
- **.supportsWebp()** (5 connections) — `services/api/src/test/java/mn/tasky/auth/application/UserProfileServiceTest.java`
- _... and 69 more nodes in this community_

## Relationships

- [[Community 3]] (32 shared connections)
- [[Community 2]] (27 shared connections)
- [[Community 1]] (16 shared connections)
- [[Community 0]] (11 shared connections)
- [[Community 7]] (5 shared connections)
- [[Community 6]] (3 shared connections)
- [[Community 4]] (1 shared connections)
- [[Community 11]] (1 shared connections)
- [[Community 5]] (1 shared connections)
- [[Community 13]] (1 shared connections)

## Source Files

- `services/api/src/main/java/mn/tasky/auth/application/UserProfileService.java`
- `services/api/src/main/java/mn/tasky/auth/application/VerificationService.java`
- `services/api/src/main/java/mn/tasky/common/storage/S3PresignedUrlService.java`
- `services/api/src/main/java/mn/tasky/common/storage/StorageKeyPolicy.java`
- `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/UserProfileCompositionService.java`
- `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/UserProfileUpdateService.java`
- `services/api/src/main/java/mn/tasky/task/application/TaskPhotoService.java`
- `services/api/src/test/java/mn/tasky/auth/UserProfileServiceTests.java`
- `services/api/src/test/java/mn/tasky/auth/VerificationServiceTests.java`
- `services/api/src/test/java/mn/tasky/auth/application/UserProfileServiceTest.java`
- `services/api/src/test/java/mn/tasky/auth/application/VerificationServiceTest.java`
- `services/api/src/test/java/mn/tasky/identity/application/command/IdentityCommandHandlerTest.java`
- `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/UserProfileCompositionServiceTests.java`
- `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/UserProfileUpdateServiceTests.java`
- `services/api/src/test/java/mn/tasky/task/TaskPhotoServiceTests.java`
- `services/api/src/test/java/mn/tasky/task/application/TaskPhotoKeyHelperTest.java`
- `services/api/src/test/java/mn/tasky/task/application/TaskPhotoServiceTest.java`

## Audit Trail

- EXTRACTED: 211 (52%)
- INFERRED: 197 (48%)
- AMBIGUOUS: 0 (0%)

---

_Part of the graphify knowledge wiki. See [[index]] to navigate._
