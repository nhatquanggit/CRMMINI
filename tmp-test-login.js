const http = require('http');

const data = JSON.stringify({
  email: "test502@example.com",
  password: "password123"
});

const opts = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(opts, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    let json = JSON.parse(body);
    console.log("Login HTTP code:", res.statusCode);
    if(json.data && json.data.token) {
        console.log("Logged in. Getting Admin users...");
        const req2 = http.request({
            hostname: 'localhost',
            port: 5000,
            path: '/api/admin/users',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${json.data.token}` }
        }, res2 => {
            let b2 = '';
            res2.on('data', c => b2 += c);
            res2.on('end', () => {
                console.log("Admin Users HTTP code:", res2.statusCode);
                console.log("Admin Users body:", b2);
            });
        });
        req2.end();
    }
  });
});
req.write(data);
req.end();
