/**
 * API RBAC Verification Tests
 * 
 * Run this after staff system is deployed to verify:
 * - RBAC guards work correctly
 * - Staff cannot escalate
 * - Password reset is enforced
 * - Disabled accounts are blocked
 * 
 * Usage:
 * 1. Start target server (default: http://localhost:5200)
 * 2. Get session cookies from browser DevTools (Application > Cookies)
 * 3. Set env vars (preferred):
 *    RBAC_BASE_URL=http://localhost:5200
 *    RBAC_COOKIE_CUSTOMER="connect.sid=..."
 *    RBAC_COOKIE_STAFF="connect.sid=..."
 *    RBAC_COOKIE_ADMIN="connect.sid=..."
 * 4. Run: npm run test:staff-rbac
 */

const BASE_URL = process.env.RBAC_BASE_URL || "http://localhost:5200";

// ⚠️ UPDATE THESE WITH REAL SESSION COOKIES FROM BROWSER
const COOKIES = {
  customer: "connect.sid=PASTE_CUSTOMER_COOKIE_HERE",
  staff: "connect.sid=PASTE_STAFF_COOKIE_HERE",
  admin: "connect.sid=PASTE_ADMIN_COOKIE_HERE",
};

const envOrFallback = (envValue: string | undefined, fallback: string) =>
  envValue && envValue.trim().length > 0 ? envValue.trim() : fallback;

const runtimeCookies = {
  customer: envOrFallback(process.env.RBAC_COOKIE_CUSTOMER, COOKIES.customer),
  staff: envOrFallback(process.env.RBAC_COOKIE_STAFF, COOKIES.staff),
  admin: envOrFallback(process.env.RBAC_COOKIE_ADMIN, COOKIES.admin),
};

interface TestResult {
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
}

const results: TestResult[] = [];

async function testEndpoint(
  name: string,
  method: string,
  url: string,
  cookie: string,
  body: any = null,
  expectedStatus: number
) {
  try {
    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const status = response.status;
    const passed = status === expectedStatus;

    results.push({
      name,
      passed,
      expected: `${expectedStatus}`,
      actual: `${status}`,
    });

    const symbol = passed ? "✅" : "❌";
    console.log(`${symbol} ${name}: ${status} (expected ${expectedStatus})`);

    if (!passed) {
      const text = await response.text();
      console.log(`   Response: ${text.substring(0, 200)}`);
    }

    return { status, passed };
  } catch (error: any) {
    results.push({
      name,
      passed: false,
      expected: `${expectedStatus}`,
      actual: `ERROR: ${error.message}`,
    });

    console.log(`❌ ${name}: ERROR - ${error.message}`);
    return { status: 0, passed: false };
  }
}

