# Mobile Screen Section Naming Remediation — Implementation Plan

Date: 2026-04-20
Source spec: `docs/plans/2026-04-20-mobile-screen-section-naming-remediation-spec.md`
Scope: `apps/mobile/src/**/*.parts.tsx` (15 files), `apps/mobile/scripts/structure-check.js`, `docs/ARCHITECTURE.md`

## Classification Matrix

### Tasks Domain (7 files, 1,439 lines)

| File                            | Lines | Exports | Re-exports | Coherence             | Migration Category                                      |
| ------------------------------- | ----- | ------- | ---------- | --------------------- | ------------------------------------------------------- |
| `ApplicantsSelection.parts.tsx` | 155   | 2       | 0          | Coherent              | split into semantic siblings                            |
| `CustomerTaskDetail.parts.tsx`  | 244   | 7       | 5          | Mixed bucket + barrel | split into semantic siblings + remove barrel re-exports |
| `CustomerTasks.parts.tsx`       | 201   | 5       | 0          | Mixed                 | split into semantic siblings                            |
| `TaskIntake.parts.tsx`          | 220   | 1       | 0          | Coherent              | simple rename                                           |
| `TaskLocation.parts.tsx`        | 178   | 3       | 0          | Mixed (same domain)   | split into semantic siblings                            |
| `TaskReviewSubmit.parts.tsx`    | 218   | 4       | 0          | Coherent              | simple rename                                           |
| `TaskSchedule.parts.tsx`        | 223   | 3       | 0          | Coherent              | simple rename                                           |

### Bookings Domain (4 files, 653 lines)

| File                          | Lines | Exports | Re-exports | Coherence          | Migration Category                                      |
| ----------------------------- | ----- | ------- | ---------- | ------------------ | ------------------------------------------------------- |
| `BookingDetail.parts.tsx`     | 194   | 5       | 0          | Mixed              | split into semantic siblings                            |
| `BookingReschedule.parts.tsx` | 199   | 6       | 4          | Mixed + barrel     | split into semantic siblings + remove barrel re-exports |
| `BookingTimeline.parts.tsx`   | 81    | 1       | 0          | Coherent           | simple rename                                           |
| `BookingsList.parts.tsx`      | 179   | 4       | 0          | Mixed (borderline) | split into semantic siblings                            |

### Other Domains (4 files, 885 lines)

| File                         | Lines | Exports | Re-exports | Coherence      | Migration Category                                      |
| ---------------------------- | ----- | ------- | ---------- | -------------- | ------------------------------------------------------- |
| `ChatConversation.parts.tsx` | 177   | 4       | 0          | Mixed          | split into semantic siblings                            |
| `DisputeStatus.parts.tsx`    | 230   | 10      | 2          | Mixed + barrel | split into semantic siblings + remove barrel re-exports |
| `HelpCenter.parts.tsx`       | 195   | 6       | 0          | Mixed          | split into semantic siblings                            |
| `ReviewForm.parts.tsx`       | 283   | 7       | 0          | Mixed          | split into semantic siblings                            |

## Per-File Export Classification And Target Layout

### 1. ApplicantsSelection.parts.tsx → split into 2 siblings

| Export              | Semantic Role  | Target File                                 |
| ------------------- | -------------- | ------------------------------------------- |
| `ApplicantCard`     | list-item      | `ApplicantsSelection.ApplicantCard.tsx`     |
| `ConfirmationSheet` | modal-or-sheet | `ApplicantsSelection.ConfirmationSheet.tsx` |

### 2. CustomerTaskDetail.parts.tsx → split into 7 siblings + remove barrel

