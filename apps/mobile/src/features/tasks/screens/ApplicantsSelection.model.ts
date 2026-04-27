export interface ApplicantItem {
  id: string;
  taskerId: string;
  name: string;
  avatarUrl?: string;
  bio?: string;
  rating: number;
  completedJobs: number;
  reviewCount: number;
  publicRatingVisible: boolean;
  isVerified: boolean;
  createdAt?: string;
  message: string;
  quotePrice?: number | null;
  responseSignal: 'detailed' | 'brief';
}
