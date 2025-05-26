import { config } from "dotenv";
config();
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "IRFarm API",
      version: "1.0.0",
      description: "A simple Express Inventory Management API",
    },
    servers: [
      {
        url: "http://localhost:3000",
      },
      {
        url: "https://irfarms.infinitibizsol.com",
      },
    ],
    components: {
      securitySchemes: {
        // Bearer Auth (JWT)
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    "./docs/*.js",
    "./docs/user/*.js",
    "./docs/contact/*.js",
    "./docs/common/*.js",
    "./docs/policy/*.js",
  ], // Files containing annotations
};

const specs = swaggerJsDoc(options);

export { swaggerUi, specs };
