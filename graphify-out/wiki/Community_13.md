# Community 13

> 117 nodes

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
- **.delegatesCorrectProfileUpdate()** (7 connections) — `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/UserProfileUpdateServiceTests.java`
- **CreatePhotoUploadUrl** (7 connections) — `services/api/src/test/java/mn/tasky/task/application/TaskPhotoServiceTest.java`
- **.updateProfile()** (6 connections) — `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/UserProfileUpdateService.java`
- **.buildOwnedPhotoAccessUrl()** (6 connections) — `services/api/src/main/java/mn/tasky/task/application/TaskPhotoService.java`
- **key()** (5 connections) — `services/api/src/main/java/mn/tasky/kernel/logging/LogField.java`
- **.submitVerification()** (5 connections) — `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/VerificationSubmissionService.java`
- **UserProfileCompositionService** (5 connections) — `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/UserProfileCompositionService.java`
- **TaskPhotoService** (5 connections) — `services/api/src/main/java/mn/tasky/task/application/TaskPhotoService.java`
- **.createPhotoUploadUrl()** (5 connections) — `services/api/src/main/java/mn/tasky/task/application/TaskPhotoService.java`
- **.returnsUploadUrlForSupportedType()** (5 connections) — `services/api/src/test/java/mn/tasky/auth/application/UserProfileServiceTest.java`
- **.normalizesContentType()** (5 connections) — `services/api/src/test/java/mn/tasky/auth/application/UserProfileServiceTest.java`
- **.supportsWebp()** (5 connections) — `services/api/src/test/java/mn/tasky/auth/application/UserProfileServiceTest.java`
- **.returnsUploadUrlForJpeg()** (5 connections) — `services/api/src/test/java/mn/tasky/auth/application/VerificationServiceTest.java`
- _... and 92 more nodes in this community_

## Relationships

- [[Community 1]] (37 shared connections)
- [[Community 0]] (32 shared connections)
- [[Community 2]] (14 shared connections)
- [[Community 4]] (4 shared connections)
- [[Community 5]] (3 shared connections)
- [[Community 15]] (2 shared connections)
- [[Community 10]] (2 shared connections)
- [[Community 3]] (2 shared connections)
- [[Community 11]] (1 shared connections)
- [[Community 16]] (1 shared connections)
- [[Community 29]] (1 shared connections)

## Source Files

- `services/api/src/main/java/mn/tasky/common/storage/S3PresignedUrlService.java`
- `services/api/src/main/java/mn/tasky/common/storage/StorageKeyPolicy.java`
- `services/api/src/main/java/mn/tasky/kernel/logging/LogField.java`
- `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/UserProfileCompositionService.java`
- `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/UserProfileUpdateService.java`
- `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/VerificationSubmissionService.java`
- `services/api/src/main/java/mn/tasky/task/application/TaskPhotoKeyHelper.java`
- `services/api/src/main/java/mn/tasky/task/application/TaskPhotoService.java`
- `services/api/src/main/java/mn/tasky/task/dao/TaskPhotoDao.java`
- `services/api/src/test/java/mn/tasky/auth/application/UserProfileServiceTest.java`
- `services/api/src/test/java/mn/tasky/auth/application/VerificationServiceTest.java`
- `services/api/src/test/java/mn/tasky/identity/application/command/IdentityCommandHandlerTest.java`
- `services/api/src/test/java/mn/tasky/kernel/logging/LogFieldTest.java`
- `services/api/src/test/java/mn/tasky/marketplace/application/command/MarketplaceCommandHandlerTest.java`
- `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/UserProfileCompositionServiceTests.java`
- `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/UserProfileUpdateServiceTests.java`
- `services/api/src/test/java/mn/tasky/task/TaskPhotoServiceTests.java`
- `services/api/src/test/java/mn/tasky/task/application/TaskPhotoKeyHelperTest.java`
- `services/api/src/test/java/mn/tasky/task/application/TaskPhotoServiceTest.java`

## Audit Trail

- EXTRACTED: 249 (55%)
- INFERRED: 200 (45%)
- AMBIGUOUS: 0 (0%)

---

_Part of the graphify knowledge wiki. See [[index]] to navigate._
