const selfsigned = require('selfsigned');
const fs = require('fs');
const path = require('path');

const attrs = [
    { name: 'commonName', value: 'localhost' },
    { name: 'countryName', value: 'CZ' },
    { shortName: 'ST', value: 'Prague' },
    { name: 'localityName', value: 'Prague' },
    { name: 'organizationName', value: 'Oblivions Dev' },
    { shortName: 'OU', value: 'Dev' }
];

const options = {
    keySize: 2048,
    days: 365,
    algorithm: 'sha256',
    extensions: [{
        name: 'basicConstraints',
        cA: true,
    }, {
        name: 'keyUsage',
        keyCertSign: true,
        digitalSignature: true,
        nonRepudiation: true,
        keyEncipherment: true,
        dataEncipherment: true
    }, {
        name: 'subjectAltName',
        altNames: [
            { type: 2, value: 'localhost' }, // DNS
            { type: 7, ip: '127.0.0.1' }     // IP
        ]
    }]
};

const pems = selfsigned.generate(attrs, options);

const certsDir = path.join(__dirname, 'certs');

if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir);
}

fs.writeFileSync(path.join(certsDir, 'key.pem'), pems.private);
fs.writeFileSync(path.join(certsDir, 'cert.pem'), pems.cert);
// Also save as .crt for Windows
fs.writeFileSync(path.join(certsDir, 'cert.crt'), pems.cert);

console.log('Certificates generated successfully with SANs in /certs');
