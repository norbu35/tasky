export type ScreenState = 'loaded' | 'loading' | 'error';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface FaqSection {
  id: string;
  title: string;
  items: FaqItem[];
}

export function resolveState(value: string | string[] | undefined): ScreenState {
  const state = Array.isArray(value) ? value[0] : value;
  return state === 'loading' || state === 'error' ? state : 'loaded';
}

export function buildFaqSections(t: (key: string) => string): FaqSection[] {
  return [
    {
      id: 'general',
      title: t('infra.help.sectionGeneral'),
      items: [
        {
          id: 'general-what-is-tasky',
          question: t('infra.help.qWhatIsTasky'),
          answer: t('infra.help.aWhatIsTasky'),
        },
        {
          id: 'general-how-it-works',
          question: t('infra.help.qHowItWorks'),
          answer: t('infra.help.aHowItWorks'),
        },
      ],
    },
    {
      id: 'tasks',
      title: t('infra.help.sectionTasks'),
      items: [
        {
          id: 'tasks-post-task',
          question: t('infra.help.qPostTask'),
          answer: t('infra.help.aPostTask'),
        },
      ],
    },
    {
      id: 'bookings',
      title: t('infra.help.sectionBookings'),
      items: [
        {
          id: 'bookings-cancel',
          question: t('infra.help.qCancelBooking'),
          answer: t('infra.help.aCancelBooking'),
        },
      ],
    },
    {
      id: 'payments',
      title: t('infra.help.sectionPayments'),
      items: [
        {
          id: 'payments-how-paid',
          question: t('infra.help.qHowPaid'),
          answer: t('infra.help.aHowPaid'),
        },
      ],
    },
    {
      id: 'account',
      title: t('infra.help.sectionAccount'),
      items: [
        {
          id: 'account-update',
          question: t('infra.help.qUpdateAccount'),
          answer: t('infra.help.aUpdateAccount'),
        },
      ],
    },
  ];
}

export function filterSections(sections: FaqSection[], query: string): FaqSection[] {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return sections;
  }

  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          item.question.toLowerCase().includes(normalized) ||
          item.answer.toLowerCase().includes(normalized),
      ),
    }))
    .filter((section) => section.items.length > 0);
}
