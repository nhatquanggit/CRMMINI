const http = require('http');

const data = JSON.stringify({
  name: "Test User",
  email: "test502@example.com",
  password: "password123"
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    const resData = JSON.parse(body);
    console.log("Register Response:", resData);
    if(resData.data && resData.data.token) {
        // Now test the admin endpoint
        const token = resData.data.token;
        const adminOpts = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/admin/users',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };
        const req2 = http.request(adminOpts, (res2) => {
            let body2 = '';
            res2.on('data', Buffer => body2 += Buffer.toString());
            res2.on('end', () => {
                console.log("Admin API Status Code:", res2.statusCode);
                console.log("Admin API Response:", body2);
            });
        });
        req2.end();
    }
  });
});

req.on('error', (error) => {
  console.error(error);
});

req.write(data);
req.end();
