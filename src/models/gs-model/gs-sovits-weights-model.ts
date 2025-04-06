import { z } from "zod";

/**
 * GPT-SoVits SoVits Weights Request Schema
 * Used for /set_sovits_weights endpoint to change the SoVits model weights
 */
export const gsSovitsWeightsRequestSchema = z.object({
  weights_path: z.string().min(1, { message: "SoVits weights path is required" })
})

/**
 * Type derived from the schema
 */
export type GsSovitsWeightsRequest = z.infer<typeof gsSovitsWeightsRequestSchema>

/**
 * Validation function for SoVits weights requests
 */
export function validateSovitsWeightsRequest(data: unknown): { success: boolean; data?: GsSovitsWeightsRequest; error?: string } {
  try {
    const validatedData = gsSovitsWeightsRequestSchema.parse(data)
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
 * Example SoVits weights request
 */
export const exampleSovitsWeightsRequest: GsSovitsWeightsRequest = {
  weights_path: "GPT_SoVITS/pretrained_models/s2G488k.pth"
} 