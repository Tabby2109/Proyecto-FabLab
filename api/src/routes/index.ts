import fs from "node:fs/promises";
import { NextFunction, Request, Response, Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requestUploadMiddleware, toPublicRequestFileUrl } from "../lib/requestUploads";
import { buildDisplayName, createAuthToken, hashPassword, toPublicUser, verifyAuthToken, verifyPassword } from "../lib/auth";
import { sendDevelopmentEmail } from "../lib/mailer";
import { createPasswordResetToken, hashPasswordResetToken } from "../lib/passwordReset";

export const router = Router();

const projectStore = (prisma as any).project;

const publicUserSelect = {
  id: true,
  name: true,
  email: true
} as const;

const requestCommentPublicInclude: any = {
  author: {
    select: publicUserSelect
  }
};

const auditLogInclude: any = {
  actor: {
    select: publicUserSelect
  }
};

const requestEventInclude: any = {
  actor: {
    select: publicUserSelect
  }
};

const requestInclude: any = {
  machine: {
    include: {
      machineType: true
    }
  },
  material: true,
  quotation: {
    include: {
      preparedBy: {
        select: publicUserSelect
      }
    }
  },
  requestFiles: true,
  requester: {
    select: publicUserSelect
  },
  assignedStaff: {
    select: publicUserSelect
  },
  project: true
};

const requestPublicDetailInclude: any = {
  ...requestInclude,
  comments: {
    where: {
      visibility: "PUBLIC"
    },
    include: requestCommentPublicInclude,
    orderBy: {
      createdAt: "asc"
    }
  },
  events: {
    include: requestEventInclude,
    orderBy: {
      createdAt: "asc"
    }
  }
};

const reservationInclude: any = {
  machine: {
    include: {
      machineType: true
    }
  },
  user: {
    select: publicUserSelect
  },
  project: true,
  request: {
    select: {
      id: true,
      title: true,
      status: true,
      quotationStatus: true
    }
  }
};

const requestDetailInclude: any = {
  ...requestPublicDetailInclude,
  reservations: {
    include: reservationInclude
  }
};

const staffRequestDetailInclude: any = {
  ...requestInclude,
  comments: {
    include: requestCommentPublicInclude,
    orderBy: {
      createdAt: "asc"
    }
  },
  events: {
    include: requestEventInclude,
    orderBy: {
      createdAt: "asc"
    }
  },
  reservations: {
    include: reservationInclude
  }
};

const machineTypeInclude: any = {
  machines: {
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      category: true,
      supportedFormats: true
    }
  }
};

const materialMovementInclude: any = {
  actor: {
    select: publicUserSelect
  },
  request: {
    select: {
      id: true,
      title: true,
      status: true,
      quotationStatus: true
    }
  }
};

const notificationInclude: any = {};

const reservationBlocks = [
  { number: 1, label: "Bloque 1", hour: 8, minute: 15, endHour: 8, endMinute: 50 },
  { number: 2, label: "Bloque 2", hour: 8, minute: 50, endHour: 9, endMinute: 25 },
  { number: 3, label: "Bloque 3", hour: 9, minute: 40, endHour: 10, endMinute: 15 },
  { number: 4, label: "Bloque 4", hour: 10, minute: 15, endHour: 10, endMinute: 50 },
  { number: 5, label: "Bloque 5", hour: 11, minute: 5, endHour: 11, endMinute: 40 },
  { number: 6, label: "Bloque 6", hour: 11, minute: 40, endHour: 12, endMinute: 15 },
  { number: 7, label: "Bloque 7", hour: 12, minute: 30, endHour: 13, endMinute: 5 },
  { number: 8, label: "Bloque 8", hour: 13, minute: 5, endHour: 13, endMinute: 40 },
  { number: 9, label: "Bloque 9", hour: 14, minute: 40, endHour: 15, endMinute: 15 },
  { number: 10, label: "Bloque 10", hour: 15, minute: 15, endHour: 15, endMinute: 50 },
  { number: 11, label: "Bloque 11", hour: 16, minute: 5, endHour: 16, endMinute: 40 },
  { number: 12, label: "Bloque 12", hour: 16, minute: 40, endHour: 17, endMinute: 15 },
  { number: 13, label: "Bloque 13", hour: 17, minute: 30, endHour: 18, endMinute: 5 },
  { number: 14, label: "Bloque 14", hour: 18, minute: 5, endHour: 18, endMinute: 40 },
  { number: 15, label: "Bloque 15", hour: 18, minute: 55, endHour: 19, endMinute: 30 },
  { number: 16, label: "Bloque 16", hour: 19, minute: 30, endHour: 20, endMinute: 5 },
  { number: 17, label: "Bloque 17", hour: 20, minute: 20, endHour: 20, endMinute: 55 },
  { number: 18, label: "Bloque 18", hour: 20, minute: 55, endHour: 21, endMinute: 30 }
] as const;

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const forgotPasswordSchema = z.object({
  email: z.string().email()
});

const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8)
});

const createRequestSchema = z.object({
  projectId: z.string().min(1),
  machineId: z.string().min(1),
  materialId: z.string().min(1),
  title: z.string().min(5),
  description: z.string().min(20),
  notes: z.string().max(1000).optional().or(z.literal("")),
  requestedDate: z.string().date(),
  estimatedDurationMinutes: z.coerce.number().int().positive(),
  estimatedCost: z.coerce.number().min(0).default(0),
  quantity: z.coerce.number().int().positive(),
  materialUnitsRequested: z.coerce.number().positive()
});

const requestQuerySchema = z.object({
  projectId: z.string().optional()
});

const requestCommentSchema = z.object({
  body: z.string().min(3).max(2000),
  visibility: z.enum(["INTERNAL", "PUBLIC"]).default("PUBLIC")
});

const staffRequestActionSchema = z.object({
  action: z.enum(["ACCEPT", "REQUEST_CORRECTION", "REJECT", "SEND_TO_QUOTATION", "START_PRODUCTION", "MARK_READY", "MARK_COMPLETED"]),
  reason: z.string().min(3).max(1000).optional().or(z.literal("")),
  visibility: z.enum(["INTERNAL", "PUBLIC"]).optional()
});

const staffRequestOpsSchema = z.object({
  assignedStaffId: z.string().optional().or(z.literal("")).nullable(),
  commitmentDate: z.string().date().optional().or(z.literal("")).nullable(),
  status: z
    .enum(["PENDING_REVIEW", "CHANGES_REQUESTED", "IN_QUOTATION", "QUOTED", "APPROVED", "IN_PROGRESS", "READY_FOR_PICKUP", "COMPLETED", "REJECTED"])
    .optional()
});

const quotationSchema = z.object({
  setupCost: z.coerce.number().min(0),
  machineCost: z.coerce.number().min(0),
  materialCost: z.coerce.number().min(0),
  quantity: z.coerce.number().int().positive(),
  estimatedMinutes: z.coerce.number().int().positive(),
  notes: z.string().max(1500).optional().or(z.literal(""))
});

const quotationDecisionSchema = z.object({
  decision: z.enum(["ACCEPT", "REJECT"]),
  reason: z.string().max(1000).optional().or(z.literal(""))
});

const notificationReadSchema = z.object({
  read: z.boolean().default(true)
});

const profileSchema = z.object({
  firstName: z.string().min(2, "El nombre es obligatorio."),
  middleName: z.string().optional().nullable(),
  lastName: z.string().min(2, "El apellido paterno es obligatorio."),
  maternalLastName: z.string().optional().nullable(),
  documentType: z.enum(["RUT", "PASSPORT", "DNI", "OTHER"]),
  documentNumber: z.string().min(4, "El documento es obligatorio."),
  career: z.string().min(4, "La carrera es obligatoria."),
  entryYear: z.coerce.number().int().min(1950).max(2100),
  birthDate: z.string().date(),
  sex: z.enum(["FEMALE", "MALE", "NON_BINARY", "PREFER_NOT_TO_SAY"])
});

const createProjectSchema = z.object({
  name: z.string().min(3, "El nombre es obligatorio."),
  description: z.string().min(10, "La descripcion es obligatoria."),
  repositoryUrl: z.string().url("El link del repositorio debe ser valido.").optional().or(z.literal("")),
  courseName: z.string().optional().or(z.literal("")),
  professorName: z.string().optional().or(z.literal("")),
  academicPeriod: z.string().optional().or(z.literal("")),
  projectType: z.enum(["PRINT_3D", "LASER_CUT", "CNC", "ELECTRONICS", "PROTOTYPE", "OTHER"]),
  scope: z.enum(["INDIVIDUAL", "GROUP"]),
  attachmentNames: z.array(z.string().min(1)).max(3).default([])
});

const projectMemberSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  roleInProject: z.string().max(120).optional().or(z.literal("")),
  isOwner: z.boolean().default(false)
});

const updateRequestSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(20),
  notes: z.string().max(1000).optional().or(z.literal("")),
  requestedDate: z.string().date(),
  estimatedDurationMinutes: z.coerce.number().int().positive(),
  estimatedCost: z.coerce.number().min(0).default(0),
  quantity: z.coerce.number().int().positive(),
  materialUnitsRequested: z.coerce.number().positive(),
  machineId: z.string().min(1),
  materialId: z.string().min(1)
});

const userRequestCommentSchema = z.object({
  body: z.string().min(3).max(2000)
});

const reservationMutationSchema = z
  .object({
    projectId: z.string().min(1).optional().or(z.literal("")).nullable(),
    requestId: z.string().min(1),
    machineId: z.string().min(1),
    title: z.string().min(3).optional(),
    startAt: z.string().datetime(),
    endAt: z.string().datetime(),
    description: z.string().max(1000).optional().or(z.literal("")),
    notes: z.string().max(1000).optional().or(z.literal("")),
    blockNumbers: z.array(z.coerce.number().int().min(1).max(18)).min(1).max(8),
    status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]).optional()
  })
  .superRefine((value, ctx) => {
    if (new Date(value.endAt) <= new Date(value.startAt)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La hora de fin debe ser posterior al inicio.",
        path: ["endAt"]
      });
    }
  });

const machineTypeSchema = z.object({
  name: z.string().min(3, "El nombre es obligatorio."),
  slug: z.string().min(3, "El slug es obligatorio."),
  summary: z.string().min(3, "El resumen es obligatorio."),
  description: z.string().min(10, "La descripcion es obligatoria."),
  assetName: z.string().min(3, "El nombre del archivo es obligatorio."),
  assetPath: z.string().min(3, "La ruta del archivo es obligatoria."),
  isPublished: z.boolean().default(true),
  minReservationBlocks: z.coerce.number().int().min(1).max(18),
  maxReservationBlocks: z.coerce.number().int().min(1).max(18),
  reservationRequiresConsecutive: z.boolean().default(true)
}).superRefine((value, ctx) => {
  if (value.maxReservationBlocks < value.minReservationBlocks) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "El maximo de bloques no puede ser menor al minimo.",
      path: ["maxReservationBlocks"]
    });
  }
});

const machineSchema = z.object({
  name: z.string().min(3),
  slug: z.string().min(3),
  description: z.string().min(10),
  category: z.enum(["PRINT_3D", "LASER", "CNC", "ELECTRONICS", "VINYL"]),
  status: z.enum(["AVAILABLE", "MAINTENANCE", "OFFLINE"]).default("AVAILABLE"),
  hourlyRate: z.coerce.number().min(0),
  setupMinutes: z.coerce.number().int().min(0),
  maxDurationMinutes: z.coerce.number().int().min(35),
  supportedFormats: z.array(z.string().min(1)).min(1),
  location: z.string().optional().or(z.literal("")),
  minBlocks: z.coerce.number().int().min(1).max(18).optional().nullable(),
  maxBlocks: z.coerce.number().int().min(1).max(18).optional().nullable(),
  machineTypeId: z.string().optional().or(z.literal("")).nullable()
}).superRefine((value, ctx) => {
  if (typeof value.minBlocks === "number" && typeof value.maxBlocks === "number" && value.maxBlocks < value.minBlocks) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "El maximo de bloques no puede ser menor al minimo.",
      path: ["maxBlocks"]
    });
  }
});

const materialSchema = z.object({
  name: z.string().min(3, "El nombre es obligatorio."),
  slug: z.string().min(3, "El slug es obligatorio."),
  unit: z.string().min(1, "La unidad es obligatoria."),
  stockQuantity: z.coerce.number().min(0),
  stockThreshold: z.coerce.number().min(0),
  pricePerUnit: z.coerce.number().min(0),
  isActive: z.boolean().default(true)
});

const materialMovementSchema = z
  .object({
    type: z.enum(["IN", "OUT", "ADJUSTMENT"]),
    quantity: z.coerce.number().positive().optional(),
    targetStockQuantity: z.coerce.number().min(0).optional(),
    reason: z.string().min(3).max(1000)
  })
  .superRefine((value, ctx) => {
    if (value.type === "ADJUSTMENT" && typeof value.targetStockQuantity !== "number") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Debes indicar el stock objetivo para un ajuste.",
        path: ["targetStockQuantity"]
      });
    }

    if (value.type !== "ADJUSTMENT" && typeof value.quantity !== "number") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Debes indicar una cantidad para el movimiento.",
        path: ["quantity"]
      });
    }
  });

const reservationAvailabilitySchema = z.object({
  machineId: z.string().min(1),
  date: z.string().date()
});

