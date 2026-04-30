const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

let authToken: string | null = null;

export type AuthUser = {
  id: string;
  email: string;
  role: "USER" | "STAFF" | "ADMIN";
  name: string;
  profileCompleted: boolean;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  maternalLastName?: string | null;
  documentType?: "RUT" | "PASSPORT" | "DNI" | "OTHER" | null;
  documentNumber?: string | null;
  career?: string | null;
  entryYear?: number | null;
  birthDate?: string | null;
  sex?: "FEMALE" | "MALE" | "NON_BINARY" | "PREFER_NOT_TO_SAY" | null;
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};

export type ProfilePayload = {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  maternalLastName?: string | null;
  documentType: "RUT" | "PASSPORT" | "DNI" | "OTHER";
  documentNumber: string;
  career: string;
  entryYear: number;
  birthDate: string;
  sex: "FEMALE" | "MALE" | "NON_BINARY" | "PREFER_NOT_TO_SAY";
};

export type ForgotPasswordResponse = {
  message: string;
  debugResetToken?: string;
};

export type NotificationItem = {
  id: string;
  type: "REQUEST_STATUS_CHANGED" | "QUOTATION_READY" | "RESERVATION_UPCOMING" | "CORRECTION_REQUIRED" | "PASSWORD_RESET" | "SYSTEM";
  title: string;
  body: string;
  linkUrl?: string | null;
  metadata?: Record<string, unknown> | null;
  emailSentAt?: string | null;
  readAt?: string | null;
  createdAt: string;
};

export type NotificationsResponse = {
  unreadCount: number;
  items: NotificationItem[];
};

export type Project = {
  id: string;
  name: string;
  description: string;
  repositoryUrl?: string | null;
  courseName?: string | null;
  professorName?: string | null;
  academicPeriod?: string | null;
  status: "CREATED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  projectType: "PRINT_3D" | "LASER_CUT" | "CNC" | "ELECTRONICS" | "PROTOTYPE" | "OTHER";
  scope: "INDIVIDUAL" | "GROUP";
  attachmentNames: string[];
  createdAt: string;
  updatedAt: string;
  finishedAt?: string | null;
  ownerId: string;
};

export type ProjectMember = {
  id: string;
  projectId: string;
  name: string;
  email: string;
  roleInProject?: string | null;
  isOwner: boolean;
  createdAt: string;
};

export type ProjectFile = {
  id: string;
  projectId: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  extension: string;
  sizeBytes: number;
  versionLabel?: string | null;
  uploadedById?: string | null;
  createdAt: string;
};

export type CreateProjectPayload = {
  name: string;
  description: string;
  repositoryUrl?: string;
  courseName?: string;
  professorName?: string;
  academicPeriod?: string;
  projectType: Project["projectType"];
  scope: Project["scope"];
  attachmentNames: string[];
};

export type ProjectDetail = Project & {
  members?: ProjectMember[];
  files?: ProjectFile[];
  requests: ServiceRequest[];
  reservations: Reservation[];
};

export type ProjectMemberPayload = {
  name: string;
  email: string;
  roleInProject?: string;
  isOwner?: boolean;
};

export type OverviewResponse = {
  metrics: {
    totalMachines: number;
    availableMachines: number;
    lowStockMaterials: number;
    openRequests: number;
    upcomingReservations: number;
  };
  lowStockMaterials: Material[];
  upcomingReservations: Reservation[];
  recentRequests: ServiceRequest[];
};

export type Machine = {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  status: string;
  hourlyRate: string;
  setupMinutes: number;
  maxDurationMinutes: number;
  supportedFormats: string[];
  machineTypeId?: string | null;
  machineType?: MachineType | null;
  location?: string | null;
  minBlocks?: number | null;
  maxBlocks?: number | null;
};

export type AdminMachinePayload = {
  name: string;
  slug: string;
  description: string;
  category: "PRINT_3D" | "LASER" | "CNC" | "ELECTRONICS" | "VINYL";
  status: "AVAILABLE" | "MAINTENANCE" | "OFFLINE";
  hourlyRate: number;
  setupMinutes: number;
  maxDurationMinutes: number;
  supportedFormats: string[];
  location?: string;
  minBlocks?: number | null;
  maxBlocks?: number | null;
  machineTypeId?: string | null;
};

