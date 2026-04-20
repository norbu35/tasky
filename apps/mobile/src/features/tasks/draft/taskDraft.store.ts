import { create } from 'zustand';

import type { TaskDraft } from './taskDraft.types';

interface TaskDraftState {
  drafts: Record<string, TaskDraft>;
  createDraft: () => string;
  getDraft: (draftId: string) => TaskDraft | undefined;
  updateDraft: (draftId: string, partial: Partial<TaskDraft>) => void;
  clearDraft: (draftId: string) => void;
}

let nextId = 1;

export const useTaskDraftStore = create<TaskDraftState>((set, get) => ({
  drafts: {},

  createDraft: () => {
    const draftId = `draft-${Date.now()}-${nextId++}`;
    const draft: TaskDraft = { draftId, currentStep: 0 };
    set((state) => ({ drafts: { ...state.drafts, [draftId]: draft } }));
    return draftId;
  },

  getDraft: (draftId: string) => get().drafts[draftId],

  updateDraft: (draftId: string, partial: Partial<TaskDraft>) => {
    set((state) => {
      const existing = state.drafts[draftId];
      if (!existing) return state;
      return { drafts: { ...state.drafts, [draftId]: { ...existing, ...partial } } };
    });
  },

  clearDraft: (draftId: string) => {
    set((state) => {
      const { [draftId]: _, ...rest } = state.drafts;
      return { drafts: rest };
    });
  },
}));
