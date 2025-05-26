import { json, urlencoded } from "express";
import cors from "cors";
import xss from "xss-clean";
import mongoSanitize from "express-mongo-sanitize";
import cookieParser from "cookie-parser";
import compression from "compression";
import jwtStrategy from "../config/jwtStrategy.js";
import morgan from "morgan";

const middlewareLoader = (app) => {
  // CORS setup for both HTTP and WebSocket
  app.use(
    cors({
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, Content-Length, X-Requested-With"
    );
    next();
  });

  // Regular middleware setup
  app.use(morgan("dev"));
  app.use(json({ limit: "50mb" }));
  app.use(urlencoded({ extended: true, limit: "50mb" }));
  app.use(cookieParser());
  app.use(mongoSanitize());
  app.use(xss());
  app.use(compression());
  app.use(jwtStrategy.initialize());
};

export default middlewareLoader;
