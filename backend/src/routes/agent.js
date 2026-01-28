/**
 * AI Agent Routes
 * API endpoints for interacting with the AI business intelligence agent
 */

import express from 'express';
import {
  sendMessage,
  continueConversation,
  getInsights,
  getStatus,
  analyzeData,
} from '../controllers/agentController.js';

const router = express.Router();

// GET /api/agent/status - Check agent availability
router.get('/status', getStatus);

// GET /api/agent/insights - Get automated quick insights
router.get('/insights', getInsights);

// POST /api/agent/chat - Send a single message
router.post('/chat', sendMessage);

// POST /api/agent/conversation - Continue multi-turn conversation
router.post('/conversation', continueConversation);

// POST /api/agent/analyze - Perform specific analysis
router.post('/analyze', analyzeData);

export default router;
