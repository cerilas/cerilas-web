import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';

const parties = [
  'CERİLAS Yüksek Teknoloji Sanayi ve Ticaret AŞ',
  'CERENİS Yüksek Teknoloji Sanayi ve Ticaret AŞ',
  'Şahıs - Deniz Can Ilgın',
  'Şahıs - Ceren Erçin Ilgın',
  'Şahıs - Diğer',
];
const categories = ['Ofis', 'Yazılım', 'Personel', 'Vergi & Resmi', 'Pazarlama', 'Ulaşım', 'Enerji', 'Diğer'];
const iconOptions = [
  ['receipt', 'Fiş', 'M4 5h16v14H4zM8 9h8M8 13h5'],
  ['building', 'Ofis', 'M4 21V3h12v18M8 7h4M8 11h4M8 15h4M16 9h4v12'],
  ['card', 'Kart', 'M3 6h18v12H3zM3 10h18M7 15h3'],
  ['cloud', 'Yazılım', 'M7 18h10a4 4 0 00.4-8A6 6 0 006 8.5 4.5 4.5 0 007 18z'],
  ['users', 'Personel', 'M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75'],
  ['bolt', 'Enerji', 'M13 2L4 14h7l-1 8 9-12h-7l1-8z'],
  ['car', 'Ulaşım', 'M5 17h14l-1-7H6l-1 7zM7 10l2-4h6l2 4M7 17v3M17 17v3'],
  ['megaphone', 'Pazarlama', 'M3 11v3l11 4V7L3 11zM14 10l5-3v11l-5-3M5 15l2 5h3l-2-4'],
];
const emptyForm = { title: '', note: '', category: 'Yazılım', related_party: parties[0], icon: 'receipt', amount: '', period: 'monthly', due_day: '1' };
const inputClass = 'w-full rounded-xl border border-gray-700 bg-gray-800 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10';

function Icon({ name, className = 'w-5 h-5' }) {
  const path = iconOptions.find(([key]) => key === name)?.[2] || iconOptions[0][2];
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d={path} /></svg>;
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

  const visible = useMemo(() => expenses.filter((item) => {
    const term = search.toLocaleLowerCase('tr-TR');
    const matches = !term || [item.title, item.note, item.category, item.related_party].some((x) => String(x || '').toLocaleLowerCase('tr-TR').includes(term));
    return matches && (periodFilter === 'all' || item.period === periodFilter);
  }), [expenses, search, periodFilter]);

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

      <section className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900">
        <div className="flex flex-col gap-3 border-b border-gray-800 p-4 sm:flex-row">
          <div className="relative flex-1"><svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeWidth="2" d="m21 21-4.4-4.4M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" /></svg><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Giderlerde ara..." className="w-full rounded-xl border border-gray-700 bg-gray-800 py-2.5 pl-10 pr-4 text-sm text-white outline-none transition focus:border-cyan-500" /></div>
          <div className="grid grid-cols-3 rounded-xl bg-gray-800 p-1 text-xs font-medium sm:w-auto">{[['all','Tümü'],['monthly','Aylık'],['yearly','Yıllık']].map(([key,label]) => <button key={key} onClick={() => setPeriodFilter(key)} className={`rounded-lg px-4 py-2 transition ${periodFilter === key ? 'bg-cyan-500 text-white' : 'text-gray-400 hover:text-white'}`}>{label}</button>)}</div>
        </div>

        {loading ? <div className="flex h-48 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" /></div> : visible.length === 0 ? <Empty onAdd={openNew} hasSearch={expenses.length > 0} /> : (
          <div className="divide-y divide-gray-800">{visible.map((item) => {
            const monthly = item.period === 'monthly' ? Number(item.amount) : Number(item.amount) / 12;
            const yearly = item.period === 'yearly' ? Number(item.amount) : Number(item.amount) * 12;
            return <article key={item.id} className="group p-4 transition hover:bg-white/[.025] sm:p-5">
              <div className="flex gap-3 sm:gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400"><Icon name={item.icon} /></div><div className="min-w-0 flex-1">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate font-semibold text-white">{item.title}</h2><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${item.period === 'monthly' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-purple-500/10 text-purple-400'}`}>{item.period === 'monthly' ? 'Aylık' : 'Yıllık'}</span></div><p className="mt-1 truncate text-xs text-gray-400">{item.category} · {item.related_party || 'İlgili belirtilmedi'}{item.period === 'monthly' && ` · Her ayın ${item.due_day}. günü`}</p></div>
                  <div className="flex items-center justify-between gap-3 lg:justify-end"><div className="text-left lg:text-right"><p className="font-semibold text-white">{money(item.amount)} <span className="text-xs font-normal text-gray-500">/ {item.period === 'monthly' ? 'ay' : 'yıl'}</span></p><p className="mt-0.5 text-xs text-gray-500">{money(monthly)} aylık · {money(yearly)} yıllık</p></div><div className="flex shrink-0"><button onClick={() => openEdit(item)} aria-label="Gideri düzenle" className="rounded-lg p-2 text-gray-500 hover:bg-gray-800 hover:text-cyan-400">✎</button><button onClick={() => remove(item)} aria-label="Gideri sil" className="rounded-lg p-2 text-gray-500 hover:bg-red-500/10 hover:text-red-400">×</button></div></div>
                </div>{item.note && <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-gray-400">{item.note}</p>}
              </div></div>
            </article>;
          })}</div>
        )}
      </section>

      {modalOpen && <ExpenseModal form={form} setField={setField} onClose={() => setModalOpen(false)} onSubmit={submit} saving={saving} editing={Boolean(editingId)} />}
    </div>
  );
}

