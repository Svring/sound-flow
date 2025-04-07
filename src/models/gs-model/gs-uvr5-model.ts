import { z } from "zod";

/**
 * GPT-SoVits UVR5 Request Schema based on API parameters
 */
export const gsUVR5RequestSchema = z.object({
  model_name: z.string().default("HP3"),
  input_path: z.string().min(1, { message: "Input path is required" }),
  output_dir_vocals: z.string().default("output/uvr5_vocals"),
  output_dir_instrumental: z.string().default("output/uvr5_inst"),
  aggressiveness: z.number().int().min(0).max(20).default(10),
  output_format: z.enum(["wav", "flac", "mp3", "m4a"]).default("wav"),
  device: z.enum(["cuda", "cpu"]).default("cuda"),
  use_half_precision: z.boolean().default(true)
});

/**
 * Type derived from the schema
 */
export type GsUVR5Request = z.infer<typeof gsUVR5RequestSchema>;

/**
 * Validation function for UVR5 requests
 */
export function validateUVR5Request(data: unknown): { success: boolean; data?: GsUVR5Request; error?: string } {
  try {
    const validatedData = gsUVR5RequestSchema.parse(data);
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
 * UVR5 Model Info (for listing available models)
 */
export interface GsUVR5ModelInfo {
  filename: string;
  model_name: string;
  type: string;
  path: string;
  is_directory: boolean;
  size: number;
  contains?: string[]; // For directory-based models
}

/**
 * UVR5 Response type
 */
export interface GsUVR5Response {
  success: boolean;
  processed_files: Array<{
    file: string;
    vocal_output: string;
    instrumental_output: string;
  }>;
  errors: Array<{
    file: string;
    error: string;
    traceback?: string;
  }>;
  warnings?: string[];
}

/**
 * Default UVR5 request values
 */
export const defaultUVR5Request: GsUVR5Request = {
  model_name: "HP3",
  input_path: "",
  output_dir_vocals: "output/uvr5_vocals",
  output_dir_instrumental: "output/uvr5_inst",
  aggressiveness: 10,
  output_format: "wav",
  device: "cuda",
  use_half_precision: true
}; 