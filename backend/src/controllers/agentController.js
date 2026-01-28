/**
 * AI Agent Controller
 * Handles API endpoints for AI agent interactions
 */

import { chat, processAgentConversation, getQuickInsights } from '../lib/aiAgent.js';

/**
 * POST /api/agent/chat
 * Send a message to the AI agent
 */
export const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Message is required and must be a string',
      });
    }

    const response = await chat(message);

    res.json({
      success: true,
      response: response.message,
      usage: response.usage,
    });
  } catch (error) {
    console.error('Agent chat error:', error);

    // Handle specific API errors
    if (error.status === 401) {
      return res.status(500).json({
        success: false,
        error: 'AI service authentication failed. Please check API configuration.',
      });
    }

    if (error.status === 429) {
      return res.status(429).json({
        success: false,
        error: 'AI service rate limit exceeded. Please try again later.',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to process message',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * POST /api/agent/conversation
 * Continue a multi-turn conversation with the AI agent
 */
export const continueConversation = async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: 'Messages array is required',
      });
    }

    // Validate message format
    const isValidFormat = messages.every(
      msg => msg.role && ['user', 'assistant'].includes(msg.role) && msg.content
    );

    if (!isValidFormat) {
      return res.status(400).json({
        success: false,
        error: 'Invalid message format. Each message must have role (user/assistant) and content.',
      });
    }

    const response = await processAgentConversation(messages);

    res.json({
      success: true,
      response: response.message,
      usage: response.usage,
    });
  } catch (error) {
    console.error('Agent conversation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process conversation',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * GET /api/agent/insights
 * Get automated quick insights from the AI agent
 */
export const getInsights = async (req, res) => {
  try {
    const response = await getQuickInsights();

    res.json({
      success: true,
      insights: response.message,
      usage: response.usage,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Agent insights error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate insights',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * GET /api/agent/status
 * Check AI agent availability and configuration
 */
export const getStatus = async (req, res) => {
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;

  res.json({
    success: true,
    status: hasApiKey ? 'configured' : 'unconfigured',
    message: hasApiKey
      ? 'AI Agent is ready to use'
      : 'ANTHROPIC_API_KEY environment variable is not set',
    capabilities: [
      'Dashboard overview analysis',
      'Platform performance insights',
      'Brand performance tracking',
      'Top performers identification',
      'Underperforming brand detection',
      'Revenue category breakdown',
      'Business recommendations',
    ],
  });
};

/**
 * POST /api/agent/analyze
 * Perform specific analysis based on type
 */
export const analyzeData = async (req, res) => {
  try {
    const { analysisType } = req.body;

    const analysisPrompts = {
      performance: 'Analyze overall platform performance. What are the key trends and how are we tracking against targets?',
      brands: 'Identify the top performing and underperforming brands. What patterns do you see?',
      forecast: 'Based on current pacing, forecast end-of-month revenue. What adjustments could improve outcomes?',
      opportunities: 'Identify growth opportunities across all platforms. Where should we focus efforts?',
      risks: 'What are the current business risks based on the data? Which brands or platforms need immediate attention?',
    };

    const prompt = analysisPrompts[analysisType];

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Invalid analysis type',
        validTypes: Object.keys(analysisPrompts),
      });
    }

    const response = await chat(prompt);

    res.json({
      success: true,
      analysisType,
      analysis: response.message,
      usage: response.usage,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Agent analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform analysis',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
