import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { api } from '../../lib/api';

const parties = [
  'CERİLAS Yüksek Teknoloji Sanayi ve Ticaret AŞ',
  'CERENİS Yüksek Teknoloji Sanayi ve Ticaret AŞ',
  'Şahıs - Deniz Can Ilgın',
  'Şahıs - Ceren Erçin Ilgın',
  'Şahıs - Diğer',
];
const categories = [
  'Ofis', 'Kira', 'Yazılım', 'Yazılım & Abonelik', 'Donanım', 'Personel', 'Vergi & Resmi',
  'Muhasebe', 'Banka & Finans', 'Sigorta', 'Pazarlama', 'Danışmanlık', 'Eğitim',
  'Ulaşım', 'Enerji', 'İnternet & İletişim', 'Yemek', 'Sağlık', 'Bakım & Onarım', 'Diğer',
];
const iconOptions = [
  ['receipt', 'Fiş', 'M4 5h16v14H4zM8 9h8M8 13h5'],
  ['building', 'Ofis', 'M4 21V3h12v18M8 7h4M8 11h4M8 15h4M16 9h4v12'],
  ['card', 'Kart', 'M3 6h18v12H3zM3 10h18M7 15h3'],
  ['cloud', 'Yazılım', 'M7 18h10a4 4 0 00.4-8A6 6 0 006 8.5 4.5 4.5 0 007 18z'],
  ['users', 'Personel', 'M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75'],
  ['bolt', 'Enerji', 'M13 2L4 14h7l-1 8 9-12h-7l1-8z'],
  ['car', 'Ulaşım', 'M5 17h14l-1-7H6l-1 7zM7 10l2-4h6l2 4M7 17v3M17 17v3'],
  ['megaphone', 'Pazarlama', 'M3 11v3l11 4V7L3 11zM14 10l5-3v11l-5-3M5 15l2 5h3l-2-4'],
  ['home', 'Kira', 'M3 11l9-8 9 8M5 10v11h14V10M9 21v-7h6v7'],
  ['laptop', 'Donanım', 'M4 5h16v11H4zM2 19h20M9 19h6'],
  ['bank', 'Finans', 'M3 10h18M5 10v8m4-8v8m6-8v8m4-8v8M3 21h18M12 3l9 4H3l9-4z'],
  ['shield', 'Sigorta', 'M12 3l8 3v5c0 5-3.4 8.7-8 10-4.6-1.3-8-5-8-10V6l8-3zM9 12l2 2 4-5'],
  ['book', 'Eğitim', 'M4 5a3 3 0 013-2h5v17H7a3 3 0 00-3 1V5zm16 0a3 3 0 00-3-2h-5v17h5a3 3 0 013 1V5z'],
  ['wifi', 'İnternet', 'M5 10a11 11 0 0114 0M8 14a6 6 0 018 0m-5 4a1.5 1.5 0 012 0'],
  ['food', 'Yemek', 'M7 3v8m-3-8v5a3 3 0 006 0V3M7 11v10m8-18v18m0-18c4 2 4 8 0 10'],
  ['health', 'Sağlık', 'M12 21S4 16 4 9a4 4 0 017-2.6L12 8l1-1.6A4 4 0 0120 9c0 7-8 12-8 12zM9 13h6m-3-3v6'],
  ['tools', 'Bakım', 'M14 6a4 4 0 005 5l-8 8-4-4 8-8a4 4 0 00-1-5v4zM5 3l4 4M3 5l4 4'],
  ['phone', 'İletişim', 'M7 3h10v18H7zM10 6h4m-3 12h2'],
  ['briefcase', 'Danışmanlık', 'M4 7h16v12H4zM9 7V4h6v3M4 12h16m-9-1h2v2h-2z'],
];
const categoryIcons = {
  Ofis: 'building', Kira: 'home', Yazılım: 'cloud', 'Yazılım & Abonelik': 'cloud', Donanım: 'laptop', Personel: 'users',
  'Vergi & Resmi': 'receipt', Muhasebe: 'receipt', 'Banka & Finans': 'bank', Sigorta: 'shield',
  Pazarlama: 'megaphone', Danışmanlık: 'briefcase', Eğitim: 'book', Ulaşım: 'car', Enerji: 'bolt',
  'İnternet & İletişim': 'wifi', Yemek: 'food', Sağlık: 'health', 'Bakım & Onarım': 'tools', Diğer: 'card',
};
const emptyForm = { title: '', note: '', category: 'Yazılım & Abonelik', related_party: parties[0], icon: 'receipt', amount: '', period: 'monthly', due_day: '1' };
const inputClass = 'w-full rounded-xl border border-gray-700 bg-gray-800 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10';
const PAGE_SIZE = 15;
const chartColors = ['#06b6d4', '#8b5cf6', '#22c55e', '#f59e0b', '#f43f5e', '#3b82f6', '#14b8a6', '#ec4899', '#84cc16', '#f97316'];

