import express from 'express';
import { getOverview, getPlatformPerformance, getBrandsByPlatform } from '../controllers/dashboardController.js';

const router = express.Router();

router.get('/overview', getOverview);
router.get('/platform-performance', getPlatformPerformance);
router.get('/brands/:platform', getBrandsByPlatform);

export default router;
