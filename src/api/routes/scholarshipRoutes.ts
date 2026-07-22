import { Router } from "express";
import { createScholarship, getScholarships, getScholarshipById, updateScholarship, deleteScholarship, validateEligibility } from "../controllers/scholarshipController.js";
import { authMiddleware, adminOnly } from "../../middleware/auth.js";
import { cacheMiddleware } from "../middlewares/cacheMiddleware.js";

const router = Router();

router.post("/scholarships", authMiddleware, adminOnly, createScholarship);
router.get("/scholarships", cacheMiddleware(300), getScholarships);
router.get("/scholarships/:id", cacheMiddleware(3600, (req: any) => `scholarship:${req.params.id}`), getScholarshipById);
router.put("/scholarships/:id", authMiddleware, adminOnly, updateScholarship);
router.delete("/scholarships/:id", authMiddleware, adminOnly, deleteScholarship);
router.post("/scholarships/validate", authMiddleware, validateEligibility);

export default router;
