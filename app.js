import loader from "./loaders/index.js";
import { config } from "dotenv";
config();
import express from "express";

const app = express();
import serverRoutes from "./routes/serverRoutes.js";
import globalErrorHandler from "./errors/errorHandler.js";
import routeNotHandler from "./middleware/routeNotFound.js";
import excludedRoutes from "./utils/constants.js";
let { middlewareLoader, excludeJwtAuthRoutes, staticRoutesLoader } = loader;

//App middlewares & load static routes
middlewareLoader(app);
staticRoutesLoader(app);

// routes
app.use(excludeJwtAuthRoutes(excludedRoutes));
app.use("/", serverRoutes);
app.all("*", routeNotHandler);
app.use(globalErrorHandler);

export default app;
