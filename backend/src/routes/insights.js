import express from 'express';
import { getTrends, getTopBrands, getTopProducts, getInsightsOverview } from '../controllers/insightsController.js';

const router = express.Router();

router.get('/trends', getTrends);
router.get('/top-brands', getTopBrands);
router.get('/top-products', getTopProducts);
router.get('/overview', getInsightsOverview);

export default router;
