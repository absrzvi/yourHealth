import fetch from 'node-fetch';
import FormData from 'form-data';

async function testPostApi() {
  console.log('Testing POST request to /api/test-post');
  
  // Create form data
  const form = new FormData();
  form.append('testField', 'testValue');
  form.append('anotherField', 'anotherValue');
  
  try {
    // Send POST request
    const response = await fetch('http://localhost:3000/api/test-post', {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
    });
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Response Headers:', response.headers.raw());
    
    // Try to parse response as JSON
    try {
      const data = await response.json();
      console.log('Response Body:', JSON.stringify(data, null, 2));
    } catch (e) {
      console.log('Response is not valid JSON');
      const text = await response.text();
      console.log('Response Body:', text);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testPostApi();
