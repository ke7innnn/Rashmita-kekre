import { create } from 'zustand';

interface AppState {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  selectedTimeSegment: 'ALL' | 'MORNING' | 'AFTERNOON' | 'EVENING';
  setSelectedTimeSegment: (segment: 'ALL' | 'MORNING' | 'AFTERNOON' | 'EVENING') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedAppointmentId: string | null;
  setSelectedAppointmentId: (id: string | null) => void;
  isAddInfoModalOpen: boolean;
  setIsAddInfoModalOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedDate: new Date().toISOString().split('T')[0],
  setSelectedDate: (date) => set({ selectedDate: date }),
  selectedTimeSegment: 'ALL',
  setSelectedTimeSegment: (segment) => set({ selectedTimeSegment: segment }),
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  selectedAppointmentId: null,
  setSelectedAppointmentId: (id) => set({ selectedAppointmentId: id }),
  isAddInfoModalOpen: false,
  setIsAddInfoModalOpen: (open) => set({ isAddInfoModalOpen: open }),
}));
