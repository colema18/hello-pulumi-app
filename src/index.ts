import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import { initAppConfig, getAppConfigValue } from "./appConfig";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors());

(async () => {
  await initAppConfig(); // Wait for first fetch

  app.get("/api/message", (_req, res) => {
    res.json({ message: getAppConfigValue() });
  });

  app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
  });
})();
