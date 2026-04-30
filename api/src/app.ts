import cors from "cors";
import express from "express";
import multer from "multer";
import morgan from "morgan";
import { ZodError } from "zod";
import { requestFilesDirectory, UploadValidationError } from "./lib/requestUploads";
import { router } from "./routes";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173"
    })
  );
  app.use(express.json());
  app.use(morgan("dev"));
  app.use("/uploads/request-files", express.static(requestFilesDirectory));

  app.get("/", (_request, response) => {
    response.json({
      name: "FabLab Workflow API",
      status: "ok",
      docsHint: "Use /health and /api/* endpoints."
    });
  });

  app.use("/api", router);

  app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    if (error instanceof UploadValidationError) {
      return response.status(400).json({
        message: error.message
      });
    }

    if (error instanceof multer.MulterError) {
      return response.status(400).json({
        message:
          error.code === "LIMIT_FILE_SIZE"
            ? "Uno de los archivos supera el tamano maximo permitido de 10 MB."
            : error.code === "LIMIT_FILE_COUNT"
              ? "Solo puedes adjuntar hasta 3 archivos por solicitud."
              : "No se pudo procesar la carga de archivos."
      });
    }

    if (error instanceof ZodError) {
      return response.status(400).json({
        message: "Payload invalido.",
        issues: error.issues
      });
    }

    console.error(error);

    return response.status(500).json({
      message: "Error interno del servidor."
    });
  });

  return app;
}
