import bcrypt from "bcrypt";
import { InvoiceStatus, PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();
const TEST_PASSWORD = "Password123!";

type ChildSeed = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  notes?: string;
  parentEmail: string;
};

async function main() {
  const organization = await prisma.organization.upsert({
    where: { name: "Dolbeare Elementary School" },
    update: {},
    create: { name: "Dolbeare Elementary School" },
  });
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

  const users = [
    {
      firstName: "Abby",
      lastName: "Chapman",
      email: "admin@test.com",
      role: UserRole.ADMIN,
    },
    {
      firstName: "Jordan",
      lastName: "Lee",
      email: "staff@test.com",
      role: UserRole.STAFF,
    },
    {
      firstName: "Elena",
      lastName: "Rivera",
      email: "parent@test.com",
      role: UserRole.PARENT,
    },
    {
      firstName: "Sarah",
      lastName: "Smith",
      email: "sarah.parent@test.com",
      role: UserRole.PARENT,
    },
    {
      firstName: "Marcus",
      lastName: "Johnson",
      email: "marcus.parent@test.com",
      role: UserRole.PARENT,
    },
    {
      firstName: "Priya",
      lastName: "Patel",
      email: "priya.parent@test.com",
      role: UserRole.PARENT,
    },
  ];

  const userByEmail = new Map<string, Awaited<ReturnType<typeof prisma.user.upsert>>>();
  for (const user of users) {
    const savedUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        firstName: user.firstName,
        lastName: user.lastName,
        passwordHash,
        role: user.role,
        organizationId: organization.id,
      },
      create: {
        ...user,
        passwordHash,
        organizationId: organization.id,
      },
    });
    userByEmail.set(user.email, savedUser);
  }

  const childSeeds: ChildSeed[] = [
    {
      firstName: "Emma",
      lastName: "Rivera",
      dateOfBirth: "2020-05-12",
      notes: "Peanut allergy",
      parentEmail: "parent@test.com",
    },
    {
      firstName: "Mateo",
      lastName: "Rivera",
      dateOfBirth: "2022-01-21",
      notes: "Enjoys music and building blocks",
      parentEmail: "parent@test.com",
    },
    {
      firstName: "Noah",
      lastName: "Smith",
      dateOfBirth: "2021-09-03",
      notes: "Asthma inhaler stored in classroom office",
      parentEmail: "sarah.parent@test.com",
    },
    {
      firstName: "Ava",
      lastName: "Johnson",
      dateOfBirth: "2020-11-17",
      notes: "Vegetarian meals",
      parentEmail: "marcus.parent@test.com",
    },
    {
      firstName: "Liam",
      lastName: "Johnson",
      dateOfBirth: "2023-02-08",
      notes: "Afternoon nap at 1:00 PM",
      parentEmail: "marcus.parent@test.com",
    },
    {
      firstName: "Maya",
      lastName: "Patel",
      dateOfBirth: "2021-04-25",
      notes: "No known allergies",
      parentEmail: "priya.parent@test.com",
    },
    {
      firstName: "Lucas",
      lastName: "Nguyen",
      dateOfBirth: "2022-07-14",
      notes: "Speech therapy on Wednesdays",
      parentEmail: "priya.parent@test.com",
    },
    {
      firstName: "Sophia",
      lastName: "Brown",
      dateOfBirth: "2020-08-30",
      notes: "Emergency contact information verified",
      parentEmail: "sarah.parent@test.com",
    },
  ];

  const childByName = new Map<string, Awaited<ReturnType<typeof prisma.childProfile.create>>>();
  for (const childSeed of childSeeds) {
    const existing = await prisma.childProfile.findFirst({
      where: {
        firstName: childSeed.firstName,
        lastName: childSeed.lastName,
        organizationId: organization.id,
      },
    });
    const child = existing
      ? await prisma.childProfile.update({
          where: { id: existing.id },
          data: {
            dateOfBirth: new Date(`${childSeed.dateOfBirth}T00:00:00.000Z`),
            notes: childSeed.notes,
            archived: false,
          },
        })
      : await prisma.childProfile.create({
          data: {
            firstName: childSeed.firstName,
            lastName: childSeed.lastName,
            dateOfBirth: new Date(`${childSeed.dateOfBirth}T00:00:00.000Z`),
            notes: childSeed.notes,
            organizationId: organization.id,
          },
        });

    childByName.set(`${child.firstName} ${child.lastName}`, child);
    const parent = userByEmail.get(childSeed.parentEmail);
    if (!parent) throw new Error(`Missing seeded parent ${childSeed.parentEmail}`);

    await prisma.parentChildLink.upsert({
      where: {
        parentId_childProfileId: {
          parentId: parent.id,
          childProfileId: child.id,
        },
      },
      update: {},
      create: {
        parentId: parent.id,
        childProfileId: child.id,
      },
    });
  }

  const scheduleSeeds = [
    {
      title: "Preschool Art Class",
      description: "Painting and mixed-media activities.",
      startTime: "2026-08-03T17:00:00.000Z",
      endTime: "2026-08-03T18:00:00.000Z",
      location: "Room 2",
      children: ["Emma Rivera", "Ava Johnson", "Sophia Brown"],
    },
    {
      title: "Family Picnic",
      description: "Families are invited to bring a picnic lunch.",
      startTime: "2026-08-07T15:00:00.000Z",
      endTime: "2026-08-07T17:00:00.000Z",
      location: "Playground",
      children: childSeeds.map(({ firstName, lastName }) => `${firstName} ${lastName}`),
    },
    {
      title: "Reading Circle",
      description: "Weekly stories and early literacy activities.",
      startTime: "2026-08-11T14:00:00.000Z",
      endTime: "2026-08-11T14:45:00.000Z",
      location: "Library",
      children: ["Emma Rivera", "Noah Smith", "Maya Patel"],
    },
    {
      title: "Toddler Music and Movement",
      description: "Songs, instruments, and guided movement.",
      startTime: "2026-08-12T13:30:00.000Z",
      endTime: "2026-08-12T14:15:00.000Z",
      location: "Multipurpose Room",
      children: ["Mateo Rivera", "Liam Johnson", "Lucas Nguyen"],
    },
    {
      title: "Parent-Teacher Check-In",
      description: "Short progress conversations with classroom staff.",
      startTime: "2026-08-14T19:00:00.000Z",
      endTime: "2026-08-14T21:00:00.000Z",
      location: "Main Office",
      children: childSeeds.map(({ firstName, lastName }) => `${firstName} ${lastName}`),
    },
    {
      title: "Outdoor Discovery Day",
      description: "Nature walk and outdoor science activities.",
      startTime: "2026-08-18T14:00:00.000Z",
      endTime: "2026-08-18T16:00:00.000Z",
      location: "School Garden",
      children: ["Emma Rivera", "Noah Smith", "Ava Johnson", "Maya Patel"],
    },
  ];

  for (const scheduleSeed of scheduleSeeds) {
    const startTime = new Date(scheduleSeed.startTime);
    const existing = await prisma.scheduleEntry.findFirst({
      where: {
        title: scheduleSeed.title,
        startTime,
        organizationId: organization.id,
      },
    });
    const childProfileIds = scheduleSeed.children.map((name) => {
      const child = childByName.get(name);
      if (!child) throw new Error(`Missing seeded child ${name}`);
      return child.id;
    });
    const scheduleData = {
      title: scheduleSeed.title,
      description: scheduleSeed.description,
      startTime,
      endTime: new Date(scheduleSeed.endTime),
      location: scheduleSeed.location,
      organizationId: organization.id,
    };

    if (existing) {
      await prisma.scheduleEntry.update({
        where: { id: existing.id },
        data: {
          ...scheduleData,
          assignments: {
            deleteMany: {},
            create: childProfileIds.map((childProfileId) => ({
              childProfileId,
            })),
          },
        },
      });
    } else {
      await prisma.scheduleEntry.create({
        data: {
          ...scheduleData,
          assignments: {
            create: childProfileIds.map((childProfileId) => ({
              childProfileId,
            })),
          },
        },
      });
    }
  }

  const invoiceSeeds = [
    {
      invoiceNumber: "INV-2026-1001",
      childName: "Emma Rivera",
      amountCents: 125000,
      dueDate: "2026-08-15",
      status: InvoiceStatus.SENT,
      description: "August preschool tuition",
    },
    {
      invoiceNumber: "INV-2026-1002",
      childName: "Mateo Rivera",
      amountCents: 98000,
      dueDate: "2026-08-15",
      status: InvoiceStatus.PAID,
      description: "August toddler program tuition",
    },
    {
      invoiceNumber: "INV-2026-1003",
      childName: "Noah Smith",
      amountCents: 125000,
      dueDate: "2026-07-15",
      status: InvoiceStatus.OVERDUE,
      description: "July preschool tuition",
    },
    {
      invoiceNumber: "INV-2026-1004",
      childName: "Ava Johnson",
      amountCents: 125000,
      dueDate: "2026-08-15",
      status: InvoiceStatus.SENT,
      description: "August preschool tuition",
    },
    {
      invoiceNumber: "INV-2026-1005",
      childName: "Liam Johnson",
      amountCents: 98000,
      dueDate: "2026-08-15",
      status: InvoiceStatus.DRAFT,
      description: "August toddler program tuition",
    },
    {
      invoiceNumber: "INV-2026-1006",
      childName: "Maya Patel",
      amountCents: 4500,
      dueDate: "2026-08-10",
      status: InvoiceStatus.PAID,
      description: "Field trip activity fee",
    },
  ];

  for (const invoiceSeed of invoiceSeeds) {
    const child = childByName.get(invoiceSeed.childName);
    if (!child) throw new Error(`Missing seeded child ${invoiceSeed.childName}`);

    await prisma.invoice.upsert({
      where: {
        organizationId_invoiceNumber: {
          organizationId: organization.id,
          invoiceNumber: invoiceSeed.invoiceNumber,
        },
      },
      update: {
        amountCents: invoiceSeed.amountCents,
        dueDate: new Date(`${invoiceSeed.dueDate}T00:00:00.000Z`),
        status: invoiceSeed.status,
        description: invoiceSeed.description,
        childProfileId: child.id,
        paidAt:
          invoiceSeed.status === InvoiceStatus.PAID ? new Date() : null,
      },
      create: {
        organizationId: organization.id,
        childProfileId: child.id,
        invoiceNumber: invoiceSeed.invoiceNumber,
        amountCents: invoiceSeed.amountCents,
        dueDate: new Date(`${invoiceSeed.dueDate}T00:00:00.000Z`),
        status: invoiceSeed.status,
        description: invoiceSeed.description,
        paidAt:
          invoiceSeed.status === InvoiceStatus.PAID ? new Date() : null,
      },
    });
  }

  const enrollmentSeeds = [
    {
      parentName: "Olivia Davis",
      email: "olivia.davis@example.com",
      phone: "555-0101",
      childName: "Ethan Davis",
      childAge: 4,
      requestedStartDate: "2026-08-15",
      requestedProgram: "Preschool",
      requestedAttendanceDays: ["MONDAY", "WEDNESDAY", "FRIDAY"],
      siblingEnrolled: false,
      message: "Interested in the preschool program.",
      status: "NEW",
    },
    {
      parentName: "Daniel Wilson",
      email: "daniel.wilson@example.com",
      phone: "555-0102",
      childName: "Harper Wilson",
      childAge: 3,
      requestedStartDate: "2026-09-01",
      requestedProgram: "Preschool",
      requestedAttendanceDays: ["TUESDAY", "THURSDAY"],
      siblingEnrolled: true,
      message: "Would like to schedule a tour.",
      status: "CONTACTED",
    },
    {
      parentName: "Grace Kim",
      email: "grace.kim@example.com",
      phone: "555-0103",
      childName: "Leo Kim",
      childAge: 2,
      requestedStartDate: "2026-08-20",
      requestedProgram: "Toddler",
      requestedAttendanceDays: ["MONDAY", "WEDNESDAY", "FRIDAY"],
      siblingEnrolled: false,
      message: "Asking about toddler availability.",
      status: "NEW",
    },
    {
      parentName: "Michael Garcia",
      email: "michael.garcia@example.com",
      phone: "555-0104",
      childName: "Isabella Garcia",
      childAge: 5,
      requestedStartDate: "2026-09-08",
      requestedProgram: "Pre-K",
      requestedAttendanceDays: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
      siblingEnrolled: false,
      message: "Needs information about fall enrollment.",
      status: "CONTACTED",
    },
    {
      parentName: "Rachel Thompson",
      email: "rachel.thompson@example.com",
      phone: "555-0105",
      childName: "Henry Thompson",
      childAge: 3,
      requestedStartDate: "2026-08-25",
      requestedProgram: "Preschool",
      requestedAttendanceDays: ["MONDAY", "WEDNESDAY", "FRIDAY"],
      siblingEnrolled: false,
      message: "Interested in part-time care.",
      status: "NEW",
    },
    {
      parentName: "James Anderson",
      email: "james.anderson@example.com",
      phone: "555-0106",
      childName: "Mia Anderson",
      childAge: 4,
      requestedStartDate: "2026-08-10",
      requestedProgram: "Preschool",
      requestedAttendanceDays: ["MONDAY", "WEDNESDAY", "FRIDAY"],
      siblingEnrolled: true,
      message: "Requested tuition and schedule details.",
      status: "ENROLLED",
    },
  ];

  for (const request of enrollmentSeeds) {
    const existing = await prisma.enrollmentRequest.findFirst({
      where: {
        email: request.email,
        childName: request.childName,
      },
    });
    if (existing) {
      await prisma.enrollmentRequest.update({
        where: { id: existing.id },
        data: {
          ...request,
          requestedStartDate: new Date(`${request.requestedStartDate}T00:00:00.000Z`),
          organizationId: organization.id,
        },
      });
    } else {
      await prisma.enrollmentRequest.create({
        data: {
          ...request,
          requestedStartDate: new Date(`${request.requestedStartDate}T00:00:00.000Z`),
          organizationId: organization.id,
        },
      });
    }
  }

  const capacitySeeds = [
    {
      programName: "Toddler",
      minimumAgeYears: 1,
      maximumAgeYears: 2,
      supportedAttendanceDays: ["MONDAY", "WEDNESDAY", "FRIDAY"],
      totalCapacity: 8,
      occupiedSeats: 7,
    },
    {
      programName: "Preschool",
      minimumAgeYears: 3,
      maximumAgeYears: 4,
      supportedAttendanceDays: [
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
      ],
      totalCapacity: 18,
      occupiedSeats: 15,
    },
    {
      programName: "Pre-K",
      minimumAgeYears: 4,
      maximumAgeYears: 5,
      supportedAttendanceDays: [
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
      ],
      totalCapacity: 16,
      occupiedSeats: 15,
    },
  ];
  const effectiveDate = new Date("2026-08-01T00:00:00.000Z");
  for (const capacity of capacitySeeds) {
    await prisma.programCapacity.upsert({
      where: {
        organizationId_programName_effectiveDate: {
          organizationId: organization.id,
          programName: capacity.programName,
          effectiveDate,
        },
      },
      update: capacity,
      create: { ...capacity, organizationId: organization.id, effectiveDate },
    });
  }

  console.log("Demo seed completed successfully.");
  console.log(`Users: ${users.length}`);
  console.log(`Active children: ${childSeeds.length}`);
  console.log(`Schedule entries: ${scheduleSeeds.length}`);
  console.log(`Enrollment requests: ${enrollmentSeeds.length}`);
  console.log(`Program capacities: ${capacitySeeds.length}`);
  console.log(`All test accounts use password: ${TEST_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