| Export                          | Semantic Role | Target File                                                          |
| ------------------------------- | ------------- | -------------------------------------------------------------------- |
| `TaskHeader`                    | header        | `CustomerTaskDetail.Header.tsx`                                      |
| `DetailRow`                     | detail-row    | `CustomerTaskDetail.DetailRow.tsx`                                   |
| `IntakeAnswersSection`          | content-block | `CustomerTaskDetail.IntakeAnswers.tsx`                               |
| `BudgetCard`                    | summary-card  | `CustomerTaskDetail.BudgetCard.tsx`                                  |
| `ApplicantsSection`             | list-section  | `CustomerTaskDetail.ApplicantsSection.tsx`                           |
| `LocationCard`                  | summary-card  | `CustomerTaskDetail.LocationCard.tsx`                                |
| `TaskerCard`                    | summary-card  | `CustomerTaskDetail.TaskerCard.tsx`                                  |
| _(re-export)_ `DetailTemplate`  | —             | Screen imports directly from `@/components/templates/DetailTemplate` |
| _(re-export)_ `TaskCancelSheet` | —             | Screen imports directly from `../components/TaskCancelSheet`         |
| _(re-export)_ `CompletedBanner` | —             | Screen imports directly from `./CustomerTaskDetail.Banners`          |
| _(re-export)_ `CancelledBanner` | —             | Screen imports directly from `./CustomerTaskDetail.Banners`          |
| _(re-export)_ `PhotosSection`   | —             | Screen imports directly from `./CustomerTaskDetail.Photos`           |

### 3. CustomerTasks.parts.tsx → split into 3 siblings

| Export                      | Semantic Role             | Target File                  |
| --------------------------- | ------------------------- | ---------------------------- |
| `TaskCard` + `SkeletonCard` | list-item + loading-state | `CustomerTasks.TaskCard.tsx` |
| `Header`                    | header                    | `CustomerTasks.Header.tsx`   |
| `EmptyState` + `ErrorState` | empty-state + error-state | `CustomerTasks.States.tsx`   |

### 4. TaskIntake.parts.tsx → simple rename

| Export                                                  | Semantic Role | Target File                          |
| ------------------------------------------------------- | ------------- | ------------------------------------ |
| `SchemaFieldRenderer` (+ internal `ChipGroup`, `YesNo`) | form-section  | `TaskIntake.SchemaFieldRenderer.tsx` |

### 5. TaskLocation.parts.tsx → split into 3 siblings

| Export               | Semantic Role | Target File                     |
| -------------------- | ------------- | ------------------------------- |
| `MapControls`        | toolbar       | `TaskLocation.MapControls.tsx`  |
| `MapOverlay`         | content-block | `TaskLocation.MapOverlay.tsx`   |
| `LocationStatusCard` | summary-card  | `TaskLocation.LocationCard.tsx` |

### 6. TaskReviewSubmit.parts.tsx → simple rename

| Export                                                                 | Semantic Role                 | Target File                            |
| ---------------------------------------------------------------------- | ----------------------------- | -------------------------------------- |
| `SectionCard`, `PhotosCard`, `IntakeAnswersSummary`, `DescriptionCard` | summary-card (coherent group) | `TaskReviewSubmit.SummarySections.tsx` |

### 7. TaskSchedule.parts.tsx → simple rename

| Export                                     | Semantic Role                 | Target File                     |
| ------------------------------------------ | ----------------------------- | ------------------------------- |
| `DateCard`, `BudgetField`, `PickerSection` | form-section (coherent group) | `TaskSchedule.ScheduleForm.tsx` |

### 8. BookingDetail.parts.tsx → split into 3 siblings

| Export                                                 | Semantic Role         | Target File                         |
| ------------------------------------------------------ | --------------------- | ----------------------------------- |
| `StatusSection`                                        | header                | `BookingDetail.StatusHeader.tsx`    |
| `TaskerSection` + `TaskSummarySection` + `PaymentNote` | summary-card + banner | `BookingDetail.SummarySections.tsx` |
| `ActionButtons`                                        | toolbar               | `BookingDetail.ActionToolbar.tsx`   |

### 9. BookingReschedule.parts.tsx → split into 4 siblings + remove barrel

| Export                           | Semantic Role | Target File                                                     |
| -------------------------------- | ------------- | --------------------------------------------------------------- |
| `CurrentScheduleCard`            | summary-card  | `BookingReschedule.CurrentSchedule.tsx`                         |
| `StepIndicator` + `PolicyNote`   | banner        | `BookingReschedule.InfoBanners.tsx`                             |
| `TimeSlotList`                   | form-section  | `BookingReschedule.TimeSlots.tsx`                               |
| `ReasonInput`                    | input-bar     | `BookingReschedule.ReasonInput.tsx`                             |
| _(re-export)_ `DatePicker`       | —             | Screen imports directly from `./BookingReschedule.datePicker`   |
| _(re-export)_ `ScreenContainer`  | —             | Screen imports directly from `@/components/shells`              |
| _(re-export)_ `InsetScrollView`  | —             | Screen imports directly from `@/components/shells`              |
| _(re-export)_ `RequestStateCard` | —             | Screen imports directly from `./BookingReschedule.submitAction` |
| _(re-export)_ `SubmitButton`     | —             | Screen imports directly from `./BookingReschedule.submitAction` |

