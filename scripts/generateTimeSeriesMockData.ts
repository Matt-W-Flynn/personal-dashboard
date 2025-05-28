import fs from 'fs';
import path from 'path';

interface TimeSeriesData {
  date: string;
  value: number;
}

// Helper function to get a value from a nested object using a path string
const getPathValue = (obj: any, pathString: string): any => {
  const keys = pathString.replace(/\\[(\d+)\\]/g, '.$1').split('.'); // Convert array accessors like [0] to .0
  let current = obj;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }
  return current;
};

// Helper function to set a value in a nested object using a path string
const setPathValue = (obj: any, pathString: string, value: any): void => {
  const keys = pathString.replace(/\\[(\d+)\\]/g, '.$1').split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = Number.isInteger(parseInt(keys[i+1])) ? [] : {}; // Create array or object as needed
    }
    current = current[key];
  }
  current[keys[keys.length - 1]] = value;
};

const generateTimeSeries = (values: number[], baseDate: Date, intervalDays: number, count: number): TimeSeriesData[] => {
  const series: TimeSeriesData[] = [];
  for (let i = 0; i < count; i++) {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() - (count - 1 - i) * intervalDays);
    series.push({ date: date.toISOString(), value: values[i] || 0 }); // Use value or 0 if not enough values
  }
  return series;
};

const generateStockPriceSeries = (values: number[], baseDate: Date, intervalDays: number, count: number): Array<{ date: string, price: number }> => {
  const series: Array<{ date: string, price: number }> = [];
  for (let i = 0; i < count; i++) {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() - (count - 1 - i) * intervalDays);
    series.push({ date: date.toISOString(), price: values[i] || 0 });
  }
  return series;
};


const processData = (data: any, jsonPath: string, isStockData: boolean): any => {
  const targetObject = getPathValue(data, jsonPath);

  if (targetObject && typeof targetObject === 'object') {
    const today = new Date();
    for (const timeframe in targetObject) {
      if (Object.prototype.hasOwnProperty.call(targetObject, timeframe)) {
        const values = targetObject[timeframe] as number[];
        if (Array.isArray(values) && values.every(v => typeof v === 'number')) {
          let intervalDays = 1;
          let count = values.length;

          switch (timeframe) {
            case '1D': // Assume hourly for 1D, map to 24 points if needed, or less if fewer values exist
              // For simplicity, we'll treat 1D as daily points for now, like 1W.
              // More complex logic would be needed for true hourly distinct from daily.
              // Let's assume 'values' for 1D represents points within that day.
              // The script will create distinct dates for each if intervalDays=1
              intervalDays = 1; // Or 1/24 for hourly, but date generation needs adjustment
              break;
            case '1W':
              intervalDays = 1; // 7 points, 1 day apart
              break;
            case '1M': // ~30 points, 1 day apart
              intervalDays = 1;
              break;
            case '3M': // ~90 points, 1 day apart
              intervalDays = 1;
              break;
            case '1Y': // ~12 points, ~30 days apart or ~52 points, 7 days apart
              intervalDays = 7; // weekly points for a year
              if (values.length > 52) intervalDays = 1; // if more than 52, assume daily
              break;
            case 'ALL': // Can be variable, assume weekly if many points
              intervalDays = 7;
              if (values.length < 52) intervalDays = 1; // if fewer than 52, assume daily
              break;
            default:
              intervalDays = 1;
          }
          if (isStockData) {
            targetObject[timeframe] = generateStockPriceSeries(values, today, intervalDays, values.length);
          } else {
            targetObject[timeframe] = generateTimeSeries(values, today, intervalDays, values.length);
          }
        }
      }
    }
  }
  return data;
};

const main = () => {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: ts-node scripts/generateTimeSeriesMockData.ts <file_path> <json_path> [--stock]');
    process.exit(1);
  }

  const filePath = path.resolve(args[0]);
  const jsonPath = args[1];
  const isStockData = args[2] === '--stock'; // Check for --stock flag

  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    let jsonData = JSON.parse(fileContent);

    // Special handling for paths like "holdings[0].price_history"
    // The script needs to be run for each holding individually if the path indicates a holding
    if (jsonPath.startsWith('holdings[') && jsonPath.includes('].price_history')) {
        // This case should be handled by calling the script multiple times, one for each holding.
        // The script itself will transform the specific path given.
        jsonData = processData(jsonData, jsonPath, true); // isStockData is true for price_history
    } else if (jsonPath === 'portfolio_history') {
        jsonData = processData(jsonData, jsonPath, false); // isStockData is false for portfolio_history
    } else {
        // General case, determine isStockData based on path or add more specific handling
        const lcJsonPath = jsonPath.toLowerCase();
        const stockHint = lcJsonPath.includes('price') || lcJsonPath.includes('stock') || lcJsonPath.includes('holding');
        jsonData = processData(jsonData, jsonPath, stockHint);
    }

    fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));
    console.log(`Successfully updated time series data in ${filePath} for path ${jsonPath}`);

  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    process.exit(1);
  }
};

main(); 