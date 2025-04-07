import { z } from "zod";

/**
 * File item interface representing a file or directory in the API's file system
 */
export interface GsFileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number; // in bytes
  lastModified?: string; // ISO date string
}

/**
 * Request schema for listing files
 */
export const gsListFilesRequestSchema = z.object({
  directory: z.string().default(""),
  includeFiles: z.boolean().default(true),
  includeDirectories: z.boolean().default(true),
  filter: z.string().optional()
});

/**
 * Type derived from the schema
 */
export type GsListFilesRequest = z.infer<typeof gsListFilesRequestSchema>;

/**
 * Response for listing files
 */
export interface GsListFilesResponse {
  success: boolean;
  directory: string;
  items: GsFileItem[];
  error?: string;
}

/**
 * Request schema for uploading a file
 */
export const gsUploadFileRequestSchema = z.object({
  destination: z.string().min(1, { message: "Destination directory is required" }),
  overwrite: z.boolean().default(false)
});

/**
 * Type derived from the schema
 */
export type GsUploadFileRequest = z.infer<typeof gsUploadFileRequestSchema>;

/**
 * Response for uploading a file
 */
export interface GsUploadFileResponse {
  success: boolean;
  filePath: string;
  error?: string;
}

/**
 * Request schema for deleting a file
 */
export const gsDeleteFileRequestSchema = z.object({
  filePath: z.string().min(1, { message: "File path is required" })
});

/**
 * Type derived from the schema
 */
export type GsDeleteFileRequest = z.infer<typeof gsDeleteFileRequestSchema>;

/**
 * Response for deleting a file
 */
export interface GsDeleteFileResponse {
  success: boolean;
  filePath: string;
  error?: string;
}

/**
 * Default list files request
 */
export const defaultListFilesRequest: GsListFilesRequest = {
  directory: "",
  includeFiles: true,
  includeDirectories: true
}; 