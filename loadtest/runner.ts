import { SCENARIOS, Scenario } from './scenarios.js';
import { printSummary, writeResultsToCsv } from './metrics.js';

const parseArgs = () => {
    const args = process.argv.slice(2);
    const options: { scenario?: Scenario; concurrency?: number; total?: number } = {};
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--scenario' && args[i + 1]) {
            const scenario = args[i + 1] as Scenario;
            if (SCENARIOS[scenario]) {
                options.scenario = scenario;
            } else {
                throw new Error(`Invalid scenario: ${scenario}. Available: ${Object.keys(SCENARIOS).join(', ')}`);
            }
        }
        if (args[i] === '--concurrency' && args[i + 1]) {
            options.concurrency = parseInt(args[i + 1], 10);
        }
        if (args[i] === '--total' && args[i + 1]) {
            options.total = parseInt(args[i + 1], 10);
        }
    }
    return {
        scenario: options.scenario || 'stream',
        concurrency: options.concurrency || 5,
        total: options.total || 20,
    };
};

async function run() {
    const { scenario, concurrency, total } = parseArgs();
    
    console.log('--- Starting Load Test ---');
    console.log(`Scenario:     ${scenario}`);
    console.log(`Concurrency:  ${concurrency}`);
    console.log(`Total Runs:   ${total}`);
    console.log('--------------------------\n');

    const scenarioFn = SCENARIOS[scenario];
    const tasks: (() => Promise<void>)[] = [];
    for (let i = 1; i <= total; i++) {
        tasks.push(() => scenarioFn(i));
    }

    let activeWorkers = 0;
    let taskIndex = 0;
    const results: Promise<void>[] = [];

    const execute = async () => {
        while (taskIndex < tasks.length) {
            const currentTaskIndex = taskIndex++;
            const task = tasks[currentTaskIndex];
            results.push(task());
            
            if (activeWorkers >= concurrency) {
                await Promise.race(results);
            }
        }
        await Promise.all(results);
    };

    // Simple concurrency limiting
    const workers = Array(concurrency).fill(null).map(execute);
    
    await Promise.all(workers);
    
    printSummary();
    writeResultsToCsv();
}

run().catch(error => {
    console.error('Load test runner encountered a fatal error:', error);
    process.exit(1);
});