export type MachineType = {
  id: string;
  name: string;
  slug: string;
  summary: string;
  description: string;
  assetName: string;
  assetPath: string;
  isPublished: boolean;
  minReservationBlocks: number;
  maxReservationBlocks: number;
  reservationRequiresConsecutive: boolean;
  createdAt: string;
  updatedAt: string;
  machines?: Array<{
    id: string;
    name: string;
    slug: string;
    status: string;
    category: string;
    supportedFormats: string[];
  }>;
};

export type MachineTypePayload = {
  name: string;
  slug: string;
  summary: string;
  description: string;
  assetName: string;
  assetPath: string;
  isPublished: boolean;
  minReservationBlocks: number;
  maxReservationBlocks: number;
  reservationRequiresConsecutive: boolean;
};

export type Material = {
  id: string;
  name: string;
  slug: string;
  unit: string;
  stockQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  stockThreshold: number;
  pricePerUnit: number;
  isActive: boolean;
  lowStock?: boolean;
  belowReserved?: boolean;
};

export type MaterialMovement = {
  id: string;
  type: "IN" | "OUT" | "RESERVE" | "RELEASE" | "ADJUSTMENT";
  quantity: number;
  reason?: string | null;
  resultingStockQuantity: number;
  resultingReservedQuantity: number;
  createdAt: string;
  actor?: {
    id: string;
    name: string;
    email: string;
  } | null;
  request?: {
    id: string;
    title: string;
    status: ServiceRequest["status"];
    quotationStatus: ServiceRequest["quotationStatus"];
  } | null;
};

export type AdminMaterial = Material & {
  movements: MaterialMovement[];
};

export type MaterialPayload = {
  name: string;
  slug: string;
  unit: string;
  stockQuantity: number;
  stockThreshold: number;
  pricePerUnit: number;
  isActive: boolean;
};

export type MaterialMovementPayload = {
  type: "IN" | "OUT" | "ADJUSTMENT";
  quantity?: number;
  targetStockQuantity?: number;
  reason: string;
};

export type RequestFile = {
  id: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  extension: string;
  sizeBytes: number;
  publicUrl: string;
  createdAt: string;
};

export type RequestComment = {
  id: string;
  body: string;
  visibility: "INTERNAL" | "PUBLIC";
  createdAt: string;
  author?: {
    id: string;
    name: string;
    email: string;
  } | null;
};

export type RequestEvent = {
  id: string;
  type:
    | "CREATED"
    | "STATUS_CHANGED"
    | "COMMENT_ADDED"
    | "SENT_TO_QUOTATION"
    | "ACCEPTED"
    | "CORRECTION_REQUESTED"
    | "REJECTED"
    | "ASSIGNED"
    | "DUE_DATE_CHANGED"
    | "STARTED_PRODUCTION"
    | "MARKED_READY"
    | "COMPLETED";
  summary: string;
  detail?: string | null;
  createdAt: string;
  actor?: {
    id: string;
    name: string;
    email: string;
  } | null;
};

export type Quotation = {
  id: string;
  setupCost: string;
  machineCost: string;
  materialCost: string;
  totalCost: string;
  quantity: number;
  estimatedMinutes: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  preparedBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
};

export type ServiceRequest = {
  id: string;
  title: string;
  description: string;
  notes?: string | null;
  status:
    | "DRAFT"
    | "PENDING_REVIEW"
    | "CHANGES_REQUESTED"
    | "IN_QUOTATION"
    | "QUOTED"
    | "APPROVED"
    | "IN_PROGRESS"
    | "READY_FOR_PICKUP"
    | "COMPLETED"
    | "REJECTED";
  quotationStatus: "NOT_REQUESTED" | "PENDING" | "READY" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  requestedDate: string;
  createdAt: string;
  updatedAt: string;
  estimatedDurationMinutes: number;
  estimatedCost: number;
  quantity: number;
  materialUnitsRequested: number;
  inventoryReservedAt?: string | null;
  commitmentDate?: string | null;
  assignedStaffId?: string | null;
  uploadedFileUrl?: string | null;
  operationalStage: "PENDING_REVIEW" | "IN_QUOTATION" | "CHANGES_REQUESTED" | "READY_TO_SCHEDULE" | "IN_PRODUCTION" | "DELIVERED" | "OTHER";
  slaStatus: "NONE" | "ON_TRACK" | "DUE_SOON" | "OVERDUE";
  quotation?: Quotation | null;
  requestFiles: RequestFile[];
  project: Project;
  machine: Machine;
  material?: Material | null;
  requester?: {
    id: string;
    name: string;
    email: string;
  } | null;
  assignedStaff?: {
    id: string;
    name: string;
    email: string;
  } | null;
};

