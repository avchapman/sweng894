import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "BrightPath API",
      version: "1.0.0",
      description:
        "REST API for the BrightPath Childcare Management Platform. Supports authentication, organization management, child profiles, and enrollment workflows.",
      contact: {
        name: "Abby Chapman",
        email: "avc6698@psu.edu",
      },
      license: {
        name: "Academic Capstone Project",
      },
    },
    servers: [
      {
        url: "http://localhost:4000",
        description: "Local development server",
      },
    ],
    tags: [
      {
        name: "Authentication",
        description: "Login and JWT authentication endpoints.",
      },
      {
        name: "Child Profiles",
        description:
          "Protected endpoints for managing child profiles within an organization.",
      },
      {
        name: "Enrollment",
        description: "Public and administrative enrollment inquiry endpoints.",
      },
      {
        name: "Schedules",
        description:
          "Protected organization-scoped scheduling and calendar endpoints.",
      },
      {
        name: "Organizations",
        description:
          "Organization-level data management and access separation.",
      },
      {
        name: "System",
        description: "Health checks and system-level endpoints.",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "Enter your JWT token only. Swagger will automatically add the Bearer prefix.",
        },
      },
      schemas: {
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              example: "admin@test.com",
            },
            password: {
              type: "string",
              example: "Password123!",
            },
          },
        },
        LoginResponse: {
          type: "object",
          properties: {
            token: {
              type: "string",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            },
            user: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  example: "29bacfd5-d8ef-4325-b123-3ed6fe1c05b7",
                },
                firstName: {
                  type: "string",
                  example: "Abby",
                },
                lastName: {
                  type: "string",
                  example: "Chapman",
                },
                email: {
                  type: "string",
                  example: "admin@test.com",
                },
                role: {
                  type: "string",
                  example: "ADMIN",
                },
                organizationId: {
                  type: "string",
                  example: "88f476b3-b015-4948-97ea-231426060853",
                },
                organizationName: {
                  type: "string",
                  example: "Dolbeare Elementary School",
                },
              },
            },
          },
        },
        ChildProfile: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "b7d2e07d-7f02-4d77-a7b1-b634d9d60f91",
            },
            firstName: {
              type: "string",
              example: "Emma",
            },
            lastName: {
              type: "string",
              example: "Smith",
            },
            dateOfBirth: {
              type: "string",
              format: "date-time",
              example: "2020-05-12T00:00:00.000Z",
            },
            notes: {
              type: "string",
              example: "Peanut allergy",
            },
            archived: {
              type: "boolean",
              example: false,
            },
            organizationId: {
              type: "string",
              example: "88f476b3-b015-4948-97ea-231426060853",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        ChildProfileCreateRequest: {
          type: "object",
          required: ["firstName", "lastName"],
          properties: {
            firstName: {
              type: "string",
              example: "Emma",
            },
            lastName: {
              type: "string",
              example: "Smith",
            },
            dateOfBirth: {
              type: "string",
              format: "date",
              example: "2020-05-12",
            },
            notes: {
              type: "string",
              example: "Peanut allergy",
            },
          },
        },
        ScheduleEntryRequest: {
          type: "object",
          required: ["title", "startTime", "endTime"],
          properties: {
            title: {
              type: "string",
              example: "Preschool Art Class",
            },
            description: {
              type: "string",
              example: "Weekly art activity for the preschool group.",
            },
            startTime: {
              type: "string",
              format: "date-time",
              example: "2026-08-03T13:00:00.000Z",
            },
            endTime: {
              type: "string",
              format: "date-time",
              example: "2026-08-03T14:00:00.000Z",
            },
            location: {
              type: "string",
              example: "Room 2",
            },
            childProfileIds: {
              type: "array",
              items: { type: "string" },
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Invalid email or password.",
            },
          },
        },
      },
    },
  },
  apis: ["./src/modules/**/*.ts", "./src/app.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
