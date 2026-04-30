import fs from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const machineTypes = [
  {
    id: "seed-machine-type-vinyl",
    name: "Cortadoras de Vinilo",
    slug: "cortadoras-de-vinilo",
    summary: "Cortadora de vinilo",
    description: "Cortadora de vinilo para trabajos graficos, rotulado y produccion de adhesivos.",
    assetName: "Imagen_Ploter.svg",
    assetPath: "/machine-assets/vinyl-cutter.svg",
    minReservationBlocks: 1,
    maxReservationBlocks: 4,
    reservationRequiresConsecutive: true
  },
  {
    id: "seed-machine-type-3d",
    name: "Impresoras 3D",
    slug: "impresoras-3d",
    summary: "Impresoras de filamento plastico.",
    description: "Familia de impresoras 3D FDM para prototipado rapido, piezas funcionales y validacion temprana.",
    assetName: "Impresoras_3D.svg",
    assetPath: "/machine-assets/printers-3d.svg",
    minReservationBlocks: 2,
    maxReservationBlocks: 8,
    reservationRequiresConsecutive: true
  },
  {
    id: "seed-machine-type-resin",
    name: "Impresora 3D Resina",
    slug: "impresora-3d-resina",
    summary: "Impresora de resina Curadora de resina",
    description: "Sistema de impresion y curado en resina para piezas con mayor detalle superficial.",
    assetName: "Impresora_Resina.svg",
    assetPath: "/machine-assets/resin-printer.svg",
    minReservationBlocks: 2,
    maxReservationBlocks: 6,
    reservationRequiresConsecutive: true
  },
  {
    id: "seed-machine-type-lathe",
    name: "Torno",
    slug: "torno",
    summary: "Torno",
    description: "Torno para mecanizado y fabricacion de piezas cilindricas de precision.",
    assetName: "Torno.svg",
    assetPath: "/machine-assets/lathe.svg",
    minReservationBlocks: 1,
    maxReservationBlocks: 4,
    reservationRequiresConsecutive: true
  },
  {
    id: "seed-machine-type-cnc",
    name: "CNC",
    slug: "cnc",
    summary: "Maquinas CNC",
    description: "Maquinas CNC para corte, fresado y mecanizado de paneles y piezas de mayor escala.",
    assetName: "CNC.svg",
    assetPath: "/machine-assets/cnc.svg",
    minReservationBlocks: 2,
    maxReservationBlocks: 6,
    reservationRequiresConsecutive: true
  },
  {
    id: "seed-machine-type-metal",
    name: "Grabado de metal",
    slug: "grabado-de-metal",
    summary: "Grabadora laser para metales",
    description: "Grabadora laser para metales y placas con trabajos de personalizacion y marcaje.",
    assetName: "Grabado_Metal.svg",
    assetPath: "/machine-assets/metal-engraving.svg",
    minReservationBlocks: 1,
    maxReservationBlocks: 3,
    reservationRequiresConsecutive: true
  },
  {
    id: "seed-machine-type-embroidery",
    name: "Bordadora",
    slug: "bordadora",
    summary: "Maquina de bordar marca Brother.",
    description: "Equipo de bordado computarizado para textiles, insignias y personalizacion de prendas.",
    assetName: "Bordadora.svg",
    assetPath: "/machine-assets/embroidery.svg",
    minReservationBlocks: 1,
    maxReservationBlocks: 4,
    reservationRequiresConsecutive: true
  },
  {
    id: "seed-machine-type-laser",
    name: "Cortadora laser",
    slug: "cortadora-laser",
    summary: "Cortadora laser",
    description: "Cortadora laser para MDF, acrilico, carton y otras laminas de espesor controlado.",
    assetName: "Cortadora_Laser.svg",
    assetPath: "/machine-assets/laser-cutter.svg",
    minReservationBlocks: 1,
    maxReservationBlocks: 5,
    reservationRequiresConsecutive: true
  },
  {
    id: "seed-machine-type-bust",
    name: "Busto Federico Santa Maria",
    slug: "busto-federico-santa-maria",
    summary: "Busto Federico Santa Maria",
    description: "Muestra de pieza fabricada en el laboratorio para exhibicion de capacidades de prototipado.",
    assetName: "Busto_Federico_Santa_Maria.svg",
    assetPath: "/machine-assets/bust.svg",
    minReservationBlocks: 1,
    maxReservationBlocks: 2,
    reservationRequiresConsecutive: true
  },
  {
    id: "seed-machine-type-plotter",
    name: "Plotter",
    slug: "plotter",
    summary: "maquina plotter",
    description: "Plotter de gran formato para dibujo tecnico, corte y salidas graficas de apoyo.",
    assetName: "Plotter.svg",
    assetPath: "/machine-assets/plotter.svg",
    minReservationBlocks: 1,
    maxReservationBlocks: 4,
    reservationRequiresConsecutive: true
  }
];

