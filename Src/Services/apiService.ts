import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Types from '../Types';

const API_BASE_URL = Platform.select({
  ios: 'http://localhost:3005/api',
  //android: 'http://10.0.2.2:3005/api',
   android: 'https://curalz.onrender.com/api',
  default: 'http://localhost:3005/api',
});

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 90000,
      headers: { 'Content-Type': 'application/json' },
    });

    // attach token
    this.api.interceptors.request.use(async config => {
      const token = await AsyncStorage.getItem('userToken');
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    this.api.interceptors.response.use(
    res => res,
    async (error: AxiosError) => {
      if (error.response?.status === 401) {
        // Clear everything on unauthorized
        await AsyncStorage.multiRemove(['userToken', 'user']);
      }
      return Promise.reject(error);
    }
  );
  }

  // ---------- AUTH ----------
  private normalizeAuthResponse(data: any): Types.AuthResponse {
    return {
      token: data.token,
      user: {
        id: data._id,
        _id: data._id,
        name: data.name,
        email: data.email,
        role: data.role,
        linkedPatientIds: [],
      },
    };
  }

  async register(data: Types.RegisterRequest): Promise<Types.AuthResponse> {
    const response = await this.api.post('/auth/register', data);
    return this.normalizeAuthResponse(response.data);
  }

  async login(data: Types.LoginRequest): Promise<Types.AuthResponse> {
    const response = await this.api.post('/auth/login', data);
    return this.normalizeAuthResponse(response.data);
  }

  // ---------- EVENTS ----------
  async getEvents(): Promise<Types.Event[]> {
    const res = await this.api.get('/events');
    return res.data;
  }

  async createEvent(data: Types.EventCreateRequest): Promise<Types.Event> {
    const res = await this.api.post('/events', data);
    return res.data;
  }

  async updateEvent(id: string, data: Partial<Types.Event>): Promise<Types.Event> {
    const res = await this.api.put(`/events/${id}`, data);
    return res.data;
  }

  async deleteEvent(id: string): Promise<void> {
    await this.api.delete(`/events/${id}`);
  }

  // ---------- CHAT ----------
  async sendMessage(message: string): Promise<Types.ChatResponse> {
    const res = await this.api.post('/chat/message', { message });
    return res.data;
  }

  async getChatHistory(limit = 20, skip = 0): Promise<Types.Thought[]> {
    const res = await this.api.get('/chat/history', { params: { limit, skip } });
    return res.data.thoughts;
  }

  async searchMemories(query: string): Promise<Types.SearchResult[]> {
    const res = await this.api.post('/chat/search', { query });
    return res.data.results;
  }

  // ---------- CAREGIVER ----------
  async getLinkedPatients(): Promise<Types.User[]> {
    const res = await this.api.get('/caregiver/patients');
    return res.data.patients;
  }
  async getPatientEvents(patientId: string): Promise<Types.Event[]> {
  const res = await this.api.get(`/caregiver/patient/${patientId}/events`);
  return res.data.events ?? res.data ?? [];
}

  async linkPatient(email: string): Promise<Types.User> {
    const res = await this.api.post('/caregiver/patient/link', { email });
    return res.data;
  }

  async getPatientProfile(patientId: string): Promise<Types.PatientProfile> {
    const res = await this.api.get(`/caregiver/patient/${patientId}/profile`);
    return res.data;
  }

  async updatePatientProfile(patientId: string, data: Partial<Types.User>): Promise<Types.PatientProfile> {
    const res = await this.api.put(`/caregiver/patient/${patientId}/profile`, data);
    return res.data;
  }

  async getPatientActivity(patientId: string, limit = 10): Promise<Types.Thought[]> {
    const res = await this.api.get(`/caregiver/patient/${patientId}/activity`, { params: { limit } });
    return res.data.activity;
  }


  async createPatientEvent(patientId: string, data: any) {
  const res = await this.api.post(`/caregiver/patient/${patientId}/event`, data);
  return res.data;
}


async deletePatientEvent(eventId: string) {
  const res = await this.api.delete(`/caregiver/event/${eventId}`);
  return res.data;
}



// ---------- MEMORY (CAREGIVER) ----------

// Add Photo Memory
async addPhotoMemory(
  patientId: string,
  data: {
    title?: string;
    year?: string;
    category?: string;
    caption?: string;
    imageUrl: string;
  }
): Promise<any> {
  const res = await this.api.post(
    `/caregiver/patient/${patientId}/memory/photo`,
    data
  );
  return res.data;
}

// Add Story Memory
async addStoryMemory(
  patientId: string,
  data: {
    title?: string;
    year?: string;
    description: string;
    mood?: string;
  }
): Promise<any> {
  const res = await this.api.post(
    `/caregiver/patient/${patientId}/memory/story`,
    data
  );
  return res.data;
}

// Add Place Memory
async addPlaceMemory(
  patientId: string,
  data: {
    placeName: string;
    address?: string;
    category?: string;
    description?: string;
    photoUrl?: string;
  }
): Promise<any> {
  const res = await this.api.post(
    `/caregiver/patient/${patientId}/memory/place`,
    data
  );
  return res.data;
}




// ---------- PATIENT ----------

// 📸 Get memories by type (photo, place, story, chat)
async getMemoriesByType(
  type: 'photo' | 'place' | 'story' | 'chat',
  limit = 20,
  skip = 0
): Promise<any[]> {
  const res = await this.api.get(`/patient/memories/${type}`, {
    params: { limit, skip },
  });
  return res.data.memories;
}


// 👨‍👩‍👧 Get contacts
async getContacts(): Promise<any[]> {
  const res = await this.api.get(`/patient/contacts`);
  return res.data.contacts;
}


// ➕ Create contact
async createContact(data: {
  name: string;
  relationship: string;
  phoneNumber: string;
}): Promise<any> {
  const res = await this.api.post(`/patient/contacts`, data);
  return res.data;
}
  // ---------- CONVERSATION ----------
  async queryConversation(query: string): Promise<{ answer: string }> {
    const res = await this.api.post('/conversation/query', { query });
    return res.data;
  }

  // ---------- LOGOUT ----------
  async logout(): Promise<void> {
    await AsyncStorage.multiRemove(['userToken', 'user']);
  }

  
}


export const apiService = new ApiService();
