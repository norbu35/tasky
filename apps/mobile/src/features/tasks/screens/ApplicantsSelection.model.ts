export interface ApplicantItem {
  id: string;
  taskerId: string;
  name: string;
  avatarUrl?: string;
  rating: number;
  reviewCount: number;
  publicRatingVisible: boolean;
  isVerified: boolean;
  message: string;
  quotePrice?: number | null;
  responseSignal: 'detailed' | 'brief';
}
