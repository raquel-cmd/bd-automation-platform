/**
 * AI Agent for BD Automation Platform
 * Uses Anthropic Claude API to provide intelligent business insights
 */

import Anthropic from '@anthropic-ai/sdk';
import prisma from '../db/client.js';
import { getDaysAccounted, getDaysInMonth } from '../utils/dateUtils.js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * System prompt that defines the AI agent's capabilities and context
 */
const SYSTEM_PROMPT = `You are an AI business intelligence assistant for the BD Automation Platform, a revenue tracking system for BestReviews.

Your capabilities:
1. Analyze revenue data across multiple platforms (Creator Connections, Skimlinks, Flat Fee partners, etc.)
2. Provide insights on brand performance and pacing
3. Help with revenue forecasting and trend analysis
4. Answer questions about platform metrics, GMV, and revenue targets
5. Suggest optimization strategies based on data patterns

Platform Categories:
- Attribution: Creator Connections, Levanta, Perch, PartnerBoost, Archer
- Affiliate: Skimlinks, Impact, Howl, BrandAds, Awin, Partnerize, Connexity, Apple
- Flat Fee: Partners with fixed monthly contracts

Key Metrics:
- MTD Revenue: Month-to-date revenue
- MTD GMV: Month-to-date gross merchandise value
- Target GMV: Monthly target for gross merchandise value
- Pacing: Projected performance based on current trajectory
- Weekly Revenue: Revenue generated in the current finance week (Thu-Wed)

Finance Week Logic:
- Weeks run Thursday to Wednesday
- Pacing formula: (MTD Revenue ÷ Days Accounted) × Days Left ÷ Target × 100

When answering questions:
- Be concise and data-driven
- Highlight key insights and actionable recommendations
- Use specific numbers when available
- Format currency values appropriately
- Consider seasonal trends and historical patterns`;

/**
 * Tools available to the AI agent for data retrieval
 */
