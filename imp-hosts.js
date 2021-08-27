const Firestore = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: "tilde-323223",
    keyFilename: 'k.json',
});
const admin = require('firebase-admin');

let hosts;

db.collection('imp').doc('hosts').onSnapshot((snap) => {
    hosts = snap.data();
});


const http = require('http');

const requestListener = function (req, res) {
    res.writeHead(200);
    res.end(hosts);
}

const server = http.createServer(requestListener);
server.listen(8080);