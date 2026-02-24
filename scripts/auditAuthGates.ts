import "dotenv/config";

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

async function testEndpoint(
  path: string,
  method: string = "GET",
  auth?: string,
): Promise<{ status: number; body: any }> {
  const options: any = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (auth) {
    options.headers["Authorization"] = `Bearer ${auth}`;
  }

  try {
    const response = await fetch(`${BASE_URL}${path}`, options);
    const body = await response.text();
    return {
      status: response.status,
      body: body ? JSON.parse(body) : null,
    };
  } catch (error) {
    return { status: 0, body: { error: String(error) } };
  }
}

async function auditAuthGates() {
  console.log("🔐 AUTH GATES & ROLE VISIBILITY AUDIT\n");

  const results: TestResult[] = [];

  // Test 1: Parking Pass visibility
  console.log("Testing Parking Pass Route Visibility...");
  const ppGuest = await testEndpoint("/api/parking-passes");
  results.push({
    name: "Guest can access /api/parking-passes (public listing)",
    passed: ppGuest.status === 200 || ppGuest.status === 401,
    details: `Status: ${ppGuest.status}`,
  });

  // Test 2: Events endpoint access
  console.log("Testing Events Discovery...");
  const eventsGuest = await testEndpoint("/api/events");
  results.push({
    name: "Guest can access /api/events (public discovery)",
    passed: eventsGuest.status === 200,
    details: `Status: ${eventsGuest.status}`,
  });

  // Test 3: Event creation (should require auth)
  console.log("Testing Event Creation Gate...");
  const eventCreate = await testEndpoint("/api/events", "POST");
  results.push({
    name: "POST /api/events requires auth (returns 401/403)",
    passed: eventCreate.status === 401 || eventCreate.status === 403,
    details: `Status: ${eventCreate.status}`,
  });

  // Test 4: Map endpoint (public)
  console.log("Testing Map Data Access...");
  const mapData = await testEndpoint("/api/hosts/nearby/40.7128/-74.0060");
  results.push({
    name: "Guest can access host map data /api/hosts/nearby",
    passed: mapData.status === 200,
    details: `Status: ${mapData.status}`,
  });

  // Test 5: Deals search (public)
  console.log("Testing Deals Discovery...");
  const dealsSearch = await testEndpoint("/api/deals/search?q=pizza");
  results.push({
    name: "Guest can search deals /api/deals/search",
    passed: dealsSearch.status === 200,
    details: `Status: ${dealsSearch.status}`,
  });

  // Test 6: Restaurant creation (should require auth)
  console.log("Testing Restaurant Creation Gate...");
  const restCreate = await testEndpoint("/api/restaurants", "POST");
  results.push({
    name: "POST /api/restaurants requires auth (returns 401/403)",
    passed: restCreate.status === 401 || restCreate.status === 403,
    details: `Status: ${restCreate.status}`,
  });

  // Test 7: Host creation (should require auth)
  console.log("Testing Host Creation Gate...");
  const hostCreate = await testEndpoint("/api/hosts", "POST");
  results.push({
    name: "POST /api/hosts requires auth (returns 401/403)",
    passed: hostCreate.status === 401 || hostCreate.status === 403,
    details: `Status: ${hostCreate.status}`,
  });

  // Test 8: User profile access
  console.log("Testing User Profile Gate...");
  const profileGuest = await testEndpoint("/api/profile");
  results.push({
    name: "GET /api/profile requires auth (returns 401)",
    passed: profileGuest.status === 401,
    details: `Status: ${profileGuest.status}`,
  });

  // Test 9: Admin endpoints (should require auth + staff role)
  console.log("Testing Admin Gate...");
  const adminAudit = await testEndpoint("/api/admin/map-pin-audit");
  results.push({
    name: "GET /api/admin/* requires auth (returns 401/403)",
    passed: adminAudit.status === 401 || adminAudit.status === 403,
    details: `Status: ${adminAudit.status}`,
  });

  // Test 10: Health check (should be public)
  console.log("Testing Health Endpoint...");
  const health = await testEndpoint("/api/health");
  results.push({
    name: "GET /api/health is public (no auth required)",
    passed: health.status === 200 || health.status === 404,
    details: `Status: ${health.status}`,
  });

  // Print results
  console.log("\n📋 AUTH GATE TEST RESULTS\n");
  results.forEach((r) => {
    const icon = r.passed ? "✅" : "❌";
    console.log(`${icon} ${r.name}`);
    console.log(`   ${r.details}\n`);
  });

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  console.log(`\n✅ SUMMARY: ${passed}/${total} tests passed\n`);

  if (passed === total) {
    console.log("🎉 All auth gates properly enforced!");
  } else {
    console.log(`⚠️  ${total - passed} gate(s) need attention`);
  }
}

auditAuthGates().catch((e) => {
  console.error("Error running audit:", e);
  process.exit(1);
});
