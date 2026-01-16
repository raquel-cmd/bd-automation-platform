import express from 'express';
import { uploadCSV, getMerchants, getAvailableMonths } from '../controllers/skimlinksController.js';

const router = express.Router();

router.post('/upload', uploadCSV);
router.get('/merchants', getMerchants);
router.get('/months', getAvailableMonths);

export default router;
