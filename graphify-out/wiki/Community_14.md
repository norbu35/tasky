# Community 14

> 125 nodes

## Key Concepts

- **.generateUploadUrl()** (22 connections) — `services/api/src/main/java/mn/tasky/common/storage/S3PresignedUrlService.java`
- **.createKey()** (20 connections) — `services/api/src/main/java/mn/tasky/common/storage/StorageKeyPolicy.java`
- **MarketplaceCommandHandlerTest** (15 connections) — `services/api/src/test/java/mn/tasky/marketplace/application/command/MarketplaceCommandHandlerTest.java`
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
- **.createVerificationUploadUrl()** (6 connections) — `services/api/src/main/java/mn/tasky/auth/application/VerificationService.java`
- **.createAvatarUploadUrl()** (6 connections) — `services/api/src/main/java/mn/tasky/auth/application/UserProfileService.java`
- **.updateProfile()** (6 connections) — `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/UserProfileUpdateService.java`
- **.buildOwnedPhotoAccessUrl()** (6 connections) — `services/api/src/main/java/mn/tasky/task/application/TaskPhotoService.java`
- **.supportedMimeTypeReturnsUrl()** (6 connections) — `services/api/src/test/java/mn/tasky/auth/UserProfileServiceTests.java`
- **.jpegReturnsUrl()** (6 connections) — `services/api/src/test/java/mn/tasky/auth/VerificationServiceTests.java`
- **key()** (5 connections) — `services/api/src/main/java/mn/tasky/kernel/logging/LogField.java`
- **UserProfileCompositionService** (5 connections) — `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/UserProfileCompositionService.java`
- **.submitVerification()** (5 connections) — `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/VerificationSubmissionService.java`
- **TaskPhotoService** (5 connections) — `services/api/src/main/java/mn/tasky/task/application/TaskPhotoService.java`
- _... and 100 more nodes in this community_

## Relationships

- [[Community 0]] (64 shared connections)
- [[Community 2]] (9 shared connections)
- [[Community 1]] (9 shared connections)
- [[Community 10]] (7 shared connections)
- [[Community 5]] (7 shared connections)
- [[Community 19]] (4 shared connections)
- [[Community 11]] (4 shared connections)
- [[Community 4]] (3 shared connections)
- [[Community 16]] (2 shared connections)
- [[Community 13]] (1 shared connections)
- [[Community 3]] (1 shared connections)
- [[Community 15]] (1 shared connections)

## Source Files

- `services/api/src/main/java/mn/tasky/auth/application/UserProfileService.java`
- `services/api/src/main/java/mn/tasky/auth/application/VerificationService.java`
- `services/api/src/main/java/mn/tasky/common/storage/S3PresignedUrlService.java`
- `services/api/src/main/java/mn/tasky/common/storage/StorageKeyPolicy.java`
- `services/api/src/main/java/mn/tasky/kernel/logging/LogField.java`
- `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/UserProfileCompositionService.java`
- `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/UserProfileUpdateService.java`
- `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/VerificationSubmissionService.java`
- `services/api/src/main/java/mn/tasky/task/application/TaskPhotoService.java`
- `services/api/src/test/java/mn/tasky/auth/UserProfileServiceTests.java`
- `services/api/src/test/java/mn/tasky/auth/VerificationServiceTests.java`
- `services/api/src/test/java/mn/tasky/auth/application/UserProfileServiceTest.java`
- `services/api/src/test/java/mn/tasky/auth/application/VerificationServiceTest.java`
- `services/api/src/test/java/mn/tasky/identity/application/command/IdentityCommandHandlerTest.java`
- `services/api/src/test/java/mn/tasky/kernel/logging/LogFieldTest.java`
- `services/api/src/test/java/mn/tasky/marketplace/application/command/MarketplaceCommandHandlerTest.java`
- `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/UserProfileCompositionServiceTests.java`
- `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/UserProfileUpdateServiceTests.java`
- `services/api/src/test/java/mn/tasky/task/TaskPhotoServiceTests.java`
- `services/api/src/test/java/mn/tasky/task/application/TaskLifecycleServiceTest.java`

## Audit Trail

- EXTRACTED: 265 (54%)
- INFERRED: 224 (46%)
- AMBIGUOUS: 0 (0%)

---

_Part of the graphify knowledge wiki. See [[index]] to navigate._
