import { useTaskDraftStore } from './taskDraft.store';
import type { TaskDraft } from './taskDraft.types';

export function useTaskDraft(draftId: string | undefined) {
  const draft = useTaskDraftStore((s) => (draftId ? s.drafts[draftId] : undefined));
  const updateDraft = useTaskDraftStore((s) => s.updateDraft);
  const clearDraft = useTaskDraftStore((s) => s.clearDraft);

  return {
    draft: draft as TaskDraft | undefined,
    update: (partial: Partial<TaskDraft>) => {
      if (draftId) updateDraft(draftId, partial);
    },
    clear: () => {
      if (draftId) clearDraft(draftId);
    },
  };
}