function Icon({ name, className = 'w-5 h-5' }) {
  const path = iconOptions.find(([key]) => key === name)?.[2] || iconOptions[0][2];
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d={path} /></svg>;
}

function CustomDropdown({ value, options, onChange, type = 'category' }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option === value) || options[0];
  const initials = (text) => text.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join('');

  return <div className="relative">
    <button type="button" onClick={() => setOpen((current) => !current)} aria-haspopup="listbox" aria-expanded={open} className={`flex min-h-11 w-full items-center gap-3 rounded-xl border bg-gray-800 px-3.5 py-2.5 text-left text-sm outline-none transition ${open ? 'border-cyan-500 ring-2 ring-cyan-500/10' : 'border-gray-700 hover:border-gray-600'}`}>
      {type === 'category' ? <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400"><Icon name={categoryIcons[selected]} className="h-4 w-4" /></span> : <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-[10px] font-bold text-purple-400">{initials(selected)}</span>}
      <span className="min-w-0 flex-1 truncate font-medium text-white">{selected}</span>
      <svg className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${open ? 'rotate-180 text-cyan-400' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m6 9 6 6 6-6" /></svg>
    </button>
    {open && <>
      <button type="button" aria-label="Açılır menüyü kapat" className="fixed inset-0 z-20 cursor-default" onClick={() => setOpen(false)} />
      <div role="listbox" className="absolute left-0 right-0 z-30 mt-2 max-h-64 overflow-y-auto rounded-xl border border-gray-700 bg-gray-800 p-1.5 shadow-2xl shadow-black/40">
        {options.map((option) => {
          const active = option === value;
          return <button type="button" role="option" aria-selected={active} key={option} onClick={() => { onChange(option); setOpen(false); }} className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-sm transition ${active ? 'bg-cyan-500/10 text-cyan-400' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}>
            {type === 'category' ? <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${active ? 'bg-cyan-500/15 text-cyan-400' : 'bg-gray-700 text-gray-400'}`}><Icon name={categoryIcons[option]} className="h-4 w-4" /></span> : <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${active ? 'bg-cyan-500/15 text-cyan-400' : 'bg-gray-700 text-gray-400'}`}>{initials(option)}</span>}
            <span className="min-w-0 flex-1 leading-snug">{option}</span>
            {active && <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="m5 12 4 4L19 6" /></svg>}
          </button>;
        })}
      </div>
    </>}
  </div>;
}

const money = (value) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 2 }).format(value || 0);

