import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';

export default function OpportunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [rates, setRates] = useState({ TRY: 1, USD: 35, EUR: 38 });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    application_url: '',
    drive_url: '',
    focus_rating: 5,
    probability_rating: 5,
    total_income: 0,
    currency: 'TRY',
    application_date: '',
    expected_end_date: ''
  });

  const [payments, setPayments] = useState([]);
  const [todos, setTodos] = useState([]);

  // New Payment Form
  const [newPayment, setNewPayment] = useState({ amount: '', currency: 'TRY', payment_date: '' });
  // New Todo Form
  const [newTodoText, setNewTodoText] = useState('');
  const [newTodoDeadline, setNewTodoDeadline] = useState('');

  // View Settings
  const [displayCurrency, setDisplayCurrency] = useState('TRY');

  useEffect(() => {
    fetchRates();
    if (!isNew) {
      fetchOpportunity();
    }
  }, [id]);

  const fetchRates = async () => {
    try {
      const data = await api.getExchangeRates();
      setRates(data);
    } catch (err) {
      console.error('Rates error', err);
    }
  };

  const fetchOpportunity = async () => {
    setLoading(true);
    try {
      const data = await api.getOpportunity(id);
      setFormData({
        name: data.name || '',
        description: data.description || '',
        application_url: data.application_url || '',
        drive_url: data.drive_url || '',
        focus_rating: data.focus_rating || 0,
        probability_rating: data.probability_rating || 0,
        total_income: data.total_income || 0,
        currency: data.currency || 'TRY',
        application_date: data.application_date ? data.application_date.split('T')[0] : '',
        expected_end_date: data.expected_end_date ? data.expected_end_date.split('T')[0] : ''
      });
      setDisplayCurrency(data.currency || 'TRY');
      setPayments(data.payments || []);
      setTodos(data.todos || []);
    } catch (err) {
      console.error(err);
      alert('İhtimal yüklenemedi!');
      navigate('/admin/opportunities');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isNew) {
        const created = await api.createOpportunity(formData);
        navigate(`/admin/opportunities/\${created.id}`);
      } else {
        await api.updateOpportunity(id, formData);
        alert('Kaydedildi!');
      }
    } catch (err) {
      alert('Hata: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Bu ihtimali silmek istediğinize emin misiniz?')) return;
    try {
      await api.deleteOpportunity(id);
      navigate('/admin/opportunities');
    } catch (err) {
      alert('Silinemedi: ' + err.message);
    }
  };

  // --- Calculations ---
  const convertAmount = (amount, fromCurr, toCurr) => {
    const val = parseFloat(amount) || 0;
    const inTry = val * (rates[fromCurr] || 1);
    return inTry / (rates[toCurr] || 1);
  };

  const totalPaymentsInDisplayCurr = payments.reduce((sum, p) => {
    return sum + convertAmount(p.amount, p.currency, displayCurrency);
  }, 0);

  const expectedIncomeInDisplayCurr = convertAmount(formData.total_income, formData.currency, displayCurrency);
  const remainingIncome = expectedIncomeInDisplayCurr - totalPaymentsInDisplayCurr;

  const formatMoney = (val, cur) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: cur }).format(val);
  };

  // --- Payments ---
  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (!newPayment.amount || !newPayment.payment_date) return;
    try {
      const added = await api.addOpportunityPayment(id, newPayment);
      setPayments([added, ...payments]);
      setNewPayment({ amount: '', currency: 'TRY', payment_date: '' });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm('Ödemeyi silmek istediğinize emin misiniz?')) return;
    try {
      await api.deleteOpportunityPayment(id, paymentId);
      setPayments(payments.filter(p => p.id !== paymentId));
    } catch (err) {
      alert(err.message);
    }
  };

  // --- Todos ---
  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!newTodoText) return;
    try {
      const added = await api.addOpportunityTodo(id, { text: newTodoText, deadline: newTodoDeadline });
      setTodos([...todos, added].sort((a,b) => a.is_completed - b.is_completed));
      setNewTodoText('');
      setNewTodoDeadline('');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleTodo = async (todo) => {
    try {
      const updated = await api.toggleOpportunityTodo(id, todo.id, !todo.is_completed);
      setTodos(todos.map(t => t.id === todo.id ? updated : t).sort((a,b) => a.is_completed - b.is_completed));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteTodo = async (todoId) => {
    try {
      await api.deleteOpportunityTodo(id, todoId);
      setTodos(todos.filter(t => t.id !== todoId));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="text-white p-8">Yükleniyor...</div>;

  return (
    <div className="max-w-7xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/opportunities')} className="text-gray-400 hover:text-white transition-colors">
            &larr; Geri
          </button>
          <h1 className="text-3xl font-bold text-white">{isNew ? 'Yeni İhtimal Ekle' : formData.name}</h1>
        </div>
        {!isNew && (
          <button onClick={handleDelete} className="text-red-400 hover:text-red-300 text-sm font-medium">
            Bu İhtimali Sil
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">
            <h2 className="text-xl font-bold text-white border-b border-gray-800 pb-4">Genel Bilgiler</h2>
            
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">İhtimal / Proje Adı</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Kısa Açıklama</label>
                <textarea rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Başvuru Bilgi Sayfası / Link</label>
                <input type="url" value={formData.application_url} onChange={e => setFormData({...formData, application_url: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white" placeholder="https://" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Drive Klasör Linki</label>
                <input type="url" value={formData.drive_url} onChange={e => setFormData({...formData, drive_url: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white" placeholder="https://" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 flex justify-between">
                  Odak Puanı <span className="text-cyan-400">{formData.focus_rating}/10</span>
                </label>
                <input type="range" min="0" max="10" value={formData.focus_rating} onChange={e => setFormData({...formData, focus_rating: parseInt(e.target.value)})} className="w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 flex justify-between">
                  Olma Olasılığı <span className={formData.probability_rating > 5 ? 'text-green-400' : 'text-red-400'}>{formData.probability_rating}/10</span>
                </label>
                <input type="range" min="0" max="10" value={formData.probability_rating} onChange={e => setFormData({...formData, probability_rating: parseInt(e.target.value)})} className="w-full" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Başvuru Tarihi</label>
                <input type="date" value={formData.application_date} onChange={e => setFormData({...formData, application_date: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white [color-scheme:dark]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Olası Bitiş Tarihi</label>
                <input type="date" value={formData.expected_end_date} onChange={e => setFormData({...formData, expected_end_date: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white [color-scheme:dark]" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-800 pt-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Toplam Olası Kazanç / Getiri</label>
                <input type="number" step="0.01" value={formData.total_income} onChange={e => setFormData({...formData, total_income: parseFloat(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Para Birimi</label>
                <select value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white">
                  <option value="TRY">TRY</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button disabled={saving} type="submit" className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-all">
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </form>

          {/* Todos Section */}
          {!isNew && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">Görevler (To-Do)</h2>
              
              <form onSubmit={handleAddTodo} className="flex gap-2 mb-6">
                <input type="text" required placeholder="Yeni görev ekle..." value={newTodoText} onChange={e => setNewTodoText(e.target.value)} className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm" />
                <input type="date" value={newTodoDeadline} onChange={e => setNewTodoDeadline(e.target.value)} className="w-40 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm [color-scheme:dark]" />
                <button type="submit" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white rounded-lg text-sm font-medium transition-colors">
                  Ekle
                </button>
              </form>

              <div className="space-y-2">
                {todos.map(todo => (
                  <div key={todo.id} className={`flex items-center justify-between p-3 rounded-lg border \${todo.is_completed ? 'bg-gray-800/30 border-gray-800' : 'bg-gray-800 border-gray-700'}`}>
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        checked={todo.is_completed} 
                        onChange={() => handleToggleTodo(todo)}
                        className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-gray-900"
                      />
                      <div>
                        <p className={`text-sm \${todo.is_completed ? 'text-gray-500 line-through' : 'text-gray-200'}`}>{todo.text}</p>
                        {todo.deadline && (
                          <p className="text-[10px] text-gray-500 mt-0.5">Son: {new Date(todo.deadline).toLocaleDateString('tr-TR')}</p>
                        )}
                      </div>
                    </div>
                    <button onClick={() => handleDeleteTodo(todo.id)} className="text-gray-500 hover:text-red-400 p-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
                {todos.length === 0 && <p className="text-sm text-gray-500 text-center py-4">Henüz görev eklenmemiş.</p>}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Financials */}
        {!isNew && (
          <div className="space-y-6">
            {/* Financial Summary */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Finansal Durum</h2>
                <select value={displayCurrency} onChange={e => setDisplayCurrency(e.target.value)} className="bg-gray-800 border border-gray-700 text-xs text-white rounded px-2 py-1 outline-none">
                  <option value="TRY">TRY Göster</option>
                  <option value="USD">USD Göster</option>
                  <option value="EUR">EUR Göster</option>
                </select>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-800">
                  <p className="text-xs text-gray-400 mb-1">Toplam Olası Kazanç</p>
                  <p className="text-xl font-bold text-white">{formatMoney(expectedIncomeInDisplayCurr, displayCurrency)}</p>
                </div>
                <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <p className="text-xs text-green-400/80 mb-1">Alınan Toplam Ödeme</p>
                  <p className="text-xl font-bold text-green-400">{formatMoney(totalPaymentsInDisplayCurr, displayCurrency)}</p>
                </div>
                <div className={`p-4 rounded-lg border \${remainingIncome > 0 ? 'bg-cyan-500/10 border-cyan-500/20' : 'bg-gray-800/50 border-gray-800'}`}>
                  <p className={`text-xs mb-1 \${remainingIncome > 0 ? 'text-cyan-400/80' : 'text-gray-400'}`}>Kalan Ödeme</p>
                  <p className={`text-xl font-bold \${remainingIncome > 0 ? 'text-cyan-400' : 'text-white'}`}>
                    {formatMoney(Math.max(0, remainingIncome), displayCurrency)}
                  </p>
                </div>
              </div>
            </div>

            {/* Payments List */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Ödeme Girişleri</h3>
              
              <form onSubmit={handleAddPayment} className="space-y-3 mb-6 bg-gray-800/50 p-4 rounded-lg border border-gray-800">
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" step="0.01" required placeholder="Miktar" value={newPayment.amount} onChange={e => setNewPayment({...newPayment, amount: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-white text-sm" />
                  <select value={newPayment.currency} onChange={e => setNewPayment({...newPayment, currency: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-white text-sm">
                    <option value="TRY">TRY</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <input type="date" required value={newPayment.payment_date} onChange={e => setNewPayment({...newPayment, payment_date: e.target.value})} className="flex-1 bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-white text-sm [color-scheme:dark]" />
                  <button type="submit" className="px-4 py-1.5 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-md transition-colors">Ekle</button>
                </div>
              </form>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {payments.map(payment => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700">
                    <div>
                      <p className="text-sm font-bold text-green-400">{formatMoney(payment.amount, payment.currency)}</p>
                      <p className="text-[10px] text-gray-400">{new Date(payment.payment_date).toLocaleDateString('tr-TR')}</p>
                    </div>
                    <button onClick={() => handleDeletePayment(payment.id)} className="text-gray-500 hover:text-red-400 p-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                ))}
                {payments.length === 0 && <p className="text-xs text-gray-500 text-center py-2">Ödeme kaydı bulunamadı.</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
