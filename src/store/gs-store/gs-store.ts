import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { GsModel } from '@/models'

// Language options dictionary
const languageOptions = {
  "中文": "all_zh",      // 全部按中文识别
  "英文": "en",          // 全部按英文识别
  "日文": "all_ja",      // 全部按日文识别
  "粤语": "all_yue",     // 全部按中文识别
  "韩文": "all_ko",      // 全部按韩文识别
  "中英混合": "zh",      // 按中英混合识别
  "日英混合": "ja",      // 按日英混合识别
  "粤英混合": "yue",     // 按粤英混合识别
  "韩英混合": "ko",      // 按韩英混合识别
  "多语种混合": "auto",  // 多语种启动切分识别语种
  "多语种混合(粤语)": "auto_yue",  // 多语种启动切分识别语种
}

interface GsState {
  // API connection
  apiEndpoint: string
  isConnected: boolean
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error'
  errorMessage: string | null
  
  // Model configurations
  availableGptWeights: string[]
  currentGptWeight: string
  availableSovitsWeights: string[]
  currentSovitsWeight: string
  loadingWeights: boolean
  
  // Reference audio
  currentReferenceAudio: string
  availableReferenceAudios: GsModel.GsReferenceAudioItem[]
  loadingReferenceAudios: boolean
  
  // Language settings
  languageOptions: typeof languageOptions
  
  // TTS request history
  recentRequests: GsModel.GsTTSRequest[]
  
  // Methods
  setApiEndpoint: (endpoint: string) => void
  setConnectionStatus: (status: GsState['connectionStatus'], error?: string) => void
  
  setGptWeight: (weight: string) => void
  addGptWeight: (weight: string) => void
  removeGptWeight: (weight: string) => void
  
  setSovitsWeight: (weight: string) => void
  addSovitsWeight: (weight: string) => void
  removeSovitsWeight: (weight: string) => void
  
  setReferenceAudio: (path: string) => void
  
  addRequest: (request: GsModel.GsTTSRequest) => void
  clearRequestHistory: () => void
  
  // API methods
  connectToApi: () => Promise<void>
  sendTTSRequest: (request: GsModel.GsTTSRequest) => Promise<Blob>
  changeGptWeight: (request: GsModel.GsGptWeightsRequest) => Promise<void>
  changeSovitsWeight: (request: GsModel.GsSovitsWeightsRequest) => Promise<void>
  changeReferenceAudio: (request: GsModel.GsReferAudioRequest) => Promise<void>
  sendControlCommand: (request: GsModel.GsControlRequest) => Promise<void>
  fetchAvailableModels: () => Promise<void>
  fetchReferenceAudios: () => Promise<void>
  getReferenceAudioByPath: (path: string) => GsModel.GsReferenceAudioItem | undefined
}

