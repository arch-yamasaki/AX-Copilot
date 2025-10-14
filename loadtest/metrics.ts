import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export interface Metric {
    scenario: string;
    runId: number;
    startTime: number;
    endTime: number;
    latency: number;
    success: boolean;
    error?: string;
    backend?: string; // To track 'vertex' or 'google'
    response_summary?: string;
}

const results: Metric[] = [];
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const resultsDir = path.resolve(__dirname, 'results');

export const recordMetric = (metric: Omit<Metric, 'latency'>) => {
    const latency = metric.endTime - metric.startTime;
    results.push({ ...metric, latency });
};

export const writeResultsToCsv = () => {
    if (results.length === 0) {
        console.log('No metrics recorded, skipping CSV export.');
        return;
    }

    if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = path.join(resultsDir, `loadtest-results-${timestamp}.csv`);
    const header = Object.keys(results[0]).join(',') + '\n';
    const rows = results.map(row => {
        const values = Object.values(row).map(value => {
            const str = String(value ?? '');
            // Wrap in double quotes if it contains a comma or a double quote
            if (str.includes(',') || str.includes('"')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        });
        return values.join(',');
    }).join('\n');

    // Prepend UTF-8 BOM to prevent character encoding issues in Excel
    const csvContent = '\ufeff' + header + rows;

    fs.writeFileSync(filePath, csvContent);
    console.log(`Test results written to ${filePath}`);
};

export const printSummary = () => {
    if (results.length === 0) {
        console.log('No metrics recorded.');
        return;
    }

    const totalRuns = results.length;
    const successfulRuns = results.filter(r => r.success).length;
    const failedRuns = totalRuns - successfulRuns;
    const successRate = ((successfulRuns / totalRuns) * 100).toFixed(2);

    const latencies = results.filter(r => r.success).map(r => r.latency);
    const avgLatency = (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(2);
    const minLatency = Math.min(...latencies).toFixed(2);
    const maxLatency = Math.max(...latencies).toFixed(2);
    
    // Percentiles
    latencies.sort((a, b) => a - b);
    const p95Index = Math.floor(latencies.length * 0.95);
    const p95Latency = latencies[p95Index]?.toFixed(2);

    console.log('\n--- Load Test Summary ---');
    console.log(`Total Runs:       ${totalRuns}`);
    console.log(`Successful Runs:  ${successfulRuns}`);
    console.log(`Failed Runs:      ${failedRuns}`);
    console.log(`Success Rate:     ${successRate}%`);
    console.log('---');
    console.log(`Avg Latency:      ${avgLatency} ms`);
    console.log(`Min Latency:      ${minLatency} ms`);
    console.log(`Max Latency:      ${maxLatency} ms`);
    console.log(`p95 Latency:      ${p95Latency} ms`);
    console.log('-------------------------\n');
};