export type ServiceRequestDetail = ServiceRequest & {
  comments: RequestComment[];
  events: RequestEvent[];
  reservations: Reservation[];
};

export type Reservation = {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  notes?: string | null;
  description?: string | null;
  blockNumbers: number[];
  createdAt: string;
  updatedAt: string;
  machine: Machine;
  project?: Project | null;
  request?: {
    id: string;
    title: string;
    status: ServiceRequest["status"];
    quotationStatus: ServiceRequest["quotationStatus"];
  } | null;
  user?: {
    id: string;
    name: string;
    email: string;
  } | null;
};

export type ReservationPayload = {
  projectId?: string | null;
  requestId?: string | null;
  machineId: string;
  title?: string;
  startAt: string;
  endAt: string;
  description?: string;
  notes?: string;
  blockNumbers: number[];
  status?: Reservation["status"];
};

export type ReservationAvailability = {
  machineId: string;
  date: string;
  reservedBlockNumbers: number[];
  maintenanceBlockNumbers: number[];
  blockedBlockNumbers: number[];
  rules: {
    minBlocks: number;
    maxBlocks: number;
    requiresConsecutive: boolean;
  };
  reservations: Array<{
    id: string;
    status: Reservation["status"];
    blockNumbers: number[];
  }>;
  maintenanceWindows: Array<{
    id: string;
    startAt: string;
    endAt: string;
    reason: string;
  }>;
};

export type ReservationSchedule = {
  machine: Machine & {
    rules: {
      minBlocks: number;
      maxBlocks: number;
      requiresConsecutive: boolean;
    };
  };
  request?: {
    id: string;
    title: string;
    estimatedDurationMinutes: number;
    status: ServiceRequest["status"];
  } | null;
  recommendedBlockCount: number;
  weekStart: string;
  days: Array<{
    date: string;
    weekdayLabel: string;
    reservedBlockNumbers: number[];
    maintenanceBlockNumbers: number[];
    blockedBlockNumbers: number[];
    freeBlockCount: number;
    occupancyRate: number;
    suggestedBlockNumbers: number[];
    reservations: Reservation[];
    maintenanceWindows: Array<{
      id: string;
      startAt: string;
      endAt: string;
      reason: string;
    }>;
  }>;
};

export type CreateRequestPayload = {
  projectId: string;
  machineId: string;
  materialId: string;
  title: string;
  description: string;
  notes?: string;
  requestedDate: string;
  estimatedDurationMinutes: number;
  estimatedCost?: number;
  quantity: number;
  materialUnitsRequested: number;
  files: File[];
};

export type RequestCommentPayload = {
  body: string;
  visibility: "INTERNAL" | "PUBLIC";
};

export type UserRequestCommentPayload = {
  body: string;
};

export type StaffRequestActionPayload = {
  action: "ACCEPT" | "REQUEST_CORRECTION" | "REJECT" | "SEND_TO_QUOTATION" | "START_PRODUCTION" | "MARK_READY" | "MARK_COMPLETED";
  reason?: string;
  visibility?: "INTERNAL" | "PUBLIC";
};

export type StaffRequestOpsPayload = {
  assignedStaffId?: string | null;
  commitmentDate?: string | null;
  status?:
    | "DRAFT"
    | "PENDING_REVIEW"
    | "CHANGES_REQUESTED"
    | "IN_QUOTATION"
    | "QUOTED"
    | "APPROVED"
    | "IN_PROGRESS"
    | "READY_FOR_PICKUP"
    | "COMPLETED"
    | "REJECTED";
};

export type QuotationPayload = {
  setupCost: number;
  machineCost: number;
  materialCost: number;
  quantity: number;
  estimatedMinutes: number;
  notes?: string;
};

export type QuotationDecisionPayload = {
  decision: "ACCEPT" | "REJECT";
  reason?: string;
};

export type StaffMetaResponse = {
  staffUsers: Array<{
    id: string;
    name: string;
    email: string;
  }>;
};

export type StaffDashboardResponse = {
  metrics: {
    totalOpenRequests: number;
    overdueRequests: number;
    unassignedRequests: number;
    pendingCorrections: number;
  };
  boardColumns: Array<{
    key: ServiceRequest["operationalStage"];
    label: string;
    items: ServiceRequestDetail[];
  }>;
  requestsByStatus: Array<{
    status: ServiceRequest["status"];
    count: number;
  }>;
  machineUsage: Array<{
    machineName: string;
    count: number;
    blocks: number;
  }>;
  averageTimes: {
    quotationMinutes: number;
    completionMinutes: number;
  };
  criticalMaterials: Material[];
  staffUsers: StaffMetaResponse["staffUsers"];
};

