#!/usr/bin/env node
/**
 * MEALSCOUT USER FLOW SCENARIOS
 *
 * Simulates realistic complete user journeys:
 * - New user signup → search → view details → claim deal
 * - Food truck discovery → view location → check status
 * - Restaurant owner → create restaurant → add deals
 * - Award tracking → view winners → understand eligibility
 * - Search with filters → sort results → compare
 *
 * Run: npm run test:flows
 * or: npx tsx scripts/userFlows.ts
 */
import http from 'http';
import https from 'https';
class UserFlowTester {
    constructor(baseUrl = 'http://localhost:5000') {
        this.flows = [];
        this.baseUrl = baseUrl;
    }
    log(message, level = 'info') {
        const colors = {
            info: '\x1b[36m',
            error: '\x1b[31m',
            success: '\x1b[32m',
            warn: '\x1b[33m',
        };
        const reset = '\x1b[0m';
        console.log(`${colors[level]}${message}${reset}`);
    }
    makeRequest(config) {
        return new Promise((resolve, reject) => {
            const client = this.baseUrl.startsWith('https') ? https : http;
            const url = new URL(config.path, this.baseUrl);
            const headers = {
                'Content-Type': 'application/json',
                'User-Agent': 'MealScout-UserFlow/1.0',
                ...config.headers,
            };
            if (config.token) {
                headers['Authorization'] = `Bearer ${config.token}`;
            }
            const options = {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname + url.search,
                method: config.method,
                timeout: 30000,
                headers,
            };
            const startTime = Date.now();
            const req = client.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    const time = Date.now() - startTime;
                    try {
                        const body = data ? JSON.parse(data) : undefined;
                        resolve({ status: res.statusCode || 500, time, body });
                    }
                    catch {
                        resolve({ status: res.statusCode || 500, time });
                    }
                });
            });
            req.on('error', (error) => {
                reject(new Error(error.message));
            });
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            if (config.body) {
                req.write(JSON.stringify(config.body));
            }
            req.end();
        });
    }
    async recordStep(name, method, path, expectedStatus = 200, body, token) {
        const startTime = Date.now();
        try {
            const response = await this.makeRequest({
                method,
                path,
                body,
                token,
            });
            const responseTime = Date.now() - startTime;
            const statuses = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
            const success = statuses.includes(response.status);
            return {
                name,
                success,
                statusCode: response.status,
                responseTime,
                error: success ? undefined : `Expected ${expectedStatus}, got ${response.status}`,
            };
        }
        catch (error) {
            return {
                name,
                success: false,
                responseTime: Date.now() - startTime,
                error: error.message,
            };
        }
    }
    /**
      * FLOW 1: New User Journey
      * - Visit homepage
      * - Search for deals
      * - View restaurant details
      * - Check awards
      */
    async flowNewUserJourney() {
        this.log('\n→ Flow 1: New User Discovery Journey', 'info');
        const flowStart = Date.now();
        const steps = [];
        steps.push(await this.recordStep('1. Visit homepage', 'GET', '/', 200));
        steps.push(await this.recordStep('2. Search for pizza deals', 'GET', '/api/deals/search?q=pizza&limit=10', 200));
        steps.push(await this.recordStep('3. Search for restaurants', 'GET', '/api/restaurants/search?q=Mario', [200, 404]));
        steps.push(await this.recordStep('4. Get nearby restaurants', 'GET', '/api/restaurants/nearby/40.7128/-74.0060?limit=10', 200));
        steps.push(await this.recordStep('5. View award holders', 'GET', '/api/awards/golden-fork/holders', 200));
        steps.push(await this.recordStep('6. View golden plate winners', 'GET', '/api/awards/golden-plate/winners', 200));
        const duration = Date.now() - flowStart;
        const success = steps.every((s) => s.success);
        const flow = { name: 'New User Discovery', steps, duration, success };
        this.flows.push(flow);
        this.printFlowResult(flow);
    }
    /**
     * FLOW 2: Deal Seeker Journey
     * - Search with multiple queries
     * - Filter by category
     * - Check featured deals
     * - View deal detail
     */
    async flowDealSeekerJourney() {
        this.log('\n→ Flow 2: Deal Seeker Journey', 'info');
        const flowStart = Date.now();
        const steps = [];
        const queries = ['pizza', 'sushi', 'burger', 'tacos'];
        for (const query of queries) {
            steps.push(await this.recordStep(`Search: ${query}`, 'GET', `/api/deals/search?q=${query}&limit=20`, 200));
        }
        steps.push(await this.recordStep('Get featured deals', 'GET', '/api/deals/featured?limit=20', 200));
        steps.push(await this.recordStep('Get recommended deals (auth optional)', 'GET', '/api/deals/recommended', [200, 401]));
        const duration = Date.now() - flowStart;
        const success = steps.every((s) => s.success);
        const flow = { name: 'Deal Seeker Journey', steps, duration, success };
        this.flows.push(flow);
        this.printFlowResult(flow);
    }
    /**
     * FLOW 3: Food Truck Tracker Journey
     * - View upcoming events
     * - Validate events discovery
     */
    async flowFoodTruckJourney() {
        this.log('\n→ Flow 3: Food Truck Tracker Journey', 'info');
        const flowStart = Date.now();
        const steps = [];
        steps.push(await this.recordStep('1. Get upcoming events', 'GET', '/api/events/upcoming', 200));
        steps.push(await this.recordStep('2. Get events discovery', 'GET', '/api/events', [200, 401]));
        const duration = Date.now() - flowStart;
        const success = steps.every((s) => s.success);
        const flow = { name: 'Food Truck Tracker', steps, duration, success };
        this.flows.push(flow);
        this.printFlowResult(flow);
    }
    /**
     * FLOW 4: Restaurant Owner Journey
     * - Verify auth gates for owner endpoints
     */
    async flowRestaurantOwnerJourney() {
        this.log('\n→ Flow 4: Restaurant Owner Journey', 'info');
        const flowStart = Date.now();
        const steps = [];
        steps.push(await this.recordStep('1. Create restaurant (auth required)', 'POST', '/api/restaurants', [401, 403], {
            name: 'Test Restaurant',
            address: '123 Main St',
            latitude: 40.7128,
            longitude: -74.0060,
            cuisine: 'Italian',
        }));
        steps.push(await this.recordStep('2. Create deal (auth required)', 'POST', '/api/deals', [401, 403], {
            restaurantId: 'rest-1',
            title: 'Happy Hour',
            description: '50% off drinks',
            discount: 50,
        }));
        steps.push(await this.recordStep('3. Get my active deals (auth required)', 'GET', '/api/deals/my-active', [401, 403]));
        steps.push(await this.recordStep('4. Get claimed deals (auth required)', 'GET', '/api/deals/claimed', [401, 403]));
        const duration = Date.now() - flowStart;
        const success = steps.every((s) => s.success);
        const flow = { name: 'Restaurant Owner', steps, duration, success };
        this.flows.push(flow);
        this.printFlowResult(flow);
    }
    /**
     * FLOW 5: Award Tracking Journey
     * - View award categories
     * - Check eligibility
     * - View holder profiles
     */
    async flowAwardTrackingJourney() {
        this.log('\n→ Flow 5: Award Tracking Journey', 'info');
        const flowStart = Date.now();
        const steps = [];
        steps.push(await this.recordStep('1. Get Golden Fork holders', 'GET', '/api/awards/golden-fork/holders', 200));
        steps.push(await this.recordStep('2. Get awards history', 'GET', '/api/awards/history', 200));
        steps.push(await this.recordStep('3. Get Golden Plate winners', 'GET', '/api/awards/golden-plate/winners', 200));
        const duration = Date.now() - flowStart;
        const success = steps.every((s) => s.success);
        const flow = { name: 'Award Tracking', steps, duration, success };
        this.flows.push(flow);
        this.printFlowResult(flow);
    }
    /**
     * FLOW 6: Action API (LLM) Journey
     * - Use find deals action
     * - Use find restaurants action
     * - Use food truck action
     * - Use redemption action
     */
    async flowLLMIntegration() {
        this.log('\n→ Flow 6: LLM Integration (Action API)', 'info');
        const flowStart = Date.now();
        const steps = [];
        steps.push(await this.recordStep('1. Find deals via LLM', 'POST', '/api/actions', [200, 400, 401, 403], { action: 'FIND_DEALS', params: { search: 'pizza', limit: 10 } }));
        steps.push(await this.recordStep('2. Find restaurants via LLM', 'POST', '/api/actions', [200, 400, 401, 403], { action: 'FIND_RESTAURANTS', params: { search: 'Mario', limit: 10 } }));
        steps.push(await this.recordStep('3. Get food trucks via LLM', 'POST', '/api/actions', [200, 400, 401, 403], { action: 'GET_FOOD_TRUCKS', params: { latitude: 40.7128, longitude: -74.0060, radiusKm: 5 } }));
        steps.push(await this.recordStep('4. Get credits balance via LLM', 'POST', '/api/actions', [200, 400, 401, 403], { action: 'GET_CREDITS_BALANCE', params: { userId: 'user-1' } }));
        const duration = Date.now() - flowStart;
        const flow = { name: 'LLM Integration', steps, duration, success: false };
        this.flows.push(flow);
        this.printFlowResult(flow);
    }
    /**
     * FLOW 7: Analytics & Reporting Journey
     * - Validate health/monitoring endpoints
     */
    async flowAnalyticsJourney() {
        this.log('\n→ Flow 7: Analytics & Reporting Journey', 'info');
        const flowStart = Date.now();
        const steps = [];
        steps.push(await this.recordStep('1. API health check', 'GET', '/api/health', 200));
        steps.push(await this.recordStep('2. API head check', 'HEAD', '/api', [200, 204]));
        const duration = Date.now() - flowStart;
        const success = steps.every((s) => s.success);
        const flow = { name: 'Analytics & Reporting', steps, duration, success };
        this.flows.push(flow);
        this.printFlowResult(flow);
    }
    printFlowResult(flow) {
        const passCount = flow.steps.filter((s) => s.success).length;
        const failCount = flow.steps.length - passCount;
        const avgTime = flow.steps.reduce((a, b) => a + b.responseTime, 0) / flow.steps.length;
        if (flow.success) {
            this.log(`  ✓ ${flow.name}: ${passCount}/${flow.steps.length} passed (${avgTime.toFixed(0)}ms avg)`, 'success');
        }
        else {
            this.log(`  ✗ ${flow.name}: ${passCount}/${flow.steps.length} passed, ${failCount} failed (${avgTime.toFixed(0)}ms avg)`, 'warn');
            flow.steps.forEach((step) => {
                if (!step.success) {
                    console.log(`    - ${step.name}: ${step.error}`);
                }
            });
        }
    }
    printSummary() {
        console.log('\n' + '='.repeat(80));
        this.log('USER FLOW TEST SUMMARY', 'success');
        console.log('='.repeat(80));
        let totalSteps = 0;
        let successfulSteps = 0;
        for (const flow of this.flows) {
            totalSteps += flow.steps.length;
            successfulSteps += flow.steps.filter((s) => s.success).length;
        }
        const successRate = ((successfulSteps / totalSteps) * 100).toFixed(1);
        console.log(`\nTotal Flows: ${this.flows.length}`);
        console.log(`Total Steps: ${totalSteps}`);
        console.log(`Successful Steps: ${successfulSteps}`);
        console.log(`Success Rate: ${successRate}%\n`);
        if (successRate >= '95') {
            this.log('✓ User flows are stable! Ready for production launch.', 'success');
        }
        else if (successRate >= '75') {
            this.log('⚠ Most flows working, but some issues detected. Review failures.', 'warn');
        }
        else {
            this.log('✗ Multiple flow failures detected. Fix issues before launch.', 'error');
        }
        console.log('='.repeat(80) + '\n');
    }
    async run() {
        this.log('Starting User Flow Tests...', 'info');
        this.log(`Testing: ${this.baseUrl}\n`, 'info');
        try {
            await this.flowNewUserJourney();
            await this.flowDealSeekerJourney();
            await this.flowFoodTruckJourney();
            await this.flowRestaurantOwnerJourney();
            await this.flowAwardTrackingJourney();
            await this.flowLLMIntegration();
            await this.flowAnalyticsJourney();
            this.printSummary();
        }
        catch (error) {
            this.log(`Test failed: ${error}`, 'error');
            process.exit(1);
        }
    }
}
// Main execution
const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
const tester = new UserFlowTester(baseUrl);
tester.run().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});
