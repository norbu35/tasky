export interface ApplicantItem {
  id: string;
  taskerId: string;
  name: string;
  avatarUrl?: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  isRecommended: boolean;
  message: string;
}
