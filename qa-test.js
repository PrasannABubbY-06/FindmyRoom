async function testEndpoints() {
  const baseUrl = 'http://localhost:5000';
  const endpoints = [
    { method: 'GET', url: '/api/rooms/trending' },
    { method: 'GET', url: '/api/rooms' },
    { method: 'GET', url: '/api/community/posts' },
    { method: 'GET', url: '/api/community/groups' },
    { method: 'GET', url: '/api/roommates' }
  ];

  let passed = 0;
  let failed = 0;
  let logs = [];

  for (const ep of endpoints) {
    try {
      const res = await fetch(`${baseUrl}${ep.url}`);
      if (res.ok) {
        passed++;
        logs.push(`[PASS] ${ep.method} ${ep.url} - Status: ${res.status}`);
      } else {
        failed++;
        logs.push(`[FAIL] ${ep.method} ${ep.url} - Status: ${res.status}`);
      }
    } catch (e) {
      failed++;
      logs.push(`[ERROR] ${ep.method} ${ep.url} - Error: ${e.message}`);
    }
  }

  console.log('=== API Test Results ===');
  console.log(logs.join('\n'));
  console.log(`Passed: ${passed}, Failed: ${failed}`);
}

testEndpoints();
