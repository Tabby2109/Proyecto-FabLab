export const REQUEST_ALLOWED_EXTENSIONS = [".stl", ".3mf", ".obj", ".dxf", ".svg", ".step", ".stp", ".pdf"] as const;
export const REQUEST_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const REQUEST_MAX_FILE_COUNT = 3;

export function hasValidRequestExtension(fileName: string) {
  return REQUEST_ALLOWED_EXTENSIONS.some((extension) => fileName.toLowerCase().endsWith(extension));
}

export function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}