const reservationScheduleSchema = z.object({
  machineId: z.string().min(1),
  weekStart: z.string().date(),
  requestId: z.string().min(1).optional(),
  excludeReservationId: z.string().min(1).optional()
});

router.get("/health", async (_request, response) => {
  await prisma.$queryRaw`SELECT 1`;
  response.json({ status: "ok" });
});

router.post("/auth/login", async (request, response) => {
  const payload = loginSchema.parse(request.body);

  const user = await prisma.user.findUnique({
    where: { email: payload.email.toLowerCase() }
  });

  if (!user || !(await verifyPassword(payload.password, user.passwordHash))) {
    return response.status(401).json({
      message: "Correo o contrasena incorrectos."
    });
  }

  return response.json({
    token: createAuthToken(user),
    user: toPublicUser(user)
  });
});

router.post("/auth/forgot-password", async (request, response) => {
  const payload = forgotPasswordSchema.parse(request.body);
  const user = await prisma.user.findUnique({
    where: {
      email: payload.email.toLowerCase()
    }
  });

  if (!user) {
    return response.json({
      message: "Si el correo existe en el sistema, recibira instrucciones para restablecer su contrasena."
    });
  }

  await (prisma as any).passwordResetToken.deleteMany({
    where: {
      userId: user.id,
      usedAt: null
    }
  });

  const rawToken = createPasswordResetToken();
  const tokenHash = hashPasswordResetToken(rawToken);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

  await (prisma as any).passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt
    }
  });

  await createUserNotification({
    userId: user.id,
    type: "PASSWORD_RESET",
    title: "Recuperacion de contrasena FabLab",
    body: "Se solicito un restablecimiento de contrasena para tu cuenta del portal FabLab.",
    linkUrl: `/reset-password?token=${rawToken}`,
    metadata: {
      expiresAt: expiresAt.toISOString()
    },
    email: user.email
  });

  await appendAuditLog({
    actorId: user.id,
    entityType: "auth",
    entityId: user.id,
    action: "password_reset_requested",
    payload: {
      expiresAt: expiresAt.toISOString()
    }
  });

  return response.json({
    message: "Si el correo existe en el sistema, recibira instrucciones para restablecer su contrasena.",
    debugResetToken: rawToken
  });
});

router.post("/auth/reset-password", async (request, response) => {
  const payload = resetPasswordSchema.parse(request.body);
  const tokenHash = hashPasswordResetToken(payload.token);
  const resetToken = await (prisma as any).passwordResetToken.findFirst({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: {
        gt: new Date()
      }
    },
    include: {
      user: true
    }
  });

  if (!resetToken) {
    return response.status(400).json({
      message: "El enlace de recuperacion es invalido o ya vencio."
    });
  }

  const nextHash = await hashPassword(payload.password);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: {
        id: resetToken.userId
      },
      data: {
        passwordHash: nextHash
      }
    });

    await (tx as any).passwordResetToken.update({
      where: {
        id: resetToken.id
      },
      data: {
        usedAt: new Date()
      }
    });
  });

  await appendAuditLog({
    actorId: resetToken.userId,
    entityType: "auth",
    entityId: resetToken.userId,
    action: "password_reset_completed"
  });

  return response.json({
    message: "Contrasena actualizada correctamente."
  });
});

async function authRequired(request: Request, response: Response, next: NextFunction) {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return response.status(401).json({ message: "Sesion requerida." });
  }

  try {
    const token = authHeader.slice("Bearer ".length);
    const payload = verifyAuthToken(token);
    request.authUserId = payload.userId;
    return next();
  } catch (_error) {
    return response.status(401).json({ message: "Token invalido o expirado." });
  }
}

async function loadCurrentUser(request: Request) {
  if (!request.authUserId) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: request.authUserId }
  });
}

async function adminRequired(request: Request, response: Response, next: NextFunction) {
  const user = await loadCurrentUser(request);

  if (!user) {
    return response.status(401).json({ message: "Usuario no encontrado." });
  }

  if (user.role !== "ADMIN") {
    return response.status(403).json({ message: "Acceso restringido a administradores." });
  }

  return next();
}

async function staffRequired(request: Request, response: Response, next: NextFunction) {
  const user = await loadCurrentUser(request);

  if (!user) {
    return response.status(401).json({ message: "Usuario no encontrado." });
  }

  if (!["STAFF", "ADMIN"].includes(user.role)) {
    return response.status(403).json({ message: "Acceso restringido a personal FabLab." });
  }

  return next();
}

function isReservationLocked(startAt: Date, status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED") {
  return status === "CANCELLED" || status === "COMPLETED" || startAt.getTime() < Date.now();
}

async function ensureReservationOwner(request: Request, response: Response, reservationId: string) {
  const currentUser = await loadCurrentUser(request);

  if (!currentUser) {
    response.status(401).json({ message: "Usuario no encontrado." });
    return null;
  }

  const reservation = await prisma.reservation.findFirst({
    where: {
      id: reservationId,
      userId: currentUser.id
    },
    include: reservationInclude
  });

  if (!reservation) {
    response.status(404).json({ message: "Reserva no encontrada." });
    return null;
  }

  return { currentUser, reservation };
}

async function ensureRequestOwner(request: Request, response: Response, requestId: string) {
  const currentUser = await loadCurrentUser(request);

  if (!currentUser) {
    response.status(401).json({ message: "Usuario no encontrado." });
    return null;
  }

  const serviceRequest = await prisma.serviceRequest.findFirst({
    where: {
      id: requestId,
      requesterId: currentUser.id
    },
    include: requestDetailInclude
  });

  if (!serviceRequest) {
    response.status(404).json({ message: "Solicitud no encontrada." });
    return null;
  }

  return { currentUser, serviceRequest };
}

async function ensureProjectOwner(request: Request, response: Response, projectId: string) {
  const currentUser = await loadCurrentUser(request);

  if (!currentUser) {
    response.status(401).json({ message: "Usuario no encontrado." });
    return null;
  }

  const project = await projectStore.findFirst({
    where: {
      id: projectId,
      ownerId: currentUser.id
    }
  });

  if (!project) {
    response.status(404).json({ message: "Proyecto no encontrado." });
    return null;
  }

  return { currentUser, project };
}

async function ensureStaffRequestAccess(request: Request, response: Response, requestId: string) {
  const currentUser = await loadCurrentUser(request);

  if (!currentUser) {
    response.status(401).json({ message: "Usuario no encontrado." });
    return null;
  }

  if (!["STAFF", "ADMIN"].includes(currentUser.role)) {
    response.status(403).json({ message: "Acceso restringido a personal FabLab." });
    return null;
  }

  const serviceRequest = await prisma.serviceRequest.findUnique({
    where: {
      id: requestId
    },
    include: staffRequestDetailInclude
  });

  if (!serviceRequest) {
    response.status(404).json({ message: "Solicitud no encontrada." });
    return null;
  }

  return { currentUser, serviceRequest };
}

async function appendRequestEvent({
  requestId,
  actorId,
  type,
  summary,
  detail
}: {
  requestId: string;
  actorId?: string | null;
  type: "CREATED" | "STATUS_CHANGED" | "COMMENT_ADDED" | "SENT_TO_QUOTATION" | "ACCEPTED" | "CORRECTION_REQUESTED" | "REJECTED";
  summary: string;
  detail?: string | null;
}) {
  await (prisma as any).requestEvent.create({
    data: {
      requestId,
      actorId: actorId ?? null,
      type,
      summary,
      detail: detail?.trim() || null
    }
  });
}

function mapActionToState(action: "ACCEPT" | "REQUEST_CORRECTION" | "REJECT" | "SEND_TO_QUOTATION" | "START_PRODUCTION" | "MARK_READY" | "MARK_COMPLETED") {
  switch (action) {
    case "ACCEPT":
      return {
        status: "APPROVED" as const,
        quotationStatus: "NOT_REQUESTED" as const,
        eventType: "ACCEPTED" as const,
        eventSummary: "Solicitud aceptada por staff"
      };
    case "REQUEST_CORRECTION":
      return {
        status: "CHANGES_REQUESTED" as const,
        quotationStatus: "NOT_REQUESTED" as const,
        eventType: "CORRECTION_REQUESTED" as const,
        eventSummary: "Se solicitaron correcciones al usuario"
      };
    case "REJECT":
      return {
        status: "REJECTED" as const,
        quotationStatus: "REJECTED" as const,
        eventType: "REJECTED" as const,
        eventSummary: "Solicitud rechazada por staff"
      };
    case "SEND_TO_QUOTATION":
      return {
        status: "IN_QUOTATION" as const,
        quotationStatus: "PENDING" as const,
        eventType: "SENT_TO_QUOTATION" as const,
        eventSummary: "Solicitud enviada a cotizacion"
      };
    case "START_PRODUCTION":
      return {
        status: "IN_PROGRESS" as const,
        quotationStatus: "ACCEPTED" as const,
        eventType: "STARTED_PRODUCTION" as const,
        eventSummary: "Solicitud iniciada en fabricacion"
      };
    case "MARK_READY":
      return {
        status: "READY_FOR_PICKUP" as const,
        quotationStatus: "ACCEPTED" as const,
        eventType: "MARKED_READY" as const,
        eventSummary: "Solicitud marcada como lista para retiro"
      };
    case "MARK_COMPLETED":
      return {
        status: "COMPLETED" as const,
        quotationStatus: "ACCEPTED" as const,
        eventType: "COMPLETED" as const,
        eventSummary: "Solicitud marcada como entregada"
      };
  }
}

function getOperationalStage(status: string) {
  switch (status) {
    case "PENDING_REVIEW":
      return "PENDING_REVIEW";
    case "IN_QUOTATION":
    case "QUOTED":
      return "IN_QUOTATION";
    case "CHANGES_REQUESTED":
      return "CHANGES_REQUESTED";
    case "APPROVED":
      return "READY_TO_SCHEDULE";
    case "IN_PROGRESS":
    case "READY_FOR_PICKUP":
      return "IN_PRODUCTION";
    case "COMPLETED":
      return "DELIVERED";
    default:
      return "OTHER";
  }
}

function getSlaStatus(commitmentDate?: Date | string | null, status?: string) {
  if (!commitmentDate || ["COMPLETED", "REJECTED"].includes(status ?? "")) {
    return "NONE";
  }

  const now = Date.now();
  const due = new Date(commitmentDate).getTime();
  const difference = due - now;

  if (difference < 0) {
    return "OVERDUE";
  }

  if (difference <= 1000 * 60 * 60 * 24) {
    return "DUE_SOON";
  }

  return "ON_TRACK";
}

async function appendAuditLog({
  actorId,
  entityType,
  entityId,
  action,
  payload
}: {
  actorId?: string | null;
  entityType: string;
  entityId: string;
  action: string;
  payload?: Record<string, unknown> | null;
}) {
  await (prisma as any).auditLog.create({
    data: {
      actorId: actorId ?? null,
      entityType,
      entityId,
      action,
      payloadJson: payload ? JSON.stringify(payload) : null
    }
  });
}

async function createUserNotification({
  userId,
  type,
  title,
  body,
  linkUrl,
  metadata,
  email
}: {
  userId: string;
  type: "REQUEST_STATUS_CHANGED" | "QUOTATION_READY" | "RESERVATION_UPCOMING" | "CORRECTION_REQUIRED" | "PASSWORD_RESET" | "SYSTEM";
  title: string;
  body: string;
  linkUrl?: string | null;
  metadata?: Record<string, unknown> | null;
  email?: string | null;
}) {
  const delivery = email
    ? await sendDevelopmentEmail({
        to: email,
        subject: title,
        text: `${title}\n\n${body}${linkUrl ? `\n\nEnlace: ${linkUrl}` : ""}`
      })
    : null;

  return (prisma as any).notification.create({
    data: {
      userId,
      type,
      title,
      body,
      linkUrl: linkUrl ?? null,
      metadataJson: metadata ? JSON.stringify(metadata) : null,
      emailSentAt: delivery?.deliveredAt ?? null
    }
  });
}

