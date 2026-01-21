/**
 * TypeScript type definitions for CSV upload data structures
 */

/**
 * Platform brand data row from CSV upload
 */
export interface PlatformCsvRow {
  /** ISO date string (YYYY-MM-DD) */
  date: string;

  /** Brand name */
  brand: string;

  /** Weekly revenue amount */
  weeklyRevenue: number;

  /** Month-to-date revenue */
  mtdRevenue: number;

  /** Month-to-date GMV (Gross Merchandise Value) */
  mtdGmv: number;

  /** Target GMV for the period */
  targetGmv: number;

  /** Optional total contract revenue */
  totalContractRevenue?: number;
}

/**
 * Flat fee contract row from CSV upload
 */
export interface FlatFeeCsvRow {
  /** Partner/platform name */
  partnerName: string;

  /** Contract start date (YYYY-MM-DD) */
  contractStart: string;

  /** Contract end date (YYYY-MM-DD) */
  contractEnd: string;

  /** Total contract revenue to be allocated across weeks */
  totalContractRevenue: number;
}

/**
 * Request body for platform data upload
 */
export interface UploadPlatformDataRequest {
  /** Platform identifier (e.g., 'creator-connections', 'skimlinks') */
  platformKey: string;

  /** Array of platform data rows */
  rows: PlatformCsvRow[];
}

/**
 * Response for platform data upload
 */
export interface UploadPlatformDataResponse {
  /** Whether upload was successful */
  success: boolean;

  /** Number of records processed */
  recordsProcessed: number;

  /** Platform identifier */
  platformKey: string;

  /** Error message if success is false */
  message?: string;
}

/**
 * Request body for flat fee upload
 */
export interface UploadFlatFeeRequest {
  /** Array of flat fee contract rows */
  rows: FlatFeeCsvRow[];
}

/**
 * Response for flat fee upload
 */
export interface UploadFlatFeeResponse {
  /** Whether upload was successful */
  success: boolean;

  /** Number of contracts processed */
  contractsProcessed: number;

  /** Number of weekly allocation records generated */
  weeksGenerated: number;

  /** Error message if success is false */
  message?: string;
}

/**
 * Finance week structure
 */
export interface FinanceWeek {
  /** Week start date (Thursday) */
  start: Date;

  /** Week end date (Wednesday) */
  end: Date;
}

/**
 * Platform key to display name mapping
 */
export type PlatformKeyMap = {
  'creator-connections': 'Creator Connections';
  'levanta': 'Levanta';
  'perch': 'Perch';
  'partnerboost': 'PartnerBoost';
  'archer': 'Archer';
  'skimlinks': 'Skimlinks';
  'impact': 'Impact';
  'howl': 'Howl';
  'brandads': 'BrandAds';
  'other-affiliates': 'Other Affiliates';
};