export const useGsStore = create<GsState>()(
  persist(
    (set, get) => ({
      // API connection
      apiEndpoint: 'http://localhost:6006',
      isConnected: false,
      connectionStatus: 'disconnected',
      errorMessage: null,
      
      // Model configurations
      availableGptWeights: [],
      currentGptWeight: '',
      availableSovitsWeights: [],
      currentSovitsWeight: '',
      loadingWeights: false,
      
      // Reference audio
      currentReferenceAudio: '',
      availableReferenceAudios: [],
      loadingReferenceAudios: false,
      
      // Language settings
      languageOptions,
      
      // TTS request history
      recentRequests: [],
      
      // Methods
      setApiEndpoint: (endpoint) => set({ apiEndpoint: endpoint }),
      setConnectionStatus: (status, error?: string) => set({ 
        connectionStatus: status, 
        isConnected: status === 'connected',
        errorMessage: error || null
      }),
      
      setGptWeight: (weight) => set({ currentGptWeight: weight }),
      addGptWeight: (weight) => set((state) => ({ 
        availableGptWeights: [...state.availableGptWeights, weight] 
      })),
      removeGptWeight: (weight) => set((state) => ({ 
        availableGptWeights: state.availableGptWeights.filter(w => w !== weight) 
      })),
      
      setSovitsWeight: (weight) => set({ currentSovitsWeight: weight }),
      addSovitsWeight: (weight) => set((state) => ({ 
        availableSovitsWeights: [...state.availableSovitsWeights, weight] 
      })),
      removeSovitsWeight: (weight) => set((state) => ({ 
        availableSovitsWeights: state.availableSovitsWeights.filter(w => w !== weight) 
      })),
      
      setReferenceAudio: (path) => set({ currentReferenceAudio: path }),
      
      addRequest: (request) => set((state) => ({ 
        recentRequests: [request, ...state.recentRequests].slice(0, 10) // Keep only last 10 requests
      })),
      clearRequestHistory: () => set({ recentRequests: [] }),
      
      getReferenceAudioByPath: (path) => {
        return get().availableReferenceAudios.find(audio => audio.path === path);
      },
      
      // API methods
      connectToApi: async () => {
        const { apiEndpoint, setConnectionStatus } = get();
        setConnectionStatus('connecting');
        
        try {
          const response = await fetch(`${apiEndpoint}/probe`);
          if (response.ok) {
            const data = await response.json();
            if (data.status === 'ok') {
              setConnectionStatus('connected');
              return;
            }
          }
          throw new Error('Failed to connect to API');
        } catch (error) {
          setConnectionStatus('error', error instanceof Error ? error.message : 'Unknown error');
          throw error;
        }
      },
      
      sendTTSRequest: async (request) => {
        const { apiEndpoint, addRequest } = get();
        
        try {
          // Add to history
          addRequest(request);
          
          // Prepare request
          const response = await fetch(`${apiEndpoint}/tts`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(request)
          });
          
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to send TTS request');
          }
          
          // Return audio blob
          return await response.blob();
        } catch (error) {
          throw error;
        }
      },
      
      changeGptWeight: async (request) => {
        const { apiEndpoint, setGptWeight } = get();
        
        try {
          const response = await fetch(`${apiEndpoint}/set_gpt_weights`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(request)
          });
          
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to change GPT weight');
          }
          
          setGptWeight(request.weights_path);
          return;
        } catch (error) {
          throw error;
        }
      },
      
      changeSovitsWeight: async (request) => {
        const { apiEndpoint, setSovitsWeight } = get();
        
        try {
          const response = await fetch(`${apiEndpoint}/set_sovits_weights`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(request)
          });
          
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to change SoVits weight');
          }
          
          setSovitsWeight(request.weights_path);
          return;
        } catch (error) {
          throw error;
        }
      },
      
      changeReferenceAudio: async (request) => {
        const { apiEndpoint, setReferenceAudio } = get();
        
        try {
          const response = await fetch(`${apiEndpoint}/set_refer_audio`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(request)
          });
          
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to change reference audio');
          }
          
          setReferenceAudio(request.refer_audio_path);
          return;
        } catch (error) {
          throw error;
        }
      },
      
      sendControlCommand: async (request) => {
        const { apiEndpoint } = get();
        
        try {
          const response = await fetch(`${apiEndpoint}/control`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(request)
          });
          
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to send control command');
          }
          
          return;
        } catch (error) {
          throw error;
        }
      },
      
      fetchAvailableModels: async () => {
        const { apiEndpoint } = get();
        set({ loadingWeights: true });
        
        try {
          // Fetch GPT weights
          const gptResponse = await fetch(`${apiEndpoint}/list_gpt_weights`);
          // Fetch SoVits weights
          const sovitsResponse = await fetch(`${apiEndpoint}/list_sovits_weights`);
          
          if (!gptResponse.ok || !sovitsResponse.ok) {
            throw new Error('Failed to fetch available models');
          }
          
          const gptData = await gptResponse.json();
          const sovitsData = await sovitsResponse.json();
          
          // Extract paths from the returned model data
          const gptWeights = gptData.models.map((model: { path: string }) => model.path);
          const sovitsWeights = sovitsData.models.map((model: { path: string }) => model.path);
          
          set({
            availableGptWeights: gptWeights,
            availableSovitsWeights: sovitsWeights,
            loadingWeights: false
          });
        } catch (error) {
          set({ loadingWeights: false });
          console.error('Error fetching models:', error);
          throw error;
        }
      },
      
      fetchReferenceAudios: async () => {
        const { apiEndpoint } = get();
        set({ loadingReferenceAudios: true });
        
        try {
          const response = await fetch(`${apiEndpoint}/list_reference_audios`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch reference audios');
          }
          
          const data = await response.json();
          set({
            availableReferenceAudios: data.reference_audios || [],
            loadingReferenceAudios: false
          });
        } catch (error) {
          set({ loadingReferenceAudios: false });
          console.error('Error fetching reference audios:', error);
          throw error;
        }
      }
    }),
    {
      name: 'gs-store',
      // Only persist certain parts of the state
      partialize: (state) => ({
        apiEndpoint: state.apiEndpoint,
        availableGptWeights: state.availableGptWeights,
        currentGptWeight: state.currentGptWeight,
        availableSovitsWeights: state.availableSovitsWeights,
        currentSovitsWeight: state.currentSovitsWeight,
        currentReferenceAudio: state.currentReferenceAudio,
        recentRequests: state.recentRequests
      })
    }
  )
)

