import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

// app will be mounted at /api
const app = new Hono();

// Enable CORS for all routes
app.use("*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "X-Environment"],
}));

// Health check endpoint
app.get("/", (c) => {
  return c.json({ 
    status: "ok", 
    message: "Heinicus API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
});

// Debug endpoint to check tRPC routes
app.get("/debug/routes", (c) => {
  return c.json({
    message: "Available tRPC routes",
    routes: {
      "mechanic.submitVerification": "POST /api/trpc/mechanic.submitVerification",
      "mechanic.getVerificationStatus": "GET /api/trpc/mechanic.getVerificationStatus",
      "mechanic.getAllVerifications": "GET /api/trpc/mechanic.getAllVerifications",
      "mechanic.reviewVerification": "POST /api/trpc/mechanic.reviewVerification",
      "mechanic.getVerificationDetails": "GET /api/trpc/mechanic.getVerificationDetails"
    },
    timestamp: new Date().toISOString()
  });
});

// Mount tRPC router at /trpc
app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
    onError: ({ error, path }) => {
      console.error(`tRPC Error on ${path}:`, error);
    },
  })
);

// Catch-all for debugging
app.all("*", (c) => {
  console.log(`Unhandled request: ${c.req.method} ${c.req.url}`);
  return c.json({ 
    error: "Route not found",
    method: c.req.method,
    path: c.req.url,
    availableRoutes: ["/", "/debug/routes", "/trpc/*"]
  }, 404);
});

export default app;