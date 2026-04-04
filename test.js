async function run() {
  const r = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@masjidkusmart.com', password: 'admin123' })
  });
  const d = await r.json();
  if (!d.token) { console.log('Login failed:', d); return; }
  console.log('Token received');
  
  const r2 = await fetch('http://localhost:3000/api/entities/Mosque', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + d.token },
    body: JSON.stringify({
      name: 'Masjid Coba',
      address: 'Jalan',
      city: 'Jakarta',
      email: 'coba@masjid.com',
      admin_password: 'admin_password123' // New admin password
    })
  });
  const m = await r2.json();
  console.log('Created Mosque:', m);
  
  // Verify User was created
  const r3 = await fetch('http://localhost:3000/api/entities/User', {
      headers: { 'Authorization': 'Bearer ' + d.token }
  });
  const users = await r3.json();
  const newUser = users.find(u => u.email === 'coba@masjid.com');
  console.log('New Admin User Created:', !!newUser, newUser ? newUser.role : '');
}
run();
