export interface TaskDraft {
  draftId: string;
  categoryId?: string;
  categoryName?: string;
  intakeSchemaJson?: string;
  intakeSchemaVersion?: number;
  intakeEnabled?: boolean;
  description?: string;
  intakeAnswers?: Record<string, unknown>;
  photos?: string[];
  location?: {
    lat: number;
    lng: number;
    text: string;
  };
  scheduledAt?: string;
  pricingMode?: 'BUDGET' | 'QUOTE';
  budget?: number | null;
  currentStep: number;
}