export function setApiToken(token: string | null) {
  authToken = token;
}

export function resolveApiUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData;

  if (!isFormData) {
    headers.set("Content-Type", "application/json");
  }

  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers
  });

  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof body === "string"
        ? body
        : typeof body === "object" && body && "message" in body
          ? String(body.message)
          : `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return body as T;
}

export const api = {
  login: (email: string, password: string) =>
    request<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    }),
  forgotPassword: (email: string) =>
    request<ForgotPasswordResponse>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email })
    }),
  resetPassword: (token: string, password: string) =>
    request<{ message: string }>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password })
    }),
  getMe: () => request<{ user: AuthUser }>("/api/auth/me"),
  updateMyProfile: (payload: ProfilePayload) =>
    request<{ user: AuthUser }>("/api/auth/me/profile", {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  getNotifications: () => request<NotificationsResponse>("/api/notifications"),
  markNotificationRead: (notificationId: string, read = true) =>
    request<NotificationItem>(`/api/notifications/${notificationId}/read`, {
      method: "POST",
      body: JSON.stringify({ read })
    }),
  getOverview: () => request<OverviewResponse>("/api/overview"),
  getProjects: () => request<Project[]>("/api/projects"),
  getProjectById: (projectId: string) => request<ProjectDetail>(`/api/projects/${projectId}`),
  addProjectMember: (projectId: string, payload: ProjectMemberPayload) =>
    request<ProjectMember>(`/api/projects/${projectId}/members`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  uploadProjectFiles: (projectId: string, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    return request<ProjectFile[]>(`/api/projects/${projectId}/files`, {
      method: "POST",
      body: formData
    });
  },
  getMachines: () => request<Machine[]>("/api/machines"),
  getMachineSchedule: (machineId: string, weekStart: string, requestId?: string, excludeReservationId?: string) =>
    request<ReservationSchedule>(
      `/api/machines/${machineId}/schedule?weekStart=${encodeURIComponent(weekStart)}${requestId ? `&requestId=${encodeURIComponent(requestId)}` : ""}${
        excludeReservationId ? `&excludeReservationId=${encodeURIComponent(excludeReservationId)}` : ""
      }`
    ),
  getMachineTypes: () => request<MachineType[]>("/api/machine-types"),
  getMachineTypeById: (machineTypeId: string) => request<MachineType>(`/api/machine-types/${machineTypeId}`),
  getAdminMachineTypes: () => request<MachineType[]>("/api/admin/machine-types"),
  getAdminMachines: () => request<Machine[]>("/api/admin/machines"),
  getMaterials: () => request<Material[]>("/api/materials"),
  getAdminMaterials: () => request<AdminMaterial[]>("/api/materials?includeMovements=true"),
  getMaterialById: (materialId: string) => request<AdminMaterial>(`/api/materials/${materialId}`),
  getRequests: (projectId?: string) =>
    request<ServiceRequest[]>(projectId ? `/api/requests?projectId=${encodeURIComponent(projectId)}` : "/api/requests"),
  getRequestById: (requestId: string) => request<ServiceRequestDetail>(`/api/requests/${requestId}`),
  updateRequest: (requestId: string, payload: Omit<CreateRequestPayload, "projectId" | "files"> & { estimatedCost?: number }) =>
    request<ServiceRequestDetail>(`/api/requests/${requestId}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  addRequestComment: (requestId: string, payload: UserRequestCommentPayload) =>
    request<RequestComment>(`/api/requests/${requestId}/comments`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  getRequestQuotation: (requestId: string) => request<Quotation>(`/api/requests/${requestId}/quotation`),
  getStaffMeta: () => request<StaffMetaResponse>("/api/staff/meta"),
  getStaffDashboard: () => request<StaffDashboardResponse>("/api/staff/dashboard"),
  getStaffBoard: () => request<{ columns: StaffDashboardResponse["boardColumns"] }>("/api/staff/board"),
  getStaffRequests: () => request<ServiceRequestDetail[]>("/api/staff/requests"),
  getStaffRequestById: (requestId: string) => request<ServiceRequestDetail>(`/api/staff/requests/${requestId}`),
  getReservations: () => request<Reservation[]>("/api/reservations"),
  getReservationAvailability: (machineId: string, date: string) =>
    request<ReservationAvailability>(`/api/reservations/availability?machineId=${encodeURIComponent(machineId)}&date=${encodeURIComponent(date)}`),
  getReservationSchedule: (machineId: string, weekStart: string, requestId?: string, excludeReservationId?: string) =>
    request<ReservationSchedule>(
      `/api/reservations/schedule?machineId=${encodeURIComponent(machineId)}&weekStart=${encodeURIComponent(weekStart)}${
        requestId ? `&requestId=${encodeURIComponent(requestId)}` : ""
      }${excludeReservationId ? `&excludeReservationId=${encodeURIComponent(excludeReservationId)}` : ""}`
    ),
  getReservationById: (reservationId: string) => request<Reservation>(`/api/reservations/${reservationId}`),
  createProject: (payload: CreateProjectPayload) =>
    request<Project>("/api/projects", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  createMachineType: (payload: MachineTypePayload) =>
    request<MachineType>("/api/admin/machine-types", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  createMaterial: (payload: MaterialPayload) =>
    request<Material>("/api/materials", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateMaterial: (materialId: string, payload: MaterialPayload) =>
    request<Material>(`/api/materials/${materialId}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  createMaterialMovement: (materialId: string, payload: MaterialMovementPayload) =>
    request<Material>(`/api/materials/${materialId}/movements`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateMachineType: (machineTypeId: string, payload: MachineTypePayload) =>
    request<MachineType>(`/api/admin/machine-types/${machineTypeId}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  createAdminMachine: (payload: AdminMachinePayload) =>
    request<Machine>("/api/admin/machines", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateAdminMachine: (machineId: string, payload: AdminMachinePayload) =>
    request<Machine>(`/api/admin/machines/${machineId}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  createRequest: (payload: CreateRequestPayload) => {
    const formData = new FormData();
    formData.set("projectId", payload.projectId);
    formData.set("machineId", payload.machineId);
    formData.set("materialId", payload.materialId);
    formData.set("title", payload.title);
    formData.set("description", payload.description);
    formData.set("notes", payload.notes ?? "");
    formData.set("requestedDate", payload.requestedDate);
    formData.set("estimatedDurationMinutes", String(payload.estimatedDurationMinutes));
    formData.set("estimatedCost", String(payload.estimatedCost ?? 0));
    formData.set("quantity", String(payload.quantity));
    formData.set("materialUnitsRequested", String(payload.materialUnitsRequested));
    payload.files.forEach((file) => formData.append("files", file));

    return request<ServiceRequestDetail>("/api/requests", {
      method: "POST",
      body: formData
    });
  },
  addStaffRequestComment: (requestId: string, payload: RequestCommentPayload) =>
    request<RequestComment>(`/api/staff/requests/${requestId}/comments`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  applyStaffRequestAction: (requestId: string, payload: StaffRequestActionPayload) =>
    request<ServiceRequestDetail>(`/api/staff/requests/${requestId}/actions`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  assignRequest: (requestId: string, assignedStaffId?: string | null) =>
    request<ServiceRequestDetail>(`/api/requests/${requestId}/assign`, {
      method: "POST",
      body: JSON.stringify({ assignedStaffId })
    }),
  updateRequestStatus: (requestId: string, status: StaffRequestOpsPayload["status"]) =>
    request<ServiceRequestDetail>(`/api/requests/${requestId}/status`, {
      method: "POST",
      body: JSON.stringify({ status })
    }),
  updateStaffRequestOps: (requestId: string, payload: StaffRequestOpsPayload) =>
    request<ServiceRequestDetail>(`/api/staff/requests/${requestId}/ops`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  upsertStaffQuotation: (requestId: string, payload: QuotationPayload) =>
    request<ServiceRequestDetail>(`/api/requests/${requestId}/quotation`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  decideQuotation: (requestId: string, payload: QuotationDecisionPayload) =>
    request<ServiceRequestDetail>(`/api/requests/${requestId}/quotation-decision`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  acceptQuotation: (quotationId: string) =>
    request<ServiceRequestDetail>(`/api/quotations/${quotationId}/accept`, {
      method: "POST"
    }),
  rejectQuotation: (quotationId: string) =>
    request<ServiceRequestDetail>(`/api/quotations/${quotationId}/reject`, {
      method: "POST"
    }),
  createReservation: (payload: ReservationPayload) =>
    request<Reservation>("/api/reservations", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  cancelReservation: (reservationId: string) =>
    request<Reservation>(`/api/reservations/${reservationId}/cancel`, {
      method: "POST"
    }),
  updateReservation: (reservationId: string, payload: ReservationPayload) =>
    request<Reservation>(`/api/reservations/${reservationId}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    })
};
