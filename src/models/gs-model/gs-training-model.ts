// Training models for GPT-SoVITS

// SoVITS Training Request model
export interface GsSoVITSTrainingRequest {
  experimentName: string;
  batchSize?: number; // Default 16
  totalEpoch?: number; // Default 8
  textLowLrRate?: number; // Default 0.4 (v1/v2 only)
  ifSaveLatest?: boolean; // Default true
  ifSaveEveryWeights?: boolean; // Default true
  saveEveryEpoch?: number; // Default 4
  gpuIds?: string; // Default "0"
  pretrainedS2G: string; // Required
  pretrainedS2D: string; // Required
  ifGradCkpt?: boolean; // Default false (v3 only)
  loraRank?: "16" | "32" | "64" | "128"; // Default "32" (v3 only)
  version?: "v1" | "v2" | "v3"; // Default "v2"
}

// Default SoVITS Training Request
export const defaultSoVITSTrainingRequest: Partial<GsSoVITSTrainingRequest> = {
  batchSize: 16,
  totalEpoch: 8,
  textLowLrRate: 0.4,
  ifSaveLatest: true,
  ifSaveEveryWeights: true,
  saveEveryEpoch: 4,
  gpuIds: "0",
  ifGradCkpt: false,
  loraRank: "32",
  version: "v2"
};

// GPT Training Request model
export interface GsGPTTrainingRequest {
  experimentName: string;
  batchSize?: number; // Default 16
  totalEpoch?: number; // Default 15
  ifDpo?: boolean; // Default false
  ifSaveLatest?: boolean; // Default true
  ifSaveEveryWeights?: boolean; // Default true
  saveEveryEpoch?: number; // Default 5
  gpuIds?: string; // Default "0"
  pretrainedS1: string; // Required
  version?: "v1" | "v2" | "v3"; // Default "v2"
}

// Default GPT Training Request
export const defaultGPTTrainingRequest: Partial<GsGPTTrainingRequest> = {
  batchSize: 16,
  totalEpoch: 15,
  ifDpo: false,
  ifSaveLatest: true,
  ifSaveEveryWeights: true,
  saveEveryEpoch: 5,
  gpuIds: "0",
  version: "v2"
};

// Training Logs Request
export interface GsTrainingLogRequest {
  experimentName: string;
  logType?: 'stdout' | 'stderr'; // Default 'stdout'
  processType: 'sovits' | 'gpt'; // Required
  offset?: number; // Default 0
  maxLines?: number; // Default 100
  version?: "v1" | "v2" | "v3"; // Default "v2" (Match training version)
}

// Default Training Logs Request
export const defaultTrainingLogRequest: Partial<GsTrainingLogRequest> = {
  logType: 'stdout',
  offset: 0,
  maxLines: 100,
  version: "v2"
};

// Training Start Response model
export interface GsTrainingStartResponse {
  success: boolean;
  message: string;
  processId?: number; // Included on success
  experimentName?: string; // Included on success
  stdoutLog?: string; // Path to log file
  stderrLog?: string; // Path to log file
  error?: string; // Included on failure
  traceback?: string; // Included on failure
}

// Training Logs Response model
export interface GsTrainingLogResponse {
  success: boolean;
  message?: string; // For error messages
  experimentName?: string;
  logType?: 'stdout' | 'stderr';
  processType?: 'sovits' | 'gpt';
  logLines?: string[];
  currentOffset?: number; // The offset used for this request
  nextOffset?: number; // The offset to use for the next poll
  error?: string;
}

// Active Training model - for tracking training jobs in the UI
export interface GsActiveTraining {
  experimentName: string;
  processType: 'sovits' | 'gpt';
  version: 'v1' | 'v2' | 'v3';
  status: 'starting' | 'running' | 'error_starting';
  processId?: number;
  logPaths?: {
    stdout?: string;
    stderr?: string;
  };
  startTime: number; // Timestamp for sorting
}

// Training Log State model - for storing and managing logs
export interface GsTrainingLogState {
  stdout: string[];
  stderr: string[];
  stdoutNextOffset: number;
  stderrNextOffset: number;
  isLoading: boolean;
} 