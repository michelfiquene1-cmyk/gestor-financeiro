'use strict';
const STORAGE_KEY='gestor-financeiro-portfolio-demo-v1';
const EXPENSE_CATEGORIES=['Mercado','Moradia','Transporte','Alimentação','Saúde','Lazer','Compras','Educação','Outros'];
const INCOME_CATEGORIES=['Salário','Freelance','Vendas','Investimentos','Outras receitas'];
const ACCOUNTS=['Conta pessoal','Conta digital','Dinheiro em espécie'];
const COLORS=['#4275f5','#70a4f7','#37bfa3','#f4b35f','#9b8bf0','#e9788d','#6cc9d5','#adb8cc','#64748b'];
const $=id=>document.getElementById(id);
const money=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v/100);
const shortMoney=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(v/100);
const monthName=m=>new Intl.DateTimeFormat('pt-BR',{month:'short'}).format(new Date(`${m}-15T12:00:00`)).replace('.','');
const dateLabel=d=>d.split('-').reverse().join('/');
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
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
function validTransactions(items) {
  if (!Array.isArray(items)) return false;
  const ids = new Set();
  let total = 0;
  return items.every(item => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
    const categories = item.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    const valid = Number.isSafeInteger(item.id) && item.id > 0 && !ids.has(item.id)
      && typeof item.description === 'string' && item.description.trim().length > 0
      && item.description.length <= 80 && ['income', 'expense'].includes(item.type)
      && Number.isSafeInteger(item.cents) && item.cents > 0 && item.cents <= MAX_CENTS
      && typeof item.date === 'string' && isValidDate(item.date)
      && categories.includes(item.category) && ACCOUNTS.includes(item.account);
    ids.add(item.id);
    total += item.cents;
    return valid && Number.isSafeInteger(total);
  });
}
function loadData() {
  try {
    storageSnapshot = localStorage.getItem(STORAGE_KEY);
    if (storageSnapshot === null) return sampleData();
    const items = JSON.parse(storageSnapshot);
    if (!validTransactions(items)) throw new Error('Dados inválidos');
    return items;
  } catch {
    // Never replace an unreadable or invalid saved collection with demo data.
    storageBlocked = true;
    storageWarning = 'Dados locais indisponíveis ou inválidos. Originais preservados; gravação bloqueada. Verifique o armazenamento e recarregue.';
    return [];
  }
}
let transactions=loadData();let currentView='dashboard';let toastTimer;
function persist(next) {
  if (storageBlocked) {
    notify(storageWarning);
    return false;
  }
  if (!validTransactions(next)) {
    notify('Não foi possível salvar: dados inválidos ou limite numérico excedido.');
    return false;
  }
  try {
    // Avoid silently overwriting changes made in another tab.
    if (localStorage.getItem(STORAGE_KEY) !== storageSnapshot) {
      notify('Os dados locais mudaram. Recarregue antes de tentar novamente.');
      return false;
    }
    const serialized = JSON.stringify(next);
    localStorage.setItem(STORAGE_KEY, serialized);
    storageSnapshot = serialized;
    transactions = next;
    return true;
  } catch {
    notify('Não foi possível salvar neste navegador. Os dados anteriores foram preservados.');
    return false;
  }
}
function notify(message){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3000)}
function byMonth(){return transactions.filter(t=>t.date.slice(0,7)===selectedMonth())}
function totals(items){return items.reduce((a,t)=>{a[t.type]+=t.cents;return a},{income:0,expense:0})}
function sorted(items){return [...items].sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id)}
function row(t,actions=false){return `<tr><td><span class="tx-symbol ${t.type}">${t.type==='income'?'↗':'↘'}</span><span class="tx-name">${escapeHTML(t.description)}</span></td><td><span class="tag">${escapeHTML(t.category)}</span></td><td>${dateLabel(t.date)}</td><td>${escapeHTML(t.account)}</td><td class="align-right"><span class="amount ${t.type}">${t.type==='income'?'+':'−'} ${money(t.cents)}</span></td>${actions?`<td class="align-right"><button class="action-btn" data-edit="${t.id}" aria-label="Editar ${escapeHTML(t.description)}">✎</button><button class="action-btn" data-delete="${t.id}" aria-label="Excluir ${escapeHTML(t.description)}">✕</button></td>`:''}</tr>`}
function renderDashboard(){const items=byMonth();const {income,expense}=totals(items);$('incomeTotal').textContent=money(income);$('expenseTotal').textContent=money(expense);$('balanceTotal').textContent=money(income-expense);$('recentRows').innerHTML=sorted(items).slice(0,6).map(t=>row(t)).join('')||'<tr><td colspan="5" class="empty">Nenhuma transação neste mês.</td></tr>';renderFlow();renderCategories(items)}
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
    const segment = COLORS[index % COLORS.length] + ' ' + start + '% ' + end + '%';
    start = end;
    return segment;
  });
  $('donut').style.background = 'conic-gradient(' + segments.join(',') + ')';
  $('categoryList').innerHTML = entries.map(([name, value], index) =>
    '<div class="category-line"><div class="category-name"><i style="background:'
    + COLORS[index % COLORS.length] + '"></i><span>' + escapeHTML(name)
    + '</span></div><b>' + (value / total * 100).toFixed(0) + '% — ' + money(value) + '</b></div>'
  ).join('');
}
function renderTransactions(){const q=$('searchInput').value.toLocaleLowerCase('pt-BR').trim(),type=$('typeFilter').value;const items=sorted(transactions.filter(t=>(type==='all'||t.type===type)&&t.description.toLocaleLowerCase('pt-BR').includes(q)));$('allRows').innerHTML=items.map(t=>row(t,true)).join('')||'<tr><td colspan="6" class="empty">Nenhuma transação encontrada.</td></tr>';$('transactionCount').textContent=`${items.length} transação(ões) encontrada(s)`}
function renderReports(){const items=byMonth(),categories=expenseBreakdown(items);$('reportCategories').innerHTML=categories.map(([name,value])=>`<div class="report-row"><span>${escapeHTML(name)}</span><b>${money(value)}</b></div>`).join('')||'<div class="empty">Sem despesas no período</div>';const accounts=ACCOUNTS.map(a=>[a,totals(items.filter(t=>t.account===a))]);$('reportAccounts').innerHTML=accounts.map(([name,t])=>`<div class="report-row"><span>${escapeHTML(name)}</span><b>${money(t.income-t.expense)}</b></div>`).join('')}
function render(){renderDashboard();renderTransactions();renderReports()}
const titles={dashboard:['Visão geral','Acompanhe suas finanças em um só lugar.'],transactions:['Transações','Gerencie seus lançamentos financeiros.'],reports:['Relatórios','Explore seus resultados por categoria e conta.']};
function setView(view){currentView=view;document.querySelectorAll('.view').forEach(e=>e.classList.toggle('hidden',e.id!==`${view}View`));document.querySelectorAll('[data-view]').forEach(e=>e.classList.toggle('active',e.dataset.view===view));$('pageTitle').textContent=titles[view][0];$('crumbTitle').textContent=titles[view][0];$('pageSubtitle').textContent=titles[view][1];$('sidebar').classList.remove('open');render();window.scrollTo({top:0,behavior:'smooth'})}
function updateCategories(){const type=$('entryType').value;const options=type==='income'?INCOME_CATEGORIES:EXPENSE_CATEGORIES;const previous=$('category').value;$('category').innerHTML=options.map(x=>`<option value="${escapeHTML(x)}">${escapeHTML(x)}</option>`).join('');if(options.includes(previous))$('category').value=previous}
let modalOrigin = null;
let modalEditId = null;
let previousOverflow = '';
function openModal(id=null){modalOrigin=document.activeElement;modalEditId=id;$('transactionForm').reset();$('editId').value='';$('entryDate').value=today();$('entryType').value='expense';updateCategories();$('account').innerHTML=ACCOUNTS.map(x=>`<option value="${escapeHTML(x)}">${escapeHTML(x)}</option>`).join('');$('modalTitle').textContent='Nova transação';if(id!==null){const t=transactions.find(t=>t.id===id);if(!t)return;$('editId').value=t.id;$('description').value=t.description;$('entryType').value=t.type;updateCategories();$('amount').value=(t.cents/100).toFixed(2);$('category').value=t.category;$('account').value=t.account;$('entryDate').value=t.date;$('modalTitle').textContent='Editar transação'}$('modalBackdrop').classList.remove('hidden');document.querySelector('.shell').inert=true;previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';$('description').focus()}
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
  if ($('modalBackdrop').classList.contains('hidden')) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    closeModal();
  } else if (event.key === 'Tab') {
    const controls = [...$('modalBackdrop').querySelectorAll('button:not([disabled]), input:not([type="hidden"]):not([disabled]), select:not([disabled]), [tabindex="0"]')];
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
  if (!persist(sampleData())) return false;
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
  const header = ['Data', 'Descrição', 'Tipo', 'Categoria', 'Conta', 'Valor (R$)'];
  const rows = sorted(items).map(t => [t.date, t.description, t.type === 'income' ? 'Receita' : 'Despesa',
    t.category, t.account, (t.cents / 100).toFixed(2).replace('.', ',')]);
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
$('monthFilter').value=today().slice(0,7);
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
$('entryType').addEventListener('change', updateCategories);
$('transactionForm').addEventListener('submit', saveTransaction);
$('exportBtn').addEventListener('click', exportCSV);
$('seeAll').addEventListener('click', () => setView('transactions'));
$('menuToggle').addEventListener('click', () => $('sidebar').classList.toggle('open'));
$('resetData').addEventListener('click', () => {
  if (confirm('Restaurar os dados fictícios? Seus lançamentos locais serão substituídos.')) restoreSampleData();
});
$('allRows').addEventListener('click', event => {
  const edit = event.target.closest('[data-edit]');
  const del = event.target.closest('[data-delete]');
  if (edit) openModal(Number(edit.dataset.edit));
  if (del && confirm('Excluir esta transação?')) deleteTransaction(Number(del.dataset.delete));
});
render();

if (storageWarning) {
  $('storageWarning').textContent = storageWarning;
  $('storageWarning').classList.remove('hidden');
}
