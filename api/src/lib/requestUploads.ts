import fs from "node:fs";
import path from "node:path";
import multer from "multer";

export const REQUEST_FILE_EXTENSIONS = [".stl", ".3mf", ".obj", ".dxf", ".svg", ".step", ".stp", ".pdf"] as const;
export const REQUEST_FILE_MAX_SIZE_BYTES = 10 * 1024 * 1024;
export const REQUEST_FILE_MAX_COUNT = 3;

export class UploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadValidationError";
  }
}

export const requestFilesDirectory = path.resolve(process.cwd(), "uploads", "request-files");

fs.mkdirSync(requestFilesDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (_request, _file, callback) => {
    callback(null, requestFilesDirectory);
  },
  filename: (_request, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const safeBaseName = path
      .basename(file.originalname, extension)
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48);

    callback(null, `${Date.now()}-${safeBaseName || "archivo"}${extension}`);
  }
});

export const requestUploadMiddleware = multer({
  storage,
  limits: {
    fileSize: REQUEST_FILE_MAX_SIZE_BYTES,
    files: REQUEST_FILE_MAX_COUNT
  },
  fileFilter: (_request, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (!REQUEST_FILE_EXTENSIONS.includes(extension as (typeof REQUEST_FILE_EXTENSIONS)[number])) {
      callback(new UploadValidationError("Formato de archivo no permitido. Usa STL, 3MF, OBJ, DXF, SVG, STEP, STP o PDF."));
      return;
    }

    callback(null, true);
  }
});

export function toPublicRequestFileUrl(storedName: string) {
  return `/uploads/request-files/${storedName}`;
}
