/**
 * Upload API Routes
 * Handles CSV data uploads for platform data and flat fee contracts
 */

import express from 'express';

const router = express.Router();

/**
 * @typedef {Object} PlatformCsvRow
 * @property {string} date - ISO date string (YYYY-MM-DD)
 * @property {string} brand - Brand name
 * @property {number} weeklyRevenue - Weekly revenue amount
 * @property {number} mtdRevenue - Month-to-date revenue
 * @property {number} mtdGmv - Month-to-date GMV
 * @property {number} targetGmv - Target GMV
 * @property {number} [totalContractRevenue] - Optional total contract revenue
 */

/**
 * @typedef {Object} FlatFeeCsvRow
 * @property {string} partnerName - Partner name
 * @property {string} contractStart - Contract start date (YYYY-MM-DD)
 * @property {string} contractEnd - Contract end date (YYYY-MM-DD)
 * @property {number} totalContractRevenue - Total contract revenue
 */

/**
 * POST /api/upload-platform-data
 * Upload and process platform-specific brand data
 *
 * Request body:
 * {
 *   platformKey: string,  // e.g., 'creator-connections', 'skimlinks', etc.
 *   rows: PlatformCsvRow[]
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   recordsProcessed: number,
 *   platformKey: string
 * }
 */
router.post('/upload-platform-data', async (req, res) => {
  try {
    const { platformKey, rows } = req.body;

    // Validate request
    if (!platformKey || !rows || !Array.isArray(rows)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request: platformKey and rows array required',
      });
    }

    // Validate rows structure
    const requiredFields = ['date', 'brand', 'weeklyRevenue', 'mtdRevenue', 'mtdGmv', 'targetGmv'];
    const invalidRows = rows.filter(row => {
      return !requiredFields.every(field => row.hasOwnProperty(field));
    });

    if (invalidRows.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid row structure: missing required fields in ${invalidRows.length} rows`,
      });
    }

    // TODO: Database persistence logic
    // Example implementation:
    //
    // 1. Normalize platformKey to platform name
    // const platformName = normalizePlatformKey(platformKey);
    //
    // 2. For each row, insert or update in database:
    // await db.platformBrandData.upsert({
    //   where: {
    //     platform_date_brand: {
    //       platform: platformName,
    //       date: row.date,
    //       brand: row.brand
    //     }
    //   },
    //   update: {
    //     weeklyRevenue: row.weeklyRevenue,
    //     mtdRevenue: row.mtdRevenue,
    //     mtdGmv: row.mtdGmv,
    //     targetGmv: row.targetGmv,
    //     totalContractRevenue: row.totalContractRevenue,
    //     updatedAt: new Date()
    //   },
    //   create: {
    //     platform: platformName,
    //     date: row.date,
    //     brand: row.brand,
    //     weeklyRevenue: row.weeklyRevenue,
    //     mtdRevenue: row.mtdRevenue,
    //     mtdGmv: row.mtdGmv,
    //     targetGmv: row.targetGmv,
    //     totalContractRevenue: row.totalContractRevenue,
    //     createdAt: new Date(),
    //     updatedAt: new Date()
    //   }
    // });

    // Mock successful response for now
    console.log(`[Upload] Processing ${rows.length} rows for platform: ${platformKey}`);

    res.json({
      success: true,
      recordsProcessed: rows.length,
      platformKey,
    });

  } catch (error) {
    console.error('Error processing platform data upload:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
});

/**
 * POST /api/upload-flat-fees
 * Upload flat fee contracts and generate weekly allocations
 *
 * Request body:
 * {
 *   rows: FlatFeeCsvRow[]
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   contractsProcessed: number,
 *   weeksGenerated: number
 * }
 */
router.post('/upload-flat-fees', async (req, res) => {
  try {
    const { rows } = req.body;

    // Validate request
    if (!rows || !Array.isArray(rows)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request: rows array required',
      });
    }

    // Validate rows structure
    const requiredFields = ['partnerName', 'contractStart', 'contractEnd', 'totalContractRevenue'];
    const invalidRows = rows.filter(row => {
      return !requiredFields.every(field => row.hasOwnProperty(field));
    });

    if (invalidRows.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid row structure: missing required fields in ${invalidRows.length} rows`,
      });
    }

    // TODO: Process flat fee contracts and generate weekly allocations
    // Example implementation:
    //
    // let totalWeeksGenerated = 0;
    //
    // for (const contract of rows) {
    //   // 1. Parse dates
    //   const startDate = new Date(contract.contractStart);
    //   const endDate = new Date(contract.contractEnd);
    //
    //   // 2. Generate all finance weeks between start and end
    //   const weeks = generateFinanceWeeks(startDate, endDate);
    //
    //   // 3. Calculate weekly allocation
    //   const weeklyRevenue = contract.totalContractRevenue / weeks.length;
    //
    //   // 4. Insert weekly records
    //   for (const week of weeks) {
    //     await db.platformWeeklyData.upsert({
    //       where: {
    //         platform_week: {
    //           platform: contract.partnerName,
    //           weekStart: week.start,
    //           weekEnd: week.end
    //         }
    //       },
    //       update: {
    //         revenue: weeklyRevenue,
    //         category: 'flatfee',
    //         updatedAt: new Date()
    //       },
    //       create: {
    //         platform: contract.partnerName,
    //         weekStart: week.start,
    //         weekEnd: week.end,
    //         revenue: weeklyRevenue,
    //         category: 'flatfee',
    //         totalContractRevenue: contract.totalContractRevenue,
    //         contractStart: contract.contractStart,
    //         contractEnd: contract.contractEnd,
    //         createdAt: new Date(),
    //         updatedAt: new Date()
    //       }
    //     });
    //     totalWeeksGenerated++;
    //   }
    // }

    // Mock successful response for now
    console.log(`[Upload] Processing ${rows.length} flat fee contracts`);

    // Simulate weekly allocation count
    const mockWeeksGenerated = rows.length * 52; // Approximate for annual contracts

    res.json({
      success: true,
      contractsProcessed: rows.length,
      weeksGenerated: mockWeeksGenerated,
    });

  } catch (error) {
    console.error('Error processing flat fee upload:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
});

