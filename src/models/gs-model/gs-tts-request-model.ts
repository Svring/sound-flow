import { z } from "zod";

/**
 * GPT-SoVits TTS Request Schema based on API parameters
 */
export const gsTTSRequestSchema = z.object({
  // Required parameters
  text: z.string().min(1, { message: "Text is required" }),
  text_lang: z.string().min(1, { message: "Text language is required" }),
  ref_audio_path: z.string().min(1, { message: "Reference audio path is required" }),
  prompt_lang: z.string().min(1, { message: "Prompt language is required" }),
  
  // Optional parameters with defaults
  aux_ref_audio_paths: z.array(z.string()).optional(),
  prompt_text: z.string().default(""),
  top_k: z.number().int().positive().default(5),
  top_p: z.number().min(0).max(1).default(1),
  temperature: z.number().min(0).default(1),
  text_split_method: z.string().default("cut0"),
  batch_size: z.number().int().positive().default(1),
  batch_threshold: z.number().min(0).max(1).default(0.75),
  split_bucket: z.boolean().default(true),
  speed_factor: z.number().positive().default(1.0),
  fragment_interval: z.number().min(0).default(0.3),
  seed: z.number().int().default(-1),
  media_type: z.enum(["wav", "raw", "ogg", "aac"]).default("wav"),
  streaming_mode: z.boolean().default(false),
  parallel_infer: z.boolean().default(true),
  repetition_penalty: z.number().min(0).default(1.35),
  sample_steps: z.number().int().positive().default(32),
  super_sampling: z.boolean().default(false)
})

/**
 * Type derived from the schema
 */
export type GsTTSRequest = z.infer<typeof gsTTSRequestSchema>

/**
 * Validation function for TTS requests
 */
export function validateTTSRequest(data: unknown): { success: boolean; data?: GsTTSRequest; error?: string } {
  try {
    const validatedData = gsTTSRequestSchema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') 
      }
    }
    return { success: false, error: 'Validation failed' }
  }
}

/**
 * Default TTS request values
 */
export const defaultTTSRequest: GsTTSRequest = {
  text: "",
  text_lang: "",
  ref_audio_path: "",
  prompt_lang: "",
  prompt_text: "",
  top_k: 5,
  top_p: 1,
  temperature: 1,
  text_split_method: "cut0",
  batch_size: 1,
  batch_threshold: 0.75,
  split_bucket: true,
  speed_factor: 1.0,
  fragment_interval: 0.3,
  seed: -1,
  media_type: "wav",
  streaming_mode: false,
  parallel_infer: true,
  repetition_penalty: 1.35,
  sample_steps: 32,
  super_sampling: false
}

/**
 * Sample TTS request example
 */
export const sampleTTSRequest: GsTTSRequest = {
  text: "那么我们走吧，你我两个人，正当朝天空慢慢铺展着黄昏，好似病人麻醉在手术桌上。",
  text_lang: "en",
  ref_audio_path: "/root/GPT-SoVITS/test/elen.wav",
  prompt_text: "今天我完成委托路过这里，碰到两个刚吃完夜宵的人，就问他们，能不能帮我多买两张打折券？",
  prompt_lang: "en",
  media_type: "wav",
  aux_ref_audio_paths: [],
  top_k: 5,
  top_p: 1,
  temperature: 1,
  text_split_method: "cut0",
  batch_size: 1,
  batch_threshold: 0.75,
  split_bucket: true,
  speed_factor: 1.0,
  fragment_interval: 0.3,
  seed: -1,
  streaming_mode: false,
  parallel_infer: true,
  repetition_penalty: 1.35,
  sample_steps: 32,
  super_sampling: false
}