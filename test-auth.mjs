// Auth test script - tests registration, login, session, and logout
import http from 'http';

const BASE = 'http://localhost:3000';

async function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const opts = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: { 'Content-Type': 'application/json' },
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data), headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, body: data, headers: res.headers });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  const testUser = {
    name: `TestUser_${Date.now()}`,
    email: `test_${Date.now()}@test.com`,
    password: 'TestPass123!',
    phone: '1234567890'
  };

  console.log('=== 1. Health Check ===');
  const health = await request('GET', '/api/health');
  console.log(`Status: ${health.status}`, JSON.stringify(health.body, null, 2));

  console.log('\n=== 2. Register User ===');
  const register = await request('POST', '/api/auth/register', testUser);
  console.log(`Status: ${register.status}`, JSON.stringify(register.body, null, 2));

  if (register.status !== 201 && register.status !== 200) {
    console.log('\n❌ Registration failed. Testing with duplicate check...');
    // Try again to see the actual error
    const register2 = await request('POST', '/api/auth/register', {
      ...testUser,
      email: `test_${Date.now()}_2@test.com`
    });
    console.log(`Retry Status: ${register2.status}`, JSON.stringify(register2.body, null, 2));
  }

  console.log('\n=== 3. Login ===');
  const login = await request('POST', '/api/auth/callback/credentials', {
    email: testUser.email,
    password: testUser.password,
    csrfToken: 'test',
    callbackUrl: '/dashboard'
  });
  console.log(`Status: ${login.status}`);
  console.log(`Headers (set-cookie): ${login.headers['set-cookie']?.join(', ')}`);
  console.log(`Body preview:`, JSON.stringify(login.body).substring(0, 500));

  console.log('\n=== 4. Get Session ===');
  const session = await request('GET', '/api/auth/session');
  console.log(`Status: ${session.status}`, JSON.stringify(session.body, null, 2));

  console.log('\n=== 5. Test SignIn with NextAuth ===');
  // Test the signIn endpoint directly
  const signInTest = await request('POST', '/api/auth/signin', {
    email: testUser.email,
    password: testUser.password,
  });
  console.log(`Status: ${signInTest.status}`);
  console.log(`Body:`, JSON.stringify(signInTest.body).substring(0, 300));

  console.log('\n✅ Tests complete');
}

main().catch(console.error);