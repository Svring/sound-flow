import { z } from "zod";

/**
 * GPT-SoVits Audio Segmentation Request Schema
 */
export const gsSegmentAudioRequestSchema = z.object({
  input_audio_path: z.string().min(1, { message: "Input audio path is required" }),
  output_directory: z.string().default("output/slicer_opt"),
  silence_threshold_db: z.number().int().default(-34),
  min_segment_length_ms: z.number().int().min(0).default(4000),
  min_silence_interval_ms: z.number().int().min(0).default(300),
  analysis_hop_size_ms: z.number().int().min(0).default(10),
  max_silence_kept_ms: z.number().int().min(0).default(500),
  normalization_max_amplitude: z.number().min(0).max(1).default(0.9),
  normalization_mix_factor: z.number().min(0).max(1).default(0.25),
  parallel_process_count: z.number().int().min(1).default(1)
});

/**
 * Type derived from the schema
 */
export type GsSegmentAudioRequest = z.infer<typeof gsSegmentAudioRequestSchema>;

/**
 * Validation function for audio segmentation requests
 */
export function validateSegmentAudioRequest(data: unknown): { success: boolean; data?: GsSegmentAudioRequest; error?: string } {
  try {
    const validatedData = gsSegmentAudioRequestSchema.parse(data);
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
 * Audio Segmentation Response type
 */
export interface GsSegmentAudioResponse {
  success: boolean;
  output_directory: string;
  output_files: string[];
  output_files_count?: number;
  processed_files: string[];
  errors: string[];
}

/**
 * Default Audio Segmentation request values
 */
export const defaultSegmentAudioRequest: GsSegmentAudioRequest = {
  input_audio_path: "",
  output_directory: "output/slicer_opt",
  silence_threshold_db: -34,
  min_segment_length_ms: 4000,
  min_silence_interval_ms: 300,
  analysis_hop_size_ms: 10,
  max_silence_kept_ms: 500,
  normalization_max_amplitude: 0.9,
  normalization_mix_factor: 0.25,
  parallel_process_count: 1
}; 