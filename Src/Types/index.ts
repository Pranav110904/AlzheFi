export type UserRole = 'patient' | 'caregiver';

export interface User {
  id: string;
  _id?: string; // MongoDB uses _id
  name: string;
  email: string;
  role: UserRole;
  linkedPatientIds?: string[];
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  datetime: string;
  importance: 'low' | 'medium' | 'high';
  reminderOffsets?: number[];
  createdBy: 'patient' | 'caregiver';
  reminderStatus: 'pending' | 'sent' | 'failed';
}

export interface Thought {
  id: string;
  rawText: string;
  entities?: {
    people?: string[];
    activities?: string[];
  };
  timestamp: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ChatResponse {
  thought: Thought;
  response: string;
  relevantMemories: number;
}

export interface SearchResult {
  id: string;
  content: string;
  relevance: number;
  timestamp: string;
}

export interface ActivityLog {
  activity: Thought[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: 'patient' | 'caregiver';
}

export interface EventCreateRequest {
  title: string;
  description?: string;
  datetime: string;
  importance: 'low' | 'medium' | 'high';
  reminderOffsets?: number[];
}

export interface ChatMessageRequest {
  message: string;
}

export interface SearchRequest {
  query: string;
}

export interface LinkPatientRequest {
  email: string;
}

export interface PatientProfile extends User {
  linkedCaregiverIds?: string[];
}
