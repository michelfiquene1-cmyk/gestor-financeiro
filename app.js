'use strict';
const LEGACY_KEY='gestor-financeiro-portfolio-demo-v1';
const STORAGE_KEY='gestor-financeiro-portfolio-demo-v3';
let EXPENSE_CATEGORIES=['Mercado','Moradia','Transporte','Alimentação','Saúde','Lazer','Compras','Educação','Outros'];
let INCOME_CATEGORIES=['Salário','Freelance','Vendas','Investimentos','Outras receitas'];
let ACCOUNTS=['Conta pessoal','Conta digital','Dinheiro em espécie'];
const COLORS=['#4275f5','#70a4f7','#37bfa3','#f4b35f','#9b8bf0','#e9788d','#6cc9d5','#adb8cc','#64748b'];
const defaultCatalog = () => ({
  accounts: ['Conta pessoal','Conta digital','Dinheiro em espécie'].map((name,i)=>({name,type:i===2?'Dinheiro':'Conta corrente',color:COLORS[i],icon:'▣'})),
  categories: [...['Mercado','Moradia','Transporte','Alimentação','Saúde','Lazer','Compras','Educação','Outros'], ...['Salário','Freelance','Vendas','Investimentos','Outras receitas']].map((name,i)=>({name,type:i<9?'expense':'income',color:COLORS[i%COLORS.length],icon:['▢','⌂','◇','♧','♡','▥','▧','▤','○'][i%9],keywords:({Mercado:'mercado, supermercado',Moradia:'aluguel, energia, condomínio',Transporte:'ônibus, gasolina, transporte',Alimentação:'restaurante, café, almoço',Saúde:'farmácia, consulta',Lazer:'cinema, lazer',Salário:'salário',Freelance:'freelance'})[name]||''}))
});
let catalog = defaultCatalog();
let legacySnapshot = null;
function syncCatalog() {
  ACCOUNTS=catalog.accounts.map(a=>a.name);
  EXPENSE_CATEGORIES=catalog.categories.filter(c=>c.type==='expense').map(c=>c.name);
  INCOME_CATEGORIES=catalog.categories.filter(c=>c.type==='income').map(c=>c.name);
}
function validCatalog(value) {
  if (!value || !Array.isArray(value.accounts) || !Array.isArray(value.categories)) return false;
  return ['accounts','categories'].every(kind => {
    const list=value[kind]; const names=new Set();
    return list.length>0 && list.length<=200 && list.every(item=>{
      if (!item || typeof item.name!=='string' || !item.name.trim() || item.name.length>60 || names.has(item.name.toLocaleLowerCase('pt-BR')) || !/^#[0-9a-f]{6}$/i.test(item.color) || !['▣','▢','⌂','◇','♧','♡','▥','▧','▤','○'].includes(item.icon)) return false;
      names.add(item.name.toLocaleLowerCase('pt-BR'));
      return kind==='accounts' ? ['Conta corrente','Conta digital','Cartão de crédito','Dinheiro','Outra'].includes(item.type) : ['income','expense'].includes(item.type) && typeof item.keywords==='string' && item.keywords.length<=500;
    });
  }) && value.categories.some(c=>c.type==='income') && value.categories.some(c=>c.type==='expense');
}
const $=id=>document.getElementById(id);
const money=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v/100);
const shortMoney=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(v/100);
const monthName=m=>new Intl.DateTimeFormat('pt-BR',{month:'short'}).format(new Date(`${m}-15T12:00:00`)).replace('.','');
const dateLabel=d=>d.split('-').reverse().join('/');
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function iconHTML(symbol) {
  const paths={
    '▣':'M4 5h14v4H4z M4 9h16v11H4z M15 13h5v4h-5z',
    '▢':'M5 8h14l1 13H4z M8 8V6a4 4 0 0 1 8 0v2',
    '⌂':'M3 10l9-7 9 7 M6 9v12h12V9 M10 21v-8h4v8',
    '◇':'M5 9l2-5h10l2 5 M4 9h16v9H4z M6 18v3 M18 18v3 M7 13h1 M16 13h1',
    '♧':'M5 3v6a3 3 0 0 0 6 0V3 M8 3v18 M19 3c-4 3-4 9 0 9 M19 3v18',
    '♡':'M12 21S2 15 2 8a5 5 0 0 1 10-1A5 5 0 0 1 22 8c0 7-10 13-10 13z',
    '▥':'M4 3h16v18H4z M8 3v18 M16 3v18 M4 8h4 M4 16h4 M16 8h4 M16 16h4',
    '▧':'M3 10l2-7h14l2 7 M4 10v11h16V10 M8 21v-7h8v7 M3 10h18',
    '▤':'M12 5v16 M3 3c4 0 6 0 9 2 3-2 5-2 9-2v16c-4 0-6 0-9 2-3-2-5-2-9-2z',
    '○':'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M7 12h10',
    grid:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
    layers:'M2 7l10-5 10 5-10 5z M2 12l10 5 10-5 M2 17l10 5 10-5',
    chart:'M3 3v18h18 M7 16V9 M12 16V5 M17 16v-5',
    receipt:'M6 2h12v20l-3-2-3 2-3-2-3 2z M9 7h6 M9 11h6 M9 15h4'
  };
  return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+(paths[symbol]||paths['○'])+'"/></svg>';
}
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const shiftMonth = (month, offset) => {
  const [year, number] = month.split('-').map(Number);
  const index = Math.max(12, year * 12 + number - 1 + offset);
  return String(Math.floor(index / 12)).padStart(4, '0') + '-' + String(index % 12 + 1).padStart(2, '0');
};
let lastValidMonth = today().slice(0, 7);
function selectedMonth() {
  const value = $('monthFilter').value;
  if (/^\d{4}-(0[1-9]|1[0-2])$/.test(value) && Number(value.slice(0, 4)) > 0) {
    lastValidMonth = value;
  } else {
    $('monthFilter').value = lastValidMonth;
    notify('Período inválido. Mantido o último mês válido.');
  }
  return lastValidMonth;
}
function sampleData(){const base=today().slice(0,7);const samples=[];let id=1;const add=(offset,day,description,type,cents,category,account)=>{const m=shiftMonth(base,offset);const maxDay=new Date(Number(m.slice(0,4)),Number(m.slice(5,7)),0).getDate();samples.push({id:id++,date:`${m}-${String(Math.min(day,maxDay)).padStart(2,'0')}`,description,type,cents,category,account})};for(let n=-5;n<=0;n++){add(n,2,'Salário demonstrativo','income',420000,'Salário','Conta pessoal');add(n,4,'Aluguel','expense',125000,'Moradia','Conta pessoal');add(n,7,'Supermercado','expense',68000+n*500,'Mercado','Conta digital');add(n,12,'Transporte','expense',23000,'Transporte','Conta digital');add(n,16,'Projeto freelance','income',n%2===0?95000:48000,'Freelance','Conta digital');add(n,19,'Restaurante','expense',16500,'Alimentação','Conta pessoal');add(n,23,'Assinaturas e lazer','expense',18900,'Lazer','Conta digital');add(n,26,'Farmácia','expense',7900,'Saúde','Conta pessoal')};return samples}
const MAX_CENTS = 99999999900;
let storageSnapshot = null;
let storageBlocked = false;
let storageWarning = '';
function validTransactions(items, config=catalog) {
  if (!Array.isArray(items)) return false;
  const ids = new Set();
  let total = 0;
  return items.every(item => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
    const categories = config.categories.filter(c=>c.type===item.type).map(c=>c.name);
    const valid = Number.isSafeInteger(item.id) && item.id > 0 && !ids.has(item.id)
      && typeof item.description === 'string' && item.description.trim().length > 0
      && item.description.length <= 80 && ['income', 'expense'].includes(item.type)
      && Number.isSafeInteger(item.cents) && item.cents > 0 && item.cents <= MAX_CENTS
      && typeof item.date === 'string' && isValidDate(item.date)
      && categories.includes(item.category) && config.accounts.some(a=>a.name===item.account)
      && (item.establishment===undefined || (typeof item.establishment==='string' && item.establishment.length<=80));
    ids.add(item.id);
    total += item.cents;
    return valid && Number.isSafeInteger(total);
  });
}
function loadData() {
  try {
    storageSnapshot = localStorage.getItem(STORAGE_KEY);
    legacySnapshot = localStorage.getItem(LEGACY_KEY);
    const raw = storageSnapshot === null ? legacySnapshot : storageSnapshot;
    if (raw === null) return sampleData();
    const data = JSON.parse(raw);
    const config = Array.isArray(data) ? defaultCatalog() : data && data.version===3 ? data.catalog : null;
    const items = Array.isArray(data) ? data : data && data.transactions;
    if (!validCatalog(config) || !validTransactions(items,config)) throw new Error('Dados inválidos');
    catalog=config; syncCatalog();
    return items;
  } catch {
    // Never replace an unreadable or invalid saved collection with demo data.
    storageBlocked = true;
    storageWarning = 'Dados locais indisponíveis ou inválidos. Originais preservados; gravação bloqueada. Verifique o armazenamento e recarregue.';
    return [];
  }
}
let transactions=loadData();let currentView='dashboard';let toastTimer;
function persist(next, config=catalog) {
  if (storageBlocked) {
    notify(storageWarning);
    return false;
  }
  if (!validCatalog(config) || !validTransactions(next,config)) {
    notify('Não foi possível salvar: dados inválidos ou limite numérico excedido.');
    return false;
  }
  try {
    // Avoid silently overwriting changes made in another tab.
    if (localStorage.getItem(STORAGE_KEY) !== storageSnapshot || localStorage.getItem(LEGACY_KEY)!==legacySnapshot) {
      notify('Os dados locais mudaram. Recarregue antes de tentar novamente.');
      return false;
    }
    const serialized = JSON.stringify({version:3,catalog:config,transactions:next});
    localStorage.setItem(STORAGE_KEY, serialized);
    if (localStorage.getItem(STORAGE_KEY)!==serialized) throw new Error('Gravação não confirmada');
    storageSnapshot = serialized;
    transactions = next;
    catalog=config; syncCatalog();
    return true;
  } catch {
    notify('Não foi possível confirmar a gravação neste navegador. Dados anteriores preservados em memória; recarregue antes de continuar.');
    return false;
  }
}
function notify(message){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3000)}
function byMonth(){return transactions.filter(t=>t.date.slice(0,7)===selectedMonth())}
function totals(items){return items.reduce((a,t)=>{a[t.type]+=t.cents;return a},{income:0,expense:0})}
function sorted(items){return [...items].sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id)}
function row(t,actions=false){const c=catalog.categories.find(c=>c.name===t.category);return `<tr><td><span class="tx-symbol ${t.type}" style="color:${c.color};background:${c.color}12">${iconHTML(c.icon)}</span><span class="tx-name">${escapeHTML(t.description)}</span></td><td>${escapeHTML(t.establishment||'—')}</td><td><span class="tag" style="border-left:2px solid ${c.color};background:${c.color}12">${escapeHTML(t.category)}</span></td><td>${escapeHTML(t.account)}</td><td>${dateLabel(t.date)}</td><td class="align-right"><span class="amount ${t.type}">${t.type==='income'?'+':'−'} ${money(t.cents)}</span></td>${actions?`<td class="align-right"><button class="action-btn" data-edit="${t.id}" aria-label="Editar ${escapeHTML(t.description)}">✎</button><button class="action-btn" data-delete="${t.id}" aria-label="Excluir ${escapeHTML(t.description)}">⌫</button></td>`:''}</tr>`}
function renderDashboard(){const items=byMonth();const {income,expense}=totals(items);$('incomeTotal').textContent=money(income);$('expenseTotal').textContent=money(expense);$('balanceTotal').textContent=money(income-expense);$('recentRows').innerHTML=sorted(items).slice(0,6).map(t=>row(t)).join('')||'<tr><td colspan="6" class="empty">Nenhuma transação neste mês.</td></tr>';renderFlow();renderCategories(items)}
function renderFlow() {
  const month = selectedMonth();
  const months = Array.from({length: 6}, (_, i) => shiftMonth(month, i - 5));
  const data = months.map(m => totals(transactions.filter(t => t.date.slice(0, 7) === m)));
  const max = Math.max(1, ...data.flatMap(d => [d.income, d.expense]));
  $('flowChart').innerHTML = months.map((m, i) => {
    const label = m + ' — Receitas: ' + money(data[i].income) + '; Despesas: ' + money(data[i].expense);
    return '<div class="bar-group" role="img" aria-label="' + escapeHTML(label) + '">'
      + '<div aria-hidden="true" class="bar income" title="' + escapeHTML(label) + '" style="height:' + (data[i].income / max * 100) + '%"></div>'
      + '<div aria-hidden="true" class="bar expense" title="' + escapeHTML(label) + '" style="height:' + (data[i].expense / max * 100) + '%"></div>'
      + '<small aria-hidden="true">' + escapeHTML(monthName(m)) + '</small></div>';
  }).join('');
}
function expenseBreakdown(items){const map=new Map();items.filter(t=>t.type==='expense').forEach(t=>map.set(t.category,(map.get(t.category)||0)+t.cents));return [...map.entries()].sort((a,b)=>b[1]-a[1])}
function renderCategories(items) {
  const entries = expenseBreakdown(items);
  const total = entries.reduce((sum, entry) => sum + entry[1], 0);
  $('donutTotal').textContent = shortMoney(total);
  if (!total) {
    $('donut').style.background = '#e9eef6';
    $('categoryList').innerHTML = '<div class="empty">Sem despesas no período</div>';
    return;
  }
  let start = 0;
  const segments = entries.map(([, value], index) => {
    const end = start + value / total * 100;
    const color=catalog.categories.find(c=>c.name===entries[index][0])?.color || COLORS[index % COLORS.length];
    const segment = color + ' ' + start + '% ' + end + '%';
    start = end;
    return segment;
  });
  $('donut').style.background = 'conic-gradient(' + segments.join(',') + ')';
  $('categoryList').innerHTML = entries.map(([name, value], index) =>
    '<div class="category-line" style="--category-color:'+(catalog.categories.find(c=>c.name===name)?.color || COLORS[index % COLORS.length])+';--category-percent:'+(value/total*100)+'%"><div class="category-name"><i style="background:'
    + (catalog.categories.find(c=>c.name===name)?.color || COLORS[index % COLORS.length]) + '"></i><span>' + escapeHTML(name)
    + '</span></div><b>' + (value / total * 100).toFixed(0) + '% — ' + money(value) + '</b></div>'
  ).join('');
}
function filteredTransactions() {
  const q=normalize($('searchInput').value.trim()), type=$('typeFilter').value;
  const category=$('categoryFilter').value, account=$('accountFilter').value;
  return sorted(transactions.filter(t=>(type==='all'||t.type===type) && (!category||t.category===category) && (!account||t.account===account) && normalize([t.description,t.establishment||'',money(t.cents),(t.cents/100).toFixed(2),(t.cents/100).toFixed(2).replace('.',',')].join(' ')).includes(q)));
}
function renderTransactions(){const items=filteredTransactions();$('allRows').innerHTML=items.map(t=>row(t,true)).join('')||'<tr><td colspan="7" class="empty">Nenhuma transação encontrada.</td></tr>';$('transactionCount').textContent=`${items.length} transação(ões) encontrada(s) · Todo o histórico`}
function renderReports(){const items=byMonth(),categories=expenseBreakdown(items);$('reportCategories').innerHTML=categories.map(([name,value])=>`<div class="report-row"><span>${escapeHTML(name)}</span><b>${money(value)}</b></div>`).join('')||'<div class="empty">Sem despesas no período</div>';const accounts=ACCOUNTS.map(a=>[a,totals(items.filter(t=>t.account===a))]);$('reportAccounts').innerHTML=accounts.map(([name,t])=>`<div class="report-row"><span>${escapeHTML(name)}</span><b>${money(t.income-t.expense)}</b></div>`).join('')}
function render(){renderDashboard();renderTransactions();renderReports();renderEvolution()}
const titles={dashboard:['Visão geral','Acompanhe suas finanças em um só lugar.'],transactions:['Transações','Gerencie seus lançamentos financeiros.'],reports:['Relatórios','Explore seus resultados por categoria e conta.']};
function setView(view){if(!titles[view])return;currentView=view;document.querySelectorAll('.view').forEach(e=>e.classList.toggle('hidden',e.id!==`${view}View`));document.querySelectorAll('[data-view]').forEach(e=>{e.classList.toggle('active',e.dataset.view===view);if(e.dataset.view===view)e.setAttribute('aria-current','page');else e.removeAttribute('aria-current')});$('pageTitle').textContent=titles[view][0];$('crumbTitle').textContent=view==='dashboard'?'Visão geral':titles[view][0];$('pageSubtitle').textContent=titles[view][1];$('sidebar').classList.remove('open');$('menuToggle').setAttribute('aria-expanded','false');$('manageAdd').classList.toggle('hidden',!['accounts','categories'].includes(view));$('manageAdd').textContent=view==='accounts'?'+ Nova conta':'+ Nova categoria';render();window.scrollTo({top:0,behavior:'smooth'})}
function updateCategories(){const type=$('entryType').value;const options=type==='income'?INCOME_CATEGORIES:EXPENSE_CATEGORIES;const previous=$('category').value;$('category').innerHTML=options.map(x=>`<option value="${escapeHTML(x)}">${escapeHTML(x)}</option>`).join('');if(options.includes(previous))$('category').value=previous}
let modalOrigin = null;
let modalEditId = null;
let previousOverflow = '';
function openModal(id=null){modalOrigin=document.activeElement;modalEditId=id;$('transactionForm').reset();$('editId').value='';$('entryDate').value=today();$('entryType').value='expense';updateCategories();$('account').innerHTML=ACCOUNTS.map(x=>`<option value="${escapeHTML(x)}">${escapeHTML(x)}</option>`).join('');$('modalTitle').textContent='Nova transação';if(id!==null){const t=transactions.find(t=>t.id===id);if(!t)return;$('editId').value=t.id;$('description').value=t.description;$('entryType').value=t.type;updateCategories();$('amount').value=(t.cents/100).toFixed(2);$('category').value=t.category;$('account').value=t.account;$('entryDate').value=t.date;$('establishment').value=t.establishment||'';$('modalTitle').textContent='Editar transação'}$('modalBackdrop').classList.remove('hidden');document.querySelector('.shell').inert=true;previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';$('description').focus();showSuggestion()}
function closeModal() {
  if ($('modalBackdrop').classList.contains('hidden')) return;
  $('modalBackdrop').classList.add('hidden');
  document.querySelector('.shell').inert = false;
  document.body.style.overflow = previousOverflow;
  const origin = modalOrigin && modalOrigin.isConnected ? modalOrigin
    : (modalEditId ? document.querySelector('[data-edit="' + modalEditId + '"]') : null);
  (origin || $('addBtn')).focus();
}
function handleModalKeydown(event) {
  const entityOpen=!$('entityBackdrop').classList.contains('hidden');
  const backdrop=entityOpen?$('entityBackdrop'):$('modalBackdrop');
  if (backdrop.classList.contains('hidden')) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    if(entityOpen)closeEntity();else closeModal();
  } else if (event.key === 'Tab') {
    const controls = [...backdrop.querySelectorAll('button, input:not([type="hidden"]), select, textarea, [tabindex="0"]')].filter(el=>!el.matches(':disabled')&&el.getClientRects().length>0);
    const first = controls[0], last = controls[controls.length - 1];
    const outside = !controls.includes(document.activeElement);
    if (event.shiftKey && (document.activeElement === first || outside)) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || outside)) {
      event.preventDefault(); first.focus();
    }
  }
}
function isValidDate(s){if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s)||Number(s.slice(0,4))<1)return false;const d=new Date(`${s}T12:00:00Z`);return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===s}
function saveTransaction(event) {
  event.preventDefault();
  const description = $('description').value.trim();
  const type = $('entryType').value;
  const amount = Number($('amount').value);
  const cents = Math.round(amount * 100);
  const editId = Number($('editId').value);
  const id = editId || transactions.reduce((max, t) => Math.max(max, t.id), 0) + 1;
  const entry = {id, description, type, cents, category: $('category').value,
    account: $('account').value, date: $('entryDate').value};
  const establishment=$('establishment').value.trim();
  if (establishment) entry.establishment=establishment;
  if (!Number.isFinite(amount) || Math.abs(amount * 100 - cents) > 0.0001 || !validTransactions([entry])) {
    notify('Revise os dados do lançamento.'); return;
  }
  if (editId && !transactions.some(t => t.id === editId)) {
    notify('Transação não encontrada. Recarregue os dados.'); return;
  }
  const next = editId ? transactions.map(t => t.id === editId ? entry : t) : [...transactions, entry];
  if (!persist(next)) return;
  render();
  closeModal();
  notify(editId ? 'Transação atualizada.' : 'Transação adicionada.');
}
function deleteTransaction(id) {
  if (!transactions.some(t => t.id === id)) return false;
  if (!persist(transactions.filter(t => t.id !== id))) return false;
  render(); notify('Transação excluída.'); return true;
}
function restoreSampleData() {
  if (!persist(sampleData(), defaultCatalog())) return false;
  render(); notify('Dados de exemplo restaurados.'); return true;
}
function csvCell(value) {
  const text = String(value);
  // Quoting alone does not prevent spreadsheet formula evaluation.
  const safe = /^[\s\u0000-\u001f\u007f]*[=+@-]/u.test(text) || /^[\u0000-\u001f\u007f]/u.test(text)
    ? "'" + text : text;
  return '"' + safe.replace(/"/g, '""') + '"';
}
function buildCSV(items) {
  const header = ['Data', 'Descrição', 'Tipo', 'Categoria', 'Conta', 'Valor (R$)', 'Estabelecimento'];
  const rows = sorted(items).map(t => [t.date, t.description, t.type === 'income' ? 'Receita' : 'Despesa',
    t.category, t.account, (t.cents / 100).toFixed(2).replace('.', ','), t.establishment||'']);
  return '\ufeff' + [header, ...rows].map(row => row.map(csvCell).join(';')).join('\r\n');
}
function exportCSV() {
  const blob = new Blob([buildCSV(transactions)], {type: 'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = 'gestor-financeiro-demo.csv';
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  notify('Download CSV solicitado.');
}
// V3 presentation and catalog operations share the V1 persistence boundary.
const normalize=text=>String(text).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
titles.dashboard=['Suas finanças, com clareza.','Um olhar simples para o que acontece com o seu dinheiro.'];
titles.transactions=['Despesas e transações','Todos os lançamentos, incluindo suas receitas.'];
titles.reports=['Seu resumo mensal','Menos números soltos, mais clareza para o próximo passo.'];
titles.accounts=['Suas contas','Organize de onde vem e para onde vai cada lançamento.'];
titles.categories=['Categorias','Dê um lugar para cada gasto e deixe o registro mais fácil.'];
function fillFilter(id,names,label) {
  const previous=$(id).value;
  $(id).innerHTML='<option value="">'+label+'</option>'+names.map(name=>'<option>'+escapeHTML(name)+'</option>').join('');
  $(id).value=names.includes(previous)?previous:'';
}
function comparison(current,previous) {
  if (!previous) return current ? 'Sem base no mês anterior' : 'Sem movimentação nos dois meses';
  const percentage=(current-previous)/previous*100;
  return (percentage>0?'+':'')+percentage.toFixed(1).replace('.',',')+'% vs. mês anterior';
}
function renderEvolution() {
  const items=byMonth(),expenses=items.filter(t=>t.type==='expense'),sum=totals(items);
  const previous=totals(transactions.filter(t=>t.date.slice(0,7)===shiftMonth(selectedMonth(),-1)));
  const breakdown=expenseBreakdown(items),top=breakdown[0];
  const used=new Set(items.map(t=>t.account)).size;
  const metrics=`<article class="stat-card"><div class="stat-head">Despesas registradas <span class="stat-icon">▤</span></div><strong>${expenses.length}</strong><p>Média de ${money(expenses.length?Math.round(sum.expense/expenses.length):0)} por despesa</p></article><article class="stat-card"><div class="stat-head">Maior categoria <span class="stat-icon">◇</span></div><strong class="metric-name">${escapeHTML(top?top[0]:'Sem despesas')}</strong><p>${top?money(top[1])+' · '+Math.round(top[1]/sum.expense*100)+'% do total':'Nenhuma despesa neste mês'}</p></article><article class="stat-card"><div class="stat-head">Contas utilizadas <span class="stat-icon">▣</span></div><strong>${used}<small> de ${catalog.accounts.length}</small></strong><p>Com receitas ou despesas no período</p></article>`;
  $('extraStats').innerHTML=metrics;
  $('expenseComparison').textContent=comparison(sum.expense,previous.expense);
  $('summaryStats').innerHTML=`<article class="stat-card"><div class="stat-head">Despesas do mês</div><strong>${money(sum.expense)}</strong><p>${comparison(sum.expense,previous.expense)}</p></article>`+metrics;
  $('summaryInsight').textContent=`${money(sum.expense)} em ${expenses.length} despesas registradas. Receitas: ${money(sum.income)}. Resultado líquido: ${money(sum.income-sum.expense)}. Mês anterior: ${money(previous.expense)} em despesas. Compare meses completos para avaliar a evolução.`;
  $('summaryFlow').innerHTML=$('flowChart').innerHTML;
  $('summaryCategories').innerHTML=$('categoryList').innerHTML;
  $('accountsGrid').innerHTML=catalog.accounts.map(a=>{
    const rows=items.filter(t=>t.account===a.name),t=totals(rows),movement=t.income+t.expense;
    return catalogCard('accounts',a,`<p>${escapeHTML(a.type)}</p><strong class="card-value">${money(movement)}</strong><p>Movimentado no mês · entradas + saídas</p><p>Receitas ${money(t.income)} · Despesas ${money(t.expense)}</p><div class="card-foot"><span>${rows.length} lançamentos</span><span>${sum.income+sum.expense?Math.round(movement/(sum.income+sum.expense)*100):0}% do mês</span></div>`);
  }).join('');
  $('categoriesGrid').innerHTML=catalog.categories.map(c=>{
    const rows=items.filter(t=>t.category===c.name),value=rows.reduce((sum,t)=>sum+t.cents,0);
    return catalogCard('categories',c,`<p>${c.type==='income'?'Receitas':'Despesas'}</p><p class="keywords">Detecção: ${escapeHTML(c.keywords||'Sem palavras-chave')}</p><div class="card-foot"><span>${rows.length} lançamentos no mês</span><span>${money(value)}</span></div>`);
  }).join('');
  renderDaily(items);
}
function catalogCard(kind,item,body) {
  return `<article class="catalog-card"><div class="card-top"><span class="catalog-icon" style="color:${item.color};background:${item.color}12">${iconHTML(item.icon)}</span><div><button class="action-btn" data-kind="${kind}" data-name="${escapeHTML(item.name)}" data-operation="edit" aria-label="Editar ${escapeHTML(item.name)}">✎</button><button class="action-btn" data-kind="${kind}" data-name="${escapeHTML(item.name)}" data-operation="delete" aria-label="Excluir ${escapeHTML(item.name)}">⌫</button></div></div><h2>${escapeHTML(item.name)}</h2>${body}</article>`;
}
function renderDaily(items) {
  const days=new Date(Number(selectedMonth().slice(0,4)),Number(selectedMonth().slice(5)),0).getDate();
  const values=Array(days).fill(0);
  items.filter(t=>t.type==='expense').forEach(t=>values[Number(t.date.slice(8))-1]+=t.cents);
  const max=Math.max(1,...values);
  const points=values.map((value,i)=>`${20+i/(days-1)*560},${175-value/max*150}`).join(' ');
  $('dailyChart').innerHTML=`<svg viewBox="0 0 600 210" role="img" aria-label="Despesas diárias em ${selectedMonth()}"><path d="M20 25H580 M20 75H580 M20 125H580 M20 175H580" stroke="#e9eef6" stroke-dasharray="3 5" fill="none"/><polygon points="20,175 ${points} 580,175" fill="#edf3ff"/><polyline points="${points}" fill="none" stroke="#477ffa" stroke-width="2"/>${values.map((v,i)=>`<circle cx="${20+i/(days-1)*560}" cy="${175-v/max*150}" r="3" fill="white" stroke="#477ffa"><title>Dia ${i+1}: ${money(v)}</title></circle>`).join('')}<text x="20" y="202">01</text><text x="555" y="202">${days}</text></svg><details><summary>Valores diários em texto</summary>${values.map((v,i)=>`<p>Dia ${i+1}: ${money(v)}</p>`).join('')}</details>`;
}
let entityContext=null;
let entityOrigin=null;
function openEntity(kind,name='',operation='edit') {
  if(!['accounts','categories'].includes(kind))return;
  const item=catalog[kind].find(item=>item.name===name);
  entityContext={kind,name,operation}; entityOrigin=document.activeElement;
  $('entityForm').reset();
  $('entityTitle').textContent=(operation==='delete'?'Excluir ':name?'Editar ':'Nova ')+(kind==='accounts'?'conta':'categoria');
  $('entityName').value=item?item.name:'';
  $('entityType').innerHTML=(kind==='accounts'?['Conta corrente','Conta digital','Cartão de crédito','Dinheiro','Outra']:['expense','income']).map(type=>`<option value="${type}">${type==='expense'?'Despesa':type==='income'?'Receita':type}</option>`).join('');
  if(item)$('entityType').value=item.type;
  $('entityColor').value=item?item.color:COLORS[0]; $('entityIcon').value=item?item.icon:'▣';
  $('entityKeywords').value=item?item.keywords||'':'';
  $('keywordsLabel').classList.toggle('hidden',kind==='accounts');
  const linked=transactions.filter(t=>t[kind==='accounts'?'account':'category']===name).length;
  const deleting=operation==='delete';
  $('entityFields').classList.toggle('hidden',deleting);
  $('entityFields').disabled=deleting;
  $('replacementLabel').classList.toggle('hidden',!deleting || !linked);
  $('replacement').required=deleting&&linked>0;
  const choices=catalog[kind].filter(c=>c.name!==name && (kind==='accounts'||c.type===item?.type));
  $('replacement').innerHTML='<option value="">Selecione o destino</option>'+choices.map(c=>'<option>'+escapeHTML(c.name)+'</option>').join('');
  $('entityMessage').textContent=deleting?`${linked} lançamentos vinculados em todo o histórico. ${linked?'Escolha um destino do mesmo tipo para transferi-los antes da exclusão. Se não houver destino, cancele e crie um primeiro.':'Confirme para excluir este cadastro.'}`:'Alterações de nome serão aplicadas a todos os lançamentos vinculados.';
  $('entityBackdrop').classList.remove('hidden'); document.querySelector('.shell').inert=true;
  previousOverflow=document.body.style.overflow; document.body.style.overflow='hidden';
  (deleting?$('entityClose'):$('entityName')).focus();
}
function closeEntity() {
  $('entityBackdrop').classList.add('hidden'); document.querySelector('.shell').inert=false;
  document.body.style.overflow=previousOverflow;
  const origin=entityOrigin?.isConnected && entityOrigin!==document.body && entityOrigin.getClientRects().length ? entityOrigin : $('manageAdd');
  origin.focus();
}
function saveEntity(event) {
  event.preventDefault(); const {kind,name,operation}=entityContext;
  const next=JSON.parse(JSON.stringify(catalog));
  const field=kind==='accounts'?'account':'category';
  const old=next[kind].find(c=>c.name===name);
  let records=transactions;
  if(operation==='delete') {
    if(!old)return;
    const linked=transactions.some(t=>t[field]===name);
    const replacement=next[kind].find(c=>c.name===$('replacement').value && c.name!==name && (kind==='accounts'||c.type===old.type));
    if(linked&&!replacement){notify('Selecione um destino válido para os lançamentos.');return;}
    next[kind]=next[kind].filter(c=>c.name!==name);
    if(linked)records=transactions.map(t=>t[field]===name?{...t,[field]:replacement.name}:t);
  } else {
    const item={name:$('entityName').value.trim(),type:$('entityType').value,color:$('entityColor').value,icon:$('entityIcon').value};
    if(kind==='categories')item.keywords=$('entityKeywords').value.trim();
    if(next[kind].some(c=>c.name!==name && normalize(c.name)===normalize(item.name))){notify('Já existe um cadastro com esse nome.');return;}
    if(old&&kind==='categories'&&old.type!==item.type&&transactions.some(t=>t.category===name)){notify('Uma categoria utilizada não pode mudar de tipo. Crie outra categoria.');return;}
    next[kind]=old?next[kind].map(c=>c.name===name?item:c):[...next[kind],item];
    if(old)records=transactions.map(t=>t[field]===name?{...t,[field]:item.name}:t);
  }
  if(!persist(records,next))return;
  refreshFilters();render();closeEntity();notify('Cadastro e referências atualizados.');
}
function refreshFilters() {
  fillFilter('categoryFilter',catalog.categories.map(c=>c.name),'Todas as categorias');
  fillFilter('accountFilter',ACCOUNTS,'Todas as contas');
}
function detectCategory(text,type) {
  const normalized=normalize(text);
  return catalog.categories.filter(c=>c.type===type).find(c=>c.keywords.split(',').map(k=>normalize(k.trim())).filter(Boolean).some(k=>normalized.includes(k)))||null;
}
function showSuggestion() {
  const match=detectCategory($('description').value+' '+$('establishment').value,$('entryType').value);
  const merchant=detectEstablishment($('description').value);
  $('suggestionText').textContent=(match||merchant)?'Sugestão: '+[match?'categoria '+match.name:'',merchant?'estabelecimento '+merchant:''].filter(Boolean).join(' · ')+'. Aplique se fizer sentido.':'Categoria e estabelecimento continuam editáveis. Digite uma palavra-chave ou “compras no Mercado Aurora” para receber sugestões.';
  $('applySuggestion').disabled=!match&&!merchant;
}
function detectEstablishment(text) {
  const match=text.match(/\b(?:no|na|em)\s+(.{2,80})$/iu);
  return match?match[1].trim():'';
}
$('monthFilter').value=today().slice(0,7);
refreshFilters();
const navIcons={dashboard:'grid',transactions:'receipt',accounts:'▣',categories:'layers',reports:'chart'};
document.querySelectorAll('[data-view]').forEach(button=>{button.querySelector('span').innerHTML=iconHTML(navIcons[button.dataset.view])});
document.querySelector('.brand-mark').innerHTML=iconHTML('▣');
['categoryFilter','accountFilter'].forEach(id=>$(id).addEventListener('change',renderTransactions));
$('manageAdd').addEventListener('click',()=>openEntity(currentView));
['accountsGrid','categoriesGrid'].forEach(id=>$(id).addEventListener('click',e=>{const button=e.target.closest('[data-operation]');if(button)openEntity(button.dataset.kind,button.dataset.name,button.dataset.operation)}));
$('entityForm').addEventListener('submit',saveEntity);
$('entityClose').addEventListener('click',closeEntity);$('entityCancel').addEventListener('click',closeEntity);
$('entityBackdrop').addEventListener('click',e=>{if(e.target===$('entityBackdrop'))closeEntity()});
['description','establishment'].forEach(id=>$(id).addEventListener('input',showSuggestion));
$('detectBtn').addEventListener('click',showSuggestion);
$('applySuggestion').addEventListener('click',()=>{const c=detectCategory($('description').value+' '+$('establishment').value,$('entryType').value);const merchant=detectEstablishment($('description').value);if(c)$('category').value=c.name;if(merchant&&!$('establishment').value.trim())$('establishment').value=merchant;notify('Sugestão aplicada. Você pode alterar os campos.');showSuggestion()});
$('prevMonth').addEventListener('click',()=>{if(selectedMonth()==='0001-01')return;$('monthFilter').value=shiftMonth(selectedMonth(),-1);render()});
$('nextMonth').addEventListener('click',()=>{if(selectedMonth()==='9999-12')return;$('monthFilter').value=shiftMonth(selectedMonth(),1);render()});
document.querySelectorAll('[data-view]').forEach(el => el.addEventListener('click', () => setView(el.dataset.view)));
$('monthFilter').addEventListener('change', render);
$('searchInput').addEventListener('input', renderTransactions);
$('typeFilter').addEventListener('change', renderTransactions);
$('addBtn').addEventListener('click', () => openModal());
$('closeModal').addEventListener('click', closeModal);
$('cancelModal').addEventListener('click', closeModal);
$('modalBackdrop').addEventListener('click', event => {
  if (event.target === $('modalBackdrop')) closeModal();
});
document.addEventListener('keydown', handleModalKeydown);
$('entryType').addEventListener('change', ()=>{updateCategories();showSuggestion()});
$('transactionForm').addEventListener('submit', saveTransaction);
$('exportBtn').addEventListener('click', exportCSV);
$('seeAll').addEventListener('click', () => setView('transactions'));
$('menuToggle').addEventListener('click', () => {$('sidebar').classList.toggle('open');$('menuToggle').setAttribute('aria-expanded',String($('sidebar').classList.contains('open')))});
$('resetData').addEventListener('click', () => {
  if (confirm('Restaurar os dados fictícios? Lançamentos, contas e categorias desta versão serão substituídos. A cópia original da V1 será preservada.')) restoreSampleData();
});
$('allRows').addEventListener('click', event => {
  const edit = event.target.closest('[data-edit]');
  const del = event.target.closest('[data-delete]');
  if (edit) openModal(Number(edit.dataset.edit));
  if (del && confirm('Excluir esta transação?')) deleteTransaction(Number(del.dataset.delete));
});
setView('dashboard');

if (storageWarning) {
  $('storageWarning').textContent = storageWarning;
  $('storageWarning').classList.remove('hidden');
}
