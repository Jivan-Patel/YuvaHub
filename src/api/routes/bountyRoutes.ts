import { Router } from "express";
import { getBounties, createBounty, acceptBounty, resolveBounty, rateBounty, getLeaderboard } from "../controllers/bountyController.js";
import { authMiddleware } from "../../middleware/auth.js";

const router = Router();

router.get("/bounties", getBounties);
router.post("/bounties", authMiddleware, createBounty);
router.post("/bounties/:id/accept", authMiddleware, acceptBounty);
router.post("/bounties/:id/resolve", authMiddleware, resolveBounty);
router.post("/bounties/:id/rate", authMiddleware, rateBounty);
router.get("/bounties/leaderboard", getLeaderboard);

export default router;