async function main() {
  const requestFilesDirectory = path.resolve(process.cwd(), "uploads", "request-files");
  await fs.mkdir(requestFilesDirectory, { recursive: true });

  const userPasswordHash = await bcrypt.hash("123fablab..", 10);
  const staffPasswordHash = await bcrypt.hash("stafffablab..", 10);
  const adminPasswordHash = await bcrypt.hash("adminfablab..", 10);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: "tabata.ahumada@usm.cl" },
      update: {
        name: "Tabata Ahumada",
        passwordHash: userPasswordHash,
        role: "USER"
      },
      create: {
        name: "Tabata Ahumada",
        email: "tabata.ahumada@usm.cl",
        passwordHash: userPasswordHash,
        role: "USER",
        firstName: "Tabata",
        middleName: null,
        lastName: "Ahumada",
        maternalLastName: null,
        documentType: "RUT",
        documentNumber: "20.790.136-9",
        career: "Ingenieria Civil Telematica",
        entryYear: 2020,
        birthDate: new Date("2001-09-21T00:00:00.000Z"),
        sex: "FEMALE",
        profileCompleted: false
      }
    }),
    prisma.user.upsert({
      where: { email: "staff.fablab@usm.cl" },
      update: {
        name: "Equipo FabLab",
        passwordHash: staffPasswordHash,
        role: "STAFF"
      },
      create: {
        name: "Equipo FabLab",
        email: "staff.fablab@usm.cl",
        passwordHash: staffPasswordHash,
        role: "STAFF",
        profileCompleted: true
      }
    }),
    prisma.user.upsert({
      where: { email: "admin.fablab@usm.cl" },
      update: {
        name: "Super Admin FabLab",
        passwordHash: adminPasswordHash,
        role: "ADMIN"
      },
      create: {
        name: "Super Admin FabLab",
        email: "admin.fablab@usm.cl",
        passwordHash: adminPasswordHash,
        role: "ADMIN",
        profileCompleted: true,
        firstName: "Admin",
        lastName: "FabLab"
      }
    })
  ]);

  for (const machineType of machineTypes) {
    await prisma.machineType.upsert({
      where: { id: machineType.id },
      update: machineType,
      create: machineType
    });
  }

  const machines = await Promise.all([
    prisma.machine.upsert({
      where: { slug: "bambulab-a-1-1" },
      update: {
        machineTypeId: "seed-machine-type-3d"
      },
      create: {
        name: "Bambulab A-1 1",
        slug: "bambulab-a-1-1",
        description: "Impresora 3D FDM para prototipos rapidos y piezas de validacion.",
        category: "PRINT_3D",
        status: "AVAILABLE",
        hourlyRate: 8500,
        setupMinutes: 20,
        maxDurationMinutes: 360,
        supportedFormats: ["stl", "3mf", "obj"],
        location: "Sala prototipado 1",
        minBlocks: 2,
        maxBlocks: 8,
        machineTypeId: "seed-machine-type-3d"
      }
    }),
    prisma.machine.upsert({
      where: { slug: "laser-thunder-60w" },
      update: {
        machineTypeId: "seed-machine-type-laser"
      },
      create: {
        name: "Cortadora Laser Thunder 60W",
        slug: "laser-thunder-60w",
        description: "Corte y grabado en MDF, acrilico y carton.",
        category: "LASER",
        status: "AVAILABLE",
        hourlyRate: 12000,
        setupMinutes: 15,
        maxDurationMinutes: 240,
        supportedFormats: ["dxf", "svg", "ai"],
        location: "Sala laser",
        minBlocks: 1,
        maxBlocks: 5,
        machineTypeId: "seed-machine-type-laser"
      }
    }),
    prisma.machine.upsert({
      where: { slug: "router-cnc-shopbot" },
      update: {
        machineTypeId: "seed-machine-type-cnc"
      },
      create: {
        name: "Router CNC ShopBot",
        slug: "router-cnc-shopbot",
        description: "Maquina para mecanizado de paneles y piezas de mayor escala.",
        category: "CNC",
        status: "MAINTENANCE",
        hourlyRate: 18000,
        setupMinutes: 30,
        maxDurationMinutes: 300,
        supportedFormats: ["dxf", "step", "dwg"],
        location: "Taller CNC",
        minBlocks: 2,
        maxBlocks: 6,
        machineTypeId: "seed-machine-type-cnc"
      }
    })
  ]);

  const materials = await Promise.all([
    (prisma as any).material.upsert({
      where: { slug: "pla-negro-175" },
      update: {
        unit: "kg",
        stockQuantity: 3.2,
        reservedQuantity: 2.0,
        stockThreshold: 2.0,
        pricePerUnit: 18500,
        isActive: true
      },
      create: {
        name: "PLA Negro 1.75 mm",
        slug: "pla-negro-175",
        unit: "kg",
        stockQuantity: 3.2,
        reservedQuantity: 2.0,
        stockThreshold: 2.0,
        pricePerUnit: 18500
      }
    }),
    (prisma as any).material.upsert({
      where: { slug: "mdf-3mm" },
      update: {
        unit: "plancha",
        stockQuantity: 12,
        reservedQuantity: 0,
        stockThreshold: 5,
        pricePerUnit: 6900,
        isActive: true
      },
      create: {
        name: "MDF 3 mm",
        slug: "mdf-3mm",
        unit: "plancha",
        stockQuantity: 12,
        reservedQuantity: 0,
        stockThreshold: 5,
        pricePerUnit: 6900
      }
    }),
    (prisma as any).material.upsert({
      where: { slug: "acrilico-transparente-3mm" },
      update: {
        unit: "plancha",
        stockQuantity: 2,
        reservedQuantity: 0,
        stockThreshold: 4,
        pricePerUnit: 14900,
        isActive: true
      },
      create: {
        name: "Acrilico Transparente 3 mm",
        slug: "acrilico-transparente-3mm",
        unit: "plancha",
        stockQuantity: 2,
        reservedQuantity: 0,
        stockThreshold: 4,
        pricePerUnit: 14900
      }
    })
  ]);

  await prisma.project.upsert({
    where: { id: "seed-project-fablab-1" },
    update: {
      name: "Impresiones 3D personales",
      description: "Proyecto base para pruebas de reserva sobre impresoras 3D.",
      repositoryUrl: null,
      courseName: "INF322 - Diseno de Interfaces Usuarias",
      professorName: "Docente Taller FabLab",
      academicPeriod: "2026-1",
      teamMode: "INDIVIDUAL",
      status: "CREATED",
      tags: ["inf322", "prototipo", "ux"],
      projectType: "PRINT_3D",
      scope: "INDIVIDUAL",
      attachmentNames: ["pieza-prueba.stl"],
      ownerId: users[0].id
    },
    create: {
      id: "seed-project-fablab-1",
      name: "Impresiones 3D personales",
      description: "Proyecto base para pruebas de reserva sobre impresoras 3D.",
      repositoryUrl: null,
      courseName: "INF322 - Diseno de Interfaces Usuarias",
      professorName: "Docente Taller FabLab",
      academicPeriod: "2026-1",
      teamMode: "INDIVIDUAL",
      status: "CREATED",
      tags: ["inf322", "prototipo", "ux"],
      projectType: "PRINT_3D",
      scope: "INDIVIDUAL",
      attachmentNames: ["pieza-prueba.stl"],
      ownerId: users[0].id
    }
  });

  await (prisma as any).projectMember.deleteMany({
    where: {
      projectId: "seed-project-fablab-1"
    }
  });

  await (prisma as any).projectMember.createMany({
    data: [
      {
        id: "seed-project-member-1",
        projectId: "seed-project-fablab-1",
        name: "Tabata Ahumada",
        email: "tabata.ahumada@usm.cl",
        roleInProject: "Tesista / coordinacion",
        isOwner: true,
        ownerUserId: users[0].id
      },
      {
        id: "seed-project-member-2",
        projectId: "seed-project-fablab-1",
        name: "Equipo FabLab",
        email: "staff.fablab@usm.cl",
        roleInProject: "Apoyo tecnico",
        isOwner: false,
        ownerUserId: users[1].id
      }
    ]
  });

  await (prisma as any).projectFile.deleteMany({
    where: {
      projectId: "seed-project-fablab-1"
    }
  });

  await (prisma as any).projectFile.createMany({
    data: [
      {
        id: "seed-project-file-1",
        projectId: "seed-project-fablab-1",
        originalName: "pieza-prueba.stl",
        storedName: "seed-prototipo-sensor.stl",
        mimeType: "model/stl",
        extension: "stl",
        sizeBytes: 58,
        versionLabel: "v1",
        uploadedById: users[0].id
      },
      {
        id: "seed-project-file-2",
        projectId: "seed-project-fablab-1",
        originalName: "panel-frontal-v2.dxf",
        storedName: "seed-panel-frontal.dxf",
        mimeType: "application/dxf",
        extension: "dxf",
        sizeBytes: 36,
        versionLabel: "v2",
        uploadedById: users[0].id
      }
    ]
  });

  const requestOne = await (prisma as any).serviceRequest.upsert({
    where: { id: "seed-request-fablab-1" },
    update: {
      description: "Se requiere impresion 3D de una carcasa para sensor, con ajustes en tolerancias de encaje y revision de orientacion de impresion.",
      notes: "Idealmente en PLA negro. Se agradece observacion si conviene dividir la pieza en dos cuerpos.",
      status: "APPROVED",
      quotationStatus: "NOT_REQUESTED",
      materialUnitsRequested: 1.2,
      inventoryReservedAt: new Date("2026-04-30T10:00:00.000Z"),
      assignedStaffId: users[1].id,
      commitmentDate: new Date("2026-05-04T12:00:00.000Z"),
      dueDate: new Date("2026-05-04T12:00:00.000Z"),
      uploadedFileUrl: "/uploads/request-files/seed-prototipo-sensor.stl",
      projectId: "seed-project-fablab-1"
    },
    create: {
      id: "seed-request-fablab-1",
      title: "Carcasa para prototipo de sensor",
      description: "Se requiere impresion 3D de una carcasa para sensor, con ajustes en tolerancias de encaje y revision de orientacion de impresion.",
      notes: "Idealmente en PLA negro. Se agradece observacion si conviene dividir la pieza en dos cuerpos.",
      status: "APPROVED",
      quotationStatus: "NOT_REQUESTED",
      requestedDate: new Date("2026-05-02T12:00:00.000Z"),
      estimatedDurationMinutes: 180,
      estimatedCost: 25500,
      quantity: 2,
      materialUnitsRequested: 1.2,
      inventoryReservedAt: new Date("2026-04-30T10:00:00.000Z"),
      assignedStaffId: users[1].id,
      commitmentDate: new Date("2026-05-04T12:00:00.000Z"),
      dueDate: new Date("2026-05-04T12:00:00.000Z"),
      uploadedFileUrl: "/uploads/request-files/seed-prototipo-sensor.stl",
      projectId: "seed-project-fablab-1",
      requesterId: users[0].id,
      machineId: machines[0].id,
      materialId: materials[0].id
    }
  });

  const requestTwo = await (prisma as any).serviceRequest.upsert({
    where: { id: "seed-request-fablab-2" },
    update: {
      description: "Se necesita corte laser de panel frontal para una caja, con perforaciones para botoneras y ventana principal en acrilico.",
      notes: "El objetivo es tener una primera cotizacion para decidir si se fabrica en acrilico o MDF.",
      status: "QUOTED",
      quotationStatus: "READY",
      uploadedFileUrl: "/uploads/request-files/seed-panel-frontal.dxf",
      materialUnitsRequested: 1.5,
      inventoryReservedAt: null,
      assignedStaffId: users[2].id,
      commitmentDate: new Date("2026-05-03T18:00:00.000Z"),
      dueDate: new Date("2026-05-03T18:00:00.000Z"),
      projectId: "seed-project-fablab-1"
    },
    create: {
      id: "seed-request-fablab-2",
      title: "Corte de panel frontal para caja",
      description: "Se necesita corte laser de panel frontal para una caja, con perforaciones para botoneras y ventana principal en acrilico.",
      notes: "El objetivo es tener una primera cotizacion para decidir si se fabrica en acrilico o MDF.",
      status: "QUOTED",
      quotationStatus: "READY",
      requestedDate: new Date("2026-05-03T12:00:00.000Z"),
      estimatedDurationMinutes: 75,
      estimatedCost: 22800,
      quantity: 1,
      materialUnitsRequested: 1.5,
      assignedStaffId: users[2].id,
      commitmentDate: new Date("2026-05-03T18:00:00.000Z"),
      dueDate: new Date("2026-05-03T18:00:00.000Z"),
      uploadedFileUrl: "/uploads/request-files/seed-panel-frontal.dxf",
      projectId: "seed-project-fablab-1",
      requesterId: users[0].id,
      machineId: machines[1].id,
      materialId: materials[2].id
    }
  });

  const requestThree = await (prisma as any).serviceRequest.upsert({
    where: { id: "seed-request-fablab-3" },
    update: {
      title: "Soporte de camara para laboratorio",
      description: "Se requiere una pieza de soporte impresa en 3D. El archivo necesita correcciones por espesor insuficiente en una zona de fijacion.",
      notes: "Favor revisar tolerancias de pernos M4.",
      status: "CHANGES_REQUESTED",
      quotationStatus: "NOT_REQUESTED",
      requestedDate: new Date("2026-05-01T15:00:00.000Z"),
      estimatedDurationMinutes: 95,
      estimatedCost: 16000,
      quantity: 1,
      materialUnitsRequested: 0.4,
      assignedStaffId: users[1].id,
      commitmentDate: new Date("2026-05-02T15:00:00.000Z"),
      dueDate: new Date("2026-05-02T15:00:00.000Z"),
      uploadedFileUrl: "/uploads/request-files/seed-prototipo-sensor.stl",
      projectId: "seed-project-fablab-1",
      requesterId: users[0].id,
      machineId: machines[0].id,
      materialId: materials[0].id
    },
    create: {
      id: "seed-request-fablab-3",
      title: "Soporte de camara para laboratorio",
      description: "Se requiere una pieza de soporte impresa en 3D. El archivo necesita correcciones por espesor insuficiente en una zona de fijacion.",
      notes: "Favor revisar tolerancias de pernos M4.",
      status: "CHANGES_REQUESTED",
      quotationStatus: "NOT_REQUESTED",
      requestedDate: new Date("2026-05-01T15:00:00.000Z"),
      estimatedDurationMinutes: 95,
      estimatedCost: 16000,
      quantity: 1,
      materialUnitsRequested: 0.4,
      assignedStaffId: users[1].id,
      commitmentDate: new Date("2026-05-02T15:00:00.000Z"),
      dueDate: new Date("2026-05-02T15:00:00.000Z"),
      uploadedFileUrl: "/uploads/request-files/seed-prototipo-sensor.stl",
      projectId: "seed-project-fablab-1",
      requesterId: users[0].id,
      machineId: machines[0].id,
      materialId: materials[0].id
    }
  });

  const requestFour = await (prisma as any).serviceRequest.upsert({
    where: { id: "seed-request-fablab-4" },
    update: {
      title: "Panel de control MDF para maqueta",
      description: "Solicitud en revision de cotizacion para un panel de corte laser con perforaciones y etiquetas.",
      notes: "Prioridad media.",
      status: "IN_QUOTATION",
      quotationStatus: "PENDING",
      requestedDate: new Date("2026-05-05T14:00:00.000Z"),
      estimatedDurationMinutes: 120,
      estimatedCost: 18000,
      quantity: 2,
      materialUnitsRequested: 2,
      assignedStaffId: users[2].id,
      commitmentDate: new Date("2026-05-06T18:00:00.000Z"),
      dueDate: new Date("2026-05-06T18:00:00.000Z"),
      uploadedFileUrl: "/uploads/request-files/seed-panel-frontal.dxf",
      projectId: "seed-project-fablab-1",
      requesterId: users[0].id,
      machineId: machines[1].id,
      materialId: materials[1].id
    },
    create: {
      id: "seed-request-fablab-4",
      title: "Panel de control MDF para maqueta",
      description: "Solicitud en revision de cotizacion para un panel de corte laser con perforaciones y etiquetas.",
      notes: "Prioridad media.",
      status: "IN_QUOTATION",
      quotationStatus: "PENDING",
      requestedDate: new Date("2026-05-05T14:00:00.000Z"),
      estimatedDurationMinutes: 120,
      estimatedCost: 18000,
      quantity: 2,
      materialUnitsRequested: 2,
      assignedStaffId: users[2].id,
      commitmentDate: new Date("2026-05-06T18:00:00.000Z"),
      dueDate: new Date("2026-05-06T18:00:00.000Z"),
      uploadedFileUrl: "/uploads/request-files/seed-panel-frontal.dxf",
      projectId: "seed-project-fablab-1",
      requesterId: users[0].id,
      machineId: machines[1].id,
      materialId: materials[1].id
    }
  });

  const requestFive = await (prisma as any).serviceRequest.upsert({
    where: { id: "seed-request-fablab-5" },
    update: {
      title: "Piezas de montaje para instalacion",
      description: "Fabricacion en curso de un set de piezas de montaje impresas en 3D para una instalacion interactiva.",
      notes: "Lote ya en fabricacion.",
      status: "IN_PROGRESS",
      quotationStatus: "ACCEPTED",
      requestedDate: new Date("2026-04-28T14:00:00.000Z"),
      estimatedDurationMinutes: 240,
      estimatedCost: 42000,
      quantity: 4,
      materialUnitsRequested: 0.8,
      assignedStaffId: users[1].id,
      commitmentDate: new Date("2026-04-30T12:00:00.000Z"),
      dueDate: new Date("2026-04-30T12:00:00.000Z"),
      inventoryReservedAt: new Date("2026-04-29T11:00:00.000Z"),
      uploadedFileUrl: "/uploads/request-files/seed-prototipo-sensor.stl",
      projectId: "seed-project-fablab-1",
      requesterId: users[0].id,
      machineId: machines[0].id,
      materialId: materials[0].id
    },
    create: {
      id: "seed-request-fablab-5",
      title: "Piezas de montaje para instalacion",
      description: "Fabricacion en curso de un set de piezas de montaje impresas en 3D para una instalacion interactiva.",
      notes: "Lote ya en fabricacion.",
      status: "IN_PROGRESS",
      quotationStatus: "ACCEPTED",
      requestedDate: new Date("2026-04-28T14:00:00.000Z"),
      estimatedDurationMinutes: 240,
      estimatedCost: 42000,
      quantity: 4,
      materialUnitsRequested: 0.8,
      assignedStaffId: users[1].id,
      commitmentDate: new Date("2026-04-30T12:00:00.000Z"),
      dueDate: new Date("2026-04-30T12:00:00.000Z"),
      inventoryReservedAt: new Date("2026-04-29T11:00:00.000Z"),
      uploadedFileUrl: "/uploads/request-files/seed-prototipo-sensor.stl",
      projectId: "seed-project-fablab-1",
      requesterId: users[0].id,
      machineId: machines[0].id,
      materialId: materials[0].id
    }
  });

  const requestSix = await (prisma as any).serviceRequest.upsert({
    where: { id: "seed-request-fablab-6" },
    update: {
      title: "Set de señaletica grabada",
      description: "Trabajo completado de grabado/corte para señaletica de laboratorio.",
      notes: "Retirado por el usuario.",
      status: "COMPLETED",
      quotationStatus: "ACCEPTED",
      requestedDate: new Date("2026-04-20T14:00:00.000Z"),
      estimatedDurationMinutes: 90,
      estimatedCost: 22000,
      quantity: 1,
      materialUnitsRequested: 1,
      assignedStaffId: users[2].id,
      commitmentDate: new Date("2026-04-24T16:00:00.000Z"),
      dueDate: new Date("2026-04-24T16:00:00.000Z"),
      uploadedFileUrl: "/uploads/request-files/seed-panel-frontal.dxf",
      projectId: "seed-project-fablab-1",
      requesterId: users[0].id,
      machineId: machines[1].id,
      materialId: materials[1].id
    },
    create: {
      id: "seed-request-fablab-6",
      title: "Set de señaletica grabada",
      description: "Trabajo completado de grabado/corte para señaletica de laboratorio.",
      notes: "Retirado por el usuario.",
      status: "COMPLETED",
      quotationStatus: "ACCEPTED",
      requestedDate: new Date("2026-04-20T14:00:00.000Z"),
      estimatedDurationMinutes: 90,
      estimatedCost: 22000,
      quantity: 1,
      materialUnitsRequested: 1,
      assignedStaffId: users[2].id,
      commitmentDate: new Date("2026-04-24T16:00:00.000Z"),
      dueDate: new Date("2026-04-24T16:00:00.000Z"),
      uploadedFileUrl: "/uploads/request-files/seed-panel-frontal.dxf",
      projectId: "seed-project-fablab-1",
      requesterId: users[0].id,
      machineId: machines[1].id,
      materialId: materials[1].id
    }
  });

  const requestSeven = await (prisma as any).serviceRequest.upsert({
    where: { id: "seed-request-fablab-7" },
    update: {
      title: "Pieza pendiente de revision inicial",
      description: "Nueva solicitud ingresada por usuario para revision inicial del equipo.",
      notes: "Sin asignacion aun.",
      status: "PENDING_REVIEW",
      quotationStatus: "NOT_REQUESTED",
      requestedDate: new Date("2026-05-06T12:00:00.000Z"),
      estimatedDurationMinutes: 60,
      estimatedCost: 9500,
      quantity: 1,
      materialUnitsRequested: 0.2,
      uploadedFileUrl: "/uploads/request-files/seed-prototipo-sensor.stl",
      projectId: "seed-project-fablab-1",
      requesterId: users[0].id,
      machineId: machines[0].id,
      materialId: materials[0].id
    },
    create: {
      id: "seed-request-fablab-7",
      title: "Pieza pendiente de revision inicial",
      description: "Nueva solicitud ingresada por usuario para revision inicial del equipo.",
      notes: "Sin asignacion aun.",
      status: "PENDING_REVIEW",
      quotationStatus: "NOT_REQUESTED",
      requestedDate: new Date("2026-05-06T12:00:00.000Z"),
      estimatedDurationMinutes: 60,
      estimatedCost: 9500,
      quantity: 1,
      materialUnitsRequested: 0.2,
      uploadedFileUrl: "/uploads/request-files/seed-prototipo-sensor.stl",
      projectId: "seed-project-fablab-1",
      requesterId: users[0].id,
      machineId: machines[0].id,
      materialId: materials[0].id
    }
  });

  await Promise.all([
    fs.writeFile(path.join(requestFilesDirectory, "seed-prototipo-sensor.stl"), "solid seed-prototipo-sensor\nendsolid seed-prototipo-sensor\n", "utf8"),
    fs.writeFile(path.join(requestFilesDirectory, "seed-panel-frontal.dxf"), "0\nSECTION\n2\nENTITIES\n0\nENDSEC\n0\nEOF\n", "utf8")
  ]);

  await prisma.requestFile.deleteMany({
    where: {
      requestId: {
        in: [requestOne.id, requestTwo.id, requestThree.id, requestFour.id, requestFive.id, requestSix.id, requestSeven.id]
      }
    }
  });

  await prisma.requestFile.createMany({
    data: [
      {
        id: "seed-request-file-1",
        requestId: requestOne.id,
        originalName: "prototipo-sensor-v1.stl",
        storedName: "seed-prototipo-sensor.stl",
        mimeType: "model/stl",
        extension: "stl",
        sizeBytes: 58,
        versionLabel: "v1",
        uploadedById: users[0].id,
        publicUrl: "/uploads/request-files/seed-prototipo-sensor.stl"
      },
      {
        id: "seed-request-file-2",
        requestId: requestTwo.id,
        originalName: "panel-frontal-v2.dxf",
        storedName: "seed-panel-frontal.dxf",
        mimeType: "application/dxf",
        extension: "dxf",
        sizeBytes: 36,
        versionLabel: "v2",
        uploadedById: users[0].id,
        publicUrl: "/uploads/request-files/seed-panel-frontal.dxf"
      },
      {
        id: "seed-request-file-3",
        requestId: requestThree.id,
        originalName: "soporte-camara-v1.stl",
        storedName: "seed-prototipo-sensor.stl",
        mimeType: "model/stl",
        extension: "stl",
        sizeBytes: 58,
        versionLabel: "v1",
        uploadedById: users[0].id,
        publicUrl: "/uploads/request-files/seed-prototipo-sensor.stl"
      },
      {
        id: "seed-request-file-4",
        requestId: requestFour.id,
        originalName: "panel-control-mdf.dxf",
        storedName: "seed-panel-frontal.dxf",
        mimeType: "application/dxf",
        extension: "dxf",
        sizeBytes: 36,
        versionLabel: "v1",
        uploadedById: users[0].id,
        publicUrl: "/uploads/request-files/seed-panel-frontal.dxf"
      },
      {
        id: "seed-request-file-5",
        requestId: requestFive.id,
        originalName: "montaje-lote-a.stl",
        storedName: "seed-prototipo-sensor.stl",
        mimeType: "model/stl",
        extension: "stl",
        sizeBytes: 58,
        versionLabel: "v3",
        uploadedById: users[0].id,
        publicUrl: "/uploads/request-files/seed-prototipo-sensor.stl"
      },
      {
        id: "seed-request-file-6",
        requestId: requestSix.id,
        originalName: "senaletica-final.dxf",
        storedName: "seed-panel-frontal.dxf",
        mimeType: "application/dxf",
        extension: "dxf",
        sizeBytes: 36,
        versionLabel: "final",
        uploadedById: users[0].id,
        publicUrl: "/uploads/request-files/seed-panel-frontal.dxf"
      },
      {
        id: "seed-request-file-7",
        requestId: requestSeven.id,
        originalName: "revision-inicial.stl",
        storedName: "seed-prototipo-sensor.stl",
        mimeType: "model/stl",
        extension: "stl",
        sizeBytes: 58,
        versionLabel: "draft",
        uploadedById: users[0].id,
        publicUrl: "/uploads/request-files/seed-prototipo-sensor.stl"
      }
    ]
  });

  await (prisma as any).quotation.deleteMany({
    where: {
      requestId: {
        in: [requestOne.id, requestTwo.id, requestThree.id, requestFour.id, requestFive.id, requestSix.id, requestSeven.id]
      }
    }
  });

  await (prisma as any).quotation.create({
    data: {
      id: "seed-quotation-1",
      requestId: requestTwo.id,
      status: "READY",
      setupCost: 4500,
      machineCost: 9800,
      materialCost: 14900,
      extraCost: 0,
      totalCost: 29200,
      quantity: 1,
      estimatedMinutes: 80,
      notes: "Incluye preparacion de archivo, calibracion inicial y una pasada de prueba.",
      validUntil: new Date("2026-05-10T23:59:00.000Z"),
      createdById: users[1].id,
      preparedById: users[1].id
    }
  });

  await (prisma as any).quotation.createMany({
    data: [
      {
        id: "seed-quotation-2",
        requestId: requestFive.id,
        status: "ACCEPTED",
        setupCost: 6000,
        machineCost: 21000,
        materialCost: 14800,
        extraCost: 0,
        totalCost: 41800,
        quantity: 4,
        estimatedMinutes: 230,
        notes: "Cotizacion aceptada. Orden liberada para fabricacion.",
        validUntil: new Date("2026-05-03T23:59:00.000Z"),
        createdById: users[1].id,
        preparedById: users[1].id
      },
      {
        id: "seed-quotation-3",
        requestId: requestSix.id,
        status: "ACCEPTED",
        setupCost: 4000,
        machineCost: 9000,
        materialCost: 8000,
        extraCost: 0,
        totalCost: 21000,
        quantity: 1,
        estimatedMinutes: 85,
        notes: "Trabajo finalizado y entregado.",
        validUntil: new Date("2026-04-23T23:59:00.000Z"),
        createdById: users[2].id,
        preparedById: users[2].id
      }
    ]
  });

  await (prisma as any).quotationItem.deleteMany();
  await (prisma as any).quotationItem.createMany({
    data: [
      {
        id: "seed-quotation-item-1",
        quotationId: "seed-quotation-1",
        label: "Preparacion de archivo",
        quantity: 1,
        unitPrice: 4500,
        totalPrice: 4500,
        itemType: "SETUP"
      },
      {
        id: "seed-quotation-item-2",
        quotationId: "seed-quotation-1",
        label: "Uso cortadora laser",
        quantity: 1,
        unitPrice: 9800,
        totalPrice: 9800,
        itemType: "MACHINE"
      },
      {
        id: "seed-quotation-item-3",
        quotationId: "seed-quotation-1",
        label: "Acrilico 3 mm",
        quantity: 1,
        unitPrice: 14900,
        totalPrice: 14900,
        itemType: "MATERIAL"
      }
    ]
  });

  await (prisma as any).requestComment.deleteMany({
    where: {
      requestId: {
        in: [requestOne.id, requestTwo.id, requestThree.id, requestFour.id, requestFive.id, requestSix.id, requestSeven.id]
      }
    }
  });

  await (prisma as any).requestEvent.deleteMany({
    where: {
      requestId: {
        in: [requestOne.id, requestTwo.id, requestThree.id, requestFour.id, requestFive.id, requestSix.id, requestSeven.id]
      }
    }
  });

  await (prisma as any).requestComment.createMany({
    data: [
      {
        id: "seed-request-comment-1",
        requestId: requestOne.id,
        authorId: users[1].id,
        visibility: "PUBLIC",
        body: "Solicitud aprobada. Se reservo stock proyectado del material para continuar con la planificacion."
      },
      {
        id: "seed-request-comment-2",
        requestId: requestTwo.id,
        authorId: users[1].id,
        visibility: "PUBLIC",
        body: "La cotizacion ya esta lista. Puedes revisarla y decidir si deseas continuar con la reserva."
      },
      {
        id: "seed-request-comment-3",
        requestId: requestThree.id,
        authorId: users[1].id,
        visibility: "PUBLIC",
        body: "Necesitamos que aumentes el espesor del punto de fijacion antes de continuar."
      },
      {
        id: "seed-request-comment-4",
        requestId: requestFive.id,
        authorId: users[1].id,
        visibility: "INTERNAL",
        body: "Lote enviado a produccion con prioridad alta por compromiso atrasado."
      }
    ]
  });

  await (prisma as any).requestEvent.createMany({
    data: [
      {
        id: "seed-request-event-1",
        requestId: requestOne.id,
        actorId: users[0].id,
        type: "CREATED",
        summary: "Solicitud creada por usuario",
        detail: "Se adjunto un archivo tecnico para revision."
      },
      {
        id: "seed-request-event-2",
        requestId: requestOne.id,
        actorId: users[1].id,
        type: "ACCEPTED",
        summary: "Solicitud aceptada por staff",
        detail: "Se aprobo la fabricacion y se proyecto consumo de material."
      },
      {
        id: "seed-request-event-2b",
        requestId: requestOne.id,
        actorId: users[1].id,
        type: "COMMENT_ADDED",
        summary: "Comentario visible para usuario agregado",
        detail: "Solicitud aprobada para continuar con planificacion y reserva."
      },
      {
        id: "seed-request-event-3",
        requestId: requestTwo.id,
        actorId: users[0].id,
        type: "CREATED",
        summary: "Solicitud creada por usuario",
        detail: "Se adjunto un archivo tecnico para revision."
      },
      {
        id: "seed-request-event-4",
        requestId: requestTwo.id,
        actorId: users[1].id,
        type: "SENT_TO_QUOTATION",
        summary: "Solicitud enviada a cotizacion",
        detail: "Se valida factibilidad tecnica inicial y pasa a cotizacion."
      },
      {
        id: "seed-request-event-5",
        requestId: requestTwo.id,
        actorId: users[1].id,
        type: "STATUS_CHANGED",
        summary: "Estado de solicitud actualizado",
        detail: "Nuevo estado: QUOTED. Estado de cotizacion: READY."
      },
      {
        id: "seed-request-event-6",
        requestId: requestThree.id,
        actorId: users[1].id,
        type: "CORRECTION_REQUESTED",
        summary: "Se solicitaron correcciones al usuario",
        detail: "Se detecto espesor insuficiente en una zona de fijacion."
      },
      {
        id: "seed-request-event-7",
        requestId: requestFour.id,
        actorId: users[2].id,
        type: "SENT_TO_QUOTATION",
        summary: "Solicitud enviada a cotizacion",
        detail: "Se esta calculando costo de material y tiempos de maquina."
      },
      {
        id: "seed-request-event-8",
        requestId: requestFive.id,
        actorId: users[1].id,
        type: "STARTED_PRODUCTION",
        summary: "Solicitud iniciada en fabricacion",
        detail: "Se tomo orden de trabajo para produccion."
      },
      {
        id: "seed-request-event-9",
        requestId: requestSix.id,
        actorId: users[2].id,
        type: "COMPLETED",
        summary: "Solicitud marcada como entregada",
        detail: "Trabajo retirado por el usuario."
      }
    ]
  });

  await (prisma as any).materialMovement.deleteMany({
    where: {
      materialId: {
        in: materials.map((material) => material.id)
      }
    }
  });

  await (prisma as any).materialMovement.createMany({
    data: [
      {
        id: "seed-material-movement-1",
        materialId: materials[0].id,
        actorId: users[2].id,
        createdById: users[2].id,
        type: "ADJUSTMENT",
        quantity: 3.2,
        reason: "Carga inicial de inventario de desarrollo.",
        resultingStockQuantity: 3.2,
        resultingReservedQuantity: 0
      },
      {
        id: "seed-material-movement-2",
        materialId: materials[0].id,
        actorId: users[1].id,
        createdById: users[1].id,
        requestId: requestOne.id,
        relatedRequestId: requestOne.id,
        type: "RESERVE",
        quantity: 1.2,
        reason: "Reserva proyectada para solicitud aprobada.",
        resultingStockQuantity: 3.2,
        resultingReservedQuantity: 1.2
      },
      {
        id: "seed-material-movement-2b",
        materialId: materials[0].id,
        actorId: users[1].id,
        createdById: users[1].id,
        requestId: requestFive.id,
        relatedRequestId: requestFive.id,
        type: "RESERVE",
        quantity: 0.8,
        reason: "Reserva proyectada para solicitud en fabricacion.",
        resultingStockQuantity: 3.2,
        resultingReservedQuantity: 2.0
      },
      {
        id: "seed-material-movement-3",
        materialId: materials[2].id,
        actorId: users[2].id,
        createdById: users[2].id,
        type: "ADJUSTMENT",
        quantity: 2,
        reason: "Carga inicial de inventario de desarrollo.",
        resultingStockQuantity: 2,
        resultingReservedQuantity: 0
      }
    ]
  });

  await prisma.reservation.upsert({
    where: { id: "seed-reservation-fablab-1" },
    update: {
      title: "Impresiones 3D personales",
      startAt: new Date("2026-04-27T16:05:00.000-04:00"),
      endAt: new Date("2026-04-27T16:40:00.000-04:00"),
      status: "CANCELLED",
      notes: "Reserva generada para pruebas de interfaz.",
      description: "",
      blockNumbers: [11],
      userId: users[0].id,
      machineId: machines[0].id,
      projectId: "seed-project-fablab-1",
      requestId: "seed-request-fablab-1"
    },
    create: {
      id: "seed-reservation-fablab-1",
      title: "Impresiones 3D personales",
      startAt: new Date("2026-04-27T16:05:00.000-04:00"),
      endAt: new Date("2026-04-27T16:40:00.000-04:00"),
      status: "CANCELLED",
      notes: "Reserva generada para pruebas de interfaz.",
      description: "",
      blockNumbers: [11],
      userId: users[0].id,
      machineId: machines[0].id,
      projectId: "seed-project-fablab-1",
      requestId: "seed-request-fablab-1"
    }
  });

  await prisma.reservation.upsert({
    where: { id: "seed-reservation-fablab-2" },
    update: {
      title: "Piezas de montaje para instalacion",
      startAt: new Date("2026-05-01T12:15:00.000Z"),
      endAt: new Date("2026-05-01T15:50:00.000Z"),
      status: "CONFIRMED",
      notes: "Reserva asociada a orden en fabricacion.",
      description: "Produccion lote A",
      blockNumbers: [1, 2, 3, 4],
      userId: users[0].id,
      machineId: machines[0].id,
      projectId: "seed-project-fablab-1",
      requestId: "seed-request-fablab-5"
    },
    create: {
      id: "seed-reservation-fablab-2",
      title: "Piezas de montaje para instalacion",
      startAt: new Date("2026-05-01T12:15:00.000Z"),
      endAt: new Date("2026-05-01T15:50:00.000Z"),
      status: "CONFIRMED",
      notes: "Reserva asociada a orden en fabricacion.",
      description: "Produccion lote A",
      blockNumbers: [1, 2, 3, 4],
      userId: users[0].id,
      machineId: machines[0].id,
      projectId: "seed-project-fablab-1",
      requestId: "seed-request-fablab-5"
    }
  });

  await prisma.reservation.upsert({
    where: { id: "seed-reservation-fablab-3" },
    update: {
      title: "Set de senaletica grabada",
      startAt: new Date("2026-04-22T12:15:00.000Z"),
      endAt: new Date("2026-04-22T13:25:00.000Z"),
      status: "COMPLETED",
      notes: "Reserva historica completada.",
      description: "Trabajo ya entregado",
      blockNumbers: [1, 2],
      userId: users[0].id,
      machineId: machines[1].id,
      projectId: "seed-project-fablab-1",
      requestId: "seed-request-fablab-6"
    },
    create: {
      id: "seed-reservation-fablab-3",
      title: "Set de senaletica grabada",
      startAt: new Date("2026-04-22T12:15:00.000Z"),
      endAt: new Date("2026-04-22T13:25:00.000Z"),
      status: "COMPLETED",
      notes: "Reserva historica completada.",
      description: "Trabajo ya entregado",
      blockNumbers: [1, 2],
      userId: users[0].id,
      machineId: machines[1].id,
      projectId: "seed-project-fablab-1",
      requestId: "seed-request-fablab-6"
    }
  });

  await (prisma as any).reservationEvent.deleteMany();
  await (prisma as any).reservationEvent.createMany({
    data: [
      {
        id: "seed-reservation-event-1",
        reservationId: "seed-reservation-fablab-1",
        actorId: users[0].id,
        type: "CANCELLED",
        payloadJson: JSON.stringify({ reason: "Reserva generada para pruebas de interfaz." })
      },
      {
        id: "seed-reservation-event-2",
        reservationId: "seed-reservation-fablab-2",
        actorId: users[1].id,
        type: "STATUS_CHANGED",
        payloadJson: JSON.stringify({ status: "CONFIRMED" })
      },
      {
        id: "seed-reservation-event-3",
        reservationId: "seed-reservation-fablab-3",
        actorId: users[2].id,
        type: "COMPLETED",
        payloadJson: JSON.stringify({ delivered: true })
      }
    ]
  });

  await (prisma as any).machineMaintenanceWindow.deleteMany();

  await (prisma as any).machineMaintenanceWindow.createMany({
    data: [
      {
        id: "seed-maintenance-1",
        machineId: machines[0].id,
        startAt: new Date("2026-05-02T12:30:00.000-04:00"),
        endAt: new Date("2026-05-02T13:40:00.000-04:00"),
        reason: "Mantencion preventiva y calibracion de cama.",
        createdById: users[2].id
      },
      {
        id: "seed-maintenance-2",
        machineId: machines[1].id,
        startAt: new Date("2026-05-05T09:40:00.000-04:00"),
        endAt: new Date("2026-05-05T10:50:00.000-04:00"),
        reason: "Limpieza de optica y prueba de enfoque.",
        createdById: users[2].id
      }
    ]
  });

  await (prisma as any).notification.deleteMany();
  await (prisma as any).auditLog.deleteMany();
  await (prisma as any).passwordResetToken.deleteMany();

  await (prisma as any).notification.createMany({
    data: [
      {
        id: "seed-notification-1",
        userId: users[0].id,
        type: "QUOTATION_READY",
        title: "Cotizacion disponible en FabLab",
        body: "La cotizacion de tu panel frontal ya esta lista para revision.",
        linkUrl: `/mis-solicitudes/${requestTwo.id}`
      },
      {
        id: "seed-notification-2",
        userId: users[0].id,
        type: "CORRECTION_REQUIRED",
        title: "Solicitud con correcciones pendientes",
        body: "El equipo FabLab solicito cambios en el soporte de camara antes de continuar.",
        linkUrl: `/mis-solicitudes/${requestThree.id}`
      },
      {
        id: "seed-notification-3",
        userId: users[1].id,
        type: "SYSTEM",
        title: "Nueva solicitud asignada",
        body: "Tienes solicitudes activas con fecha compromiso cercana.",
        linkUrl: `/staff/solicitudes/${requestFive.id}`
      }
    ]
  });

  await (prisma as any).auditLog.createMany({
    data: [
      {
        id: "seed-audit-1",
        actorId: users[1].id,
        entityType: "service_request",
        entityId: requestFive.id,
        action: "staff_action_start_production",
        payloadJson: JSON.stringify({ status: "IN_PROGRESS" })
      },
      {
        id: "seed-audit-2",
        actorId: users[2].id,
        entityType: "quotation",
        entityId: requestTwo.id,
        action: "upserted",
        payloadJson: JSON.stringify({ totalCost: 29200 })
      }
    ]
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
