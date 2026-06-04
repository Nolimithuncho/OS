import http from 'https';
import fs from 'fs';

const url = 'https://oc.japhetprosper13.workers.dev/assets/index-ZNXgXHb3.js';
const file = fs.createWriteStream('downloaded_js.js');

http.get(url, (response) => {
  response.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log('Download completed');
  });
}).on('error', (err) => {
  console.error('Error downloading:', err.message);
});
