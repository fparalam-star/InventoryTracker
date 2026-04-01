// @ts-nocheck
import express from "express";
import { registerRoutes } from "../server/routes";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

let initialized = false;

export default async function handler(req: any, res: any) {
  if (!initialized) {
    await registerRoutes(app);
    initialized = true;
  }
  return app(req, res);
}
// @ts-nocheck
