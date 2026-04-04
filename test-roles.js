async function test() {
  // Test if RolePermission endpoint is working
  const r1 = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'admin@masjidkusmart.com', password: 'admin123' })
  });
  const data = await r1.json();
  const token = data.token;
  if (!token) throw new Error("Login failed");

  const r2 = await fetch('http://localhost:3000/api/entities/RolePermission', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const roles = await r2.json();
  console.log("Current Roles setup:", roles);
  
  if (roles.length === 0) {
    const r3 = await fetch('http://localhost:3000/api/entities/RolePermission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ role_name: 'test_role', permissions: JSON.stringify({ 'kegiatan': { view: true, edit: false, delete: false }}) })
    });
    console.log("Created test role", await r3.json());
  }
}
test();
