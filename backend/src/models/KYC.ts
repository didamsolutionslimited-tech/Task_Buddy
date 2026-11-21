export interface KYCVerification {
  user_id: string;
  id_type: 'NIN' | 'BVN';
  id_number: string;
  verification_status: 'pending' | 'verified' | 'failed';
  verified_at?: Date;
  provider_ref?: string;
}
