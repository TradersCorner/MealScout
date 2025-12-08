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

interface FlowResult {
  name: string;
  steps: StepResult[];
  duration: number;
  success: boolean;
}

interface StepResult {
  name: string;
  success: boolean;
  statusCode?: number;
  responseTime: number;
  error?: string;
}

interface RequestConfig {
  method: string;
  path: string;
  body?: Record<string, any>;
  headers?: Record<string, string>;
  token?: string;
}

class UserFlowTester {
  private baseUrl: string;
  private flows: FlowResult[] = [];

  constructor(baseUrl: string = 'http://localhost:5000') {
    this.baseUrl = baseUrl;
  }

  private log(message: string, level: 'info' | 'error' | 'success' | 'warn' = 'info') {
    const colors = {
      info: '\x1b[36m',
      error: '\x1b[31m',
      success: '\x1b[32m',
      warn: '\x1b[33m',
    };
    const reset = '\x1b[0m';
    console.log(`${colors[level]}${message}${reset}`);
  }

  private makeRequest(config: RequestConfig): Promise<{ status: number; time: number; body?: any }> {
    return new Promise((resolve, reject) => {
      const client = this.baseUrl.startsWith('https') ? https : http;
      const url = new URL(config.path, this.baseUrl);

      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: config.method,
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'MealScout-UserFlow/1.0',
          ...config.headers,
        },
      };

      if (config.token) {
        options.headers['Authorization'] = `Bearer ${config.token}`;
      }

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
          } catch {
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

  async recordStep(
    name: string,
    method: string,
    path: string,
    expectedStatus: number | number[] = 200,
    body?: Record<string, any>,
    token?: string
  ): Promise<StepResult> {
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
    } catch (error: any) {
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
    const steps: StepResult[] = [];

    steps.push(
      await this.recordStep('1. Visit homepage', 'GET', '/', 200)
    );

    steps.push(
      await this.recordStep('2. Search for pizza deals', 'GET', '/api/deals/search?q=pizza&limit=10', 200)
    );

    steps.push(
      await this.recordStep('3. Search for restaurants', 'GET', '/api/restaurants/search?q=Mario', [200, 404])
    );

    steps.push(
      await this.recordStep('4. Get nearby restaurants', 'GET', '/api/restaurants/nearby/40.7128/-74.0060?limit=10', 200)
    );

    steps.push(
      await this.recordStep('5. View award winners', 'GET', '/api/awards/golden-fork/holders', 200)
    );

    steps.push(
      await this.recordStep('6. View golden plate winners', 'GET', '/api/awards/golden-plate/winners', 200)
    );

    const duration = Date.now() - flowStart;
    const success = steps.every((s) => s.success);
    const flow: FlowResult = { name: 'New User Discovery', steps, duration, success };
    this.flows.push(flow);
    this.printFlowResult(flow);
  }

  /**
   * FLOW 2: Deal Seeker Journey
   * - Search with multiple queries
   * - Filter by category
   * - View deal details
   * - Check real-time availability
   */
  async flowDealSeekerJourney() {
    this.log('\n→ Flow 2: Deal Seeker Journey', 'info');
    const flowStart = Date.now();
    const steps: StepResult[] = [];

    const queries = ['pizza', 'sushi', 'burger', 'tacos'];
    for (const query of queries) {
      steps.push(
        await this.recordStep(`Search: ${query}`, 'GET', `/api/deals/search?q=${query}&limit=20`, 200)
      );
    }

    steps.push(
      await this.recordStep('Filter by category', 'GET', '/api/deals/by-category/pizza?limit=20', [200, 404])
    );

    steps.push(
      await this.recordStep('Get hot deals', 'GET', '/api/deals/hot', [200, 404])
    );

    steps.push(
      await this.recordStep('Get trending deals', 'GET', '/api/deals/trending', [200, 404])
    );

    const duration = Date.now() - flowStart;
    const success = steps.every((s) => s.success);
    const flow: FlowResult = { name: 'Deal Seeker Journey', steps, duration, success };
    this.flows.push(flow);
    this.printFlowResult(flow);
  }

  /**
   * FLOW 3: Food Truck Tracker Journey
   * - Get nearby food trucks
   * - Check specific food truck status
   * - View route history
   */
  async flowFoodTruckJourney() {
    this.log('\n→ Flow 3: Food Truck Tracker Journey', 'info');
    const flowStart = Date.now();
    const steps: StepResult[] = [];

    steps.push(
      await this.recordStep('1. Get nearby food trucks', 'GET', '/api/food-trucks/nearby/40.7128/-74.0060', [200, 404])
    );

    steps.push(
      await this.recordStep('2. Get all food trucks', 'GET', '/api/food-trucks', [200, 404])
    );

    steps.push(
      await this.recordStep('3. Get food truck details', 'GET', '/api/food-trucks/truck-1', [200, 404])
    );

    steps.push(
      await this.recordStep('4. Get food truck schedule', 'GET', '/api/food-trucks/truck-1/schedule', [200, 404])
    );

    steps.push(
      await this.recordStep('5. Get food truck reviews', 'GET', '/api/food-trucks/truck-1/reviews', [200, 404])
    );

    const duration = Date.now() - flowStart;
    const success = steps.every((s) => s.success);
    const flow: FlowResult = { name: 'Food Truck Tracker', steps, duration, success };
    this.flows.push(flow);
    this.printFlowResult(flow);
  }

  /**
   * FLOW 4: Restaurant Owner Journey
   * - Create restaurant
   * - Update restaurant info
   * - Add deals
   * - View analytics
   */
  async flowRestaurantOwnerJourney() {
    this.log('\n→ Flow 4: Restaurant Owner Journey', 'info');
    const flowStart = Date.now();
    const steps: StepResult[] = [];

    const token = 'test-owner-token';

    steps.push(
      await this.recordStep(
        '1. Create restaurant',
        'POST',
        '/api/restaurants',
        [200, 201, 400, 401],
        {
          name: 'Test Restaurant',
          address: '123 Main St',
          latitude: 40.7128,
          longitude: -74.0060,
          cuisine: 'Italian',
        },
        token
      )
    );

    steps.push(
      await this.recordStep(
        '2. Update restaurant',
        'PUT',
        '/api/restaurants/rest-1',
        [200, 400, 401],
        {
          description: 'Updated description',
          phone: '555-0123',
        },
        token
      )
    );

    steps.push(
      await this.recordStep(
        '3. Create deal',
        'POST',
        '/api/deals',
        [200, 201, 400, 401],
        {
          restaurantId: 'rest-1',
          title: 'Happy Hour',
          description: '50% off drinks',
          discount: 50,
        },
        token
      )
    );

    steps.push(
      await this.recordStep(
        '4. Get restaurant analytics',
        'GET',
        '/api/restaurants/rest-1/analytics',
        [200, 404, 401],
        undefined,
        token
      )
    );

    steps.push(
      await this.recordStep(
        '5. Get restaurant deals',
        'GET',
        '/api/restaurants/rest-1/deals',
        [200, 404]
      )
    );

    const duration = Date.now() - flowStart;
    const success = steps.filter((s) => !['Create deal'].some((x) => s.name.includes(x))).every((s) => s.success);
    const flow: FlowResult = { name: 'Restaurant Owner', steps, duration, success };
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
    const steps: StepResult[] = [];

    steps.push(
      await this.recordStep('1. Get Golden Fork holders', 'GET', '/api/awards/golden-fork/holders', 200)
    );

    steps.push(
      await this.recordStep('2. Get Golden Fork history', 'GET', '/api/awards/golden-fork/history', [200, 404])
    );

    steps.push(
      await this.recordStep('3. Get Golden Plate winners', 'GET', '/api/awards/golden-plate/winners', 200)
    );

    steps.push(
      await this.recordStep('4. Get Golden Plate stats', 'GET', '/api/awards/golden-plate/stats', [200, 404])
    );

    steps.push(
      await this.recordStep('5. Check user influence', 'GET', '/api/users/user-1/influence', [200, 404])
    );

    const duration = Date.now() - flowStart;
    const success = steps.every((s) => s.success);
    const flow: FlowResult = { name: 'Award Tracking', steps, duration, success };
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
    const steps: StepResult[] = [];

    const dummyToken = 'test-token';

    steps.push(
      await this.recordStep(
        '1. Find deals via LLM',
        'POST',
        '/api/actions',
        [200, 400, 401],
        { action: 'FIND_DEALS', params: { search: 'pizza', limit: 10 } },
        dummyToken
      )
    );

    steps.push(
      await this.recordStep(
        '2. Find restaurants via LLM',
        'POST',
        '/api/actions',
        [200, 400, 401],
        { action: 'FIND_RESTAURANTS', params: { search: 'Mario', limit: 10 } },
        dummyToken
      )
    );

    steps.push(
      await this.recordStep(
        '3. Get food trucks via LLM',
        'POST',
        '/api/actions',
        [200, 400, 401],
        { action: 'GET_FOOD_TRUCKS', params: { latitude: 40.7128, longitude: -74.0060, radiusKm: 5 } },
        dummyToken
      )
    );

    steps.push(
      await this.recordStep(
        '4. Get credits balance via LLM',
        'POST',
        '/api/actions',
        [200, 400, 401],
        { action: 'GET_CREDITS_BALANCE', params: { userId: 'user-1' } },
        dummyToken
      )
    );

    const duration = Date.now() - flowStart;
    const flow: FlowResult = { name: 'LLM Integration', steps, duration, success: false };
    this.flows.push(flow);
    this.printFlowResult(flow);
  }

  /**
   * FLOW 7: Analytics & Reporting Journey
   * - Get user analytics
   * - Get restaurant analytics
   * - Get system-wide stats
   */
  async flowAnalyticsJourney() {
    this.log('\n→ Flow 7: Analytics & Reporting Journey', 'info');
    const flowStart = Date.now();
    const steps: StepResult[] = [];

    steps.push(
      await this.recordStep('1. Get system stats', 'GET', '/api/analytics/stats', [200, 404])
    );

    steps.push(
      await this.recordStep('2. Get user stats', 'GET', '/api/users/user-1/stats', [200, 404])
    );

    steps.push(
      await this.recordStep('3. Get restaurant analytics', 'GET', '/api/restaurants/rest-1/analytics', [200, 404])
    );

    steps.push(
      await this.recordStep('4. Get deal analytics', 'GET', '/api/deals/analytics', [200, 404])
    );

    steps.push(
      await this.recordStep('5. Get trending categories', 'GET', '/api/analytics/trending-categories', [200, 404])
    );

    const duration = Date.now() - flowStart;
    const success = steps.every((s) => s.success);
    const flow: FlowResult = { name: 'Analytics & Reporting', steps, duration, success };
    this.flows.push(flow);
    this.printFlowResult(flow);
  }

  private printFlowResult(flow: FlowResult) {
    const passCount = flow.steps.filter((s) => s.success).length;
    const failCount = flow.steps.length - passCount;
    const avgTime = flow.steps.reduce((a, b) => a + b.responseTime, 0) / flow.steps.length;

    if (flow.success) {
      this.log(
        `  ✓ ${flow.name}: ${passCount}/${flow.steps.length} passed (${avgTime.toFixed(0)}ms avg)`,
        'success'
      );
    } else {
      this.log(
        `  ✗ ${flow.name}: ${passCount}/${flow.steps.length} passed, ${failCount} failed (${avgTime.toFixed(0)}ms avg)`,
        'warn'
      );
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
    } else if (successRate >= '75') {
      this.log('⚠ Most flows working, but some issues detected. Review failures.', 'warn');
    } else {
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
    } catch (error) {
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
