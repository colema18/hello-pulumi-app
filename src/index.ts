import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import { initAppConfig, getAppConfigValues } from "./appConfig";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors());

(async () => {
  await initAppConfig();

  app.get("/api/message", (_req, res) => {
    const { message, logo, backgroundColor } = getAppConfigValues();
    res.json({ message, logo, backgroundColor });
  });

  app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
  });
})();
