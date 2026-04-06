const axios = require('axios');

async function testSultanSwitch() {
  const BASE_URL = 'http://localhost:3000/api';
  console.log('--- SULTAN DEBUG: TESTING MOSQUE SWITCH ---');
  
  try {
    // 1. LOGIN
    console.log('[1/2] Melakukan Login...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      identifier: 'admin@masjidkusmart.com',
      password: 'admin123'
    });
    const token = loginRes.data.token;
    console.log('[OK] Login Berhasil. Token didapat.');

    // 2. PATCH (SWITCH)
    console.log('[2/2] Melakukan Pindah Masjid (PATCH)...');
    const switchRes = await axios.patch(`${BASE_URL}/auth/me`, 
      { current_mosque_id: 'mosque_test_id_123' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    if (switchRes.status === 200) {
      console.log('--- SULTAN SUCCESS! ---');
      console.log('User Updated:', switchRes.data.user.email);
      console.log('New Token Issued:', !!switchRes.data.token);
    } else {
      console.error('--- SULTAN FAILED! ---', switchRes.status);
    }
  } catch (err) {
    console.error('--- SULTAN ERROR! ---');
    console.error('Status:', err.response?.status || 'N/A');
    console.error('Data:', JSON.stringify(err.response?.data || err.message));
  }
}

testSultanSwitch();
