// Minimal fetch test for simple-test API
import fetch from 'node-fetch';

// API endpoint
const apiUrl = 'http://localhost:3000/api/simple-test';

async function testApi() {
  console.log(`Testing simple API at ${apiUrl}`);
  
  try {
    // Test GET request
    console.log('Testing GET...');
    const getResponse = await fetch(apiUrl);
    
    console.log(`GET Status: ${getResponse.status} ${getResponse.statusText}`);
    
    const getContentType = getResponse.headers.get('content-type');
    console.log('Content Type:', getContentType);
    
    if (getContentType && getContentType.includes('application/json')) {
      const getData = await getResponse.json();
      console.log('GET Response:', JSON.stringify(getData, null, 2));
    } else {
      const getText = await getResponse.text();
      console.log('GET Response (text):', getText.substring(0, 200) + (getText.length > 200 ? '...' : ''));
    }
    
    // Test POST request
    console.log('\nTesting POST...');
    const postResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'data' })
    });
    
    console.log(`POST Status: ${postResponse.status} ${postResponse.statusText}`);
    
    const postContentType = postResponse.headers.get('content-type');
    console.log('Content Type:', postContentType);
    
    if (postContentType && postContentType.includes('application/json')) {
      const postData = await postResponse.json();
      console.log('POST Response:', JSON.stringify(postData, null, 2));
    } else {
      const postText = await postResponse.text();
      console.log('POST Response (text):', postText.substring(0, 200) + (postText.length > 200 ? '...' : ''));
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test function
testApi();
