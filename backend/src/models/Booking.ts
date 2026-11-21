export interface Booking {
  id: string;
  task_id: string;
  tasker_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'confirmed' | 'completed';
  accepted_at?: Date;
  completed_at?: Date;
}

export interface BookingRequest {
  task_id: string;
  tasker_id: string;
}

export interface PaymentRecord {
  id: string;
  booking_id: string;
  amount: number;
  platform_fee: number;
  transaction_ref: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
}
