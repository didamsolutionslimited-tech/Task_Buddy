export interface Category {
  id: number;
  name: string;
  icon_url: string;
  description: string;
}

export interface Task {
  id: string;
  client_id: string;
  category_id: number;
  title: string;
  description: string;
  budget: number;
  location_address: string;
  location_lat: number;
  location_lng: number;
  scheduled_date: Date;
  status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  created_at: Date;
}

export interface CreateTaskRequest {
  category_id: number;
  title: string;
  description: string;
  budget: number;
  location_address: string;
  location_lat: number;
  location_lng: number;
  scheduled_date: string;
}
