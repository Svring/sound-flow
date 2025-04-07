import { z } from "zod";

/**
 * GPT-SoVits ASR (Automatic Speech Recognition) Request Schema
 */
export const gsASRRequestSchema = z.object({
  input_audio_path: z.string().min(1, { message: "Input audio path is required" }),
  output_directory: z.string().default("output/asr_opt"),
  model: z.string().default("达摩 ASR (中文)"),
  model_size: z.string().default("large"),
  language: z.string().default("zh"),
  precision: z.string().default("float32")
});

/**
 * Type derived from the schema
 */
export type GsASRRequest = z.infer<typeof gsASRRequestSchema>;

/**
 * Validation function for ASR requests
 */
export function validateASRRequest(data: unknown): { success: boolean; data?: GsASRRequest; error?: string } {
  try {
    const validatedData = gsASRRequestSchema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') 
      };
    }
    return { success: false, error: 'Validation failed' };
  }
}

/**
 * ASR Transcription item type
 */
export interface GsASRTranscription {
  file: string;
  segment?: string;
  lang?: string;
  text: string;
}

/**
 * ASR Model Info (for listing available models)
 */
export interface GsASRModelInfo {
  name: string;
  languages: string[];
  sizes: string[];
  precision: string[];
  description?: string;
}

/**
 * ASR Response type
 */
export interface GsASRResponse {
  success: boolean;
  output_file_path: string;
  transcriptions: GsASRTranscription[];
  transcription_count?: number;
  stdout?: string;
  language: string;
}

/**
 * Default ASR request values
 */
export const defaultASRRequest: GsASRRequest = {
  input_audio_path: "",
  output_directory: "output/asr_opt",
  model: "达摩 ASR (中文)",
  model_size: "large",
  language: "zh",
  precision: "float32"
}; 