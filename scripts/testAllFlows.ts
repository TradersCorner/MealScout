#!/usr/bin/env tsx
/**
 * Comprehensive Test Suite for MealScout
 * Tests all major user flows and features
 */

import { strict as assert } from 'assert';

const BASE_URL = process.env.TEST_URL || 'http://localhost:5000';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    results.push({ name, passed: true, duration: Date.now() - start });
    console.log(`✅ ${name}`);
  } catch (error) {
    results.push({
      name,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - start,
    });
    console.log(`❌ ${name}: ${error}`);
  }
}

async function apiRequest(
  method: string,
  path: string,
  body?: any,
  cookie?: string
): Promise<{ status: number; data: any; cookies?: string[] }> {
  const headers: any = {
    'Content-Type': 'application/json',
  };
  if (cookie) {
    headers.Cookie = cookie;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  const cookies = response.headers.getSetCookie?.() || [];

  return { status: response.status, data, cookies };
}

function extractSessionCookie(cookies: string[]): string | undefined {
  return cookies.find((c) => c.startsWith('connect.sid='));
}

// ==================== TESTS ====================

async function testHealthCheck() {
  const { status, data } = await apiRequest('GET', '/api/health');
  assert.equal(status, 200);
  assert.equal(data.status, 'healthy');
}

async function testCustomerSignup() {
  const email = `test-${Date.now()}@example.com`;
  const { status, data, cookies } = await apiRequest('POST', '/api/auth/register', {
    email,
    password: 'Test123!',
    firstName: 'Test',
    lastName: 'User',
    userType: 'customer',
  });
  assert.equal(status, 200);
  assert.ok(data.user);
  assert.equal(data.user.email, email);
  const sessionCookie = extractSessionCookie(cookies!);
  assert.ok(sessionCookie);
  return { email, cookie: sessionCookie };
}

async function testRestaurantSignup() {
  const email = `restaurant-${Date.now()}@example.com`;
  const { status, data, cookies } = await apiRequest('POST', '/api/restaurants/signup', {
    email,
    password: 'Test123!',
    firstName: 'Restaurant',
    lastName: 'Owner',
    restaurantName: 'Test Restaurant',
    address: '123 Test St, Los Angeles, CA 90001',
    phone: '555-0100',
    businessType: 'restaurant',
    cuisineType: 'American',
  });
  assert.equal(status, 200);
  assert.ok(data.user);
  assert.ok(data.restaurant);
  const sessionCookie = extractSessionCookie(cookies!);
  assert.ok(sessionCookie);
  return { email, cookie: sessionCookie!, restaurantId: data.restaurant.id };
}

async function testLogin(email: string, password: string) {
  const { status, data, cookies } = await apiRequest('POST', '/api/auth/login', {
    username: email,
    password,
  });
  assert.equal(status, 200);
  assert.ok(data.user);
  const sessionCookie = extractSessionCookie(cookies!);
  assert.ok(sessionCookie);
  return sessionCookie!;
}

async function testCreateDeal(cookie: string, restaurantId: string) {
  const { status, data } = await apiRequest(
    'POST',
    '/api/deals',
    {
      restaurantId,
      title: 'Test Deal - 20% Off',
      description: 'Test deal for automated testing',
      dealType: 'percentage',
      discountValue: '20',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      startTime: '00:00',
      endTime: '23:59',
      minOrderAmount: '10.00',
    },
    cookie
  );
  assert.equal(status, 201);
  assert.ok(data.id);
  return data.id;
}

async function testClaimDeal(cookie: string, dealId: string) {
  const { status, data } = await apiRequest('POST', `/api/deals/${dealId}/claim`, {}, cookie);
  assert.equal(status, 200);
  assert.ok(data.success);
}

async function testAddFavorite(cookie: string, restaurantId: string) {
  const { status } = await apiRequest(
    'POST',
    `/api/restaurants/${restaurantId}/favorite`,
    {},
    cookie
  );
  assert.equal(status, 200);
}

async function testGetFavorites(cookie: string) {
  const { status, data } = await apiRequest('GET', '/api/favorites/restaurants', undefined, cookie);
  assert.equal(status, 200);
  assert.ok(Array.isArray(data));
}

async function testSubmitReview(cookie: string, restaurantId: string) {
  const { status } = await apiRequest(
    'POST',
    '/api/reviews',
    {
      restaurantId,
      rating: 5,
      comment: 'Great food and service!',
    },
    cookie
  );
  assert.equal(status, 201);
}

async function testSearchRestaurants() {
  const { status, data } = await apiRequest('GET', '/api/restaurants/search?lat=34.0522&lng=-118.2437');
  assert.equal(status, 200);
  assert.ok(Array.isArray(data));
}

async function testGetDeals() {
  const { status, data } = await apiRequest('GET', '/api/deals/featured');
  assert.equal(status, 200);
  assert.ok(Array.isArray(data));
}

async function testGoldenForkEligibility(cookie: string) {
  const { status, data } = await apiRequest(
    'GET',
    '/api/awards/golden-fork/eligibility',
    undefined,
    cookie
  );
  assert.equal(status, 200);
  assert.ok(typeof data.eligible === 'boolean');
}

async function testGoldenPlateWinners() {
  const { status, data } = await apiRequest('GET', '/api/awards/golden-plate/winners');
  assert.equal(status, 200);
  assert.ok(Array.isArray(data));
}

// ==================== RUN ALL TESTS ====================

async function runAllTests() {
  console.log('🚀 Starting MealScout Test Suite...\n');
  console.log(`Testing against: ${BASE_URL}\n`);

  let customerCookie: string;
  let restaurantCookie: string;
  let restaurantId: string;
  let dealId: string;

  // Health & Setup
  await test('Health Check', testHealthCheck);

  // User Authentication
  await test('Customer Signup', async () => {
    const result = await testCustomerSignup();
    customerCookie = result.cookie!;
  });

  await test('Restaurant Signup', async () => {
    const result = await testRestaurantSignup();
    restaurantCookie = result.cookie!;
    restaurantId = result.restaurantId;
  });

  // Deal Management
  await test('Create Deal', async () => {
    dealId = await testCreateDeal(restaurantCookie, restaurantId);
  });

  await test('Get Featured Deals', testGetDeals);

  // Customer Actions
  await test('Claim Deal', async () => {
    await testClaimDeal(customerCookie, dealId);
  });

  await test('Add to Favorites', async () => {
    await testAddFavorite(customerCookie, restaurantId);
  });

  await test('Get Favorites', async () => {
    await testGetFavorites(customerCookie);
  });

  await test('Submit Review', async () => {
    await testSubmitReview(customerCookie, restaurantId);
  });

  // Search & Discovery
  await test('Search Restaurants', testSearchRestaurants);

  // Awards System
  await test('Check Golden Fork Eligibility', async () => {
    await testGoldenForkEligibility(customerCookie);
  });

  await test('Get Golden Plate Winners', testGoldenPlateWinners);

  // Print Results
  console.log('\n' + '='.repeat(50));
  console.log('TEST RESULTS');
  console.log('='.repeat(50));

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const totalTime = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`\nTotal: ${results.length}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  console.log(`Total Time: ${totalTime}ms`);

  if (failed > 0) {
    console.log('\nFailed Tests:');
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`  ❌ ${r.name}: ${r.error}`);
      });
  }

  console.log('\n' + '='.repeat(50));

  process.exit(failed > 0 ? 1 : 0);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch((error) => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}

export default runAllTests;
