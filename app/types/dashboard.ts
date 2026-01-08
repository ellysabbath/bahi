// types/dashboard.ts
export interface ServiceType {
  id: number;
  name: string;
  icon: string;
  color: string;
  desc: string;
}

export interface ActiveService {
  id: number;
  type: string;
  time: string;
  status: 'In Progress' | 'Scheduled' | 'Completed';
  mechanic: string;
}

export interface Transaction {
  id: number;
  service: string;
  amount: number;
  date: string;
  status: 'Completed' | 'Pending';
}