async function applyQuotationDecisionForOwner(
  owned: { currentUser: any; serviceRequest: any },
  payload: { decision: "ACCEPT" | "REJECT"; reason?: string }
) {
  await prisma.$transaction(async (tx) => {
    await tx.serviceRequest.update({
      where: {
        id: owned.serviceRequest.id
      },
      data: {
        status: payload.decision === "ACCEPT" ? ("APPROVED" as any) : ("CHANGES_REQUESTED" as any),
        quotationStatus: payload.decision === "ACCEPT" ? "ACCEPTED" : "REJECTED"
      }
    });

    await (tx as any).quotation.updateMany({
      where: {
        requestId: owned.serviceRequest.id
      },
      data: {
        status: payload.decision === "ACCEPT" ? "ACCEPTED" : "REJECTED"
      }
    });

    if (payload.reason?.trim()) {
      await (tx as any).requestComment.create({
        data: {
          requestId: owned.serviceRequest.id,
          authorId: owned.currentUser.id,
          body: payload.reason.trim(),
          visibility: "PUBLIC"
        }
      });
    }

    await (tx as any).requestEvent.create({
      data: {
        requestId: owned.serviceRequest.id,
        actorId: owned.currentUser.id,
        type: payload.decision === "ACCEPT" ? "ACCEPTED" : "CORRECTION_REQUESTED",
        summary: payload.decision === "ACCEPT" ? "Usuario acepto la cotizacion" : "Usuario rechazo la cotizacion",
        detail: payload.reason?.trim() || null
      }
    });

    await syncRequestInventoryReservation(tx, {
      requestId: owned.serviceRequest.id,
      actorId: owned.currentUser.id,
      reason: payload.decision === "ACCEPT" ? "Reserva proyectada tras aceptacion de cotizacion." : "Liberacion proyectada por rechazo de cotizacion."
    });
  });

  const staffTargets = await prisma.user.findMany({
    where: {
      OR: [owned.serviceRequest.assignedStaffId ? { id: owned.serviceRequest.assignedStaffId } : { id: "__none__" }, { role: "ADMIN" }]
    }
  });

  await Promise.all(
    staffTargets.map((staffUser) =>
      createUserNotification({
        userId: staffUser.id,
        type: "REQUEST_STATUS_CHANGED",
        title: payload.decision === "ACCEPT" ? "Cotizacion aceptada por usuario" : "Cotizacion rechazada por usuario",
        body: `La solicitud "${owned.serviceRequest.title}" fue ${payload.decision === "ACCEPT" ? "aceptada" : "rechazada"} por el usuario.`,
        linkUrl: `/staff/solicitudes/${owned.serviceRequest.id}`,
        metadata: {
          requestId: owned.serviceRequest.id,
          decision: payload.decision
        }
      })
    )
  );

  await appendAuditLog({
    actorId: owned.currentUser.id,
    entityType: "quotation",
    entityId: owned.serviceRequest.id,
    action: payload.decision === "ACCEPT" ? "accepted_by_user" : "rejected_by_user",
    payload: {
      reason: payload.reason?.trim() || null
    }
  });

  return prisma.serviceRequest.findUniqueOrThrow({
    where: {
      id: owned.serviceRequest.id
    },
    include: requestDetailInclude
  });
}

async function ensureUpcomingReservationNotifications(userId: string) {
  const now = new Date();
  const next48h = new Date(now.getTime() + 1000 * 60 * 60 * 48);
  const reservations = await prisma.reservation.findMany({
    where: {
      userId,
      status: {
        in: ["PENDING", "CONFIRMED"]
      },
      startAt: {
        gte: now,
        lte: next48h
      }
    },
    include: reservationInclude
  });

  for (const reservation of reservations) {
    const reservationItem = reservation as any;
    const key = `reservation-upcoming:${reservation.id}`;
    const existing = await (prisma as any).notification.findFirst({
      where: {
        userId,
        type: "RESERVATION_UPCOMING",
        metadataJson: {
          contains: reservation.id
        }
      }
    });

    if (!existing) {
      await createUserNotification({
        userId,
        type: "RESERVATION_UPCOMING",
        title: "Reserva proxima en FabLab",
        body: `Tu reserva para ${reservationItem.machine?.name ?? "tu maquina"} comienza el ${new Date(reservation.startAt).toLocaleString("es-CL")}.`,
        linkUrl: `/mis-reservas/${reservation.id}`,
        metadata: { key, reservationId: reservation.id }
      });
    }
  }
}

function calculateQuotationTotal(input: { setupCost: number; machineCost: number; materialCost: number }) {
  return input.setupCost + input.machineCost + input.materialCost;
}

function toNumber(value: unknown) {
  return Number(value ?? 0);
}

function toMaterialResponse(material: any) {
  const stockQuantity = toNumber(material.stockQuantity);
  const reservedQuantity = toNumber(material.reservedQuantity);
  const stockThreshold = toNumber(material.stockThreshold);
  const availableQuantity = stockQuantity - reservedQuantity;

  return {
    ...material,
    stockQuantity,
    reservedQuantity,
    stockThreshold,
    pricePerUnit: toNumber(material.pricePerUnit),
    availableQuantity,
    lowStock: availableQuantity <= stockThreshold,
    belowReserved: availableQuantity < 0
  };
}

function toRequestResponse(serviceRequest: any) {
  if (!serviceRequest) {
    return serviceRequest;
  }

  return {
    ...serviceRequest,
    estimatedCost: toNumber(serviceRequest.estimatedCost),
    materialUnitsRequested: toNumber(serviceRequest.materialUnitsRequested),
    operationalStage: getOperationalStage(serviceRequest.status),
    slaStatus: getSlaStatus(serviceRequest.commitmentDate, serviceRequest.status),
    material: serviceRequest.material ? toMaterialResponse(serviceRequest.material) : null,
    quotation: serviceRequest.quotation
      ? {
          ...serviceRequest.quotation,
          setupCost: toNumber(serviceRequest.quotation.setupCost),
          machineCost: toNumber(serviceRequest.quotation.machineCost),
          materialCost: toNumber(serviceRequest.quotation.materialCost),
          totalCost: toNumber(serviceRequest.quotation.totalCost)
        }
      : null
  };
}

function toReservationResponse(reservation: any) {
  if (!reservation) {
    return reservation;
  }

  return {
    ...reservation,
    machine: reservation.machine
      ? {
          ...reservation.machine,
          hourlyRate: toNumber(reservation.machine.hourlyRate),
          machineType: reservation.machine.machineType
            ? {
                ...reservation.machine.machineType
              }
            : reservation.machine.machineType ?? null
        }
      : reservation.machine
  };
}

function toNotificationResponse(notification: any) {
  return {
    ...notification,
    metadata: notification.metadataJson ? JSON.parse(notification.metadataJson) : null
  };
}

function toProjectResponse(project: any) {
  if (!project) {
    return project;
  }

  return {
    ...project,
    files: (project.files ?? []).map((file: any) => ({
      ...file
    })),
    members: (project.members ?? []).map((member: any) => ({
      ...member
    }))
  };
}

function getLocalDateString(dateValue: Date | string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(dateValue));
}

