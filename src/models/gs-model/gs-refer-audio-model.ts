import { z } from "zod";

/**
 * GPT-SoVits Refer Audio Request Schema
 * Used for /set_refer_audio endpoint to set the reference audio
 */
export const gsReferAudioRequestSchema = z.object({
  refer_audio_path: z.string().min(1, { message: "Reference audio path is required" })
})

/**
 * Type derived from the schema
 */
export type GsReferAudioRequest = z.infer<typeof gsReferAudioRequestSchema>

/**
 * Validation function for refer audio requests
 */
export function validateReferAudioRequest(data: unknown): { success: boolean; data?: GsReferAudioRequest; error?: string } {
  try {
    const validatedData = gsReferAudioRequestSchema.parse(data)
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
 * Example refer audio request
 */
export const exampleReferAudioRequest: GsReferAudioRequest = {
  refer_audio_path: "/path/to/reference/audio.wav"
}

/**
 * Reference Audio Response Item Schema
 * Represents a single reference audio file returned by the API
 */
export const gsReferenceAudioItemSchema = z.object({
  filename: z.string(),
  path: z.string(),
  prompt_text: z.string(),
  size: z.number()
})

/**
 * Reference Audio Response Schema
 * Used for /list_reference_audios endpoint
 */
export const gsReferenceAudiosResponseSchema = z.object({
  reference_audios: z.array(gsReferenceAudioItemSchema)
})

/**
 * Types derived from the schemas
 */
export type GsReferenceAudioItem = z.infer<typeof gsReferenceAudioItemSchema>
export type GsReferenceAudiosResponse = z.infer<typeof gsReferenceAudiosResponseSchema> 