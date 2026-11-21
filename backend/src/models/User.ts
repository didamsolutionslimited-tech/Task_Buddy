export enum UserRole {
  CLIENT = 'client',
  TASKER = 'tasker',
  ADMIN = 'admin'
}

export interface User {
  id: string;
  phone_number: string;
  full_name: string;
  email?: string;
  role: UserRole;
  avatar_url?: string;
  is_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AuthRequest {
  phone_number: string;
}

export interface VerifyOTPRequest {
  phone_number: string;
  otp: string;
}
