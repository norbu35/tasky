# Community 13

> 119 nodes

## Key Concepts

- **.generateDownloadUrl()** (23 connections) — `services/api/src/main/java/mn/tasky/common/storage/S3PresignedUrlService.java`
- **.generateUploadUrl()** (22 connections) — `services/api/src/main/java/mn/tasky/common/storage/S3PresignedUrlService.java`
- **.createKey()** (20 connections) — `services/api/src/main/java/mn/tasky/common/storage/StorageKeyPolicy.java`
- **.validateOwnedKey()** (14 connections) — `services/api/src/main/java/mn/tasky/common/storage/StorageKeyPolicy.java`
- **UpdateProfile** (13 connections) — `services/api/src/test/java/mn/tasky/auth/application/UserProfileServiceTest.java`
- **ExtractAvatarStorageKey** (13 connections) — `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/UserProfileCompositionServiceTests.java`
- **StorageKeyPolicy** (10 connections) — `services/api/src/main/java/mn/tasky/common/storage/StorageKeyPolicy.java`
- **SubmitVerification** (10 connections) — `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/VerificationSubmissionServiceTests.java`
- **.profileResponse()** (9 connections) — `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/UserProfileCompositionService.java`
- **.returnsDetailWithUrls()** (9 connections) — `services/api/src/test/java/mn/tasky/auth/application/VerificationServiceTest.java`
- **CreateAvatarUploadUrl** (8 connections) — `services/api/src/test/java/mn/tasky/auth/application/UserProfileServiceTest.java`
- **CreateVerificationUploadUrl** (8 connections) — `services/api/src/test/java/mn/tasky/auth/application/VerificationServiceTest.java`
- **.updatesProfileSuccessfully()** (8 connections) — `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/UserProfileUpdateServiceTests.java`
- **.skipsAvatarValidationWhenNull()** (8 connections) — `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/UserProfileUpdateServiceTests.java`
- **StatusResponse** (8 connections) — `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/VerificationPublicCompositionServiceTests.java`
- **.parse()** (7 connections) — `services/api/src/main/java/mn/tasky/common/storage/StorageKeyPolicy.java`
- **.delegatesCorrectProfileUpdate()** (7 connections) — `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/UserProfileUpdateServiceTests.java`
- **.defaultRequest()** (7 connections) — `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/VerificationSubmissionServiceTests.java`
- **.createVerificationUploadUrl()** (6 connections) — `services/api/src/main/java/mn/tasky/auth/application/VerificationService.java`
- **.createAvatarUploadUrl()** (6 connections) — `services/api/src/main/java/mn/tasky/auth/application/UserProfileService.java`
- **.updateProfile()** (6 connections) — `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/UserProfileUpdateService.java`
- **.buildOwnedPhotoAccessUrl()** (6 connections) — `services/api/src/main/java/mn/tasky/task/application/TaskPhotoService.java`
- **.supportedMimeTypeReturnsUrl()** (6 connections) — `services/api/src/test/java/mn/tasky/auth/UserProfileServiceTests.java`
- **.jpegReturnsUrl()** (6 connections) — `services/api/src/test/java/mn/tasky/auth/VerificationServiceTests.java`
- **key()** (5 connections) — `services/api/src/main/java/mn/tasky/kernel/logging/LogField.java`
- _... and 94 more nodes in this community_

## Relationships

- [[Community 0]] (77 shared connections)
- [[Community 1]] (12 shared connections)
- [[Community 11]] (8 shared connections)
- [[Community 4]] (8 shared connections)
- [[Community 6]] (7 shared connections)
- [[Community 16]] (6 shared connections)
- [[Community 3]] (5 shared connections)
- [[Community 5]] (3 shared connections)
- [[Community 12]] (2 shared connections)
- [[Community 2]] (1 shared connections)
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
- `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/UserProfileCompositionServiceTests.java`
- `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/UserProfileUpdateServiceTests.java`
- `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/VerificationPublicCompositionServiceTests.java`
- `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/VerificationSubmissionServiceTests.java`
- `services/api/src/test/java/mn/tasky/task/TaskPhotoServiceTests.java`

## Audit Trail

- EXTRACTED: 266 (52%)
- INFERRED: 246 (48%)
- AMBIGUOUS: 0 (0%)

---

_Part of the graphify knowledge wiki. See [[index]] to navigate._
