const Client = require('ssh2-sftp-client');
async function test() {
  const sftp = new Client();
  console.log('Connecting...');
  try {
    await sftp.connect({
      host: '65.75.201.217',
      port: 22,
      username: 'root',
      password: '7jp819V3UXeMoRk', // Just checking if it segfaults on connect
      readyTimeout: 5000
    });
    console.log('Connected!');
    await sftp.end();
  } catch (e) {
    console.log('Caught error:', e.message);
  }
}
test();