export default function ExpensesAdmin() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [analysisMode, setAnalysisMode] = useState('category');
  const [analysisFilter, setAnalysisFilter] = useState(null);
  const [sortOrder, setSortOrder] = useState('newest');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;
    api.getExpenses()
      .then((data) => { if (active) setExpenses(data); })
      .catch((err) => { if (active) toast.error(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const totals = useMemo(() => expenses.reduce((acc, item) => {
    const amount = Number(item.amount) || 0;
    acc.monthly += item.period === 'monthly' ? amount : amount / 12;
    acc.yearly += item.period === 'yearly' ? amount : amount * 12;
    return acc;
  }, { monthly: 0, yearly: 0 }), [expenses]);

  const chartData = useMemo(() => {
    const grouped = expenses.reduce((result, item) => {
      const monthlyAmount = item.period === 'monthly' ? Number(item.amount) : Number(item.amount) / 12;
      const groupName = analysisMode === 'category' ? (item.category || 'Diğer') : (item.related_party || 'İlgili belirtilmedi');
      result[groupName] = (result[groupName] || 0) + monthlyAmount;
      return result;
    }, {});
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [expenses, analysisMode]);

  const visible = useMemo(() => expenses.filter((item) => {
    const term = search.toLocaleLowerCase('tr-TR');
    const matches = !term || [item.title, item.note, item.category, item.related_party].some((x) => String(x || '').toLocaleLowerCase('tr-TR').includes(term));
    const analysisValue = analysisMode === 'category' ? (item.category || 'Diğer') : (item.related_party || 'İlgili belirtilmedi');
    return matches && (periodFilter === 'all' || item.period === periodFilter) && (!analysisFilter || analysisValue === analysisFilter);
  }).sort((a, b) => {
    if (sortOrder === 'newest') return new Date(b.created_at) - new Date(a.created_at);
    const monthlyA = a.period === 'monthly' ? Number(a.amount) : Number(a.amount) / 12;
    const monthlyB = b.period === 'monthly' ? Number(b.amount) : Number(b.amount) / 12;
    return sortOrder === 'asc' ? monthlyA - monthlyB : monthlyB - monthlyA;
  }), [expenses, search, periodFilter, analysisMode, analysisFilter, sortOrder]);
  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const activePage = Math.min(page, totalPages);
  const paginatedExpenses = visible.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);

  const openNew = () => { setEditingId(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({ ...item, amount: String(item.amount), due_day: item.due_day ? String(item.due_day) : '1' });
    setModalOpen(true);
  };
  const setField = (key, value) => setForm((old) => ({ ...old, [key]: value }));
  const submit = async (event) => {
    event.preventDefault(); setSaving(true);
    try {
      const payload = { ...form, amount: Number(form.amount), due_day: form.period === 'monthly' ? Number(form.due_day) : null };
      const saved = editingId ? await api.updateExpense(editingId, payload) : await api.createExpense(payload);
      setExpenses((old) => editingId ? old.map((item) => item.id === editingId ? saved : item) : [saved, ...old]);
      toast.success(editingId ? 'Gider güncellendi' : 'Gider eklendi'); setModalOpen(false);
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };
  const remove = async (item) => {
    if (!window.confirm(`“${item.title}” giderini silmek istediğinize emin misiniz?`)) return;
    try { await api.deleteExpense(item.id); setExpenses((old) => old.filter((x) => x.id !== item.id)); toast.success('Gider silindi'); }
    catch (err) { toast.error(err.message); }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="mb-1 text-xs font-semibold uppercase tracking-[.18em] text-cyan-400">Finans yönetimi</p><h1 className="text-2xl font-bold text-white sm:text-3xl">Gider Takibi</h1><p className="mt-2 text-sm text-gray-400">Tekrarlayan giderlerinizi tek ekranda planlayın ve karşılaştırın.</p></div>
        <button onClick={openNew} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400"><span className="text-xl leading-none">+</span> Yeni gider</button>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Summary title="Aylık toplam gider" value={money(totals.monthly)} subtitle="Yıllık giderler ÷ 12 dahil" color="cyan" icon="card" />
        <Summary title="12 aylık toplam gider" value={money(totals.yearly)} subtitle="Aylık giderler × 12 dahil" color="purple" icon="receipt" />
        <Summary title="Aktif gider" value={String(expenses.length)} subtitle={`${expenses.filter((x) => x.period === 'monthly').length} aylık · ${expenses.filter((x) => x.period === 'yearly').length} yıllık`} color="emerald" icon="building" extra="hidden xl:block" />
      </section>

      <ExpenseChart data={chartData} total={totals.monthly} mode={analysisMode} selected={analysisFilter} onModeChange={(mode) => { setAnalysisMode(mode); setAnalysisFilter(null); setPage(1); }} onSelect={(value) => { setAnalysisFilter((current) => current === value ? null : value); setPage(1); }} />

      <MonthlyCalendar expenses={expenses} onEdit={openEdit} />

      <section className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900">
        <div className="flex flex-col gap-3 border-b border-gray-800 p-4 sm:flex-row">
          <div className="relative min-w-0 flex-1"><svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeWidth="2" d="m21 21-4.4-4.4M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" /></svg><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Giderlerde ara..." className="w-full rounded-xl border border-gray-700 bg-gray-800 py-2.5 pl-10 pr-4 text-sm text-white outline-none transition focus:border-cyan-500" /></div>
          <div className="grid grid-cols-3 rounded-xl bg-gray-800 p-1 text-xs font-medium sm:w-auto">{[['all','Tümü'],['monthly','Aylık'],['yearly','Yıllık']].map(([key,label]) => <button key={key} onClick={() => { setPeriodFilter(key); setPage(1); }} className={`rounded-lg px-4 py-2 transition ${periodFilter === key ? 'bg-cyan-500 text-white' : 'text-gray-400 hover:text-white'}`}>{label}</button>)}</div>
          <div className="grid grid-cols-3 rounded-xl bg-gray-800 p-1 text-xs font-medium sm:w-auto">{[['newest','Yeni'],['asc','Tutar ↑'],['desc','Tutar ↓']].map(([key,label]) => <button key={key} title={key === 'newest' ? 'En yeni giderler' : `Aylık karşılığa göre ${key === 'asc' ? 'artan' : 'azalan'}`} onClick={() => { setSortOrder(key); setPage(1); }} className={`rounded-lg px-3 py-2 transition ${sortOrder === key ? 'bg-cyan-500 text-white' : 'text-gray-400 hover:text-white'}`}>{label}</button>)}</div>
        </div>
        {analysisFilter && <div className="flex items-center justify-between gap-3 border-b border-cyan-500/20 bg-cyan-500/5 px-4 py-2.5"><p className="truncate text-xs text-gray-400"><span className="font-semibold text-cyan-400">{analysisFilter}</span> {analysisMode === 'category' ? 'kategorisi' : 'kurum/kişisi'} gösteriliyor</p><button type="button" onClick={() => { setAnalysisFilter(null); setPage(1); }} className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-cyan-400 transition hover:bg-cyan-500/10">Filtreyi temizle ×</button></div>}

        {loading ? <div className="flex h-48 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" /></div> : visible.length === 0 ? <Empty onAdd={openNew} hasSearch={expenses.length > 0} /> : (
          <div className="expense-list">{paginatedExpenses.map((item) => {
            const monthly = item.period === 'monthly' ? Number(item.amount) : Number(item.amount) / 12;
            const yearly = item.period === 'yearly' ? Number(item.amount) : Number(item.amount) * 12;
            return <article key={item.id} className="expense-list-item group p-4 transition hover:bg-white/[.025] sm:p-5">
              <div className="flex gap-3 sm:gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400"><Icon name={item.icon} /></div><div className="min-w-0 flex-1">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate font-semibold text-white">{item.title}</h2><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${item.period === 'monthly' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-purple-500/10 text-purple-400'}`}>{item.period === 'monthly' ? 'Aylık' : 'Yıllık'}</span></div><p className="mt-1 truncate text-xs text-gray-400">{item.category} · {item.related_party || 'İlgili belirtilmedi'}{item.period === 'monthly' && ` · Her ayın ${item.due_day}. günü`}</p></div>
                  <div className="flex items-center justify-between gap-3 lg:justify-end"><div className="text-left lg:text-right"><p className="font-semibold text-white">{money(item.amount)} <span className="text-xs font-normal text-gray-500">/ {item.period === 'monthly' ? 'ay' : 'yıl'}</span></p><p className="mt-0.5 text-xs text-gray-500">{money(monthly)} aylık · {money(yearly)} yıllık</p></div><div className="flex shrink-0"><button onClick={() => openEdit(item)} aria-label="Gideri düzenle" className="rounded-lg p-2 text-gray-500 hover:bg-gray-800 hover:text-cyan-400">✎</button><button onClick={() => remove(item)} aria-label="Gideri sil" className="rounded-lg p-2 text-gray-500 hover:bg-red-500/10 hover:text-red-400">×</button></div></div>
                </div>{item.note && <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-gray-400">{item.note}</p>}
              </div></div>
            </article>;
          })}</div>
        )}
        {!loading && visible.length > 0 && <Pagination page={activePage} totalPages={totalPages} totalItems={visible.length} onChange={setPage} />}
      </section>

      {modalOpen && <ExpenseModal form={form} setField={setField} onClose={() => setModalOpen(false)} onSubmit={submit} saving={saving} editing={Boolean(editingId)} />}
    </div>
  );
}

function Summary({ title, value, subtitle, color, icon, extra = '' }) {
  const styles = { cyan: 'bg-cyan-500/10 text-cyan-400', purple: 'bg-purple-500/10 text-purple-400', emerald: 'bg-green-500/10 text-green-400' };
  return <div className={`${extra} rounded-2xl border border-gray-800 bg-gray-900 p-5`}><div className="flex items-start justify-between"><div><p className="text-xs font-medium text-gray-400">{title}</p><p className="mt-2 text-2xl font-bold tracking-tight text-white">{value}</p><p className="mt-1 text-xs text-gray-500">{subtitle}</p></div><div className={`rounded-xl p-2.5 ${styles[color]}`}><Icon name={icon} /></div></div></div>;
}

function ExpenseChart({ data, total, mode, selected, onModeChange, onSelect }) {
  if (!data.length) return null;
  return <section className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900 p-4 sm:p-5">
    <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-cyan-400">Gider analizi</p><h2 className="mt-1 text-lg font-bold text-white">Aylık gider dağılımı</h2></div><div className="flex flex-col gap-2 xl:items-end"><div className="grid grid-cols-2 rounded-xl bg-gray-800 p-1 text-xs font-semibold">{[['category','Kategoriye göre'],['party','Kurum / kişiye göre']].map(([value, label]) => <button type="button" key={value} onClick={() => onModeChange(value)} className={`rounded-lg px-3 py-2 transition ${mode === value ? 'bg-cyan-500 text-white' : 'text-gray-400 hover:text-white'}`}>{label}</button>)}</div><div className="flex items-center justify-between gap-2 xl:justify-end"><p className="text-xs text-gray-500">Filtrelemek için bir {mode === 'category' ? 'kategoriye' : 'kurum/kişiye'} tıklayın</p>{selected && <button type="button" onClick={() => onSelect(selected)} className="shrink-0 rounded-lg bg-cyan-500/10 px-2.5 py-1.5 text-xs font-semibold text-cyan-400 hover:bg-cyan-500/20">Temizle</button>}</div></div></div>
    <div className="grid items-center gap-5 lg:grid-cols-[minmax(280px,0.85fr)_1.15fr]">
      <div className="relative h-72 min-w-0 sm:h-80">
        <ResponsiveContainer width="100%" height="100%" className="relative z-10">
          <PieChart><Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="58%" outerRadius="84%" paddingAngle={2} stroke="none" onClick={(entry) => onSelect(entry.name)} className="cursor-pointer">{data.map((item, index) => <Cell key={item.name} fill={chartColors[index % chartColors.length]} opacity={!selected || selected === item.name ? 1 : 0.24} className="outline-none transition-opacity" />)}</Pie><Tooltip content={<ChartTooltip total={total} />} /></PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 z-0 flex flex-col items-center justify-center"><span className="text-xs text-gray-500">Aylık toplam</span><strong className="mt-1 max-w-40 truncate text-lg font-bold text-white sm:text-xl">{money(total)}</strong></div>
      </div>
      <div className="grid max-h-80 gap-1 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">{data.map((item, index) => {
        const percent = total ? (item.value / total) * 100 : 0;
        return <button type="button" onClick={() => onSelect(item.name)} key={item.name} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${selected === item.name ? 'bg-cyan-500/10 ring-1 ring-inset ring-cyan-500/20' : selected ? 'opacity-45 hover:bg-white/[.025] hover:opacity-100' : 'hover:bg-white/[.025]'}`}><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} /><div className="min-w-0 flex-1"><p className={`truncate text-sm font-medium ${selected === item.name ? 'text-cyan-400' : 'text-gray-300'}`}>{item.name}</p><p className="mt-0.5 text-xs text-gray-500">{money(item.value)}</p></div><span className="shrink-0 rounded-lg bg-gray-800 px-2 py-1 text-xs font-semibold text-gray-400">%{percent.toLocaleString('tr-TR', { maximumFractionDigits: 1 })}</span></button>;
      })}</div>
    </div>
  </section>;
}

function ChartTooltip({ active, payload, total }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  const percent = total ? (item.value / total) * 100 : 0;
  return <div className="rounded-xl border border-gray-700 bg-gray-900 px-3 py-2.5 shadow-xl"><p className="text-xs font-semibold text-white">{item.name}</p><p className="mt-1 text-xs text-cyan-400">{money(item.value)} · %{percent.toLocaleString('tr-TR', { maximumFractionDigits: 1 })}</p></div>;
}

function MonthlyCalendar({ expenses, onEdit }) {
  const [viewDate, setViewDate] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState(null);
  const monthlyExpenses = useMemo(() => expenses.filter((item) => item.period === 'monthly'), [expenses]);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const monthLabel = new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(viewDate);
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const expensesByDay = monthlyExpenses.reduce((groups, item) => {
    const effectiveDay = Math.min(Number(item.due_day) || 1, daysInMonth);
    (groups[effectiveDay] ||= []).push(item);
    return groups;
  }, {});
  const dueDays = Object.keys(expensesByDay).map(Number).sort((a, b) => a - b);
  const changeMonth = (offset) => setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  const returnToday = () => setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));

  return <><section className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900">
    <div className="flex flex-col gap-3 border-b border-gray-800 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-cyan-400">Ödeme takvimi</p><h2 className="mt-1 text-lg font-bold capitalize text-white">{monthLabel}</h2><p className="mt-1 text-xs text-gray-500">{monthlyExpenses.length} aylık gider · {money(monthlyExpenses.reduce((sum, item) => sum + Number(item.amount), 0))}</p></div><div className="flex items-center gap-2"><button type="button" onClick={() => changeMonth(-1)} aria-label="Önceki ay" className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-700 bg-gray-800 text-gray-400 hover:border-cyan-500/40 hover:text-cyan-400">←</button><button type="button" onClick={returnToday} className="h-9 rounded-xl border border-gray-700 bg-gray-800 px-4 text-xs font-semibold text-gray-300 hover:border-cyan-500/40 hover:text-cyan-400">Bugün</button><button type="button" onClick={() => changeMonth(1)} aria-label="Sonraki ay" className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-700 bg-gray-800 text-gray-400 hover:border-cyan-500/40 hover:text-cyan-400">→</button></div></div>

    {monthlyExpenses.length === 0 ? <div className="flex min-h-40 flex-col items-center justify-center p-6 text-center"><div className="mb-3 rounded-xl bg-gray-800 p-3 text-gray-500"><Icon name="receipt" /></div><p className="text-sm font-medium text-white">Takvimde gösterilecek aylık gider yok</p><p className="mt-1 text-xs text-gray-500">Son ödeme günü olan aylık giderler burada görünür.</p></div> : <>
      <div className="hidden md:block">
        <div className="grid grid-cols-7 border-b border-gray-800 bg-gray-800/30">{['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day) => <div key={day} className="px-2 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-gray-500">{day}</div>)}</div>
        <div className="grid grid-cols-7">{Array.from({ length: firstWeekday }).map((_, index) => <div key={`empty-${index}`} className="min-h-28 border-b border-r border-gray-800/50 bg-gray-950/20" />)}{Array.from({ length: daysInMonth }, (_, index) => index + 1).map((day) => {
          const dayExpenses = expensesByDay[day] || [];
          const dayTotal = dayExpenses.reduce((sum, item) => sum + Number(item.amount), 0);
          const isToday = isCurrentMonth && today.getDate() === day;
          return <div key={day} role={dayExpenses.length ? 'button' : undefined} tabIndex={dayExpenses.length ? 0 : undefined} onClick={() => dayExpenses.length && setSelectedDay(day)} onKeyDown={(event) => { if (dayExpenses.length && (event.key === 'Enter' || event.key === ' ')) setSelectedDay(day); }} className={`min-h-28 border-b border-r border-gray-800/50 p-2 transition ${dayExpenses.length ? 'cursor-pointer bg-cyan-500/[.025] hover:bg-cyan-500/[.055] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-500/30' : ''}`}><div className="mb-1.5 flex items-center justify-between"><span className={`flex h-6 min-w-6 items-center justify-center rounded-lg px-1 text-xs font-semibold ${isToday ? 'bg-cyan-500 text-white' : 'text-gray-500'}`}>{day}</span>{dayExpenses.length > 0 && <span className="text-[10px] font-semibold text-cyan-400">{money(dayTotal)}</span>}</div><div className="space-y-1">{dayExpenses.slice(0, 2).map((item) => <button type="button" key={item.id} onClick={(event) => { event.stopPropagation(); onEdit(item); }} title={`${item.title} · ${money(item.amount)}`} className="flex w-full items-center gap-1.5 rounded-md bg-cyan-500/10 px-1.5 py-1 text-left text-[10px] font-medium text-cyan-400 transition hover:bg-cyan-500/20"><Icon name={item.icon} className="h-3 w-3 shrink-0" /><span className="truncate">{item.title}</span></button>)}{dayExpenses.length > 2 && <p className="rounded px-1 py-0.5 text-[10px] font-medium text-gray-500">+{dayExpenses.length - 2} gider daha</p>}</div></div>;
        })}</div>
      </div>
      <div className="expense-calendar-agenda md:hidden">{dueDays.map((day) => <div key={day} className="expense-calendar-agenda-day flex gap-3 p-4"><button type="button" onClick={() => setSelectedDay(day)} className={`flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl ${isCurrentMonth && today.getDate() === day ? 'bg-cyan-500 text-white' : 'bg-gray-800 text-gray-300'}`}><span className="text-sm font-bold">{day}</span><span className="text-[8px] uppercase">{new Intl.DateTimeFormat('tr-TR', { weekday: 'short' }).format(new Date(year, month, day))}</span></button><div className="min-w-0 flex-1 space-y-2">{expensesByDay[day].map((item) => <button type="button" key={item.id} onClick={() => onEdit(item)} className="flex w-full items-center gap-3 rounded-xl bg-gray-800 p-2.5 text-left"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400"><Icon name={item.icon} className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-white">{item.title}</span><span className="mt-0.5 block text-xs text-gray-500">Son ödeme: {day} {monthLabel}</span></span><strong className="shrink-0 text-xs text-cyan-400">{money(item.amount)}</strong></button>)}</div></div>)}</div>
    </>}
  </section>{selectedDay && <CalendarDayModal day={selectedDay} monthLabel={monthLabel} expenses={expensesByDay[selectedDay] || []} onClose={() => setSelectedDay(null)} onEdit={(item) => { setSelectedDay(null); onEdit(item); }} />}</>;
}

function CalendarDayModal({ day, monthLabel, expenses, onClose, onEdit }) {
  const total = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  return <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="max-h-[85vh] w-full overflow-hidden rounded-t-3xl border border-gray-700 bg-gray-900 shadow-2xl sm:max-w-lg sm:rounded-3xl">
    <div className="flex items-center justify-between border-b border-gray-800 p-5"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-cyan-400">Son ödeme günü</p><h3 className="mt-1 text-lg font-bold capitalize text-white">{day} {monthLabel}</h3><p className="mt-1 text-xs text-gray-500">{expenses.length} gider · Toplam {money(total)}</p></div><button type="button" onClick={onClose} className="rounded-xl p-2 text-xl text-gray-400 hover:bg-gray-800 hover:text-white">×</button></div>
    <div className="expense-list max-h-[60vh] overflow-y-auto p-2">{expenses.map((item) => <button type="button" key={item.id} onClick={() => onEdit(item)} className="expense-list-item flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-white/[.035]"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400"><Icon name={item.icon} /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-white">{item.title}</span><span className="mt-1 block truncate text-xs text-gray-500">{item.category} · {item.related_party || 'İlgili belirtilmedi'}</span>{item.note && <span className="mt-1 block truncate text-xs text-gray-400">{item.note}</span>}</span><span className="shrink-0 text-right"><strong className="block text-sm text-cyan-400">{money(item.amount)}</strong><span className="mt-1 block text-[10px] text-gray-500">Düzenle →</span></span></button>)}</div>
    <div className="border-t border-gray-800 bg-gray-900 p-4"><button type="button" onClick={onClose} className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm font-semibold text-gray-300 hover:text-white">Kapat</button></div>
  </div></div>;
}
function Empty({ onAdd, hasSearch }) { return <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center"><div className="mb-4 rounded-2xl bg-gray-800 p-4 text-gray-500"><Icon name="receipt" className="h-7 w-7" /></div><h3 className="font-semibold text-white">{hasSearch ? 'Eşleşen gider bulunamadı' : 'Henüz gider eklenmedi'}</h3><p className="mt-2 max-w-sm text-sm text-gray-400">{hasSearch ? 'Arama veya filtre seçiminizi değiştirin.' : 'Aylık ve yıllık maliyetlerinizi takip etmeye başlayın.'}</p>{!hasSearch && <button onClick={onAdd} className="mt-4 text-sm font-semibold text-cyan-400 hover:text-cyan-300">İlk gideri ekle →</button>}</div>; }

function Pagination({ page, totalPages, totalItems, onChange }) {
  const start = (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, totalItems);
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter((item) => item === 1 || item === totalPages || Math.abs(item - page) <= 1);
  return <div className="flex flex-col gap-3 border-t border-gray-800 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
    <p className="text-center text-xs text-gray-500 sm:text-left"><span className="font-medium text-gray-300">{start}–{end}</span> / {totalItems} gider</p>
    <nav aria-label="Gider sayfaları" className="flex items-center justify-center gap-1">
      <button type="button" disabled={page === 1} onClick={() => onChange(page - 1)} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs font-medium text-gray-400 transition hover:border-cyan-500/40 hover:text-cyan-400 disabled:cursor-not-allowed disabled:opacity-35">←</button>
      {pages.map((item, index) => <span key={item} className="contents">{index > 0 && item - pages[index - 1] > 1 && <span className="px-1 text-gray-600">…</span>}<button type="button" aria-current={item === page ? 'page' : undefined} onClick={() => onChange(item)} className={`h-8 min-w-8 rounded-lg px-2 text-xs font-semibold transition ${item === page ? 'bg-cyan-500 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>{item}</button></span>)}
      <button type="button" disabled={page === totalPages} onClick={() => onChange(page + 1)} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs font-medium text-gray-400 transition hover:border-cyan-500/40 hover:text-cyan-400 disabled:cursor-not-allowed disabled:opacity-35">→</button>
    </nav>
  </div>;
}

function ExpenseModal({ form, setField, onClose, onSubmit, saving, editing }) {
  const monthlyPreview = form.amount ? (form.period === 'monthly' ? Number(form.amount) : Number(form.amount) / 12) : 0;
  const yearlyPreview = form.amount ? (form.period === 'yearly' ? Number(form.amount) : Number(form.amount) * 12) : 0;
  return <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><form onSubmit={onSubmit} className="max-h-[94vh] w-full overflow-y-auto rounded-t-3xl border border-gray-700 bg-gray-900 shadow-2xl sm:max-w-2xl sm:rounded-3xl">
    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-800 bg-gray-900 px-5 py-4"><div><h2 className="text-lg font-bold text-white">{editing ? 'Gideri düzenle' : 'Yeni gider ekle'}</h2><p className="mt-0.5 text-xs text-gray-400">Tutar dönüşümleri otomatik hesaplanır.</p></div><button type="button" onClick={onClose} className="rounded-xl p-2 text-xl text-gray-400 hover:bg-gray-800 hover:text-white">×</button></div>
    <div className="space-y-5 p-5">
      <Field label="Gider başlığı"><input required maxLength="240" value={form.title} onChange={(e) => setField('title', e.target.value)} placeholder="Örn. Ofis kirası" className={inputClass} /></Field>
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Tutar (₺)"><input required min="0.01" step="0.01" type="number" inputMode="decimal" value={form.amount} onChange={(e) => setField('amount', e.target.value)} placeholder="0,00" className={inputClass} /></Field><Field label="Gider türü"><div className="grid grid-cols-2 rounded-xl bg-gray-800 p-1">{[['monthly','Aylık'],['yearly','Yıllık']].map(([key,label]) => <button type="button" key={key} onClick={() => setField('period', key)} className={`rounded-lg py-2.5 text-sm font-semibold transition ${form.period === key ? 'bg-cyan-500 text-white' : 'text-gray-400 hover:text-white'}`}>{label}</button>)}</div></Field></div>
      {form.amount && <div className="grid grid-cols-2 gap-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-sm"><div><p className="text-xs text-gray-500">Aylık karşılığı</p><p className="mt-1 font-semibold text-cyan-400">{money(monthlyPreview)}</p></div><div><p className="text-xs text-gray-500">Yıllık karşılığı</p><p className="mt-1 font-semibold text-cyan-400">{money(yearlyPreview)}</p></div></div>}
      {form.period === 'monthly' && <Field label="Her ayın son ödeme günü"><div className="flex items-center gap-3"><input required min="1" max="31" type="number" value={form.due_day} onChange={(e) => setField('due_day', e.target.value)} className={`${inputClass} max-w-28`} /><span className="text-sm text-gray-400">Her ay bu gün son ödeme tarihi olur.</span></div></Field>}
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Kategori"><CustomDropdown value={form.category} options={categories} onChange={(value) => setField('category', value)} /></Field><Field label="İlgili kurum / kişi"><CustomDropdown type="party" value={form.related_party} options={parties} onChange={(value) => setField('related_party', value)} /></Field></div>
      <Field label="İkon"><div className="grid grid-cols-4 gap-2 sm:grid-cols-8">{iconOptions.map(([key,label]) => <button type="button" title={label} aria-label={label} key={key} onClick={() => setField('icon', key)} className={`flex aspect-square items-center justify-center rounded-xl border transition ${form.icon === key ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400' : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600 hover:text-white'}`}><Icon name={key} /></button>)}</div></Field>
      <Field label="Not"><textarea value={form.note} onChange={(e) => setField('note', e.target.value)} rows="3" placeholder="Giderle ilgili açıklama veya hatırlatma..." className={`${inputClass} resize-none`} /></Field>
    </div><div className="sticky bottom-0 flex gap-3 border-t border-gray-800 bg-gray-900 p-4 sm:justify-end"><button type="button" onClick={onClose} className="flex-1 rounded-xl border border-gray-700 bg-gray-900 px-5 py-2.5 text-sm font-semibold text-gray-300 hover:bg-gray-800 sm:flex-none">Vazgeç</button><button disabled={saving} className="flex-1 rounded-xl bg-cyan-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-cyan-400 disabled:opacity-50 sm:flex-none">{saving ? 'Kaydediliyor...' : editing ? 'Değişiklikleri kaydet' : 'Gideri ekle'}</button></div>
  </form></div>;
}
function Field({ label, children }) { return <div className="block"><span className="mb-2 block text-xs font-semibold text-gray-400">{label}</span>{children}</div>; }