const AGENT_TOOLS = [
  {
    name: 'get_dashboard_overview',
    description: 'Get overall dashboard summary including total revenue, GMV, targets, and pacing metrics',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_platform_performance',
    description: 'Get detailed performance data for all platforms including top brands, revenue, and pacing',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_brand_details',
    description: 'Get detailed metrics for a specific brand across all platforms',
    input_schema: {
      type: 'object',
      properties: {
        brand_name: {
          type: 'string',
          description: 'The name of the brand to look up',
        },
      },
      required: ['brand_name'],
    },
  },
  {
    name: 'get_top_performers',
    description: 'Get top performing brands by revenue or GMV',
    input_schema: {
      type: 'object',
      properties: {
        metric: {
          type: 'string',
          enum: ['revenue', 'gmv'],
          description: 'The metric to rank by',
        },
        limit: {
          type: 'number',
          description: 'Number of top performers to return (default: 10)',
        },
      },
      required: ['metric'],
    },
  },
  {
    name: 'get_underperforming_brands',
    description: 'Get brands that are below their pacing targets',
    input_schema: {
      type: 'object',
      properties: {
        threshold: {
          type: 'number',
          description: 'Pacing percentage threshold (default: 80, meaning below 80% pacing)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_revenue_by_category',
    description: 'Get revenue breakdown by platform category (attribution, affiliate, flatfee)',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
];

/**
 * Execute a tool call and return the result
 */
async function executeTool(toolName, toolInput) {
  const currentDate = new Date().toISOString().split('T')[0];
  const monthStart = `${currentDate.substring(0, 7)}-01`;
  const daysAccounted = getDaysAccounted();
  const daysInMonth = getDaysInMonth();
  const daysLeft = daysInMonth - daysAccounted;

  switch (toolName) {
    case 'get_dashboard_overview': {
      const metrics = await prisma.platformMetric.findMany({
        where: {
          date: { gte: monthStart, lte: currentDate },
        },
        orderBy: [{ platformKey: 'asc' }, { brand: 'asc' }, { date: 'desc' }],
      });

      const latestBrands = new Map();
      metrics.forEach(metric => {
        const key = `${metric.platformKey}-${metric.brand}`;
        if (!latestBrands.has(key)) {
          latestBrands.set(key, metric);
        }
      });

      const brandsArray = Array.from(latestBrands.values());
      const totalRevenue = brandsArray.reduce((sum, b) => sum + b.mtdRevenue, 0);
      const totalTarget = brandsArray.reduce((sum, b) => sum + b.targetGmv, 0);
      const totalGMV = brandsArray.reduce((sum, b) => sum + b.mtdGmv, 0);

      const overallPacing = (totalTarget > 0 && daysAccounted > 0)
        ? ((totalGMV / daysAccounted) * daysInMonth / totalTarget) * 100
        : 0;

      return {
        totalRevenue,
        totalTarget,
        totalGMV,
        totalBrands: latestBrands.size,
        overallPacing: Math.round(overallPacing * 10) / 10,
        daysAccounted,
        daysInMonth,
        daysLeft,
        currentDate,
      };
    }

    case 'get_platform_performance': {
      const metrics = await prisma.platformMetric.findMany({
        where: {
          date: { gte: monthStart, lte: currentDate },
        },
        orderBy: [{ platformKey: 'asc' }, { brand: 'asc' }, { date: 'desc' }],
      });

      const platformMap = new Map();
      metrics.forEach(metric => {
        if (!platformMap.has(metric.platformKey)) {
          platformMap.set(metric.platformKey, { brands: new Map() });
        }
        const platform = platformMap.get(metric.platformKey);
        if (!platform.brands.has(metric.brand)) {
          platform.brands.set(metric.brand, metric);
        }
      });

      const platforms = [];
      platformMap.forEach((data, platformKey) => {
        const brands = Array.from(data.brands.values());
        const mtdRevenue = brands.reduce((sum, b) => sum + b.mtdRevenue, 0);
        const mtdGmv = brands.reduce((sum, b) => sum + b.mtdGmv, 0);
        const targetGmv = brands.reduce((sum, b) => sum + b.targetGmv, 0);

        const pacing = (targetGmv > 0 && daysAccounted > 0)
          ? ((mtdGmv / daysAccounted) * daysInMonth / targetGmv) * 100
          : 0;

        platforms.push({
          name: platformKey,
          mtdRevenue,
          mtdGmv,
          targetGmv,
          pacing: Math.round(pacing * 10) / 10,
          brandCount: brands.length,
        });
      });

      return { platforms, daysAccounted, daysLeft };
    }

    case 'get_brand_details': {
      const brandName = toolInput.brand_name;
      const metrics = await prisma.platformMetric.findMany({
        where: {
          brand: { contains: brandName, mode: 'insensitive' },
          date: { gte: monthStart, lte: currentDate },
        },
        orderBy: { date: 'desc' },
      });

      if (metrics.length === 0) {
        return { error: `No data found for brand: ${brandName}` };
      }

      const latestByPlatform = new Map();
      metrics.forEach(m => {
        if (!latestByPlatform.has(m.platformKey)) {
          latestByPlatform.set(m.platformKey, m);
        }
      });

      return {
        brandName,
        platforms: Array.from(latestByPlatform.values()).map(m => ({
          platform: m.platformKey,
          mtdRevenue: m.mtdRevenue,
          mtdGmv: m.mtdGmv,
          targetGmv: m.targetGmv,
          weeklyRevenue: m.weeklyRevenue,
          pacing: (m.targetGmv > 0 && daysAccounted > 0)
            ? Math.round(((m.mtdGmv / daysAccounted) * daysInMonth / m.targetGmv) * 1000) / 10
            : 0,
        })),
      };
    }

    case 'get_top_performers': {
      const metric = toolInput.metric || 'revenue';
      const limit = toolInput.limit || 10;

      const metrics = await prisma.platformMetric.findMany({
        where: {
          date: { gte: monthStart, lte: currentDate },
        },
        orderBy: { date: 'desc' },
      });

      const brandTotals = new Map();
      metrics.forEach(m => {
        const key = m.brand;
        if (!brandTotals.has(key)) {
          brandTotals.set(key, { brand: m.brand, mtdRevenue: 0, mtdGmv: 0 });
        }
        const data = brandTotals.get(key);
        data.mtdRevenue += m.mtdRevenue;
        data.mtdGmv += m.mtdGmv;
      });

      const sorted = Array.from(brandTotals.values())
        .sort((a, b) => metric === 'revenue' ? b.mtdRevenue - a.mtdRevenue : b.mtdGmv - a.mtdGmv)
        .slice(0, limit);

      return { topPerformers: sorted, metric, limit };
    }

    case 'get_underperforming_brands': {
      const threshold = toolInput.threshold || 80;

      const metrics = await prisma.platformMetric.findMany({
        where: {
          date: { gte: monthStart, lte: currentDate },
        },
        orderBy: { date: 'desc' },
      });

      const latestBrands = new Map();
      metrics.forEach(m => {
        const key = `${m.platformKey}-${m.brand}`;
        if (!latestBrands.has(key)) {
          latestBrands.set(key, m);
        }
      });

      const underperforming = Array.from(latestBrands.values())
        .map(m => {
          const pacing = (m.targetGmv > 0 && daysAccounted > 0)
            ? ((m.mtdGmv / daysAccounted) * daysInMonth / m.targetGmv) * 100
            : 0;
          return { ...m, pacing };
        })
        .filter(m => m.pacing < threshold && m.targetGmv > 0)
        .sort((a, b) => a.pacing - b.pacing)
        .map(m => ({
          brand: m.brand,
          platform: m.platformKey,
          mtdGmv: m.mtdGmv,
          targetGmv: m.targetGmv,
          pacing: Math.round(m.pacing * 10) / 10,
          gap: m.targetGmv - m.mtdGmv,
        }));

      return { underperformingBrands: underperforming, threshold };
    }

    case 'get_revenue_by_category': {
      const categoryMap = {
        'Creator Connections': 'attribution',
        'Levanta': 'attribution',
        'Perch': 'attribution',
        'PartnerBoost': 'attribution',
        'Archer': 'attribution',
        'Skimlinks': 'affiliate',
        'Impact': 'affiliate',
        'Howl': 'affiliate',
        'BrandAds': 'affiliate',
        'Awin': 'affiliate',
        'Partnerize': 'affiliate',
        'Connexity': 'affiliate',
        'Apple': 'affiliate',
      };

      const metrics = await prisma.platformMetric.findMany({
        where: {
          date: { gte: monthStart, lte: currentDate },
        },
        orderBy: { date: 'desc' },
      });

      const latestBrands = new Map();
      metrics.forEach(m => {
        const key = `${m.platformKey}-${m.brand}`;
        if (!latestBrands.has(key)) {
          latestBrands.set(key, m);
        }
      });

      const flatFeeContracts = await prisma.flatFeeContract.findMany({
        select: { partnerName: true },
        distinct: ['partnerName'],
      });
      const flatFeePlatforms = new Set(flatFeeContracts.map(c => c.partnerName));

      const categories = { attribution: 0, affiliate: 0, flatfee: 0 };
      latestBrands.forEach(m => {
        const category = flatFeePlatforms.has(m.platformKey)
          ? 'flatfee'
          : (categoryMap[m.platformKey] || 'attribution');
        categories[category] += m.mtdRevenue;
      });

      return {
        revenueByCategory: categories,
        total: Object.values(categories).reduce((a, b) => a + b, 0),
      };
    }

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

/**
 * Process a conversation with the AI agent
 * @param {Array} messages - Array of message objects with role and content
 * @returns {Promise<Object>} - Agent response with message and any tool results
 */
export async function processAgentConversation(messages) {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: AGENT_TOOLS,
      messages,
    });

    // Check if the model wants to use tools
    if (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(block => block.type === 'tool_use');
      const toolResults = [];

      for (const toolUse of toolUseBlocks) {
        const result = await executeTool(toolUse.name, toolUse.input);
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: JSON.stringify(result),
        });
      }

      // Continue the conversation with tool results
      const updatedMessages = [
        ...messages,
        { role: 'assistant', content: response.content },
        { role: 'user', content: toolResults },
      ];

      // Recursive call to get the final response
      return processAgentConversation(updatedMessages);
    }

    // Extract text response
    const textContent = response.content.find(block => block.type === 'text');
    return {
      success: true,
      message: textContent ? textContent.text : 'No response generated',
      usage: response.usage,
    };
  } catch (error) {
    console.error('AI Agent error:', error);
    throw error;
  }
}

/**
 * Simple chat function for single-turn conversations
 * @param {string} userMessage - The user's message
 * @returns {Promise<Object>} - Agent response
 */
export async function chat(userMessage) {
  return processAgentConversation([
    { role: 'user', content: userMessage },
  ]);
}

/**
 * Get quick insights without specific user query
 * @returns {Promise<Object>} - Automated insights
 */
export async function getQuickInsights() {
  return chat(
    'Provide a brief executive summary of current business performance. Include: 1) Overall revenue status and pacing, 2) Top 3 performing brands, 3) Any areas of concern, 4) One key recommendation.'
  );
}

export default {
  chat,
  processAgentConversation,
  getQuickInsights,
};