function getLocalTimeValue(dateValue: Date | string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Santiago",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(new Date(dateValue));
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

function getReservationBlockByNumber(blockNumber: number) {
  return reservationBlocks.find((block) => block.number === blockNumber);
}

function getMachineReservationRules(machine: any) {
  return {
    minBlocks: machine.machineType?.minReservationBlocks ?? 1,
    maxBlocks: machine.machineType?.maxReservationBlocks ?? 8,
    requiresConsecutive: machine.machineType?.reservationRequiresConsecutive ?? true
  };
}

function sortUniqueBlockNumbers(blockNumbers: number[]) {
  return [...new Set(blockNumbers)].sort((left, right) => left - right);
}

function validateReservationBlockSelection(blockNumbers: number[], machine: any, estimatedMinutes?: number | null) {
  const normalized = sortUniqueBlockNumbers(blockNumbers);
  const rules = getMachineReservationRules(machine);

  if (normalized.length !== blockNumbers.length) {
    throw new Error("No puedes repetir bloques dentro de la misma reserva.");
  }

  if (normalized.length < rules.minBlocks) {
    throw new Error(`Debes seleccionar al menos ${rules.minBlocks} bloque(s) para esta maquina.`);
  }

  if (normalized.length > rules.maxBlocks) {
    throw new Error(`Solo puedes reservar hasta ${rules.maxBlocks} bloque(s) para esta maquina.`);
  }

  if (rules.requiresConsecutive) {
    for (let index = 1; index < normalized.length; index += 1) {
      if (normalized[index] !== normalized[index - 1] + 1) {
        throw new Error("Esta maquina requiere bloques consecutivos dentro de la misma reserva.");
      }
    }
  }

  const totalMinutes = normalized.length * 35;
  if (totalMinutes > Number(machine.maxDurationMinutes ?? 0)) {
    throw new Error(`La seleccion supera la duracion maxima permitida de ${machine.maxDurationMinutes} minutos para esta maquina.`);
  }

  if (estimatedMinutes && totalMinutes < estimatedMinutes) {
    throw new Error(`La seleccion debe cubrir al menos ${estimatedMinutes} minutos segun la solicitud aprobada.`);
  }

  return normalized;
}

function getOverlappingBlockNumbersForInterval(date: string, startAt: Date | string, endAt: Date | string) {
  if (getLocalDateString(startAt) !== date && getLocalDateString(endAt) !== date) {
    return [];
  }

  const intervalStart = getLocalTimeValue(startAt);
  const intervalEnd = getLocalTimeValue(endAt);

  return reservationBlocks
    .filter((block) => {
      const blockStart = block.hour * 60 + block.minute;
      const blockEnd = block.endHour * 60 + block.endMinute;
      return intervalStart < blockEnd && intervalEnd > blockStart;
    })
    .map((block) => block.number);
}

function getWeekDates(weekStart: string) {
  const dates: string[] = [];
  const [year, month, day] = weekStart.split("-").map((value) => Number(value));
  const baseDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

  for (let offset = 0; offset < 7; offset += 1) {
    const nextDate = new Date(baseDate);
    nextDate.setUTCDate(baseDate.getUTCDate() + offset);
    dates.push(nextDate.toISOString().slice(0, 10));
  }

  return dates;
}

function getRecommendedBlockCount(serviceRequest: any, machine: any) {
  const estimatedMinutes = Number(serviceRequest?.quotation?.estimatedMinutes ?? serviceRequest?.estimatedDurationMinutes ?? 35);
  const rawBlockCount = Math.max(1, Math.ceil(estimatedMinutes / 35));
  const rules = getMachineReservationRules(machine);
  return Math.min(rules.maxBlocks, Math.max(rules.minBlocks, rawBlockCount));
}

function findSuggestedBlockNumbers(
  blockedNumbers: number[],
  rules: { minBlocks: number; maxBlocks: number; requiresConsecutive: boolean },
  recommendedBlockCount: number
) {
  const blockedSet = new Set(blockedNumbers);
  const desiredCount = Math.min(rules.maxBlocks, Math.max(rules.minBlocks, recommendedBlockCount));

  if (!rules.requiresConsecutive) {
    const available = reservationBlocks.map((block) => block.number).filter((blockNumber) => !blockedSet.has(blockNumber));
    return available.slice(0, desiredCount);
  }

  for (let startIndex = 0; startIndex <= reservationBlocks.length - desiredCount; startIndex += 1) {
    const slice = reservationBlocks.slice(startIndex, startIndex + desiredCount).map((block) => block.number);
    if (slice.every((blockNumber, index) => index === 0 || blockNumber === slice[index - 1] + 1) && slice.every((blockNumber) => !blockedSet.has(blockNumber))) {
      return slice;
    }
  }

  return [];
}

function requestNeedsInventoryReservation(serviceRequest: any) {
  return (
    serviceRequest.status === "APPROVED" &&
    (!serviceRequest.quotation || serviceRequest.quotationStatus === "ACCEPTED" || serviceRequest.quotationStatus === "NOT_REQUESTED")
  );
}

async function registerMaterialMovement(
  tx: any,
  input: {
    materialId: string;
    actorId?: string | null;
    requestId?: string | null;
    type: "IN" | "OUT" | "RESERVE" | "RELEASE" | "ADJUSTMENT";
    quantity: number;
    reason?: string | null;
    resultingStockQuantity: number;
    resultingReservedQuantity: number;
  }
) {
  await (tx as any).materialMovement.create({
    data: {
      materialId: input.materialId,
      actorId: input.actorId ?? null,
      requestId: input.requestId ?? null,
      type: input.type,
      quantity: input.quantity,
      reason: input.reason?.trim() || null,
      resultingStockQuantity: input.resultingStockQuantity,
      resultingReservedQuantity: input.resultingReservedQuantity
    }
  });
}

async function syncRequestInventoryReservation(
  tx: any,
  input: {
    requestId: string;
    actorId?: string | null;
    reason?: string | null;
  }
) {
  const serviceRequest = (await (tx as any).serviceRequest.findUnique({
    where: {
      id: input.requestId
    },
    include: {
      material: true,
      quotation: true
    } as any
  })) as any;

  if (!serviceRequest?.materialId || !serviceRequest.material) {
    return serviceRequest;
  }

  const shouldReserve = requestNeedsInventoryReservation(serviceRequest);
  const isReserved = Boolean(serviceRequest.inventoryReservedAt);
  const reserveQuantity = toNumber(serviceRequest.materialUnitsRequested);
  const material = serviceRequest.material;
  const stockQuantity = toNumber(material.stockQuantity);
  const reservedQuantity = toNumber(material.reservedQuantity);
  const availableQuantity = stockQuantity - reservedQuantity;

  if (shouldReserve && !isReserved) {
    if (availableQuantity < reserveQuantity) {
      throw new Error(
        `No hay stock suficiente para aprobar la solicitud. Disponible: ${availableQuantity.toFixed(2)} ${material.unit}. Requerido: ${reserveQuantity.toFixed(2)} ${material.unit}.`
      );
    }

    const updatedMaterial = await (tx as any).material.update({
      where: { id: material.id },
      data: {
        reservedQuantity: {
          increment: reserveQuantity
        }
      }
    });

    await (tx as any).serviceRequest.update({
      where: { id: serviceRequest.id },
      data: {
        inventoryReservedAt: new Date()
      }
    });

    await registerMaterialMovement(tx, {
      materialId: material.id,
      actorId: input.actorId ?? null,
      requestId: serviceRequest.id,
      type: "RESERVE",
      quantity: reserveQuantity,
      reason: input.reason ?? "Reserva proyectada de stock para solicitud aprobada.",
      resultingStockQuantity: toNumber(updatedMaterial.stockQuantity),
      resultingReservedQuantity: toNumber(updatedMaterial.reservedQuantity)
    });
  }

  if (!shouldReserve && isReserved) {
    const updatedMaterial = await (tx as any).material.update({
      where: { id: material.id },
      data: {
        reservedQuantity: {
          decrement: reserveQuantity
        }
      }
    });

    await (tx as any).serviceRequest.update({
      where: { id: serviceRequest.id },
      data: {
        inventoryReservedAt: null
      }
    });

    await registerMaterialMovement(tx, {
      materialId: material.id,
      actorId: input.actorId ?? null,
      requestId: serviceRequest.id,
      type: "RELEASE",
      quantity: reserveQuantity,
      reason: input.reason ?? "Liberacion de stock proyectado por cambio de estado.",
      resultingStockQuantity: toNumber(updatedMaterial.stockQuantity),
      resultingReservedQuantity: toNumber(updatedMaterial.reservedQuantity)
    });
  }

  return (tx as any).serviceRequest.findUnique({
    where: {
      id: serviceRequest.id
    },
    include: {
      material: true,
      quotation: true
    } as any
  });
}

async function ensureReservationRequestEligibility({
  currentUserId,
  projectId,
  requestId,
  machineId
}: {
  currentUserId: string;
  projectId?: string | null;
  requestId?: string | null;
  machineId: string;
}) {
  if (!requestId) {
    throw new Error("La reserva debe quedar asociada a una solicitud aprobada.");
  }

  const serviceRequest = await prisma.serviceRequest.findFirst({
    where: {
      id: requestId,
      requesterId: currentUserId
    },
    include: {
      quotation: true,
      machine: {
        include: {
          machineType: true
        }
      }
    } as any
  }) as (typeof prisma.serviceRequest extends never ? never : any);

  if (!serviceRequest) {
    throw new Error("La solicitud asociada no existe o no pertenece al usuario.");
  }

  if (serviceRequest.machineId !== machineId) {
    throw new Error("La reserva debe usar la misma maquina definida en la solicitud.");
  }

  if (projectId && serviceRequest.projectId !== projectId) {
    throw new Error("La reserva debe quedar asociada al mismo proyecto de la solicitud.");
  }

  if (serviceRequest.status !== "APPROVED") {
    throw new Error("No puedes reservar esta maquina hasta que la solicitud quede aprobada.");
  }

  if (serviceRequest.quotation && serviceRequest.quotationStatus !== "ACCEPTED") {
    throw new Error("Debes aceptar la cotizacion antes de crear una reserva para esta solicitud.");
  }

  return {
    request: serviceRequest,
    resolvedProjectId: serviceRequest.projectId
  };
}

async function buildReservationScheduleData({
  machineId,
  weekStart,
  requestId,
  excludeReservationId
}: {
  machineId: string;
  weekStart: string;
  requestId?: string;
  excludeReservationId?: string;
}) {
  const weekDates = getWeekDates(weekStart);
  const weekStartRange = new Date(`${weekDates[0]}T00:00:00.000Z`);
  const weekEndRange = new Date(`${weekDates[6]}T23:59:59.999Z`);
  const machine = await prisma.machine.findUnique({
    where: {
      id: machineId
    },
    include: {
      machineType: true,
      maintenanceWindows: {
        where: {
          startAt: {
            lt: weekEndRange
          },
          endAt: {
            gt: weekStartRange
          }
        }
      }
    } as any
  }) as any;

  if (!machine) {
    throw new Error("Maquina no encontrada.");
  }

  const reservations = await prisma.reservation.findMany({
    where: {
      machineId,
      ...(excludeReservationId ? { id: { not: excludeReservationId } } : {}),
      status: {
        in: ["PENDING", "CONFIRMED"]
      },
      startAt: {
        lt: weekEndRange
      },
      endAt: {
        gt: weekStartRange
      }
    },
    include: reservationInclude
  });

  const requestDetail = requestId
    ? ((await prisma.serviceRequest.findUnique({
        where: {
          id: requestId
        },
        include: {
          quotation: true
        } as any
      })) as any)
    : null;

  const rules = getMachineReservationRules(machine);
  const recommendedBlockCount = getRecommendedBlockCount(requestDetail, machine);

  const days = weekDates.map((date) => {
    const reservationEntries = reservations.filter((reservation) => getLocalDateString(reservation.startAt) === date);
    const maintenanceEntries = (machine.maintenanceWindows ?? []).filter((window: any) => getLocalDateString(window.startAt) === date);
    const reservedBlockNumbers = sortUniqueBlockNumbers(reservationEntries.flatMap((reservation) => reservation.blockNumbers));
    const maintenanceBlockNumbers = sortUniqueBlockNumbers(
      maintenanceEntries.flatMap((window: any) => getOverlappingBlockNumbersForInterval(date, window.startAt, window.endAt))
    );
    const blockedBlockNumbers = sortUniqueBlockNumbers([...reservedBlockNumbers, ...maintenanceBlockNumbers]);
    const suggestedBlockNumbers = findSuggestedBlockNumbers(blockedBlockNumbers, rules, recommendedBlockCount);

    return {
      date,
      weekdayLabel: new Intl.DateTimeFormat("es-CL", { weekday: "long", timeZone: "America/Santiago" })
        .format(new Date(`${date}T12:00:00.000Z`))
        .replace(/^./, (value) => value.toUpperCase()),
      reservedBlockNumbers,
      maintenanceBlockNumbers,
      blockedBlockNumbers,
      freeBlockCount: reservationBlocks.length - blockedBlockNumbers.length,
      occupancyRate: Number((((blockedBlockNumbers.length / reservationBlocks.length) || 0) * 100).toFixed(1)),
      suggestedBlockNumbers,
      reservations: reservationEntries.map(toReservationResponse),
      maintenanceWindows: maintenanceEntries
    };
  });

  return {
    machine: {
      ...machine,
      hourlyRate: toNumber(machine.hourlyRate),
      rules
    },
    request: requestDetail
      ? {
          id: requestDetail.id,
          title: requestDetail.title,
          estimatedDurationMinutes: requestDetail.quotation?.estimatedMinutes ?? requestDetail.estimatedDurationMinutes,
          status: requestDetail.status
        }
      : null,
    recommendedBlockCount,
    weekStart,
    days
  };
}

function toRequestDate(dateValue: string) {
  return new Date(`${dateValue}T12:00:00.000Z`);
}

function normalizeUploadedFiles(files: Express.Multer.File[]) {
  return files.map((file) => ({
    originalName: file.originalname,
    storedName: file.filename,
    mimeType: file.mimetype || "application/octet-stream",
    extension: file.originalname.split(".").pop()?.toLowerCase() ?? "",
    sizeBytes: file.size,
    publicUrl: toPublicRequestFileUrl(file.filename)
  }));
}

async function cleanupUploadedFiles(files: Express.Multer.File[]) {
  await Promise.all(
    files.map((file) =>
      fs.unlink(file.path).catch(() => {
        return undefined;
      })
    )
  );
}

async function validateReservationMutation({
  payload,
  currentUserId,
  excludeReservationId
}: {
  payload: z.infer<typeof reservationMutationSchema>;
  currentUserId: string;
  excludeReservationId?: string;
}) {
  const eligibility = await ensureReservationRequestEligibility({
    currentUserId,
    projectId: payload.projectId || null,
    requestId: payload.requestId,
    machineId: payload.machineId
  });

  const machine = await prisma.machine.findUnique({
    where: {
      id: payload.machineId
    },
    include: {
      machineType: true
    } as any
  }) as any;

  if (!machine) {
    throw new Error("Maquina no encontrada.");
  }

  if (machine.status === "OFFLINE") {
    throw new Error("La maquina seleccionada se encuentra fuera de servicio.");
  }

  const normalizedBlocks = validateReservationBlockSelection(
    payload.blockNumbers,
    machine,
    eligibility.request?.quotation?.estimatedMinutes ?? eligibility.request?.estimatedDurationMinutes ?? null
  );

  const reservationStartDate = getLocalDateString(payload.startAt);
  const schedule = await buildReservationScheduleData({
    machineId: payload.machineId,
    weekStart: reservationStartDate,
    requestId: payload.requestId,
    excludeReservationId
  });

  const selectedDay = schedule.days.find((day) => day.date === reservationStartDate);

  if (!selectedDay) {
    throw new Error("No fue posible construir la agenda semanal para la fecha seleccionada.");
  }

  const conflictingReserved = normalizedBlocks.filter((blockNumber) => selectedDay.reservedBlockNumbers.includes(blockNumber));
  if (conflictingReserved.length > 0) {
    throw new Error("Ya existe una reserva activa para esa maquina en uno o mas bloques seleccionados.");
  }

  const maintenanceConflicts = normalizedBlocks.filter((blockNumber) => selectedDay.maintenanceBlockNumbers.includes(blockNumber));
  if (maintenanceConflicts.length > 0) {
    throw new Error("Uno o mas bloques seleccionados estan bloqueados por mantenimiento.");
  }

  return {
    eligibility,
    machine,
    normalizedBlocks
  };
}

router.get("/auth/me", authRequired, async (request, response) => {
  const user = await loadCurrentUser(request);

  if (!user) {
    return response.status(401).json({ message: "Usuario no encontrado." });
  }

  return response.json({
    user: toPublicUser(user)
  });
});

router.put("/auth/me/profile", authRequired, async (request, response) => {
  const payload = profileSchema.parse(request.body);
  const user = await loadCurrentUser(request);

  if (!user) {
    return response.status(401).json({ message: "Usuario no encontrado." });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      name: buildDisplayName(payload.firstName, payload.lastName),
      firstName: payload.firstName,
      middleName: payload.middleName?.trim() || null,
      lastName: payload.lastName,
      maternalLastName: payload.maternalLastName?.trim() || null,
      documentType: payload.documentType,
      documentNumber: payload.documentNumber,
      career: payload.career,
      entryYear: payload.entryYear,
      birthDate: new Date(`${payload.birthDate}T00:00:00.000Z`),
      sex: payload.sex,
      profileCompleted: true
    }
  });

  return response.json({
    user: toPublicUser(updated)
  });
});

router.use(authRequired);

