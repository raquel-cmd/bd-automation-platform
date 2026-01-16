/**
 * CSV Parser utility for Skimlinks reports
 */

/**
 * Parse Skimlinks Publisher Report CSV
 * Format: Merchant, Clicks, Sales, Conversion rate, Order value, Revenue, EPC
 */
export function parseSkimlinksCSV(csvContent) {
  const lines = csvContent.split('\n');
  const merchants = [];

  let headerFound = false;
  let headerIndex = -1;

  // Find the header line starting with "Merchant,Clicks,Sales"
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('Merchant,Clicks,Sales') || line.startsWith('Merchant, Clicks, Sales')) {
      headerFound = true;
      headerIndex = i;
      break;
    }
  }

  if (!headerFound) {
    throw new Error('Invalid CSV format: Could not find header line starting with "Merchant,Clicks,Sales"');
  }

  // Parse data rows after header
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) continue;

    // Split by comma (handle quoted values if needed)
    const columns = line.split(',').map(col => col.trim().replace(/^"(.*)"$/, '$1'));

    // Need at least 7 columns
    if (columns.length < 7) continue;

    const merchant = columns[0];

    // Skip if merchant is empty or looks like a total/summary row
    if (!merchant || merchant.toLowerCase().includes('total')) continue;

    try {
      const merchantData = {
        merchant,
        clicks: parseInt(columns[1].replace(/,/g, '')) || 0,
        sales: parseInt(columns[2].replace(/,/g, '')) || 0,
        conversionRate: parseFloat(columns[3].replace('%', '').trim()) || 0,
        gmv: parseFloat(columns[4].replace(/[$,]/g, '').trim()) || 0,
        revenue: parseFloat(columns[5].replace(/[$,]/g, '').trim()) || 0,
        epc: parseFloat(columns[6].replace(/[$,]/g, '').trim()) || 0,
      };

      merchants.push(merchantData);
    } catch (error) {
      console.error(`Error parsing line ${i}: ${line}`, error);
      // Continue parsing other lines
    }
  }

  return merchants;
}
