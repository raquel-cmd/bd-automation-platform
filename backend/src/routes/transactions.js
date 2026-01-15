import express from 'express';
import { getAllTransactions, getTransactionById } from '../controllers/transactionsController.js';

const router = express.Router();

router.get('/', getAllTransactions);
router.get('/:id', getTransactionById);

export default router;
