import { Router } from "express";
import {
  addMyProcess,
  createScenario,
  deleteMyProcess,
  getMyProcess,
  getMyScenarios,
  getProcessCategoryMaster,
  getScenarioDetails,
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
router.post("/scenario-process", saveScenarioProcess);
router.post("/scenario-process/bulk", saveScenarioProcessesBulk);
router.get("/scenario-process/details", getScenarioDetails);


export default router;