/**
 * Helper function to generate finance weeks between two dates
 * Finance weeks run Thursday to Wednesday
 *
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Array<{start: Date, end: Date}>}
 */
function generateFinanceWeeks(startDate, endDate) {
  const weeks = [];

  // Find the first Thursday on or after startDate
  let currentDate = new Date(startDate);
  const dayOfWeek = currentDate.getDay();
  const daysUntilThursday = (4 - dayOfWeek + 7) % 7;
  currentDate.setDate(currentDate.getDate() + daysUntilThursday);

  // Generate weeks until we pass endDate
  while (currentDate <= endDate) {
    const weekStart = new Date(currentDate);
    const weekEnd = new Date(currentDate);
    weekEnd.setDate(weekEnd.getDate() + 6); // Wednesday

    weeks.push({
      start: weekStart,
      end: weekEnd
    });

    // Move to next Thursday
    currentDate.setDate(currentDate.getDate() + 7);
  }

  return weeks;
}

/**
 * Helper function to normalize platform keys to display names
 *
 * @param {string} platformKey
 * @returns {string}
 */
function normalizePlatformKey(platformKey) {
  const keyMap = {
    'creator-connections': 'Creator Connections',
    'levanta': 'Levanta',
    'perch': 'Perch',
    'partnerboost': 'PartnerBoost',
    'archer': 'Archer',
    'skimlinks': 'Skimlinks',
    'impact': 'Impact',
    'howl': 'Howl',
    'brandads': 'BrandAds',
    'other-affiliates': 'Other Affiliates',
  };

  return keyMap[platformKey] || platformKey;
}

export default router;
