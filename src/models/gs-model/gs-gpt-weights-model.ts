import { z } from "zod";

/**
 * GPT-SoVits GPT Weights Request Schema
 * Used for /set_gpt_weights endpoint to change the GPT model weights
 */
export const gsGptWeightsRequestSchema = z.object({
  weights_path: z.string().min(1, { message: "GPT weights path is required" })
})

/**
 * Type derived from the schema
 */
export type GsGptWeightsRequest = z.infer<typeof gsGptWeightsRequestSchema>

/**
 * Validation function for GPT weights requests
 */
export function validateGptWeightsRequest(data: unknown): { success: boolean; data?: GsGptWeightsRequest; error?: string } {
  try {
    const validatedData = gsGptWeightsRequestSchema.parse(data)
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
 * Example GPT weights request
 */
export const exampleGptWeightsRequest: GsGptWeightsRequest = {
  weights_path: "GPT_SoVITS/pretrained_models/s1bert25hz-2kh-longer-epoch=68e-step=50232.ckpt"
} 