const fetch = require('node-fetch');

async function testRoute() {
  try {
    console.log('Testing API Routes');
    
    // Test GET request
    console.log('\nTesting GET request...');
    const getResponse = await fetch('http://localhost:3000/api/claims/test-route');
    const getData = await getResponse.json();
    console.log(`GET Status: ${getResponse.status}`);
    console.log('GET Response:', getData);
    
    // Test POST request
    console.log('\nTesting POST request...');
    const postResponse = await fetch('http://localhost:3000/api/claims/test-route', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ test: 'data' })
    });
    const postData = await postResponse.json();
    console.log(`POST Status: ${postResponse.status}`);
    console.log('POST Response:', postData);
    
  } catch (error) {
    console.error('Error:', error.message || error);
  }
}

testRoute();