function Summary({ title, value, subtitle, color, icon, extra = '' }) {
  const styles = { cyan: 'bg-cyan-500/10 text-cyan-400', purple: 'bg-purple-500/10 text-purple-400', emerald: 'bg-green-500/10 text-green-400' };
  return <div className={`${extra} rounded-2xl border border-gray-800 bg-gray-900 p-5`}><div className="flex items-start justify-between"><div><p className="text-xs font-medium text-gray-400">{title}</p><p className="mt-2 text-2xl font-bold tracking-tight text-white">{value}</p><p className="mt-1 text-xs text-gray-500">{subtitle}</p></div><div className={`rounded-xl p-2.5 ${styles[color]}`}><Icon name={icon} /></div></div></div>;
}
function Empty({ onAdd, hasSearch }) { return <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center"><div className="mb-4 rounded-2xl bg-gray-800 p-4 text-gray-500"><Icon name="receipt" className="h-7 w-7" /></div><h3 className="font-semibold text-white">{hasSearch ? 'Eşleşen gider bulunamadı' : 'Henüz gider eklenmedi'}</h3><p className="mt-2 max-w-sm text-sm text-gray-400">{hasSearch ? 'Arama veya filtre seçiminizi değiştirin.' : 'Aylık ve yıllık maliyetlerinizi takip etmeye başlayın.'}</p>{!hasSearch && <button onClick={onAdd} className="mt-4 text-sm font-semibold text-cyan-400 hover:text-cyan-300">İlk gideri ekle →</button>}</div>; }

function ExpenseModal({ form, setField, onClose, onSubmit, saving, editing }) {
  const monthlyPreview = form.amount ? (form.period === 'monthly' ? Number(form.amount) : Number(form.amount) / 12) : 0;
  const yearlyPreview = form.amount ? (form.period === 'yearly' ? Number(form.amount) : Number(form.amount) * 12) : 0;
  return <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><form onSubmit={onSubmit} className="max-h-[94vh] w-full overflow-y-auto rounded-t-3xl border border-gray-700 bg-gray-900 shadow-2xl sm:max-w-2xl sm:rounded-3xl">
    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-800 bg-gray-900/95 px-5 py-4 backdrop-blur"><div><h2 className="text-lg font-bold text-white">{editing ? 'Gideri düzenle' : 'Yeni gider ekle'}</h2><p className="mt-0.5 text-xs text-gray-400">Tutar dönüşümleri otomatik hesaplanır.</p></div><button type="button" onClick={onClose} className="rounded-xl p-2 text-xl text-gray-400 hover:bg-gray-800 hover:text-white">×</button></div>
    <div className="space-y-5 p-5">
      <Field label="Gider başlığı"><input required maxLength="240" value={form.title} onChange={(e) => setField('title', e.target.value)} placeholder="Örn. Ofis kirası" className={inputClass} /></Field>
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Tutar (₺)"><input required min="0.01" step="0.01" type="number" inputMode="decimal" value={form.amount} onChange={(e) => setField('amount', e.target.value)} placeholder="0,00" className={inputClass} /></Field><Field label="Gider türü"><div className="grid grid-cols-2 rounded-xl bg-gray-800 p-1">{[['monthly','Aylık'],['yearly','Yıllık']].map(([key,label]) => <button type="button" key={key} onClick={() => setField('period', key)} className={`rounded-lg py-2.5 text-sm font-semibold transition ${form.period === key ? 'bg-cyan-500 text-white' : 'text-gray-400 hover:text-white'}`}>{label}</button>)}</div></Field></div>
      {form.amount && <div className="grid grid-cols-2 gap-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-sm"><div><p className="text-xs text-gray-500">Aylık karşılığı</p><p className="mt-1 font-semibold text-cyan-400">{money(monthlyPreview)}</p></div><div><p className="text-xs text-gray-500">Yıllık karşılığı</p><p className="mt-1 font-semibold text-cyan-400">{money(yearlyPreview)}</p></div></div>}
      {form.period === 'monthly' && <Field label="Her ayın son ödeme günü"><div className="flex items-center gap-3"><input required min="1" max="31" type="number" value={form.due_day} onChange={(e) => setField('due_day', e.target.value)} className={`${inputClass} max-w-28`} /><span className="text-sm text-gray-400">Her ay bu gün son ödeme tarihi olur.</span></div></Field>}
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Kategori"><select value={form.category} onChange={(e) => setField('category', e.target.value)} className={inputClass}>{categories.map((x) => <option key={x}>{x}</option>)}</select></Field><Field label="İlgili kurum / kişi"><select value={form.related_party} onChange={(e) => setField('related_party', e.target.value)} className={inputClass}>{parties.map((x) => <option key={x}>{x}</option>)}</select></Field></div>
      <Field label="İkon"><div className="grid grid-cols-4 gap-2 sm:grid-cols-8">{iconOptions.map(([key,label]) => <button type="button" title={label} aria-label={label} key={key} onClick={() => setField('icon', key)} className={`flex aspect-square items-center justify-center rounded-xl border transition ${form.icon === key ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400' : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600 hover:text-white'}`}><Icon name={key} /></button>)}</div></Field>
      <Field label="Not"><textarea value={form.note} onChange={(e) => setField('note', e.target.value)} rows="3" placeholder="Giderle ilgili açıklama veya hatırlatma..." className={`${inputClass} resize-none`} /></Field>
    </div><div className="sticky bottom-0 flex gap-3 border-t border-gray-800 bg-gray-900/95 p-4 backdrop-blur sm:justify-end"><button type="button" onClick={onClose} className="flex-1 rounded-xl border border-gray-700 px-5 py-2.5 text-sm font-semibold text-gray-300 hover:bg-gray-800 sm:flex-none">Vazgeç</button><button disabled={saving} className="flex-1 rounded-xl bg-cyan-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-cyan-400 disabled:opacity-50 sm:flex-none">{saving ? 'Kaydediliyor...' : editing ? 'Değişiklikleri kaydet' : 'Gideri ekle'}</button></div>
  </form></div>;
}
function Field({ label, children }) { return <label className="block"><span className="mb-2 block text-xs font-semibold text-gray-400">{label}</span>{children}</label>; }
