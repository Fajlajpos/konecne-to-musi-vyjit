const selfsigned = require('selfsigned');
const fs = require('fs');
const path = require('path');

const attrs = [{ name: 'commonName', value: 'localhost' }];
const pems = selfsigned.generate(attrs, { days: 365 });

const certsDir = path.join(__dirname, 'certs');

if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir);
}

fs.writeFileSync(path.join(certsDir, 'key.pem'), pems.private);
fs.writeFileSync(path.join(certsDir, 'cert.pem'), pems.cert);

console.log('Certificates generated successfully in /certs');
