/**
 * tools/verify-browser-console.js
 * Launches headless Edge with CDP, inspects console logs and page errors
 */

const { spawn } = require('child_process');
const http = require('http');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9222;

const edge = spawn(EDGE_PATH, [
  '--headless',
  '--disable-gpu',
  `--remote-debugging-port=${PORT}`,
  'http://localhost:8080/'
]);

edge.stderr.on('data', d => {});

async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function getWsUrl() {
  for (let i = 0; i < 20; i++) {
    try {
      const res = await new Promise((resolve, reject) => {
        http.get(`http://127.0.0.1:${PORT}/json`, r => {
          let d = '';
          r.on('data', c => d += c);
          r.on('end', () => resolve(JSON.parse(d)));
        }).on('error', reject);
      });
      if (res && res[0] && res[0].webSocketDebuggerUrl) {
        return res[0].webSocketDebuggerUrl;
      }
    } catch (e) {
      await wait(500);
    }
  }
  throw new Error('CDP not responding');
}

(async () => {
  try {
    const wsUrl = await getWsUrl();
    console.log('Connected to headless Edge CDP at:', wsUrl);

    const ws = new WebSocket(wsUrl);
    const errors = [];
    const logs = [];

    ws.onopen = () => {
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
      ws.send(JSON.stringify({ id: 2, method: 'Page.enable' }));
      ws.send(JSON.stringify({ id: 3, method: 'Network.enable' }));
    };

    ws.onmessage = msg => {
      const data = JSON.parse(msg.data);
      if (data.method === 'Runtime.consoleAPICalled') {
        const text = data.params.args.map(a => a.value).join(' ');
        logs.push(`[${data.params.type}] ${text}`);
      }
      if (data.method === 'Runtime.exceptionThrown') {
        errors.push(data.params.exceptionDetails.text + ' ' + (data.params.exceptionDetails.exception?.description || ''));
      }
      if (data.method === 'Network.requestWillBeSent') {
        const url = data.params.request.url;
        if (!url.startsWith('http://localhost:8080') && !url.startsWith('data:') && !url.startsWith('blob:')) {
          errors.push('Remote network request detected: ' + url);
        }
      }
    };

    await wait(3000);

    // Now test navigating pages and testing search
    ws.send(JSON.stringify({
      id: 10,
      method: 'Runtime.evaluate',
      params: {
        expression: `(() => {
          // 1. Selector search
          const search = document.getElementById('mat-search');
          search.value = '6061';
          search.dispatchEvent(new Event('input', { bubbles: true }));

          // 2. Open Detail page
          const firstCard = document.querySelector('.mat-card');
          if (firstCard) firstCard.click();

          // 3. Navigate to Compare page
          showPage('compare');
          const searchA = document.getElementById('search-a');
          searchA.value = '6061';
          searchA.dispatchEvent(new Event('input', { bubbles: true }));

          // 4. Navigate to Assistant and ask question
          showPage('assistant');
          const chatInput = document.getElementById('chat-input');
          chatInput.value = 'properties of 6061-T6';
          handleAssistantInput('properties of 6061-T6');

          // 5. Navigate to Calculators
          showPage('calculators');

          // 6. Navigate to About
          showPage('about');

          return { success: true };
        })()`,
        returnByValue: true
      }
    }));

    await wait(2000);

    console.log('\n--- BROWSER CONSOLE LOGS ---');
    logs.forEach(l => console.log('  ' + l));

    console.log('\n--- BROWSER CONSOLE ERRORS ---');
    if (errors.length === 0) {
      console.log('  [PASS] 0 console errors or exceptions detected!');
    } else {
      errors.forEach(e => console.error('  [ERROR] ' + e));
    }

    edge.kill();
    process.exit(errors.length > 0 ? 1 : 0);
  } catch (err) {
    console.error('Verification failed:', err);
    edge.kill();
    process.exit(1);
  }
})();
