// Training service for interacting with the GPT-SoVITS training API
import {
  GsSoVITSTrainingRequest,
  GsGPTTrainingRequest,
  GsTrainingLogRequest,
  GsTrainingStartResponse,
  GsTrainingLogResponse,
} from './gs-training-model';

/**
 * Manages training operations for GPT-SoVITS
 */
export class GsTrainingService {
  private apiEndpoint: string;

  constructor(apiEndpoint = 'http://localhost:6006') {
    this.apiEndpoint = apiEndpoint;
  }

  /**
   * Sets the API endpoint
   */
  setApiEndpoint(endpoint: string) {
    this.apiEndpoint = endpoint;
  }

  /**
   * Start SoVITS training
   */
  async startSoVITSTraining(request: GsSoVITSTrainingRequest): Promise<GsTrainingStartResponse> {
    try {
      // Convert camelCase to snake_case for request parameters
      const apiRequest = {
        experiment_name: request.experimentName,
        batch_size: request.batchSize,
        total_epoch: request.totalEpoch,
        text_low_lr_rate: request.textLowLrRate,
        if_save_latest: request.ifSaveLatest,
        if_save_every_weights: request.ifSaveEveryWeights,
        save_every_epoch: request.saveEveryEpoch,
        gpu_ids: request.gpuIds,
        pretrained_s2G: request.pretrainedS2G,
        pretrained_s2D: request.pretrainedS2D,
        if_grad_ckpt: request.ifGradCkpt,
        lora_rank: request.loraRank,
        version: request.version,
      };

      const response = await fetch(`${this.apiEndpoint}/train_sovits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiRequest)
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          message: errorData.message || 'Failed to start SoVITS training',
          error: errorData.error || 'Unknown error',
          traceback: errorData.traceback
        };
      }

      const data = await response.json();
      return {
        success: true,
        message: data.message || 'SoVITS training started successfully',
        processId: data.process_id,
        experimentName: data.experiment_name,
        stdoutLog: data.stdout_log,
        stderrLog: data.stderr_log
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to start SoVITS training',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Start GPT training
   */
  async startGPTTraining(request: GsGPTTrainingRequest): Promise<GsTrainingStartResponse> {
    try {
      // Convert camelCase to snake_case for request parameters
      const apiRequest = {
        experiment_name: request.experimentName,
        batch_size: request.batchSize,
        total_epoch: request.totalEpoch,
        if_dpo: request.ifDpo,
        if_save_latest: request.ifSaveLatest,
        if_save_every_weights: request.ifSaveEveryWeights,
        save_every_epoch: request.saveEveryEpoch,
        gpu_ids: request.gpuIds,
        pretrained_s1: request.pretrainedS1,
        version: request.version,
      };

      const response = await fetch(`${this.apiEndpoint}/train_gpt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiRequest)
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          message: errorData.message || 'Failed to start GPT training',
          error: errorData.error || 'Unknown error',
          traceback: errorData.traceback
        };
      }

      const data = await response.json();
      return {
        success: true,
        message: data.message || 'GPT training started successfully',
        processId: data.process_id,
        experimentName: data.experiment_name,
        stdoutLog: data.stdout_log,
        stderrLog: data.stderr_log
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to start GPT training',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Fetch training logs
   */
  async fetchTrainingLogs(request: GsTrainingLogRequest): Promise<GsTrainingLogResponse> {
    try {
      // Convert camelCase to snake_case for request parameters
      const apiRequest = {
        experiment_name: request.experimentName,
        log_type: request.logType,
        process_type: request.processType,
        offset: request.offset,
        max_lines: request.maxLines,
        version: request.version,
      };

      const response = await fetch(`${this.apiEndpoint}/training_logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiRequest)
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          message: errorData.message || 'Failed to fetch training logs',
          error: errorData.error || 'Unknown error'
        };
      }

      const data = await response.json();
      return {
        success: true,
        experimentName: data.experiment_name,
        logType: data.log_type,
        processType: data.process_type,
        logLines: data.log_lines || [],
        currentOffset: data.current_offset,
        nextOffset: data.next_offset
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch training logs',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
} 