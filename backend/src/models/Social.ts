export interface Message {
  id: string;
  booking_id: string;
  sender_id: string;
  text: string;
  created_at: Date;
}

export interface Review {
  id: string;
  booking_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string;
  created_at: Date;
}

export interface AdminStat {
  total_users: number;
  total_tasks: number;
  total_revenue: number;
  pending_kyc: number;
}
