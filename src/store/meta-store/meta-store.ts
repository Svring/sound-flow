import { create } from 'zustand'

export type StatusMessageType = 'success' | 'error' | 'info' | null;

interface MetaState {
  // Status message
  statusMessage: {
    type: StatusMessageType;
    message: string;
  };
  
  // Methods
  setStatusMessage: (type: StatusMessageType, message: string) => void;
  clearStatusMessage: () => void;
}

export const useMetaStore = create<MetaState>()((set) => ({
  // Status message
  statusMessage: {
    type: null,
    message: '',
  },
  
  // Methods
  setStatusMessage: (type, message) => set({
    statusMessage: { type, message }
  }),
  
  clearStatusMessage: () => set({
    statusMessage: { type: null, message: '' }
  }),
}))