router.get("/notifications", async (request, response) => {
  const currentUser = await loadCurrentUser(request);

  if (!currentUser) {
    return response.status(401).json({ message: "Usuario no encontrado." });
  }

  await ensureUpcomingReservationNotifications(currentUser.id);

  const notifications = await (prisma as any).notification.findMany({
    where: {
      userId: currentUser.id
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  response.json({
    unreadCount: notifications.filter((item: any) => !item.readAt).length,
    items: notifications.map(toNotificationResponse)
  });
});

router.post("/notifications/:notificationId/read", async (request, response) => {
  const currentUser = await loadCurrentUser(request);

  if (!currentUser) {
    return response.status(401).json({ message: "Usuario no encontrado." });
  }

  const payload = notificationReadSchema.parse(request.body ?? {});
  const notification = await (prisma as any).notification.findFirst({
    where: {
      id: request.params.notificationId,
      userId: currentUser.id
    }
  });

  if (!notification) {
    return response.status(404).json({ message: "Notificacion no encontrada." });
  }

  const updated = await (prisma as any).notification.update({
    where: {
      id: notification.id
    },
    data: {
      readAt: payload.read ? new Date() : null
    }
  });

  response.json(toNotificationResponse(updated));
});

router.get("/overview", async (_request, response) => {
  const [machines, materials, requests, reservations] = await Promise.all([
    prisma.machine.findMany({ orderBy: { name: "asc" } }),
    prisma.material.findMany({ orderBy: { name: "asc" } }),
    prisma.serviceRequest.findMany({
      include: requestInclude,
      orderBy: { requestedDate: "asc" },
      take: 5
    }),
    prisma.reservation.findMany({
      include: reservationInclude,
      orderBy: { startAt: "asc" },
      take: 5
    })
  ]);

  const normalizedMaterials = materials.map(toMaterialResponse);
  const lowStockMaterials = normalizedMaterials.filter((material) => material.lowStock);

  response.json({
    metrics: {
      totalMachines: machines.length,
      availableMachines: machines.filter((machine) => machine.status === "AVAILABLE").length,
      lowStockMaterials: lowStockMaterials.length,
      openRequests: requests.filter((item) => !["COMPLETED", "REJECTED"].includes(item.status)).length,
      upcomingReservations: reservations.length
    },
    lowStockMaterials,
    upcomingReservations: reservations,
    recentRequests: requests.map(toRequestResponse)
  });
});

router.get("/machines", async (_request, response) => {
  const machines = await prisma.machine.findMany({
    include: {
      machineType: true
    },
    orderBy: [{ status: "asc" }, { name: "asc" }]
  });

  response.json(machines);
});

router.get("/machine-types", async (_request, response) => {
  const machineTypes = await prisma.machineType.findMany({
    where: {
      isPublished: true
    },
    orderBy: { createdAt: "asc" }
  });

  response.json(machineTypes);
});

router.get("/machine-types/:machineTypeId", async (request, response) => {
  const machineType = await prisma.machineType.findFirst({
    where: {
      id: request.params.machineTypeId,
      isPublished: true
    },
    include: machineTypeInclude
  });

  if (!machineType) {
    return response.status(404).json({ message: "Tipo de maquina no encontrado." });
  }

  response.json(machineType);
});

router.get("/materials", async (request, response) => {
  const includeMovements = String(request.query.includeMovements ?? "") === "true";

  if (includeMovements) {
    const currentUser = await loadCurrentUser(request);
    if (!currentUser || !["STAFF", "ADMIN"].includes(currentUser.role)) {
      return response.status(403).json({ message: "Acceso restringido a personal FabLab." });
    }

    const materials = await (prisma as any).material.findMany({
      include: {
        movements: {
          include: materialMovementInclude,
          orderBy: {
            createdAt: "desc"
          },
          take: 20
        }
      },
      orderBy: {
        name: "asc"
      }
    });

    return response.json(
      materials.map((material: any) => ({
        ...toMaterialResponse(material),
        movements: material.movements.map((movement: any) => ({
          ...movement,
          quantity: toNumber(movement.quantity),
          resultingStockQuantity: toNumber(movement.resultingStockQuantity),
          resultingReservedQuantity: toNumber(movement.resultingReservedQuantity)
        }))
      }))
    );
  }

  const materials = await (prisma as any).material.findMany({
    where: {
      isActive: true
    },
    orderBy: { name: "asc" }
  });

  response.json(materials.map(toMaterialResponse));
});

router.get("/materials/:materialId", staffRequired, async (request, response) => {
  const material = await (prisma as any).material.findUnique({
    where: {
      id: request.params.materialId
    },
    include: {
      movements: {
        include: materialMovementInclude,
        orderBy: {
          createdAt: "desc"
        },
        take: 50
      }
    }
  });

  if (!material) {
    return response.status(404).json({ message: "Material no encontrado." });
  }

  response.json({
    ...toMaterialResponse(material),
    movements: material.movements.map((movement: any) => ({
      ...movement,
      quantity: toNumber(movement.quantity),
      resultingStockQuantity: toNumber(movement.resultingStockQuantity),
      resultingReservedQuantity: toNumber(movement.resultingReservedQuantity)
    }))
  });
});

router.get("/requests", async (_request, response) => {
  const currentUser = await loadCurrentUser(_request);
  const query = requestQuerySchema.parse(_request.query);

  if (!currentUser) {
    return response.status(401).json({ message: "Usuario no encontrado." });
  }

  const requests = await prisma.serviceRequest.findMany({
    where: {
      requesterId: currentUser.id,
      ...(query.projectId ? { projectId: query.projectId } : {})
    },
    include: requestInclude,
    orderBy: { createdAt: "desc" }
  });

  response.json(requests.map(toRequestResponse));
});

router.get("/requests/:requestId", async (request, response) => {
  const owned = await ensureRequestOwner(request, response, request.params.requestId);

  if (!owned) {
    return;
  }

  response.json(toRequestResponse(owned.serviceRequest));
});

router.put("/requests/:requestId", async (request, response) => {
  const owned = await ensureRequestOwner(request, response, request.params.requestId);

  if (!owned) {
    return;
  }

  if (["APPROVED", "IN_PROGRESS", "READY_FOR_PICKUP", "COMPLETED", "REJECTED"].includes(owned.serviceRequest.status)) {
    return response.status(409).json({ message: "Esta solicitud ya no puede ser editada por el usuario." });
  }

  const payload = updateRequestSchema.parse(request.body);

  const updated = await prisma.serviceRequest.update({
    where: {
      id: owned.serviceRequest.id
    },
    data: {
      title: payload.title,
      description: payload.description,
      notes: payload.notes?.trim() || null,
      requestedDate: toRequestDate(payload.requestedDate),
      estimatedDurationMinutes: payload.estimatedDurationMinutes,
      estimatedCost: payload.estimatedCost,
      quantity: payload.quantity,
      materialUnitsRequested: payload.materialUnitsRequested,
      machineId: payload.machineId,
      materialId: payload.materialId,
      status: "PENDING_REVIEW"
    },
    include: requestDetailInclude
  });

  await appendRequestEvent({
    requestId: owned.serviceRequest.id,
    actorId: owned.currentUser.id,
    type: "STATUS_CHANGED",
    summary: "Solicitud actualizada por usuario",
    detail: "La solicitud vuelve a estado pendiente de revision."
  });

  response.json(toRequestResponse(updated));
});

router.post("/requests/:requestId/comments", async (request, response) => {
  const owned = await ensureRequestOwner(request, response, request.params.requestId);

  if (!owned) {
    return;
  }

  const payload = userRequestCommentSchema.parse(request.body);
  const created = await (prisma as any).requestComment.create({
    data: {
      requestId: owned.serviceRequest.id,
      authorId: owned.currentUser.id,
      body: payload.body.trim(),
      visibility: "PUBLIC"
    },
    include: requestCommentPublicInclude
  });

  await appendRequestEvent({
    requestId: owned.serviceRequest.id,
    actorId: owned.currentUser.id,
    type: "COMMENT_ADDED",
    summary: "Usuario agrego un comentario",
    detail: "Nuevo comentario visible para el equipo."
  });

  response.status(201).json(created);
});

router.get("/projects", async (request, response) => {
  const currentUser = await loadCurrentUser(request);

  if (!currentUser) {
    return response.status(401).json({ message: "Usuario no encontrado." });
  }

  const projects = await projectStore.findMany({
    where: {
      ownerId: currentUser.id
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return response.json(projects);
});

router.get("/projects/:projectId", async (request, response) => {
  const currentUser = await loadCurrentUser(request);

  if (!currentUser) {
    return response.status(401).json({ message: "Usuario no encontrado." });
  }

  const project = await projectStore.findFirst({
    where: {
      id: request.params.projectId,
      ownerId: currentUser.id
    },
    include: {
      members: true,
      files: true
    }
  });

  if (!project) {
    return response.status(404).json({ message: "Proyecto no encontrado." });
  }

  const [requests, reservations] = await Promise.all([
    prisma.serviceRequest.findMany({
      where: {
        projectId: project.id
      },
      include: requestInclude,
      orderBy: { createdAt: "asc" }
    }),
    prisma.reservation.findMany({
      where: {
        projectId: project.id
      },
      include: reservationInclude,
      orderBy: { createdAt: "asc" }
    })
  ]);

  return response.json(toProjectResponse({
    ...project,
    requests: requests.map(toRequestResponse),
    reservations
  }));
});

router.post("/projects", async (request, response) => {
  const currentUser = await loadCurrentUser(request);
  const payload = createProjectSchema.parse(request.body);

  if (!currentUser) {
    return response.status(401).json({ message: "Usuario no encontrado." });
  }

  const created = await projectStore.create({
    data: {
      name: payload.name,
      description: payload.description,
      repositoryUrl: payload.repositoryUrl || null,
      courseName: payload.courseName || null,
      professorName: payload.professorName || null,
      academicPeriod: payload.academicPeriod || null,
      projectType: payload.projectType,
      scope: payload.scope,
      attachmentNames: payload.attachmentNames,
      ownerId: currentUser.id
    }
  });

  return response.status(201).json(created);
});

router.post("/projects/:projectId/members", async (request, response) => {
  const access = await ensureProjectOwner(request, response, request.params.projectId);

  if (!access) {
    return;
  }

  const payload = projectMemberSchema.parse(request.body);
  const created = await (prisma as any).projectMember.create({
    data: {
      projectId: access.project.id,
      name: payload.name.trim(),
      email: payload.email.toLowerCase(),
      roleInProject: payload.roleInProject?.trim() || null,
      isOwner: payload.isOwner,
      ownerUserId: payload.email.toLowerCase() === access.currentUser.email.toLowerCase() ? access.currentUser.id : null
    }
  });

  await appendAuditLog({
    actorId: access.currentUser.id,
    entityType: "project_member",
    entityId: created.id,
    action: "created",
    payload: {
      projectId: access.project.id
    }
  });

  response.status(201).json(created);
});

router.post("/projects/:projectId/files", requestUploadMiddleware.array("files", 3), async (request, response, next) => {
  const uploadedFiles = ((request.files as Express.Multer.File[] | undefined) ?? []).slice(0, 3);

  try {
    const access = await ensureProjectOwner(request, response, String(request.params.projectId));

    if (!access) {
      await cleanupUploadedFiles(uploadedFiles);
      return;
    }

    if (uploadedFiles.length === 0) {
      return response.status(400).json({ message: "Debes adjuntar al menos un archivo de proyecto." });
    }

    const createdFiles = await Promise.all(
      normalizeUploadedFiles(uploadedFiles).map((file, index) =>
        (prisma as any).projectFile.create({
          data: {
            projectId: access.project.id,
            originalName: file.originalName,
            storedName: file.storedName,
            mimeType: file.mimeType,
            extension: file.extension,
            sizeBytes: file.sizeBytes,
            versionLabel: `v${index + 1}`,
            uploadedById: access.currentUser.id
          }
        })
      )
    );

    await appendAuditLog({
      actorId: access.currentUser.id,
      entityType: "project",
      entityId: access.project.id,
      action: "files_uploaded",
      payload: {
        count: createdFiles.length
      }
    });

    response.status(201).json(createdFiles);
  } catch (error) {
    await cleanupUploadedFiles(uploadedFiles);
    next(error);
  }
});

router.post("/requests", requestUploadMiddleware.array("files", 3), async (request, response, next) => {
  const uploadedFiles = ((request.files as Express.Multer.File[] | undefined) ?? []).slice(0, 3);

  try {
    const payload = createRequestSchema.parse(request.body);
    const currentUser = await loadCurrentUser(request);

    if (!currentUser) {
      await cleanupUploadedFiles(uploadedFiles);
      return response.status(401).json({ message: "Usuario no encontrado." });
    }

    if (uploadedFiles.length === 0) {
      return response.status(400).json({
        message: "Debes adjuntar al menos un archivo tecnico para crear la solicitud."
      });
    }

    const [project, machine, material] = await Promise.all([
      projectStore.findFirst({
        where: {
          id: payload.projectId,
          ownerId: currentUser.id
        }
      }),
      prisma.machine.findUnique({
        where: {
          id: payload.machineId
        }
      }),
      (prisma as any).material.findUnique({
        where: {
          id: payload.materialId
        }
      })
    ]);

    if (!project) {
      await cleanupUploadedFiles(uploadedFiles);
      return response.status(404).json({ message: "Proyecto asociado no encontrado." });
    }

    if (!machine) {
      await cleanupUploadedFiles(uploadedFiles);
      return response.status(404).json({ message: "Maquina sugerida no encontrada." });
    }

    if (!material) {
      await cleanupUploadedFiles(uploadedFiles);
      return response.status(404).json({ message: "Material deseado no encontrado." });
    }

    const normalizedFiles = normalizeUploadedFiles(uploadedFiles);
    const created = await (prisma as any).serviceRequest.create({
      data: {
        projectId: payload.projectId,
        title: payload.title,
        description: payload.description,
        notes: payload.notes?.trim() || null,
        quotationStatus: "NOT_REQUESTED",
        requestedDate: toRequestDate(payload.requestedDate),
        estimatedDurationMinutes: payload.estimatedDurationMinutes,
        estimatedCost: payload.estimatedCost,
        quantity: payload.quantity,
        materialUnitsRequested: payload.materialUnitsRequested,
        uploadedFileUrl: normalizedFiles[0]?.publicUrl ?? null,
        requesterId: currentUser.id,
        machineId: payload.machineId,
        materialId: payload.materialId,
        requestFiles: {
          create: normalizedFiles
        }
      },
      include: requestInclude
    });

    await appendRequestEvent({
      requestId: created.id,
      actorId: currentUser.id,
      type: "CREATED",
      summary: "Solicitud creada por usuario",
      detail: `Se registraron ${normalizedFiles.length} archivo(s) tecnicos para revision.`
    });

    const staffUsers = await prisma.user.findMany({
      where: {
        role: {
          in: ["STAFF", "ADMIN"]
        }
      }
    });

    await Promise.all(
      staffUsers.map((staffUser) =>
        createUserNotification({
          userId: staffUser.id,
          type: "SYSTEM",
          title: "Nueva solicitud pendiente de revision",
          body: `${currentUser.name} envio la solicitud "${created.title}" para revision inicial.`,
          linkUrl: `/staff/solicitudes/${created.id}`,
          metadata: {
            requestId: created.id
          }
        })
      )
    );

    await appendAuditLog({
      actorId: currentUser.id,
      entityType: "service_request",
      entityId: created.id,
      action: "created",
      payload: {
        projectId: created.projectId,
        machineId: created.machineId,
        materialId: created.materialId
      }
    });

    const createdDetail = await prisma.serviceRequest.findUniqueOrThrow({
      where: {
        id: created.id
      },
      include: requestDetailInclude
    });

    response.status(201).json(toRequestResponse(createdDetail));
  } catch (error) {
    await cleanupUploadedFiles(uploadedFiles);
    next(error);
  }
});

router.get("/staff/meta", staffRequired, async (_request, response) => {
  const staffUsers = await prisma.user.findMany({
    where: {
      role: {
        in: ["STAFF", "ADMIN"]
      }
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: publicUserSelect
  });

  response.json({
    staffUsers
  });
});

router.get("/staff/dashboard", staffRequired, async (_request, response) => {
  const [requests, materials, reservations, staffUsers] = await Promise.all([
    prisma.serviceRequest.findMany({
      include: staffRequestDetailInclude,
      orderBy: [{ createdAt: "desc" }]
    }),
    (prisma as any).material.findMany({
      orderBy: { name: "asc" }
    }),
    prisma.reservation.findMany({
      include: reservationInclude
    }),
    prisma.user.findMany({
      where: {
        role: {
          in: ["STAFF", "ADMIN"]
        }
      },
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: publicUserSelect
    })
  ]);

  const normalizedRequests = requests.map(toRequestResponse);
  const boardColumns = [
    { key: "PENDING_REVIEW", label: "Pendiente revision" },
    { key: "IN_QUOTATION", label: "Cotizando" },
    { key: "CHANGES_REQUESTED", label: "Esperando correccion" },
    { key: "READY_TO_SCHEDULE", label: "Listo para reservar" },
    { key: "IN_PRODUCTION", label: "En fabricacion" },
    { key: "DELIVERED", label: "Entregado" }
  ].map((column) => ({
    ...column,
    items: normalizedRequests.filter((item: any) => item.operationalStage === column.key)
  }));

  const requestsByStatus = Object.entries(
    normalizedRequests.reduce<Record<string, number>>((accumulator, item: any) => {
      accumulator[item.status] = (accumulator[item.status] ?? 0) + 1;
      return accumulator;
    }, {})
  ).map(([status, count]) => ({ status, count }));

  const machineUsageMap = reservations.reduce<Record<string, { machineName: string; count: number; blocks: number }>>((accumulator, item: any) => {
    const current = accumulator[item.machineId] ?? { machineName: item.machine.name, count: 0, blocks: 0 };
    current.count += 1;
    current.blocks += item.blockNumbers?.length ?? 0;
    accumulator[item.machineId] = current;
    return accumulator;
  }, {});

  const machineUsage = Object.values(machineUsageMap)
    .sort((left, right) => right.blocks - left.blocks)
    .slice(0, 5);

  const quotedRequests = normalizedRequests.filter((item: any) => item.quotation && ["READY", "ACCEPTED", "REJECTED"].includes(item.quotationStatus));
  const averageQuotationMinutes =
    quotedRequests.length > 0
      ? Math.round(
          quotedRequests.reduce((accumulator: number, item: any) => accumulator + (new Date(item.updatedAt).getTime() - new Date(item.createdAt).getTime()), 0) /
            quotedRequests.length /
            60000
        )
      : 0;
  const completedRequests = normalizedRequests.filter((item: any) => item.status === "COMPLETED");
  const averageCompletionMinutes =
    completedRequests.length > 0
      ? Math.round(
          completedRequests.reduce((accumulator: number, item: any) => accumulator + (new Date(item.updatedAt).getTime() - new Date(item.createdAt).getTime()), 0) /
            completedRequests.length /
            60000
        )
      : 0;

  response.json({
    metrics: {
      totalOpenRequests: normalizedRequests.filter((item: any) => !["COMPLETED", "REJECTED"].includes(item.status)).length,
      overdueRequests: normalizedRequests.filter((item: any) => item.slaStatus === "OVERDUE").length,
      unassignedRequests: normalizedRequests.filter((item: any) => !item.assignedStaffId && !["COMPLETED", "REJECTED"].includes(item.status)).length,
      pendingCorrections: normalizedRequests.filter((item: any) => item.status === "CHANGES_REQUESTED").length
    },
    boardColumns,
    requestsByStatus,
    machineUsage,
    averageTimes: {
      quotationMinutes: averageQuotationMinutes,
      completionMinutes: averageCompletionMinutes
    },
    criticalMaterials: materials.map(toMaterialResponse).filter((item: any) => item.lowStock),
    staffUsers
  });
});

router.get("/staff/board", staffRequired, async (_request, response) => {
  const requests = await prisma.serviceRequest.findMany({
    include: staffRequestDetailInclude,
    orderBy: [{ createdAt: "desc" }]
  });

  const normalizedRequests = requests.map(toRequestResponse);
  const columns = [
    { key: "PENDING_REVIEW", label: "Pendiente revision" },
    { key: "IN_QUOTATION", label: "Cotizando" },
    { key: "CHANGES_REQUESTED", label: "Esperando correccion" },
    { key: "READY_TO_SCHEDULE", label: "Listo para reservar" },
    { key: "IN_PRODUCTION", label: "En fabricacion" },
    { key: "DELIVERED", label: "Entregado" }
  ].map((column) => ({
    ...column,
    items: normalizedRequests.filter((item: any) => item.operationalStage === column.key)
  }));

  response.json({ columns });
});

router.get("/staff/requests", staffRequired, async (_request, response) => {
  const requests = await prisma.serviceRequest.findMany({
    include: staffRequestDetailInclude,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }]
  });

  response.json(requests.map(toRequestResponse));
});

router.get("/staff/requests/:requestId", staffRequired, async (request, response) => {
  const access = await ensureStaffRequestAccess(request, response, String(request.params.requestId));

  if (!access) {
    return;
  }

  response.json(toRequestResponse(access.serviceRequest));
});

router.put("/staff/requests/:requestId/ops", staffRequired, async (request, response) => {
  const access = await ensureStaffRequestAccess(request, response, String(request.params.requestId));

  if (!access) {
    return;
  }

  const payload = staffRequestOpsSchema.parse(request.body);
  let assignedStaffId = payload.assignedStaffId?.trim() || null;

  if (assignedStaffId) {
    const assignee = await prisma.user.findFirst({
      where: {
        id: assignedStaffId,
        role: {
          in: ["STAFF", "ADMIN"]
        }
      }
    });

    if (!assignee) {
      return response.status(404).json({ message: "El responsable interno seleccionado no existe." });
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const previousAssignedStaffId = access.serviceRequest.assignedStaffId ?? null;
    const previousCommitmentDate = access.serviceRequest.commitmentDate ? new Date(access.serviceRequest.commitmentDate).toISOString().slice(0, 10) : null;
    const nextCommitmentDate = payload.commitmentDate?.trim() ? new Date(`${payload.commitmentDate}T12:00:00.000Z`) : null;

    const next: any = await tx.serviceRequest.update({
      where: {
        id: access.serviceRequest.id
      },
      data: {
        assignedStaffId,
        commitmentDate: nextCommitmentDate,
        ...(payload.status ? { status: payload.status as any } : {})
      },
      include: staffRequestDetailInclude
    });

    if (previousAssignedStaffId !== assignedStaffId) {
      await (tx as any).requestEvent.create({
        data: {
          requestId: access.serviceRequest.id,
          actorId: access.currentUser.id,
          type: "ASSIGNED",
          summary: assignedStaffId ? "Solicitud asignada a responsable interno" : "Responsable interno removido",
          detail: assignedStaffId ? `Nuevo responsable interno: ${next.assignedStaff?.name ?? next.assignedStaff?.email ?? assignedStaffId}.` : null
        }
      });
    }

    if (previousCommitmentDate !== (payload.commitmentDate?.trim() || null)) {
      await (tx as any).requestEvent.create({
        data: {
          requestId: access.serviceRequest.id,
          actorId: access.currentUser.id,
          type: "DUE_DATE_CHANGED",
          summary: "Fecha compromiso actualizada",
          detail: nextCommitmentDate ? `Nueva fecha compromiso: ${payload.commitmentDate}.` : "Se elimino la fecha compromiso."
        }
      });
    }

    if (payload.status && payload.status !== access.serviceRequest.status) {
      await (tx as any).requestEvent.create({
        data: {
          requestId: access.serviceRequest.id,
          actorId: access.currentUser.id,
          type: "STATUS_CHANGED",
          summary: "Estado operativo actualizado",
          detail: `Nuevo estado: ${payload.status}.`
        }
      });
    }

    return next;
  });

  await appendAuditLog({
    actorId: access.currentUser.id,
    entityType: "service_request",
    entityId: access.serviceRequest.id,
    action: "staff_ops_updated",
    payload: {
      assignedStaffId,
      commitmentDate: payload.commitmentDate?.trim() || null,
      status: payload.status ?? null
    }
  });

  if (assignedStaffId && assignedStaffId !== access.currentUser.id && assignedStaffId !== access.serviceRequest.assignedStaffId) {
    await createUserNotification({
      userId: assignedStaffId,
      type: "SYSTEM",
      title: "Nueva solicitud asignada",
      body: `Se te asigno la solicitud "${access.serviceRequest.title}" para seguimiento interno.`,
      linkUrl: `/staff/solicitudes/${access.serviceRequest.id}`,
      metadata: {
        requestId: access.serviceRequest.id
      }
    });
  }

  if (payload.status && payload.status !== access.serviceRequest.status && access.serviceRequest.requesterId) {
    await createUserNotification({
      userId: access.serviceRequest.requesterId,
      type: "REQUEST_STATUS_CHANGED",
      title: "Actualizacion operativa de tu solicitud",
      body: `Tu solicitud "${access.serviceRequest.title}" cambio a estado ${payload.status}.`,
      linkUrl: `/mis-solicitudes/${access.serviceRequest.id}`,
      metadata: {
        requestId: access.serviceRequest.id,
        status: payload.status
      },
      email: (access.serviceRequest.requester as any)?.email ?? null
    });
  }

  response.json(toRequestResponse(updated));
});

router.post("/requests/:requestId/assign", staffRequired, async (request, response) => {
  const access = await ensureStaffRequestAccess(request, response, String(request.params.requestId));
  if (!access) {
    return;
  }
  const payload = z.object({ assignedStaffId: z.string().min(1).optional().nullable() }).parse(request.body);
  const updated = await prisma.serviceRequest.update({
    where: { id: access.serviceRequest.id },
    data: {
      assignedStaffId: payload.assignedStaffId ?? null
    },
    include: staffRequestDetailInclude
  });
  response.json(toRequestResponse(updated));
});

router.post("/requests/:requestId/status", staffRequired, async (request, response) => {
  const access = await ensureStaffRequestAccess(request, response, String(request.params.requestId));
  if (!access) {
    return;
  }
  const payload = z.object({
    status: z.enum(["PENDING_REVIEW", "CHANGES_REQUESTED", "IN_QUOTATION", "QUOTED", "APPROVED", "IN_PROGRESS", "READY_FOR_PICKUP", "COMPLETED", "REJECTED"])
  }).parse(request.body);
  const updated = await prisma.serviceRequest.update({
    where: { id: access.serviceRequest.id },
    data: {
      status: payload.status as any
    },
    include: staffRequestDetailInclude
  });
  response.json(toRequestResponse(updated));
});

router.post("/staff/requests/:requestId/comments", staffRequired, async (request, response) => {
  const access = await ensureStaffRequestAccess(request, response, String(request.params.requestId));

  if (!access) {
    return;
  }

  const payload = requestCommentSchema.parse(request.body);
  const createdComment = await (prisma as any).requestComment.create({
    data: {
      requestId: access.serviceRequest.id,
      authorId: access.currentUser.id,
      body: payload.body.trim(),
      visibility: payload.visibility
    },
    include: requestCommentPublicInclude
  });

  await appendRequestEvent({
    requestId: access.serviceRequest.id,
    actorId: access.currentUser.id,
    type: "COMMENT_ADDED",
    summary: payload.visibility === "INTERNAL" ? "Comentario interno agregado" : "Comentario visible para usuario agregado",
    detail: payload.visibility === "INTERNAL" ? "Registro interno agregado por staff." : "Nuevo comentario disponible para el usuario."
  });

  response.status(201).json(createdComment);
});

router.post("/staff/requests/:requestId/actions", staffRequired, async (request, response) => {
  const access = await ensureStaffRequestAccess(request, response, String(request.params.requestId));

  if (!access) {
    return;
  }

  const payload = staffRequestActionSchema.parse(request.body);
  const nextState = mapActionToState(payload.action);

  await prisma.$transaction(async (tx) => {
    await tx.serviceRequest.update({
      where: {
        id: access.serviceRequest.id
      },
      data: {
        status: nextState.status as any,
        quotationStatus: nextState.quotationStatus
      }
    });

    if (payload.reason?.trim()) {
      await (tx as any).requestComment.create({
        data: {
          requestId: access.serviceRequest.id,
          authorId: access.currentUser.id,
          body: payload.reason.trim(),
          visibility:
            payload.visibility ??
            (payload.action === "REQUEST_CORRECTION" || payload.action === "REJECT" ? "PUBLIC" : "INTERNAL")
        }
      });
    }

    await (tx as any).requestEvent.create({
      data: {
        requestId: access.serviceRequest.id,
        actorId: access.currentUser.id,
        type: nextState.eventType,
        summary: nextState.eventSummary,
        detail: null
      }
    });

    await (tx as any).requestEvent.create({
      data: {
        requestId: access.serviceRequest.id,
        actorId: access.currentUser.id,
        type: "STATUS_CHANGED",
        summary: "Estado de solicitud actualizado",
        detail: `Nuevo estado: ${nextState.status}. Estado de cotizacion: ${nextState.quotationStatus}.`
      }
    });

    await syncRequestInventoryReservation(tx, {
      requestId: access.serviceRequest.id,
      actorId: access.currentUser.id,
      reason: `Sincronizacion automatica por accion ${payload.action}.`
    });
  });

  if (access.serviceRequest.requesterId) {
    const notificationType =
      payload.action === "REQUEST_CORRECTION"
        ? "CORRECTION_REQUIRED"
        : payload.action === "SEND_TO_QUOTATION"
          ? "REQUEST_STATUS_CHANGED"
          : "REQUEST_STATUS_CHANGED";

    await createUserNotification({
      userId: access.serviceRequest.requesterId,
      type: notificationType,
      title:
        payload.action === "REQUEST_CORRECTION"
          ? "Tu solicitud requiere correcciones"
          : `Actualizacion de solicitud: ${access.serviceRequest.title}`,
      body:
        payload.action === "REQUEST_CORRECTION"
          ? "El equipo FabLab solicito correcciones antes de continuar con tu solicitud."
          : `El equipo FabLab actualizo el estado de tu solicitud a ${mapActionToState(payload.action).status}.`,
      linkUrl: `/mis-solicitudes/${access.serviceRequest.id}`,
      metadata: {
        requestId: access.serviceRequest.id,
        action: payload.action
      },
      email: (access.serviceRequest.requester as any)?.email ?? null
    });
  }

  await appendAuditLog({
    actorId: access.currentUser.id,
    entityType: "service_request",
    entityId: access.serviceRequest.id,
    action: `staff_action_${payload.action.toLowerCase()}`,
    payload: {
      reason: payload.reason?.trim() || null
    }
  });

  const updated = await prisma.serviceRequest.findUniqueOrThrow({
    where: {
      id: access.serviceRequest.id
    },
    include: staffRequestDetailInclude
  });

  response.json(toRequestResponse(updated));
});

router.put("/staff/requests/:requestId/quotation", staffRequired, async (request, response) => {
  const access = await ensureStaffRequestAccess(request, response, String(request.params.requestId));

  if (!access) {
    return;
  }

  const payload = quotationSchema.parse(request.body);
  const totalCost = calculateQuotationTotal(payload);

  const updated = await prisma.$transaction(async (tx) => {
    await (tx as any).quotation.upsert({
      where: {
        requestId: access.serviceRequest.id
      },
      update: {
        setupCost: payload.setupCost,
        machineCost: payload.machineCost,
        materialCost: payload.materialCost,
        totalCost,
        quantity: payload.quantity,
        estimatedMinutes: payload.estimatedMinutes,
        notes: payload.notes?.trim() || null,
        preparedById: access.currentUser.id
      },
      create: {
        requestId: access.serviceRequest.id,
        setupCost: payload.setupCost,
        machineCost: payload.machineCost,
        materialCost: payload.materialCost,
        totalCost,
        quantity: payload.quantity,
        estimatedMinutes: payload.estimatedMinutes,
        notes: payload.notes?.trim() || null,
        preparedById: access.currentUser.id
      }
    });

    await tx.serviceRequest.update({
      where: {
        id: access.serviceRequest.id
      },
      data: {
        status: "QUOTED" as any,
        quotationStatus: "READY"
      }
    });

    await (tx as any).requestEvent.create({
      data: {
        requestId: access.serviceRequest.id,
        actorId: access.currentUser.id,
        type: "STATUS_CHANGED",
        summary: "Cotizacion registrada por staff",
        detail: `Total cotizado: ${totalCost}. Tiempo estimado: ${payload.estimatedMinutes} min.`
      }
    });
  });

  if (access.serviceRequest.requesterId) {
    await createUserNotification({
      userId: access.serviceRequest.requesterId,
      type: "QUOTATION_READY",
      title: "Cotizacion disponible en FabLab",
      body: `La cotizacion de "${access.serviceRequest.title}" ya esta lista para tu revision.`,
      linkUrl: `/mis-solicitudes/${access.serviceRequest.id}`,
      metadata: {
        requestId: access.serviceRequest.id,
        totalCost
      },
      email: (access.serviceRequest.requester as any)?.email ?? null
    });
  }

  await appendAuditLog({
    actorId: access.currentUser.id,
    entityType: "quotation",
    entityId: access.serviceRequest.id,
    action: "upserted",
    payload: {
      totalCost,
      estimatedMinutes: payload.estimatedMinutes
    }
  });

  const requestDetail = await prisma.serviceRequest.findUniqueOrThrow({
    where: {
      id: access.serviceRequest.id
    },
    include: staffRequestDetailInclude
  });

  response.json(toRequestResponse(requestDetail));
});

router.post("/requests/:requestId/quotation", staffRequired, async (request, response, next) => {
  try {
    const access = await ensureStaffRequestAccess(request, response, String(request.params.requestId));
    if (!access) {
      return;
    }

    const payload = quotationSchema.parse(request.body);
    const totalCost = calculateQuotationTotal(payload);

    await prisma.$transaction(async (tx) => {
      await (tx as any).quotation.upsert({
        where: {
          requestId: access.serviceRequest.id
        },
        update: {
          status: "READY",
          setupCost: payload.setupCost,
          machineCost: payload.machineCost,
          materialCost: payload.materialCost,
          extraCost: 0,
          totalCost,
          quantity: payload.quantity,
          estimatedMinutes: payload.estimatedMinutes,
          notes: payload.notes?.trim() || null,
          validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
          createdById: access.currentUser.id,
          preparedById: access.currentUser.id
        },
        create: {
          requestId: access.serviceRequest.id,
          status: "READY",
          setupCost: payload.setupCost,
          machineCost: payload.machineCost,
          materialCost: payload.materialCost,
          extraCost: 0,
          totalCost,
          quantity: payload.quantity,
          estimatedMinutes: payload.estimatedMinutes,
          notes: payload.notes?.trim() || null,
          validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
          createdById: access.currentUser.id,
          preparedById: access.currentUser.id
        }
      });

      await tx.serviceRequest.update({
        where: {
          id: access.serviceRequest.id
        },
        data: {
          status: "QUOTED" as any,
          quotationStatus: "READY"
        }
      });

      await (tx as any).requestEvent.create({
        data: {
          requestId: access.serviceRequest.id,
          actorId: access.currentUser.id,
          type: "STATUS_CHANGED",
          summary: "Cotizacion registrada por staff",
          detail: `Total cotizado: ${totalCost}. Tiempo estimado: ${payload.estimatedMinutes} min.`
        }
      });
    });

    if (access.serviceRequest.requesterId) {
      await createUserNotification({
        userId: access.serviceRequest.requesterId,
        type: "QUOTATION_READY",
        title: "Cotizacion disponible en FabLab",
        body: `La cotizacion de "${access.serviceRequest.title}" ya esta lista para tu revision.`,
        linkUrl: `/mis-solicitudes/${access.serviceRequest.id}`,
        metadata: {
          requestId: access.serviceRequest.id,
          totalCost
        },
        email: (access.serviceRequest.requester as any)?.email ?? null
      });
    }

    await appendAuditLog({
      actorId: access.currentUser.id,
      entityType: "quotation",
      entityId: access.serviceRequest.id,
      action: "upserted",
      payload: {
        totalCost,
        estimatedMinutes: payload.estimatedMinutes
      }
    });

    const requestDetail = await prisma.serviceRequest.findUniqueOrThrow({
      where: { id: access.serviceRequest.id },
      include: staffRequestDetailInclude
    });
    response.json(toRequestResponse(requestDetail));
  } catch (error) {
    next(error);
  }
});

router.get("/requests/:requestId/quotation", async (request, response) => {
  const owned = await ensureRequestOwner(request, response, request.params.requestId);

  if (!owned) {
    return;
  }

  if (!owned.serviceRequest.quotation) {
    return response.status(404).json({ message: "La solicitud no tiene cotizacion registrada." });
  }

  response.json(toRequestResponse(owned.serviceRequest).quotation);
});

router.post("/requests/:requestId/quotation-decision", async (request, response) => {
  const owned = await ensureRequestOwner(request, response, request.params.requestId);

  if (!owned) {
    return;
  }

  const payload = quotationDecisionSchema.parse(request.body);

  if (!owned.serviceRequest.quotation) {
    return response.status(409).json({ message: "La solicitud no tiene una cotizacion lista para decidir." });
  }

  if (owned.serviceRequest.quotationStatus !== "READY") {
    return response.status(409).json({ message: "La cotizacion ya fue procesada o aun no esta disponible." });
  }

  const updated = await applyQuotationDecisionForOwner(owned, payload);

  response.json(toRequestResponse(updated));
});

router.post("/quotations/:quotationId/accept", async (request, response) => {
  const quotation = await (prisma as any).quotation.findUnique({
    where: {
      id: request.params.quotationId
    }
  });

  if (!quotation) {
    return response.status(404).json({ message: "Cotizacion no encontrada." });
  }

  const owned = await ensureRequestOwner(request, response, quotation.requestId);
  if (!owned) {
    return;
  }
  if (owned.serviceRequest.quotationStatus !== "READY") {
    return response.status(409).json({ message: "La cotizacion ya fue procesada o aun no esta disponible." });
  }
  const updated = await applyQuotationDecisionForOwner(owned, { decision: "ACCEPT", reason: "" });
  response.json(toRequestResponse(updated));
});

router.post("/quotations/:quotationId/reject", async (request, response) => {
  const quotation = await (prisma as any).quotation.findUnique({
    where: {
      id: request.params.quotationId
    }
  });

  if (!quotation) {
    return response.status(404).json({ message: "Cotizacion no encontrada." });
  }

  const owned = await ensureRequestOwner(request, response, quotation.requestId);
  if (!owned) {
    return;
  }
  if (owned.serviceRequest.quotationStatus !== "READY") {
    return response.status(409).json({ message: "La cotizacion ya fue procesada o aun no esta disponible." });
  }
  const updated = await applyQuotationDecisionForOwner(owned, { decision: "REJECT", reason: "" });
  response.json(toRequestResponse(updated));
});

router.get("/reservations", async (request, response) => {
  const currentUser = await loadCurrentUser(request);

  if (!currentUser) {
    return response.status(401).json({ message: "Usuario no encontrado." });
  }

  const reservations = await prisma.reservation.findMany({
    where: {
      userId: currentUser.id
    },
    include: reservationInclude,
    orderBy: { createdAt: "desc" }
  });

  response.json(reservations.map(toReservationResponse));
});

router.get("/reservations/availability", async (request, response) => {
  const parsed = reservationAvailabilitySchema.safeParse(request.query);
  if (!parsed.success) {
    return response.status(400).json({ message: "Consulta de disponibilidad invalida.", issues: parsed.error.flatten() });
  }

  const payload = parsed.data;
  const schedule = await buildReservationScheduleData({
    machineId: payload.machineId,
    weekStart: payload.date
  });
  const day = schedule.days.find((item) => item.date === payload.date);

  response.json({
    machineId: payload.machineId,
    date: payload.date,
    reservedBlockNumbers: day?.reservedBlockNumbers ?? [],
    maintenanceBlockNumbers: day?.maintenanceBlockNumbers ?? [],
    blockedBlockNumbers: day?.blockedBlockNumbers ?? [],
    reservations: day?.reservations ?? [],
    maintenanceWindows: day?.maintenanceWindows ?? [],
    rules: schedule.machine.rules
  });
});

router.get("/reservations/schedule", async (request, response) => {
  const parsed = reservationScheduleSchema.safeParse(request.query);
  if (!parsed.success) {
    return response.status(400).json({ message: "Consulta de agenda invalida.", issues: parsed.error.flatten() });
  }

  const payload = parsed.data;
  const schedule = await buildReservationScheduleData({
    machineId: payload.machineId,
    weekStart: payload.weekStart,
    requestId: payload.requestId,
    excludeReservationId: payload.excludeReservationId
  });

  response.json(schedule);
});

router.get("/machines/:machineId/schedule", async (request, response) => {
  const weekStart = typeof request.query.weekStart === "string" ? request.query.weekStart : getLocalDateString(new Date());
  const requestId = typeof request.query.requestId === "string" ? request.query.requestId : undefined;
  const excludeReservationId = typeof request.query.excludeReservationId === "string" ? request.query.excludeReservationId : undefined;
  const parsed = reservationScheduleSchema.safeParse({
    machineId: request.params.machineId,
    weekStart,
    requestId,
    excludeReservationId
  });

  if (!parsed.success) {
    return response.status(400).json({ message: "Parametros de agenda invalidos.", issues: parsed.error.flatten() });
  }

  try {
    const schedule = await buildReservationScheduleData(parsed.data);
    response.json(schedule);
  } catch (error) {
    if (error instanceof Error && error.message === "Maquina no encontrada.") {
      return response.status(404).json({ message: error.message });
    }

    throw error;
  }
});

router.get("/reservations/:reservationId", async (request, response) => {
  const owned = await ensureReservationOwner(request, response, request.params.reservationId);

  if (!owned) {
    return;
  }

  response.json(toReservationResponse(owned.reservation));
});

router.post("/reservations/:reservationId/cancel", async (request, response) => {
  const owned = await ensureReservationOwner(request, response, request.params.reservationId);

  if (!owned) {
    return;
  }

  const updated = await prisma.reservation.update({
    where: { id: owned.reservation.id },
    data: {
      status: "CANCELLED"
    },
    include: reservationInclude
  });

  await (prisma as any).reservationEvent.create({
    data: {
      reservationId: updated.id,
      actorId: owned.currentUser.id,
      type: "CANCELLED",
      payloadJson: JSON.stringify({ fromStatus: owned.reservation.status })
    }
  });

  await appendAuditLog({
    actorId: owned.currentUser.id,
    entityType: "reservation",
    entityId: updated.id,
    action: "cancelled"
  });

  response.json(toReservationResponse(updated));
});

router.post("/reservations", async (request, response) => {
  const parsed = reservationMutationSchema.safeParse(request.body);
  if (!parsed.success) {
    return response.status(400).json({ message: "Datos de reserva invalidos.", issues: parsed.error.flatten() });
  }

  const payload = parsed.data;
  const currentUser = await loadCurrentUser(request);

  if (!currentUser) {
    return response.status(401).json({ message: "Usuario no encontrado." });
  }

  const validation = await validateReservationMutation({
    payload,
    currentUserId: currentUser.id
  }).catch((error: Error) => {
    return response.status(409).json({ message: error.message });
  });

  if (!validation || "status" in validation) {
    return;
  }

  const project = validation.eligibility.resolvedProjectId
    ? await projectStore.findFirst({
        where: {
          id: validation.eligibility.resolvedProjectId,
          ownerId: currentUser.id
        }
      })
    : null;

  if (validation.eligibility.resolvedProjectId && !project) {
    return response.status(404).json({ message: "Proyecto asociado no encontrado." });
  }

  const created = await prisma.reservation.create({
    data: {
      title: payload.title?.trim() || project?.name || "Reserva FabLab",
      startAt: new Date(payload.startAt),
      endAt: new Date(payload.endAt),
      status: payload.status ?? "PENDING",
      notes: payload.notes?.trim() || null,
      description: payload.description?.trim() || null,
      blockNumbers: validation.normalizedBlocks,
      userId: currentUser.id,
      machineId: payload.machineId,
      projectId: validation.eligibility.resolvedProjectId || null,
      requestId: payload.requestId
    },
    include: reservationInclude
  });

  await appendAuditLog({
    actorId: currentUser.id,
    entityType: "reservation",
    entityId: created.id,
    action: "created",
    payload: {
      requestId: payload.requestId,
      machineId: payload.machineId,
      blockNumbers: validation.normalizedBlocks
    }
  });

  return response.status(201).json(toReservationResponse(created));
});

router.put("/reservations/:reservationId", async (request, response) => {
  const owned = await ensureReservationOwner(request, response, request.params.reservationId);

  if (!owned) {
    return;
  }

  const parsed = reservationMutationSchema.safeParse(request.body);
  if (!parsed.success) {
    return response.status(400).json({ message: "Datos de reserva invalidos.", issues: parsed.error.flatten() });
  }

  const payload = parsed.data;
  const { currentUser, reservation } = owned;

  if (isReservationLocked(reservation.startAt, reservation.status)) {
    return response.status(409).json({
      message: "Esta reserva ya paso su fecha y no puede ser modificada."
    });
  }

  const effectiveRequestId = payload.requestId || (reservation as any).request?.id || "";
  const validation = await validateReservationMutation({
    payload: {
      ...payload,
      requestId: effectiveRequestId,
      projectId: payload.projectId || (reservation as any).project?.id || null
    },
    currentUserId: currentUser.id,
    excludeReservationId: reservation.id
  }).catch((error: Error) => {
    return response.status(409).json({ message: error.message });
  });

  if (!validation || "status" in validation) {
    return;
  }

  const project = validation.eligibility.resolvedProjectId
    ? await projectStore.findFirst({
        where: {
          id: validation.eligibility.resolvedProjectId,
          ownerId: currentUser.id
        }
      })
    : null;

  if (validation.eligibility.resolvedProjectId && !project) {
    return response.status(404).json({ message: "Proyecto asociado no encontrado." });
  }

  const updated = await prisma.reservation.update({
    where: { id: reservation.id },
    data: {
      title: payload.title?.trim() || project?.name || reservation.title,
      startAt: new Date(payload.startAt),
      endAt: new Date(payload.endAt),
      status: payload.status ?? reservation.status,
      notes: payload.notes?.trim() || null,
      description: payload.description?.trim() || null,
      blockNumbers: validation.normalizedBlocks,
      machineId: payload.machineId,
      projectId: validation.eligibility.resolvedProjectId || null,
      requestId: effectiveRequestId
    },
    include: reservationInclude
  });

  await appendAuditLog({
    actorId: currentUser.id,
    entityType: "reservation",
    entityId: updated.id,
    action: "updated",
    payload: {
      requestId: effectiveRequestId,
      machineId: payload.machineId,
      blockNumbers: validation.normalizedBlocks
    }
  });

  response.json(toReservationResponse(updated));
});

router.use("/admin", adminRequired);

router.post("/materials", staffRequired, async (request, response) => {
  const payload = materialSchema.parse(request.body);
  const currentUser = await loadCurrentUser(request);

  const created = await (prisma as any).material.create({
    data: {
      ...payload,
      reservedQuantity: 0
    }
  });

  await appendAuditLog({
    actorId: currentUser?.id ?? null,
    entityType: "material",
    entityId: created.id,
    action: "created"
  });

  response.status(201).json(toMaterialResponse(created));
});

router.put("/materials/:materialId", staffRequired, async (request, response) => {
  const payload = materialSchema.parse(request.body);
  const updated = await (prisma as any).material.update({
    where: {
      id: request.params.materialId
    },
    data: payload
  });

  response.json(toMaterialResponse(updated));
});

router.post("/materials/:materialId/movements", staffRequired, async (request, response) => {
  const payload = materialMovementSchema.parse(request.body);
  const currentUser = await loadCurrentUser(request);
  const material = await (prisma as any).material.findUnique({
    where: {
      id: request.params.materialId
    }
  });

  if (!material) {
    return response.status(404).json({ message: "Material no encontrado." });
  }

  const stockQuantity = toNumber(material.stockQuantity);
  const reservedQuantity = toNumber(material.reservedQuantity);
  let nextStockQuantity = stockQuantity;

  if (payload.type === "ADJUSTMENT") {
    nextStockQuantity = Number(payload.targetStockQuantity ?? stockQuantity);
  } else if (payload.type === "IN") {
    nextStockQuantity += Number(payload.quantity ?? 0);
  } else {
    nextStockQuantity -= Number(payload.quantity ?? 0);
  }

  if (nextStockQuantity < 0) {
    return response.status(409).json({ message: "El movimiento deja el stock total por debajo de cero." });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const nextMaterial = await (tx as any).material.update({
      where: {
        id: material.id
      },
      data: {
        stockQuantity: nextStockQuantity
      }
    });

    await registerMaterialMovement(tx, {
      materialId: material.id,
      actorId: currentUser?.id ?? null,
      type: payload.type,
      quantity: payload.type === "ADJUSTMENT" ? nextStockQuantity - stockQuantity : Number(payload.quantity ?? 0),
      reason: payload.reason,
      resultingStockQuantity: nextStockQuantity,
      resultingReservedQuantity: reservedQuantity
    });

    return nextMaterial;
  });

  response.json(toMaterialResponse(updated));
});

router.get("/admin/materials", async (_request, response) => {
  const materials = await (prisma as any).material.findMany({
    include: {
      movements: {
        include: materialMovementInclude,
        orderBy: {
          createdAt: "desc"
        },
        take: 20
      }
    },
    orderBy: {
      name: "asc"
    }
  });

  response.json(
    materials.map((material: any) => ({
      ...toMaterialResponse(material),
      movements: material.movements.map((movement: any) => ({
        ...movement,
        quantity: toNumber(movement.quantity),
        resultingStockQuantity: toNumber(movement.resultingStockQuantity),
        resultingReservedQuantity: toNumber(movement.resultingReservedQuantity)
      }))
    }))
  );
});

router.post("/admin/materials", async (request, response) => {
  const payload = materialSchema.parse(request.body);
  const currentUser = await loadCurrentUser(request);

  const created = await (prisma as any).material.create({
    data: {
      ...payload,
      reservedQuantity: 0
    }
  });

  await registerMaterialMovement(prisma, {
    materialId: created.id,
    actorId: currentUser?.id ?? null,
    type: "ADJUSTMENT",
    quantity: payload.stockQuantity,
    reason: "Creacion inicial de material en catalogo.",
    resultingStockQuantity: payload.stockQuantity,
    resultingReservedQuantity: 0
  });

  response.status(201).json(toMaterialResponse(created));
});

router.put("/admin/materials/:materialId", async (request, response) => {
  const payload = materialSchema.parse(request.body);
  const currentUser = await loadCurrentUser(request);

  const updated = await prisma.$transaction(async (tx) => {
    const material = await (tx as any).material.findUnique({
      where: {
        id: request.params.materialId
      }
    });

    if (!material) {
      throw new Error("Material no encontrado.");
    }

    if (payload.stockQuantity < toNumber(material.reservedQuantity)) {
      throw new Error("El stock total no puede quedar por debajo de la cantidad ya reservada.");
    }

    const result = await (tx as any).material.update({
      where: {
        id: request.params.materialId
      },
      data: payload
    });

    if (payload.stockQuantity !== toNumber(material.stockQuantity)) {
      await registerMaterialMovement(tx, {
        materialId: material.id,
        actorId: currentUser?.id ?? null,
        type: "ADJUSTMENT",
        quantity: Math.abs(payload.stockQuantity - toNumber(material.stockQuantity)),
        reason: "Ajuste de stock desde la ficha del material.",
        resultingStockQuantity: toNumber(result.stockQuantity),
        resultingReservedQuantity: toNumber(result.reservedQuantity)
      });
    }

    return result;
  });

  response.json(toMaterialResponse(updated));
});

router.post("/admin/materials/:materialId/movements", async (request, response) => {
  const payload = materialMovementSchema.parse(request.body);
  const currentUser = await loadCurrentUser(request);

  const updatedMaterial = await prisma.$transaction(async (tx) => {
    const material = await (tx as any).material.findUnique({
      where: {
        id: request.params.materialId
      }
    });

    if (!material) {
      throw new Error("Material no encontrado.");
    }

    const currentStock = toNumber(material.stockQuantity);
    const currentReserved = toNumber(material.reservedQuantity);
    let nextStock = currentStock;

    if (payload.type === "IN") {
      nextStock = currentStock + Number(payload.quantity);
    }

    if (payload.type === "OUT") {
      nextStock = currentStock - Number(payload.quantity);
      if (nextStock < currentReserved) {
        throw new Error("No puedes descontar stock por debajo de la cantidad ya reservada.");
      }
    }

    if (payload.type === "ADJUSTMENT") {
      nextStock = Number(payload.targetStockQuantity);
      if (nextStock < currentReserved) {
        throw new Error("El stock objetivo no puede quedar bajo la cantidad reservada.");
      }
    }

    const updated = await (tx as any).material.update({
      where: {
        id: material.id
      },
      data: {
        stockQuantity: nextStock
      }
    });

    await registerMaterialMovement(tx, {
      materialId: material.id,
      actorId: currentUser?.id ?? null,
      type: payload.type,
      quantity: payload.type === "ADJUSTMENT" ? Math.abs(nextStock - currentStock) : Number(payload.quantity),
      reason: payload.reason,
      resultingStockQuantity: toNumber(updated.stockQuantity),
      resultingReservedQuantity: toNumber(updated.reservedQuantity)
    });

    return updated;
  });

  response.json(toMaterialResponse(updatedMaterial));
});

router.get("/admin/machine-types", async (_request, response) => {
  const machineTypes = await prisma.machineType.findMany({
    include: machineTypeInclude,
    orderBy: { createdAt: "asc" }
  });

  response.json(machineTypes);
});

router.get("/admin/machines", async (_request, response) => {
  const machines = await prisma.machine.findMany({
    include: {
      machineType: true
    },
    orderBy: [{ name: "asc" }]
  });

  response.json(
    machines.map((machine) => ({
      ...machine,
      hourlyRate: toNumber(machine.hourlyRate)
    }))
  );
});

router.post("/admin/machine-types", async (request, response) => {
  const payload = machineTypeSchema.parse(request.body);

  const created = await prisma.machineType.create({
    data: payload
  });

  response.status(201).json(created);
});

router.put("/admin/machine-types/:machineTypeId", async (request, response) => {
  const payload = machineTypeSchema.parse(request.body);

  const updated = await prisma.machineType.update({
    where: {
      id: request.params.machineTypeId
    },
    data: payload
  });

  response.json(updated);
});

router.post("/admin/machines", async (request, response) => {
  const payload = machineSchema.parse(request.body);
  const created = await prisma.machine.create({
    data: {
      name: payload.name,
      slug: payload.slug,
      description: payload.description,
      category: payload.category as any,
      status: payload.status as any,
      hourlyRate: payload.hourlyRate,
      setupMinutes: payload.setupMinutes,
      maxDurationMinutes: payload.maxDurationMinutes,
      supportedFormats: payload.supportedFormats,
      location: payload.location?.trim() || null,
      minBlocks: payload.minBlocks ?? null,
      maxBlocks: payload.maxBlocks ?? null,
      machineTypeId: payload.machineTypeId?.trim() || null
    },
    include: {
      machineType: true
    }
  });

  response.status(201).json({
    ...created,
    hourlyRate: toNumber(created.hourlyRate)
  });
});

router.put("/admin/machines/:machineId", async (request, response) => {
  const payload = machineSchema.parse(request.body);
  const updated = await prisma.machine.update({
    where: {
      id: request.params.machineId
    },
    data: {
      name: payload.name,
      slug: payload.slug,
      description: payload.description,
      category: payload.category as any,
      status: payload.status as any,
      hourlyRate: payload.hourlyRate,
      setupMinutes: payload.setupMinutes,
      maxDurationMinutes: payload.maxDurationMinutes,
      supportedFormats: payload.supportedFormats,
      location: payload.location?.trim() || null,
      minBlocks: payload.minBlocks ?? null,
      maxBlocks: payload.maxBlocks ?? null,
      machineTypeId: payload.machineTypeId?.trim() || null
    },
    include: {
      machineType: true
    }
  });

  response.json({
    ...updated,
    hourlyRate: toNumber(updated.hourlyRate)
  });
});
