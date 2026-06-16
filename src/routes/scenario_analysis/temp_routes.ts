import { Router } from "express";
import { getProcessCategoryMaster } from "../../controllers/modules/scenario_analysis/temp_controller";


const router = Router();

router.get("/processmaster/:industryId", getProcessCategoryMaster);


export default router;
