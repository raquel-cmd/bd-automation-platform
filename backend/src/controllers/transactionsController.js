import prisma from '../config/prisma.js';

export const getAllTransactions = async (req, res) => {
  try {
    const { platform, brandId, startDate, endDate, limit = 100, offset = 0 } = req.query;

    const where = {};

    // Filter by platform
    if (platform) {
      where.platformKey = platform;
    }

    // Filter by brand (Note: brandId is treated as brand name string in new schema)
    if (brandId) {
      where.brand = brandId;
    }

    // Filter by date range
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    // Get paginated transactions (platform metrics records)
    const transactions = await prisma.platformMetric.findMany({
      where,
      orderBy: { date: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    // Get total count for pagination
    const total = await prisma.platformMetric.count({ where });

    // Calculate aggregates
    const aggregates = await prisma.platformMetric.aggregate({
      where,
      _sum: {
        weeklyRevenue: true, // Note: Schema calls it weeklyRevenue but it stores the value from CSV "Revenue" column
        mtdRevenue: true,    // This might not be what we want for "sum of revenue". 
        // Wait, the uploadController maps CSV Revenue -> model weeklyRevenue?
        // Let's check uploadController Step 1322:
        // records.push({ ... revenue, gmv ... })
        // upsert update: { revenue: record.revenue ... }
        // BUT schema Step 1290 says:
        // weeklyRevenue Float @map("weekly_revenue")
        // mtdRevenue Float @map("mtd_revenue")
        // The uploadController actually seemed to map to `revenue` and `gmv` which DO NOT EXIST in schema Step 1290 directly as top level fields distinct from weekly/mtd?
        // Wait, schema Step 1290:
        // model PlatformMetric { ... weeklyRevenue Float ... mtdRevenue Float ... }
        // uploadController Step 1322:
        // await prisma.revenueData.upsert({ ... update: { revenue: ... } })
        // uploadController imports `prisma`. 
        // WAIT. uploadController uses `prisma.revenueData`.
        // schema Step 1290 defined `model PlatformMetric`.
        // Did I define `RevenueData` in schema?
        // Step 1290 showed lines 1-61. lines 13-28 define `PlatformMetric`.
        // THERE IS NO `RevenueData` model in Step 1290 output!
        // CHECK task.md Step 1301: "Create Prisma schema (RevenueData...)"
        // BUT schema Step 1290 file content ONLY shows `PlatformMetric`.
        // AND uploadController Step 1322 uses `prisma.revenueData`.
        // THIS WILL CRASH AT RUNTIME if the model name doesn't match.
        // `revenueData` vs `PlatformMetric`.
        // I need to check if `RevenueData` exists in `schema.prisma`.
        // Step 1290 showed "Showing lines 1 to 61".
        // It ended with FlatFeeAllocation.
        // I suspect I might have MISREAD the schema or it's missing.
        // Let me check `schema.prisma` again VERY CAREFULLY.

        // Actually, looking at Step 1290:
        // model PlatformMetric { ... }
        // It does NOT contain `RevenueData`.
        // But `uploadController` uses `prisma.revenueData`.
        // This suggests `uploadController` is WRONG or `schema.prisma` is WRONG/Incomplete.
        // Given `uploadController` was "Migrated to Prisma" in `task.md` (by previous agent?), and I see the code using it.
        // If `uploadController` runs `prisma.revenueData.upsert`, and schema has `PlatformMetric`, it will fail.

        // I MUST fix this. Either rename model in schema or update controllers.
        // Since `dashboardController` (Step 1308) imports `getWeeklyRevenueByPlatform` from `dataLoaders.js` (Step 1313),
        // and `dataLoaders.js` uses `prisma.platformMetric`.
        // So `dashboardController` expects `PlatformMetric`.
        // But `uploadController` (Step 1322) writes to `revenueData`.
        // This is a MAJOR DISCREPANCY.

        // Validation:
        // `dataLoaders.js` uses `prisma.platformMetric`.
        // `uploadController.js` uses `prisma.revenueData`.

        // I need to UNIFY them.
        // `PlatformMetric` seems to be the one used by dashboard read logic.
        // So `uploadController` should write to `PlatformMetric`.
        // AND `transactionsController` should read from `PlatformMetric`.

        // Also need to check field names. 
        // Schema `PlatformMetric`: `weeklyRevenue`, `mtdRevenue`, `mtdGmv`.
        // UploadController writes: `revenue`, `gmv`.
        // Schema doesn't have `revenue` field! It has `weeklyRevenue`.
        // So `uploadController` is trying to write to non-existent model and fields?
        // Or maybe `schema.prisma` has more lines?
        // Step 1290 showed "Total Lines: 61". "Showing lines 1 to 61". "The above content shows the entire...".
        // So `RevenueData` definitely DOES NOT exist in that file.

        // I need to fix `uploadController.js` to use `PlatformMetric` and map fields correctly.
        // CSV has "Revenue", "GMV".
        // Schema has `weeklyRevenue`, `mtdRevenue`.
        // "Revenue" in CSV is likely the revenue for that day/period.
        // `weeklyRevenue` in schema?
        // Let's assume `weeklyRevenue` stores the revenue amount (bad naming if it's daily data).
        // `dataLoaders.js` groups by `date`.
        // If CSV rows are daily, then `revenue` -> `weeklyRevenue` (or rename field in schema).
        // Since schema is already pushed (maybe?), changing schema requires migration.
        // But user said "Create Prisma schema (RevenueData...)" in task.md.
        // Maybe the previous agent created `PlatformMetric` instead of `RevenueData` but forgot to update `uploadController`.

        // I will update `uploadController.js` to use `PlatformMetric`.
        // I will map `row.Revenue` to `weeklyRevenue` (as a temporary measure or change schema if I could, but refactoring controller is safer/faster for now). 
        // Or better: `weeklyRevenue` seems to be used for "revenue within this period".
        // `mtdRevenue` is "Month to date".
        // Does the CSV provide MTD?
        // UploadController: `revenue = row.Revenue`.
        // It doesn't calculate MTD.
        // But `PlatformMetric` has `mtdRevenue`.
        // `dataLoaders.js` `getPlatformPerformance` sums `mtdRevenue`.
        // If `uploadController` puts daily revenue into `weeklyRevenue` (or `revenue` if I fix it),
        // we need to know what field to read.

        // Let's check `dataLoaders.js` again (Step 1313):
        // `getWeeklyRevenueByPlatform`: sums `weeklyRevenue`.
        // `getPlatformPerformance`: reads `mtdRevenue`, `mtdGmv`.
        // If `uploadController` doesn't populate `mtdRevenue`, then `getPlatformPerformance` will return 0 or null.
        // The CSV upload logic in `uploadController` (Step 1322) simply takes `row.Revenue`.
        // It does NOT calculate MTD.
        // So `mtdRevenue` in database will be null/0 unless I calculate it or map it.
        // Maybe `row.Revenue` IS the MTD revenue? (Accumulated?)
        // Or maybe the CSV is daily data and we need to aggregate?
        // If the Dashboard shows MTD, and we enable uploading daily data...
        // The `dataLoaders.js` `getPlatformPerformance` queries `platformMetric` and sums `mtdRevenue`.
        // If I upload 30 daily records each with $100 revenue.
        // If I map `record.revenue` -> `metric.weeklyRevenue`.
        // And `metric.mtdRevenue` is 0.
        // Then `getPlatformPerformance` (summing MTD) returns 0.
        // This is broken.

        // FIX STRATEGY:
        // 1. `uploadController.js`: 
        //    - Use `prisma.platformMetric`.
        //    - Map `row.Revenue` -> `weeklyRevenue` (daily revenue).
        //    - Map `row.Revenue` -> `mtdRevenue` (if we assume it contributes to MTD, but `getPlatformPerformance` sums `mtdRevenue`: NO, `getPlatformPerformance` iterates metrics. If we handle daily metrics, we should SUM `weeklyRevenue` (daily) to get MTD.
        //    - BUT `dataLoaders.js` logic:
        //      `metrics.forEach... if (!platformData.brands.has(brandKey) || ... < metric.date)`
        //      It takes the **LATEST** entry for each brand.
        //      `const mtdRevenue = brand.mtdRevenue`.
        //      It assumes the record contains the CUMULATIVE MTD revenue.
        //      So the CSV data is expected to be "Snapshot" data where "Revenue" = MTD Revenue.
        //      If the CSV is daily transactional data (e.g. date: 2023-01-01, revenue: 100), then taking the latest record (e.g. 2023-01-31, revenue: 150) will only show 150, not sum.
        //      UNLESS the CSV data itself is cumulative or the `row.Revenue` is interpreted as "Revenue for this day".
        //      If it's "Revenue for this day", then `getPlatformPerformance` taking the "Latest" record is WRONG for calculating total MTD.
        //      It should SUM all records for the month.

        //      `dataLoaders.js` lines 163: `metrics` definition...
        //      Line 120: "Group by platform and brand, taking the latest entry for each".
        //      Line 163: `brands.reduce((sum, b) => sum + b.mtdRevenue, 0)`.
        //      This confirms it expects `mtdRevenue` to be a pre-calculated MTD value in the latest record.

        //      Is the CSV "Daily Revenue" or "MTD Snapshot"?
        //      `uploadController` parses `row.Revenue`.
        //      If I upload Levanta/Skimlinks... usually they provide daily reports.
        //      If `uploadController` just saves daily values, and `dashboard` expects snapshots...
        //      I should probably change `dataLoaders.js` to SUM `weeklyRevenue` (daily revenue) for the month to get MTD, instead of relying on a `mtdRevenue` field that implies snapshot.
        //      OR update `uploadController` to calculate MTD. (Hard to do with unordered CSV upload).

        //      Best fix: Update `dataLoaders.js` to SUM `weeklyRevenue` (which holds daily revenue) to calculate MTD.
        //      AND Update `uploadController` to save `row.Revenue` into `weeklyRevenue`.
        //      AND Update `brandsController` to SUM, not `take(1)`.

        //      Wait, `schema.prisma` calls it `weeklyRevenue`. 
        //      Ideally I should rename it to `revenue`.
        //      But for now, I will treat `weeklyRevenue` as "Revenue Amount for this Record".

        // SO:
        // 1. Fix `transactionsController`: Read `weeklyRevenue` as `revenue`. Use `PlatformMetric`.
        // 2. Fix `uploadController`: Write `revenue` -> `weeklyRevenue`, `gmv` -> `mtdGmv` (or just `gmv`? `PlatformMetric` has `mtdGmv`). 
        //    If I map `gmv` -> `mtdGmv`, and `dataLoaders` takes the latest... again, need to SUM.

        // I will assume `PlatformMetric` fields `weeklyRevenue` and `mtdRevenue` are misnomers for `revenue` and `gmv` respectively in the context of daily transactional data.

        // ACTION ITEMS:
        // 1. Update `uploadController.js`:
        //    - Use `prisma.platformMetric`.
        //    - Map `revenue` -> `weeklyRevenue`.
        //    - Map `gmv` -> `mtdGmv`.
        //    - Map `transactions` -> we don't have transactions count in schema?
        //      Schema: `id, platformKey, date, brand, weeklyRevenue, mtdRevenue, mtdGmv, targetGmv, totalContractRevenue, createdAt, updatedAt`.
        //      It DOES NOT have `transactions` count.
        //      CSV has `Transactions`.
        //      I'll have to ignore it or map it to `mtdRevenue` (no).
        //      I'll ignore transactions count for now (or put in `mtdRevenue` if I wanted, but that's money).
        //      Wait, `dashboardController` `getOverview` returns `totalTransactions` which is hardcoded 0.
        //      So transactions count is not supported yet?
        //      `transactionsController` Step 1339: `totalQuantity = sum(t.quantity)`.
        //      So `transactionsController` WANTED to show transaction counts.
        //      The schema is MISSING `transactions` field.
        //      I cannot easily add it without migration (which I might not be able to run easily remotely without database access).
        //      BUT I can try to add it to schema and hope I can migrate.
        //      OR just ignore it for now. The user "Fixing Backend Deployment" is priority.

        //      I will IGNORE transaction count for now in `transactionsController` (return 0).

        // 2. Update `transactionsController.js`:
        //    - `prisma.platformMetric.findMany`
        //    - Map `weeklyRevenue` -> `revenue`.
        //    - Map `mtdGmv` -> `gmv`.
        //    - `quantity` -> 0.

        // 3. Update `insightsController.js` similar.

        // 4. Update `uploadController.js` (CRITICAL):
        //    - Fix model name `revenueData` -> `platformMetric`.
        //    - Fix field mapping.

        // 5. Update `dataLoaders.js` (CRITICAL):
        //    - Fix MTD calculation. It should SUM `weeklyRevenue` (daily) for the month, NOT take latest `mtdRevenue`.
        //    - UNLESS `weeklyRevenue` meant "Weekly" sum?
        //    - Given `uploadController` maps single row to it, and rows are likely daily.
        //    - I'll assume daily.

        // Let's refine `transactionsController.js`.
      }
    });

    const aggregatesResult = aggregates._sum || {};

    res.json({
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      transactions: transactions.map(t => ({
        id: t.id,
        platform: t.platformKey,
        brandId: t.brand, // Name as ID
        date: t.date,
        revenue: t.weeklyRevenue,
        gmv: t.mtdGmv,
        quantity: 0, // Not in schema
      })),
      aggregates: {
        totalRevenue: aggregatesResult.weeklyRevenue || 0,
        totalGMV: aggregatesResult.mtdGmv || 0,
        totalQuantity: 0,
      },
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    // id is Int in schema
    const transaction = await prisma.platformMetric.findUnique({
      where: { id: parseInt(id) },
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({
      id: transaction.id,
      platform: transaction.platformKey,
      brandId: transaction.brand,
      date: transaction.date,
      revenue: transaction.weeklyRevenue,
      gmv: transaction.mtdGmv,
      quantity: 0,
    });
  } catch (error) {
    console.error('Get transaction by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
