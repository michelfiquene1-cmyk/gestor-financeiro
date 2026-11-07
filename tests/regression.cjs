// No dependencies. Run: node tests/regression.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../app.js'), 'utf8');
const core = source.slice(0, source.indexOf("$('monthFilter').value=today()"));
let checks = 0;
function test(name, fn) { fn(); checks++; console.log('PASS ' + name); }
function setup(stored = null, legacy = null) {
  const elements = {};
  const storage = {raw: stored, legacy, fail: false, readFail: false, writes: 0};
  const context = {Intl, Date, setTimeout: () => 0, clearTimeout() {}, console,
    localStorage: {
      getItem(key) { if (storage.readFail) throw Error('denied'); return key.endsWith('v1') ? storage.legacy ?? null : storage.raw; },
      setItem(key, value) { if (storage.fail) throw Error('quota'); if(!storage.ignore) storage.raw = value; storage.writes++; }
    },
    document: {getElementById(id) { return elements[id] ||= {value: '', textContent: '', innerHTML: '', style: {},
      classList: {add() {}, remove() {}}}; }}
  };
  vm.createContext(context); vm.runInContext(core, context);
  const run = expression => vm.runInContext(expression, context);
  run("render=()=>{};closeModal=()=>{};$('monthFilter').value=today().slice(0,7)");
  function form() { run("$('description').value='Teste';$('entryType').value='expense';$('amount').value='10.25';$('category').value='Mercado';$('account').value=ACCOUNTS[0];$('entryDate').value='2026-11-05';$('editId').value=''"); }
  return {run, storage, form};
}
const base = setup().run('JSON.stringify(sampleData())');
test('Samples, exact totals and valid empty collection', () => {
  const {run} = setup();
  assert.equal(run('transactions.length'), 48);
  assert.equal(run('validTransactions(transactions)'), true);
  assert.equal(run('validTransactions([])'), true);
  assert.equal(run('totals(byMonth()).income'), 515000);
  assert.equal(run('totals(byMonth()).expense'), 259300);
});
for (const operation of ['add', 'edit', 'delete', 'restore']) {
  test(operation + ': failed write preserves memory and storage', () => {
    const t = setup(base); t.form(); t.storage.fail = true;
    if (operation === 'edit') t.run("$('editId').value='1'");
    if (operation === 'add' || operation === 'edit') t.run('saveTransaction({preventDefault(){}})');
    else t.run(operation === 'delete' ? 'deleteTransaction(1)' : 'restoreSampleData()');
    assert.equal(t.storage.raw, base);
    assert.equal(t.run('JSON.stringify(transactions)'), base);
    assert.match(t.run("$('toast').textContent"), /preservados/);
  });
}
test('Successful add/edit/delete/restore and reload', () => {
  const t = setup(base); t.form(); t.run('saveTransaction({preventDefault(){}})');
  assert.equal(setup(t.storage.raw).run('transactions.length'), 49);
  t.run("$('editId').value='49';$('description').value='Editado';saveTransaction({preventDefault(){}})");
  assert.equal(setup(t.storage.raw).run('transactions[48].description'), 'Editado');
  t.run('deleteTransaction(49)'); assert.equal(setup(t.storage.raw).run('transactions.length'), 48);
  t.run('restoreSampleData()'); assert.equal(setup(t.storage.raw).run('JSON.stringify(transactions)'), base);
});
test('Concurrent storage change and read errors prevent overwrites', () => {
  for (const failRead of [false, true]) {
    const t = setup(base); t.form();
    if (failRead) t.storage.readFail = true; else t.storage.raw = 'external change';
    t.run('saveTransaction({preventDefault(){}})');
    assert.equal(t.storage.writes, 0); assert.equal(t.run('JSON.stringify(transactions)'), base);
  }
});
test('Invalid dates, IDs, descriptions, types, values, accounts and categories rejected', () => {
  const sample = JSON.parse(base)[0];
  const changes = [{id: 0}, {id: -1}, {id: 1.5}, {id: Number.MAX_SAFE_INTEGER + 1},
    {description: ''}, {description: ' '}, {description: 'x'.repeat(81)}, {type: 'other'},
    {cents: 0}, {cents: -1}, {cents: 1.2}, {cents: 99999999901},
    {date: '2026-02-29'}, {date: '2026-99-01'}, {date: '0000-01-01'}, {date: null},
    {account: 'unknown'}, {category: 'Mercado'}];
  for (const change of changes) {
    const raw = JSON.stringify([{...sample, ...change}]); const t = setup(raw);
    assert.equal(t.run('storageBlocked'), true, JSON.stringify(change));
    t.run('restoreSampleData()'); assert.equal(t.storage.raw, raw); assert.equal(t.storage.writes, 0);
  }
  for (const raw of ['{', '{}', 'null', '[null]', JSON.stringify([sample, sample])]) {
    const t = setup(raw); assert.equal(t.run('storageBlocked'), true);
    assert.equal(t.storage.raw, raw);
  }
  assert.equal(setup().run("isValidDate('2024-02-29')"), true);
});
test('Empty and invalid months retain last valid period without RangeError', () => {
  const {run} = setup(); run("$('monthFilter').value='2024-02';selectedMonth()");
  for (const value of ['', 'invalid', '2026-13', '0000-01', '10000-01']) {
    run("$('monthFilter').value=" + JSON.stringify(value) + ';renderFlow()');
    assert.equal(run("$('monthFilter').value"), '2024-02');
  }
  run("$('monthFilter').value='0001-01';renderFlow()");
});
test('CSV neutralizes formulas, controls, quotes, separators and line breaks', () => {
  const {run} = setup();
  for (const value of ['=1+1', '+1', '-1', '@SUM(1)', '  =1', '\t=1', '\r=1', '\n=1', '\u0000=1']) {
    assert.ok(run('csvCell(' + JSON.stringify(value) + ')').startsWith('"\''));
  }
  assert.equal(run('csvCell(' + JSON.stringify('Café; "teste"\nlinha') + ')'), '"Café; ""teste""\nlinha"');
  const csv = run('buildCSV(transactions)');
  assert.equal(csv.charCodeAt(0), 0xfeff); assert.ok(csv.includes(';')); assert.ok(csv.includes('\r\n'));
});
test('All nine categories have labels and amounts', () => {
  const {run} = setup();
  run("renderCategories(EXPENSE_CATEGORIES.map((category,i)=>({type:'expense',category,cents:(i+1)*100})))");
  assert.equal((run("$('categoryList').innerHTML").match(/class="category-line"/g) || []).length, 9);
  assert.ok(run("$('categoryList').innerHTML.includes('Outros')"));
  run('renderCategories([])'); assert.match(run("$('categoryList').innerHTML"), /Sem despesas/);
});
test('Zero bars have zero height and accessible exact values', () => {
  const {run} = setup('[]'); run('renderFlow()');
  const html = run("$('flowChart').innerHTML");
  assert.equal((html.match(/height:0%/g) || []).length, 12);
  assert.equal((html.match(/role="img"/g) || []).length, 6);
  assert.ok(html.includes('Receitas:')); assert.ok(html.includes('Despesas:'));
});
test('Form rejects fractional cents, impossible dates and HTML is escaped', () => {
  const t = setup(base); t.form();
  for (const expression of ["$('amount').value='0.001'", "$('entryDate').value='2026-02-30'"]) {
    t.form(); t.run(expression); t.run('saveTransaction({preventDefault(){}})');
    assert.equal(t.storage.writes, 0);
  }
  assert.equal(t.run("escapeHTML('<script>')"), '&lt;script&gt;');
});
console.log(checks + ' regression scenarios passed. Browser and spreadsheet tests are separate.');
test('V1 migration is lazy, preserves original, and reloads V3 metadata',()=>{
  const t=setup(null,base); assert.equal(t.storage.writes,0);assert.equal(t.storage.raw,null);
  t.form();t.run('saveTransaction({preventDefault(){}})');
  assert.equal(t.storage.legacy,base);assert.equal(JSON.parse(t.storage.raw).version,3);
  assert.equal(setup(t.storage.raw,base).run('transactions.length'),49);
  const blocked=setup(null,'{broken');assert.equal(blocked.run('storageBlocked'),true);assert.equal(blocked.storage.writes,0);
});
function entity(t,kind,name,newName,type,operation='edit',replacement='') {
  t.run('closeEntity=()=>{};refreshFilters=()=>{}');
  t.run(`entityContext=${JSON.stringify({kind,name,operation})};$('entityName').value=${JSON.stringify(newName)};$('entityType').value=${JSON.stringify(type)};$('entityColor').value='#4275f5';$('entityIcon').value='▣';$('entityKeywords').value='teste, exemplo';$('replacement').value=${JSON.stringify(replacement)};saveEntity({preventDefault(){}})`);
}
test('Account add, rename references, reject deletion without destination, transfer and reload',()=>{
  const t=setup(base);
  entity(t,'accounts','','Conta fictícia','Conta digital');
  assert.equal(t.run("ACCOUNTS.includes('Conta fictícia')"),true);
  entity(t,'accounts','Conta pessoal','Principal fictícia','Conta corrente');
  assert.equal(t.run("transactions.some(t=>t.account==='Conta pessoal')"),false);
  const before=t.storage.raw;
  entity(t,'accounts','Principal fictícia','','','delete');assert.equal(t.storage.raw,before);
  entity(t,'accounts','Principal fictícia','','','delete','Conta fictícia');
  assert.equal(setup(t.storage.raw).run('validTransactions(transactions)'),true);
  assert.equal(t.run("ACCOUNTS.includes('Principal fictícia')"),false);
});
test('Category create, rename, type guard, safe transfer, keywords and failure atomicity',()=>{
  const t=setup(base);entity(t,'categories','','Exemplo fictício','expense');
  assert.equal(t.run("detectCategory('TESTE','expense').name"),'Exemplo fictício');
  entity(t,'categories','Mercado','Mercado fictício','expense');
  assert.equal(t.run("transactions.some(t=>t.category==='Mercado')"),false);
  const before=t.storage.raw;
  entity(t,'categories','Mercado fictício','Mercado fictício','income');assert.equal(t.storage.raw,before);
  t.storage.fail=true;entity(t,'categories','Mercado fictício','','','delete','Exemplo fictício');assert.equal(t.storage.raw,before);
  t.storage.fail=false;entity(t,'categories','Mercado fictício','','','delete','Exemplo fictício');
  assert.equal(setup(t.storage.raw).run('validTransactions(transactions)'),true);
});
test('Merchant persistence, search, combined filters and CSV protection',()=>{
  const t=setup(base);t.form();t.run("$('establishment').value='=Loja fictícia';saveTransaction({preventDefault(){}})");
  assert.equal(setup(t.storage.raw).run('transactions[48].establishment'),'=Loja fictícia');
  assert.ok(t.run('buildCSV(transactions)').includes("\"'=Loja fictícia\""));
  t.run("$('typeFilter').value='expense';$('categoryFilter').value='Mercado';$('accountFilter').value=ACCOUNTS[0];$('searchInput').value='loja ficticia'");
  assert.equal(t.run('filteredTransactions().length'),1);
  t.run("$('searchInput').value='10,25'");assert.equal(t.run('filteredTransactions().length'),1);
  t.run("$('accountFilter').value=ACCOUNTS[1]");assert.equal(t.run('filteredTransactions().length'),0);
});
test('Invalid catalog, versions, merchant and empty comparison handled',()=>{
  const t=setup(base);
  assert.equal(t.run("validTransactions([{...transactions[0],establishment:23}])"),false);
  for(const data of [{version:99,catalog:t.run('catalog'),transactions:[]},{version:3,catalog:{accounts:[],categories:[]},transactions:[]}]) {
    assert.equal(setup(JSON.stringify(data)).run('storageBlocked'),true);
  }
  assert.match(t.run('comparison(100,0)'),/Sem base/);
  assert.match(t.run('comparison(0,0)'),/Sem movimentação/);
  assert.equal(t.run('comparison(0,100)'),'-100,0% vs. mês anterior');
  assert.equal(t.run("detectEstablishment('Compras no Mercado Aurora')"),'Mercado Aurora');
  assert.equal(t.run("detectEstablishment('Sem estabelecimento')"),'');
});
test('Unconfirmed writes do not claim success; invalid V3 never falls back over V1',()=>{
  const t=setup(base);t.form();t.storage.ignore=true;t.run('saveTransaction({preventDefault(){}})');
  assert.equal(t.storage.raw,base);assert.equal(t.run('JSON.stringify(transactions)'),base);
  assert.match(t.run("$('toast').textContent"),/confirmar/);
  const invalid=setup('{invalid',base);assert.equal(invalid.run('storageBlocked'),true);
  invalid.run('restoreSampleData()');assert.equal(invalid.storage.raw,'{invalid');assert.equal(invalid.storage.legacy,base);assert.equal(invalid.storage.writes,0);
});
console.log(checks+' total regression scenarios passed.');