### 10. BookingTimeline.parts.tsx → simple rename

| Export             | Semantic Role | Target File                       |
| ------------------ | ------------- | --------------------------------- |
| `TimelineEventRow` | timeline-row  | `BookingTimeline.TimelineRow.tsx` |

### 11. BookingsList.parts.tsx → split into 3 siblings

| Export                                | Semantic Role             | Target File                    |
| ------------------------------------- | ------------------------- | ------------------------------ |
| `FilterTab`                           | filter-bar                | `BookingsList.FilterBar.tsx`   |
| `BookingCard` + `LoadingSkeletonCard` | list-item + loading-state | `BookingsList.BookingCard.tsx` |
| `EmptyState`                          | empty-state               | `BookingsList.EmptyState.tsx`  |

### 12. ChatConversation.parts.tsx → split into 4 siblings

| Export          | Semantic Role | Target File                          |
| --------------- | ------------- | ------------------------------------ |
| `ChatHeader`    | header        | `ChatConversation.Header.tsx`        |
| `MessageBubble` | list-item     | `ChatConversation.MessageBubble.tsx` |
| `PhoneWarning`  | banner        | `ChatConversation.PhoneWarning.tsx`  |
| `InputBar`      | input-bar     | `ChatConversation.InputBar.tsx`      |

### 13. DisputeStatus.parts.tsx → split into 3 siblings + remove barrel

| Export                                                               | Semantic Role                               | Target File                                             |
| -------------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------- |
| `StatusBadge` + `DisputeSummary` + `ResolutionSection` + `PhaseNote` | summary-card + content-block                | `DisputeStatus.SummarySections.tsx`                     |
| `EvidenceList`                                                       | list-section                                | `DisputeStatus.EvidenceList.tsx`                        |
| `DecorativeScale` + `LoadingState` + `ErrorState`                    | content-block + loading-state + error-state | `DisputeStatus.States.tsx`                              |
| _(re-export)_ `TimelineSection`                                      | —                                           | Screen imports directly from `./DisputeStatus.timeline` |
| _(re-export)_ `SURFACE`                                              | —                                           | Screen imports directly from `./DisputeStatus.model`    |

### 14. HelpCenter.parts.tsx → split into 3 siblings

| Export                                       | Semantic Role                       | Target File                |
| -------------------------------------------- | ----------------------------------- | -------------------------- |
| `HelpSearchBar`                              | filter-bar                          | `HelpCenter.SearchBar.tsx` |
| `HelpLoading` + `HelpErrorState`             | loading-state + error-state         | `HelpCenter.States.tsx`    |
| `FaqItemRow` + `CategorySection` + `SURFACE` | list-item + list-section + constant | `HelpCenter.FaqList.tsx`   |

### 15. ReviewForm.parts.tsx → split into 4 siblings

| Export                                  | Semantic Role           | Target File                    |
| --------------------------------------- | ----------------------- | ------------------------------ |
| `ReviewFormHeader` + `CounterpartyCard` | header + summary-card   | `ReviewForm.Header.tsx`        |
| `StarRatingInput` + `RatingSection`     | form-section            | `ReviewForm.RatingInput.tsx`   |
| `CommentField`                          | form-section            | `ReviewForm.CommentField.tsx`  |
| `SuccessOverlay` + `SubmitFooter`       | content-block + toolbar | `ReviewForm.SubmitSection.tsx` |

## Execution Order

### Tranche 1: Docs + Tooling

Update ARCHITECTURE.md and structure-check.js to recognize semantic section files.

### Tranche 2: Tasks Domain (7 files)

Priority: tasks first (highest edit frequency, most files).

### Tranche 3: Bookings Domain (4 files)

### Tranche 4: Review + Help + Disputes + Chat (4 files)

## Residual Risks

1. **Import surface size:** CustomerTaskDetail and BookingReschedule screens import many components.
2. **Internal helpers:** TaskIntake.parts.tsx has non-exported `ChipGroup` and `YesNo`.
3. **No behavior changes:** This migration is purely structural.
