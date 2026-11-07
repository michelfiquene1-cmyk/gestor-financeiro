// Chrome DevTools Protocol, no packages. Isolated temporary profile, loopback server.
// Run: node tests/browser.cjs
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const {spawn} = require('node:child_process');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
const captures=path.join(root,'.preview');
const chrome = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
async function main() {
  const publishedURL=process.env.GESTOR_TEST_URL;
  if(publishedURL && publishedURL!=='https://gestor-financeiro-michel.netlify.app') throw Error('Public browser test restricted to the existing authorized site');
  const server = http.createServer((req, res) => {
    const name = req.url === '/' ? 'index.html' : req.url.slice(1);
    if (!['index.html', 'app.js', 'styles.css'].includes(name)) { res.writeHead(404).end(); return; }
    res.setHeader('Content-Type', name.endsWith('.js') ? 'text/javascript' : name.endsWith('.css') ? 'text/css' : 'text/html');
    res.end(fs.readFileSync(path.join(root, name)));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'gestor-browser-'));
  const browser = spawn(chrome, ['--headless=new', '--remote-debugging-port=0', '--no-first-run',
    '--no-default-browser-check', '--user-data-dir=' + profile, 'about:blank'], {windowsHide: true, stdio: 'ignore'});
  let ws;
  try {
    const portFile = path.join(profile, 'DevToolsActivePort');
    for (let i = 0; i < 100 && !fs.existsSync(portFile); i++) await wait(100);
    if (!fs.existsSync(portFile)) throw Error('Browser debugging endpoint unavailable');
    const port = fs.readFileSync(portFile, 'utf8').split('\n')[0];
    const targets = await (await fetch('http://127.0.0.1:' + port + '/json')).json();
    ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
    let id = 0; const pending = new Map(); const errors = [];
    ws.onmessage = event => {
      const result = JSON.parse(event.data);
      if (result.method === 'Runtime.exceptionThrown') errors.push(result.params.exceptionDetails.text);
      if (pending.has(result.id)) {
        const {resolve, reject} = pending.get(result.id); pending.delete(result.id);
        result.error ? reject(Error(JSON.stringify(result.error))) : resolve(result.result);
      }
    };
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      pending.set(++id, {resolve, reject}); ws.send(JSON.stringify({id, method, params}));
    });
    const evaluate = async expression => {
      const r = await send('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true});
      if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails));
      return r.result.value;
    };
    await send('Runtime.enable');
    await send('Page.enable');
    const targetURL=publishedURL || 'http://127.0.0.1:' + server.address().port;
    console.log('Browser test target: '+targetURL);
    await send('Page.navigate', {url: targetURL});
    for (let i = 0; i < 100; i++) {
      if (await evaluate("document.readyState==='complete' && typeof transactions!=='undefined'")) break;
      await wait(50);
    }
    assert.equal(await evaluate('transactions.length'), 48);
    assert.equal(await evaluate("document.querySelectorAll('#flowChart .bar').length"), 12);
    await evaluate("$('monthFilter').value='';$('monthFilter').dispatchEvent(new Event('change'))");
    assert.equal(await evaluate("$('monthFilter').value"), await evaluate('today().slice(0,7)'));
    console.log('PASS browser dashboard and empty month');
    await evaluate('window.legacyOriginal=JSON.stringify(transactions);localStorage.setItem(LEGACY_KEY,window.legacyOriginal)');
    await send('Page.reload');
    for(let i=0;i<100;i++){await wait(50);if(await evaluate("document.readyState==='complete' && typeof transactions!=='undefined'"))break;}
    assert.equal(await evaluate('localStorage.getItem(STORAGE_KEY)'),null);
    assert.equal(await evaluate('transactions.length'),48);
    const originalLegacy=await evaluate('localStorage.getItem(LEGACY_KEY)');

    await evaluate("$('addBtn').focus();$('addBtn').click()");
    assert.equal(await evaluate('document.activeElement.id'), 'description');
    assert.equal(await evaluate("document.querySelector('.shell').inert"), true);
    await evaluate("document.querySelector('[type=submit]').focus()");
    await send('Input.dispatchKeyEvent', {type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9});
    assert.equal(await evaluate('document.activeElement.id'), 'closeModal');
    await send('Input.dispatchKeyEvent', {type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, modifiers: 8});
    assert.equal(await evaluate('document.activeElement.type'), 'submit');
    await send('Input.dispatchKeyEvent', {type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27});
    assert.equal(await evaluate('document.activeElement.id'), 'addBtn');
    assert.equal(await evaluate("document.querySelector('.shell').inert"), false);
    console.log('PASS browser modal focus, Tab, Shift+Tab, Escape and return focus');

    await evaluate("$('addBtn').click();$('description').value='Teste fictício';$('amount').value='12.34';$('transactionForm').requestSubmit()");
    assert.equal(await evaluate('transactions.length'), 49);
    await evaluate("setView('transactions');document.querySelector('[data-edit=\"49\"]').focus();document.querySelector('[data-edit=\"49\"]').click();$('description').value='Editado fictício';$('transactionForm').requestSubmit()");
    assert.equal(await evaluate('document.activeElement.dataset.edit'), '49');
    await evaluate("$('searchInput').value='Editado';$('searchInput').dispatchEvent(new Event('input'))");
    assert.equal(await evaluate("document.querySelectorAll('#allRows tr').length"), 1);
    await evaluate("setView('reports')");
    assert.ok(await evaluate("$('reportAccounts').textContent.includes('Conta pessoal')"));
    console.log('PASS browser add, edit, search, reports and focus after rerender');

    await evaluate("setView('accounts');$('manageAdd').click()");
    assert.equal(await evaluate('document.activeElement.id'),'entityName');
    await evaluate("$('entityForm').querySelector('[type=submit]').focus()");
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
    assert.equal(await evaluate('document.activeElement.id'),'entityClose');
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9,modifiers:8});
    assert.equal(await evaluate('document.activeElement.type'),'submit');
    await evaluate("$('entityName').value='Conta fictícia nova';$('entityForm').requestSubmit()");
    assert.equal(await evaluate("ACCOUNTS.includes('Conta fictícia nova')"),true);
    await evaluate("openEntity('accounts','Conta fictícia nova');$('entityName').value='Conta fictícia editada';$('entityForm').requestSubmit()");
    assert.equal(await evaluate("ACCOUNTS.includes('Conta fictícia editada')"),true);
    await evaluate("openEntity('accounts','Conta fictícia editada','delete');$('entityForm').requestSubmit()");
    assert.equal(await evaluate("ACCOUNTS.includes('Conta fictícia editada')"),false);
    await evaluate("setView('categories');$('manageAdd').click();$('entityName').value='Categoria fictícia';$('entityKeywords').value='teste novo';$('entityForm').requestSubmit()");
    assert.equal(await evaluate("EXPENSE_CATEGORIES.includes('Categoria fictícia')"),true);
    await evaluate("$('addBtn').click();$('description').value='Teste novo na Loja Aurora';$('description').dispatchEvent(new Event('input'))");
    assert.notEqual(await evaluate("$('category').value"),'Categoria fictícia');
    assert.equal(await evaluate("$('establishment').value"),'');
    await evaluate("$('applySuggestion').click()");
    assert.equal(await evaluate("$('establishment').value"),'Loja Aurora');
    await evaluate("$('establishment').value='Loja fictícia';$('applySuggestion').click()");
    assert.equal(await evaluate("$('establishment').value"),'Loja fictícia');
    await evaluate("$('amount').value='7.50';$('transactionForm').requestSubmit()");
    assert.equal(await evaluate("transactions.at(-1).category"),'Categoria fictícia');
    await evaluate("openEntity('categories','Categoria fictícia','delete');$('replacement').value='Outros';$('entityForm').requestSubmit()");
    assert.equal(await evaluate("transactions.at(-1).category"),'Outros');
    await evaluate("setView('transactions');$('searchInput').value='loja ficticia';$('categoryFilter').value='Outros';$('accountFilter').value=ACCOUNTS[0];renderTransactions()");
    assert.equal(await evaluate("document.querySelectorAll('#allRows [data-edit]').length"),1);
    await send('Page.reload');
    for(let i=0;i<100;i++){await wait(50);if(await evaluate("document.readyState==='complete' && typeof transactions!=='undefined'"))break;}
    assert.equal(await evaluate("transactions.at(-1).establishment"),'Loja fictícia');
    assert.equal(await evaluate('validTransactions(transactions)'),true);
    await evaluate("setView('categories');$('manageAdd').click();$('entityName').value='Não gravar';window.entityBefore=JSON.stringify(catalog);window.entitySet=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw Error('quota')};$('entityForm').requestSubmit()");
    assert.equal(await evaluate('JSON.stringify(catalog)===window.entityBefore'),true);
    assert.equal(await evaluate("$('entityBackdrop').classList.contains('hidden')"),false);
    await evaluate('Storage.prototype.setItem=window.entitySet');
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
    assert.equal(await evaluate('document.activeElement.id'),'manageAdd');
    console.log('PASS browser accounts, categories, safe transfer, explicit suggestion, merchant filters, reload and catalog quota failure');
    assert.equal(await evaluate('localStorage.getItem(LEGACY_KEY)'),originalLegacy);
    assert.equal(await evaluate('JSON.parse(localStorage.getItem(STORAGE_KEY)).version'),3);

    const downloads = path.join(profile, 'downloads');
    fs.mkdirSync(downloads);
    await send('Browser.setDownloadBehavior', {behavior: 'allow', downloadPath: downloads});
    await evaluate("$('exportBtn').click()");
    const downloaded = path.join(downloads, 'gestor-financeiro-demo.csv');
    for (let i = 0; i < 100 && !fs.existsSync(downloaded); i++) await wait(50);
    assert.ok(fs.existsSync(downloaded));
    assert.ok(fs.readFileSync(downloaded, 'utf8').includes('Editado fictício'));
    console.log('PASS browser CSV download');

    // Inject storage errors into this isolated browser only.
    await evaluate("window.beforeFailure=JSON.stringify(transactions);window.originalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('quota','QuotaExceededError')};$('addBtn').click();$('description').value='Não salvar';$('amount').value='5';$('transactionForm').requestSubmit()");
    assert.equal(await evaluate('JSON.stringify(transactions)===window.beforeFailure'), true);
    assert.equal(await evaluate("$('modalBackdrop').classList.contains('hidden')"), false);
    assert.ok(await evaluate("$('toast').textContent.includes('preservados')"));
    await evaluate('Storage.prototype.setItem=window.originalSetItem;closeModal()');
    console.log('PASS browser storage quota failure preserves data and form');

    await evaluate("transactions=EXPENSE_CATEGORIES.map((category,i)=>({id:i+1,description:category,type:'expense',cents:(i+1)*100,category,account:ACCOUNTS[0],date:today()}));render()");
    assert.equal(await evaluate("document.querySelectorAll('#categoryList .category-line').length"), 9);
    for (const width of [1440, 760, 390, 320]) {
      await send('Emulation.setDeviceMetricsOverride', {width, height: 900, deviceScaleFactor: 1, mobile: width < 761});
      await evaluate("setView('dashboard')");
      assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth'), 'Overflow dashboard ' + width);
      await evaluate("setView('transactions')");
      assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth'), 'Overflow transactions ' + width);
      for(const view of ['reports','accounts','categories']){
        await evaluate('setView('+JSON.stringify(view)+')');
        assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth'), 'Overflow '+view+' '+width);
      }
      await evaluate("$('manageAdd').click()");
      assert.ok(await evaluate("$('entityBackdrop').querySelector('.modal').getBoundingClientRect().right<=innerWidth"));
      assert.ok(await evaluate("$('entityBackdrop').querySelector('.modal').getBoundingClientRect().bottom<=innerHeight"));
      await evaluate('closeEntity()');
      await evaluate("$('addBtn').click()");
      assert.ok(await evaluate("document.querySelector('.modal').getBoundingClientRect().right<=innerWidth"));
      await evaluate('closeModal()');
    }
    await evaluate("transactions=sampleData();setView('dashboard');$('toast').classList.remove('show')");
    await wait(250); // Finish the toast fade before visual captures.
    fs.mkdirSync(captures,{recursive:true});
    fs.writeFileSync(path.join(captures, 'mobile.png'), Buffer.from((await send('Page.captureScreenshot', {format: 'png'})).data, 'base64'));
    await evaluate("$('menuToggle').click()");
    assert.equal(await evaluate("$('menuToggle').getAttribute('aria-expanded')"),'true');
    await wait(250); // Wait for the actual drawer transition before geometry checks.
    assert.equal(await evaluate("$('sidebar').getBoundingClientRect().left"),0);
    await evaluate("document.querySelector('[data-view=accounts]').click()");
    assert.equal(await evaluate("$('menuToggle').getAttribute('aria-expanded')"),'false');
    await evaluate("$('manageAdd').click()");
    fs.writeFileSync(path.join(captures,'mobile-account-form.png'),Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
    await evaluate("closeEntity();$('addBtn').click()");
    fs.writeFileSync(path.join(captures,'mobile-form.png'),Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
    await evaluate("closeModal();setView('dashboard')");
    await send('Emulation.setDeviceMetricsOverride', {width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false});
    fs.writeFileSync(path.join(captures, 'desktop.png'), Buffer.from((await send('Page.captureScreenshot', {format: 'png'})).data, 'base64'));
    await evaluate("transactions=[];renderFlow()");
    assert.equal(await evaluate("[...document.querySelectorAll('.bar')].every(e=>e.getBoundingClientRect().height===0)"), true);
    assert.deepEqual(errors, []);
    console.log('PASS browser nine-category legend, zero bars, responsive layouts and no runtime exceptions');
    console.log('Screenshots: ' + captures);
    await evaluate('transactions=sampleData();render()');
    for (const view of ['transactions', 'reports', 'accounts', 'categories', 'form']) {
      await evaluate(view === 'form' ? "$('addBtn').click()" : 'setView(' + JSON.stringify(view) + ')');
      fs.writeFileSync(path.join(captures, view + '.png'), Buffer.from((await send('Page.captureScreenshot', {format: 'png'})).data, 'base64'));
      if (view === 'form') await evaluate('closeModal()');
    }
    const raw = '{invalid';
    await evaluate('localStorage.setItem(STORAGE_KEY,' + JSON.stringify(raw) + ')');
    await send('Page.reload');
    for (let i = 0; i < 100; i++) {
      await wait(50);
      if (await evaluate("document.readyState==='complete' && typeof storageBlocked!=='undefined' && storageBlocked")) break;
    }
    assert.equal(await evaluate('storageBlocked'), true);
    assert.equal(await evaluate("$('storageWarning').classList.contains('hidden')"), false);
    await evaluate('restoreSampleData()');
    assert.equal(await evaluate('localStorage.getItem(STORAGE_KEY)'), raw);
    console.log('PASS browser invalid storage remains untouched and warning visible');
    await send('Browser.close');
  } finally {
    if (ws) ws.close();
    browser.kill(); // Only the isolated browser process created by this test.
    server.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
