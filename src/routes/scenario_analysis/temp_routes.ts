import { Router } from "express";
import {
  addMyProcess,
  createScenario,
  deleteMyProcess,
  deleteScenario,
  getAIWorkspaceSnapshot,
  getMyProcess,
  getMyScenarios,
  getProcessCategoryMaster,
  getScenarioDetails,
  generateAIInsights,
  saveWorkspaceSection,
  saveScenarioProcess,
  saveScenarioProcessesBulk,
} from "../../controllers/modules/scenario_analysis/temp_controller";


const router = Router();

router.get("/processmaster/:industryId", getProcessCategoryMaster);
router.get("/myprocess", getMyProcess);
router.post("/myprocess", addMyProcess);
router.delete("/myprocess", deleteMyProcess);
router.get("/scenario", getMyScenarios);
router.post("/scenario", createScenario);
router.delete("/scenario/:scenarioId", deleteScenario);
router.post("/scenario-process", saveScenarioProcess);
router.post("/scenario-process/bulk", saveScenarioProcessesBulk);
router.get("/scenario-process/details", getScenarioDetails);

// ---------------------------    AI Workspace Routes  ------------------------------------- //
router.post("/scenario/:scenarioId/:tenantId/:userId/ai-insights/generate", generateAIInsights);
router.get("/scenario/:scenarioId/:tenantId/:userId/workspace", getAIWorkspaceSnapshot);
router.put("/scenario/:scenarioId/:tenantId/:userId/workspace/:section", saveWorkspaceSection);

export default router;
