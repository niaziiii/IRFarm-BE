import { swaggerUi, specs } from "../docs/swagger.js";
import express from "express";

// import swaggerStats from "swagger-stats";

const staticRouteLoader = async (app) => {
  // Swagger-stats middleware

  /* app.use(
    swaggerStats.getMiddleware({
      swaggerSpec: specs, // Reuse the Swagger spec from swagger.js
      uriPath: "/api-stats", // Stats will be accessible at this route
    })
  ); */

  app.use(express.static("public"));

  //Load images and files.
  app.use("/images", express.static("uploads"));
  // Swagger documentation
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

  // Example starter route
  app.use("/starter", (req, res) => {
    res.send("Hello, This is a starter route!! new");
  });
};

export default staticRouteLoader;