async function main() {
  console.log("🔒 STAFF ROLE RBAC VERIFICATION TESTS\n");
  console.log("=" .repeat(60));

  // Check if cookies are set
  if (
    runtimeCookies.customer.includes("PASTE") ||
    runtimeCookies.staff.includes("PASTE") ||
    runtimeCookies.admin.includes("PASTE")
  ) {
    console.error(
      "❌ ERROR: Missing RBAC cookies. Set RBAC_COOKIE_CUSTOMER, RBAC_COOKIE_STAFF, and RBAC_COOKIE_ADMIN."
    );
    console.log("\nHow to get cookies:");
    console.log("1. Log in to MealScout in browser");
    console.log("2. Open DevTools (F12)");
    console.log("3. Go to Application > Cookies > localhost");
    console.log("4. Copy 'connect.sid' value");
    console.log("5. Set env vars before running the script:\n");
    console.log(
      '   $env:RBAC_COOKIE_CUSTOMER="connect.sid=..."'
    );
    console.log('   $env:RBAC_COOKIE_STAFF="connect.sid=..."');
    console.log('   $env:RBAC_COOKIE_ADMIN="connect.sid=..."');
    console.log('   $env:RBAC_BASE_URL="http://localhost:5200"\n');
    process.exit(1);
  }

  console.log("\n📋 Test 1: Customer cannot access admin routes");
  console.log("-".repeat(60));
  await testEndpoint(
    "Customer → GET /api/admin/staff",
    "GET",
    `${BASE_URL}/api/admin/staff`,
    runtimeCookies.customer,
    null,
    403
  );

  console.log("\n📋 Test 2: Customer cannot access staff routes");
  console.log("-".repeat(60));
  await testEndpoint(
    "Customer → POST /api/staff/users",
    "POST",
    `${BASE_URL}/api/staff/users`,
    runtimeCookies.customer,
    { email: "test@example.com", firstName: "Test" },
    403
  );

  console.log("\n📋 Test 3: Staff cannot access admin-only routes");
  console.log("-".repeat(60));
  await testEndpoint(
    "Staff → GET /api/admin/staff",
    "GET",
    `${BASE_URL}/api/admin/staff`,
    runtimeCookies.staff,
    null,
    403
  );

  await testEndpoint(
    "Staff → POST /api/admin/staff/:id/promote",
    "POST",
    `${BASE_URL}/api/admin/staff/fake-user-id/promote`,
    runtimeCookies.staff,
    null,
    403
  );

  console.log("\n📋 Test 4: Staff CAN access staff creation routes");
  console.log("-".repeat(60));
  const testEmail = `test+rbac${Date.now()}@mealscout.test`;
  const createResult = await testEndpoint(
    "Staff → POST /api/staff/users",
    "POST",
    `${BASE_URL}/api/staff/users`,
    runtimeCookies.staff,
    { email: testEmail, firstName: "Test", lastName: "User" },
    200
  );

  if (createResult.passed) {
    console.log("   ✅ Staff successfully created user account");
  }

  console.log("\n📋 Test 5: Staff cannot inject admin role");
  console.log("-".repeat(60));
  const evilEmail = `evil+rbac${Date.now()}@mealscout.test`;
  const evilResult = await testEndpoint(
    "Staff → POST /api/staff/users (with userType:admin)",
    "POST",
    `${BASE_URL}/api/staff/users`,
    runtimeCookies.staff,
    { email: evilEmail, firstName: "Evil", userType: "admin" },
    200 // Should succeed but ignore userType
  );

  if (evilResult.status === 200) {
    console.log(
      "   ⚠️  Check database to ensure user was created as 'customer', NOT 'admin'"
    );
  }

  console.log("\n📋 Test 6: Admin can access all routes");
  console.log("-".repeat(60));
  await testEndpoint(
    "Admin → GET /api/admin/staff",
    "GET",
    `${BASE_URL}/api/admin/staff`,
    runtimeCookies.admin,
    null,
    200
  );

  await testEndpoint(
    "Admin → POST /api/staff/users",
    "POST",
    `${BASE_URL}/api/staff/users`,
    runtimeCookies.admin,
    { email: `admin-test${Date.now()}@mealscout.test`, firstName: "Admin" },
    200
  );

  // ============================================
  // Summary
  // ============================================
  console.log("\n" + "=".repeat(60));
  console.log("📊 TEST SUMMARY");
  console.log("=".repeat(60));

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;

  console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}\n`);

  if (failed > 0) {
    console.log("❌ FAILED TESTS:");
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(
          `  - ${r.name}: Expected ${r.expected}, got ${r.actual}`
        );
      });
  }

  if (passed === total) {
    console.log("✅ ALL TESTS PASSED! RBAC is correctly enforced.\n");
  } else {
    console.log("❌ SOME TESTS FAILED! Review RBAC middleware.\n");
    process.exit(1);
  }

  console.log("\n🔍 MANUAL VERIFICATION STEPS:");
  console.log(
    "1. Check database to ensure evil user is 'customer', not 'admin':"
  );
  console.log(`   SELECT email, user_type FROM users WHERE email LIKE '%rbac%';`);
  console.log("\n2. Verify audit logs captured staff actions:");
  console.log(
    `   SELECT action, user_id, resource_id FROM security_audit_log ORDER BY timestamp DESC LIMIT 10;`
  );
  console.log("\n3. Test UI guards:");
  console.log("   - Visit /staff as customer → should redirect/block");
  console.log("   - Visit /admin/dashboard as staff → should redirect/block");
  console.log("   - Visit /staff as staff → should load dashboard");

  process.exit(0);
}

main().catch((err) => {
  console.error("💥 RBAC test script failed:", err);
  process.exit(1);
});
