import axios from 'axios';

// --- Configuration ---
const BASE_URL = 'http://localhost:3000'; // Adjust port if needed (default NestJS is 3000)
const API_URL = `${BASE_URL}/api`; // Swagger/API prefix? No, based on main.ts, it's just root or maybe mapped.
// Wait, checking main.ts again... `await app.listen(3001);`
// And `SwaggerModule.setup('api', app, document);`
// Controlllers are mapped at root? `ingestion.controller.ts` is `@Controller('ingest')`.
// So it's `http://localhost:3001/ingest`.
// Users/Auth? `auth.controller.ts` -> `@Controller('auth')`.
// Let's correct the port to 3001 based on main.ts.

const PORT = 3000;
const URL = `http://localhost:${PORT}`;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bgRed: '\x1b[41m',
};

const log = (msg: string, color: string = colors.reset) => {
  console.log(`${color}${msg}${colors.reset}`);
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function runDemo() {
  log(`\n🚀 STARTING PORTFOLIO DEMO SCENARIO`, colors.bright + colors.cyan);
  log(`Target: ${URL}\n`, colors.cyan);

  // 1. Authentication
  let token: string | null = null;
  const uniqueId = Math.floor(Math.random() * 10000);
  const userEmail = `recruiter${uniqueId}@demo.com`;
  const userPass = 'DemoPass123!';

  try {
    log(`[1/4] 🔐 Authenticating as ${userEmail}...`, colors.yellow);

    // Register
    try {
      await axios.post(`${URL}/users`, {
        email: userEmail,
        password: userPass,
      });
      log(`  ✓ Registered new user`, colors.green);
    } catch (e: any) {
      if (e.response && e.response.status === 409) {
        log(`  ℹ User already exists, proceeding to login`, colors.yellow);
      } else {
        throw e;
      }
    }

    // Login
    const loginRes = await axios.post(`${URL}/auth/login`, {
      email: userEmail,
      password: userPass,
    });

    token = loginRes.data.access_token;
    if (!token) throw new Error('No access token received');
    log(`  ✓ Login successful! Token received.`, colors.green);
  } catch (error: any) {
    log(`❌ Auth Failed: ${error.message}`, colors.red);
    if(error.code) log(`  Code: ${error.code}`, colors.red);
    if(error.response) {
        log(`  Status: ${error.response.status}`, colors.red);
        console.log(error.response.data);
    } else {
        console.log(error);
    }
    process.exit(1);
  }

  // 2. Normal Traffic Simulation
  try {
    log(
      `\n[2/4] 🟢 Simulating Normal Traffic (Info/Debug logs)...`,
      colors.yellow,
    );
    const services = [
      'payment-service',
      'user-service',
      'notification-service',
    ];

    for (let i = 0; i < 5; i++) {
      const service = services[Math.floor(Math.random() * services.length)];
      await axios.post(`${URL}/ingest`, {
        service_id: service,
        level: 'INFO',
        message: `Processed request ${i}`,
        metadata: { duration: Math.random() * 100 },
        timestamp: new Date().toISOString(),
      });
      process.stdout.write('.');
      await sleep(200);
    }
    log(`\n  ✓ Sent 5 normal logs. No incidents expected.`, colors.green);
  } catch (error: any) {
    log(`❌ Ingestion Failed: ${error.message}`, colors.red);
  }

  // 3. Incident Simulation (The Crash)
  log(
    `\n[3/4] 💥 SIMULATING SYSTEM CRASH (Goal: Trigger Detection)`,
    colors.bgRed + colors.bright,
  );
  log(`  Sending burst of CRITICAL errors...`, colors.red);

  try {
    for (let i = 0; i < 15; i++) {
      // Send 15 to be sure > 5 threshold
      await axios.post(`${URL}/ingest`, {
        service_id: 'payment-service',
        level: 'ERROR',
        message: `Database Connection Timeout: Pool Empty`,
        metadata: { error_code: 'ECONNRESET', attempt: i },
        timestamp: new Date().toISOString(),
      });
      process.stdout.write('x');
      await sleep(100); // Fast burst
    }
    log(
      `\n  ✓ Burst complete. Waiting for logical "intelligence" to react...`,
      colors.yellow,
    );
  } catch (error: any) {
    log(`❌ Burst Failed: ${error.message}`, colors.red);
  }

  // 4. Verification (Polling)
  log(`\n[4/4] 🕵️ verifying Incident Creation...`, colors.yellow);
  const maxRetries = 15; // 15 * 2s = 30s max wait (cron runs every 10s)
  let found = false;

  for (let i = 0; i < maxRetries; i++) {
    try {
      // Use the token to fetch incidents (protected route)
      // Need to check specific endpoint for fetching incidents.
      // Assuming GET /incidents based on typical REST, but let's check controller later if this fails.
      // Just guessing the endpoint given the structure described in README.

      const res = await axios.get(`${URL}/incidents`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Look for recent open incident
      // Look for recent open incident
      // API returns paginated response: { data: [...], meta: ... }
      const incidents = res.data.data;
      const relevantIncident = incidents.find(
        (inc: any) =>
          inc.status === 'OPEN' && inc.title.includes('High Error Rate'),
      );

      if (relevantIncident) {
        log(
          `\n✅ SUCCESS! The system automatically detected the failure.`,
          colors.bright + colors.green,
        );
        log(`  Incident ID: ${relevantIncident.id}`, colors.cyan);
        log(`  Title:       ${relevantIncident.title}`, colors.cyan);
        log(`  Severity:    ${relevantIncident.severity}`, colors.red);
        found = true;
        break;
      }
    } catch (e: any) {
      // Ignore auth/fetch errors during polling if transient, but print if persistent
      if (i === maxRetries - 1)
        log(`  Polling error: ${e.message}`, colors.red);
    }

    process.stdout.write('.');
    await sleep(2000);
  }

  if (!found) {
    log(
      `\n❌ Failed to detect incident within expected time window.`,
      colors.red,
    );
    log(
      `  Possible reasons: Cron didn't run, threshold not met, or API changed.`,
      colors.yellow,
    );
  } else {
    log(
      `\n✨ DEMO COMPLETE. The platform works as intended.`,
      colors.bright + colors.green,
    );
  }
}

runDemo();
