const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Extract Token from server log or env for test
async function testUpdate() {
  const url = 'http://localhost:3000/api/entities/Mosque/a46b4d7c-5e05-45fb-9e23-99fd16983700'; // Example ID from debug-users
  const payload = {
    name: "Masjid At-Taqwa Metro Villa TEST",
    email: "dkmattaqwacilegon@gmail.com",
    latitude: -6.0,
    longitude: 106.0
  };
  
  // Note: We need a valid token to bypass authenticateToken
  // For now we'll just check if the server is up and logs the request if we hit it.
  try {
    console.log("Hitting backend locally...");
    const res = await axios.patch(url, payload, { timeout: 5000 });
    console.log("Response:", res.status, res.data);
  } catch (err) {
    if (err.response) {
      console.log("Backend Responded with Error:", err.response.status, err.response.data);
    } else {
      console.log("Backend Did Not Respond (Hanging or Closed):", err.message);
    }
  }
}

testUpdate();
