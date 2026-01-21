import express from 'express';
import {
  getOverview,
  getPlatformPerformance,
  getBrandsByPlatform,
  getWeeklyRevenue,
} from '../controllers/dashboardController.js';

const router = express.Router();

router.get('/overview', getOverview);
router.get('/platform-performance', getPlatformPerformance);
router.get('/weekly-revenue', getWeeklyRevenue);
router.get('/brands/:platform', getBrandsByPlatform);

export default router;
