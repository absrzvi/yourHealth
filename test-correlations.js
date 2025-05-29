const fetch = require('node-fetch');

async function testCorrelations() {
  try {
    // First, authenticate to get a session cookie
    const loginResponse = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword',
        redirect: false,
      }),
      credentials: 'include',
    });

    if (!loginResponse.ok) {
      const error = await loginResponse.text();
      throw new Error(`Login failed: ${error}`);
    }

    const session = await loginResponse.json();
    console.log('Login successful, user:', session.user);

    // Now call the correlations endpoint with the session cookie
    const correlationsResponse = await fetch('http://localhost:3000/api/correlations', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': loginResponse.headers.get('set-cookie') || '',
      },
      credentials: 'include',
    });

    if (!correlationsResponse.ok) {
      const error = await correlationsResponse.text();
      throw new Error(`Correlations request failed: ${error}`);
    }

    const correlations = await correlationsResponse.json();
    console.log('Correlations:', JSON.stringify(correlations, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

testCorrelations();
