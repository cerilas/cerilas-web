import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { api } from '../../lib/api';

registerLocale('tr', tr);

export default function OpportunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [rates, setRates] = useState({ TRY: 1, USD: 35, EUR: 38 });
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  const statusOptions = [
    { value: 'Aktif', label: 'Aktif', color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' },
    { value: 'Pasif', label: 'Pasif', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    { value: 'Beklemede', label: 'Beklemede', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    { value: 'Tamamlandı', label: 'Tamamlandı', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { value: 'Arşiv', label: 'Arşiv', color: 'text-gray-400', bg: 'bg-gray-700/50', border: 'border-gray-600' }
  ];

  const [isApplicationPointDropdownOpen, setIsApplicationPointDropdownOpen] = useState(false);
  const [isInstitutionDropdownOpen, setIsInstitutionDropdownOpen] = useState(false);
  const institutionOptions = [
    { value: 'EIC', label: 'EIC', logo: '/logos/eic-logo.png' },
    { value: 'EU Horizon', label: 'EU Horizon', logo: '/logos/eu-horizon.png' },
    { value: 'F6S', label: 'F6S', logo: '/logos/f6s-logo.png' },
    { value: 'KOSGEB', label: 'KOSGEB', logo: '/logos/kosgeb-logo.png' },
    { value: 'TÜBİTAK', label: 'TÜBİTAK', logo: '/logos/tubitak-logo.png' },
    { value: 'TÜSEB', label: 'TÜSEB', logo: '/logos/tuseb-logo.png' },
    { value: 'Diğer Kamu', label: 'Diğer Kamu', icon: <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg> },
    { value: 'Diğer Özel', label: 'Diğer Özel', icon: <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> }
  ];

  const applicationPoints = [
    'CERİLAS Yüksek Teknoloji Sanayi ve Ticaret AŞ',
    'CERENİS Yüksek Teknoloji Sanayi ve Ticaret AŞ',
    'Şahıs - Deniz Can Ilgın',
    'Şahıs - Ceren Erçin Ilgın',
    'Şahıs - Diğer'
  ];

  const toDate = (dateStr) => {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split('-');
    return new Date(year, month - 1, day);
  };
  
  const toStr = (dateObj) => {
    if (!dateObj) return '';
    return format(dateObj, 'yyyy-MM-dd');
  };

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    application_url: '',
    drive_url: '',
    focus_rating: 5,
    probability_rating: 5,
    total_income: 0,
    currency: 'TRY',
    status: 'Aktif',
    institution: '',
    application_point: '',
    application_point_other: '',
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
        status: data.status || 'Aktif',
        institution: data.institution || '',
        application_point: data.application_point || '',
        application_point_other: data.application_point_other || '',
        application_date: data.application_date ? data.application_date.split('T')[0] : '',
        expected_end_date: data.expected_end_date ? data.expected_end_date.split('T')[0] : ''
      });
      setDisplayCurrency(data.currency || 'TRY');
      setPayments(data.payments || []);
      setTodos(data.todos || []);
    } catch (err) {
      console.error(err);
      toast.error('İhtimal yüklenemedi!');
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
        navigate(`/admin/opportunities/${created.id}`);
        toast.success('İhtimal başarıyla oluşturuldu!');
      } else {
        await api.updateOpportunity(id, formData);
        toast.success('Değişiklikler kaydedildi!');
      }
    } catch (err) {
      toast.error('Hata: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOpportunity = () => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-gray-200 font-medium">Bu ihtimali silmek istediğinize emin misiniz?</p>
        <div className="flex gap-2 justify-end">
          <button 
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium rounded transition-colors"
            onClick={() => toast.dismiss(t.id)}
          >
            İptal
          </button>
          <button 
            className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded transition-colors"
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await api.deleteOpportunity(id);
                toast.success('İhtimal silindi!');
                navigate('/admin/opportunities');
              } catch (err) {
                toast.error('Silinemedi: ' + err.message);
              }
            }}
          >
            Sil
          </button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const getAccentColor = (rating) => {
    if (rating <= 3) return '#ef4444';
    if (rating <= 7) return '#eab308';
    return '#22c55e';
  };

  // --- Calculations ---
  const convertAmount = (amount, fromCurr, toCurr, customRates) => {
    const activeRates = customRates || rates;
    const val = parseFloat(amount) || 0;
    const inTry = val * (activeRates[fromCurr] || 1);
    return inTry / (activeRates[toCurr] || 1);
  };

  const totalPaymentsInDisplayCurr = payments.reduce((sum, p) => {
    let pRates = rates;
    if (p.exchange_rates) {
      pRates = typeof p.exchange_rates === 'string' ? JSON.parse(p.exchange_rates) : p.exchange_rates;
    }
    return sum + convertAmount(p.amount, p.currency, displayCurrency, pRates);
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
      toast.success('Ödeme eklendi');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeletePayment = (paymentId) => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-gray-200 font-medium">Bu ödemeyi silmek istediğinize emin misiniz?</p>
        <div className="flex gap-2 justify-end">
          <button 
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium rounded transition-colors"
            onClick={() => toast.dismiss(t.id)}
          >
            İptal
          </button>
          <button 
            className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded transition-colors"
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await api.deleteOpportunityPayment(id, paymentId);
                setPayments(payments.filter(p => p.id !== paymentId));
                toast.success('Ödeme silindi');
              } catch (err) {
                toast.error(err.message);
              }
            }}
          >
            Sil
          </button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  // --- Todos ---
  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!newTodoText) return;
    try {
      const added = await api.addOpportunityTodo(id, { text: newTodoText, deadline: newTodoDeadline });
      setTodos([...todos, added]);
      setNewTodoText('');
      setNewTodoDeadline('');
      toast.success('Görev eklendi');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleToggleTodo = async (todo) => {
    try {
      const updated = await api.toggleOpportunityTodo(id, todo.id, !todo.is_completed);
      setTodos(todos.map(t => t.id === todo.id ? updated : t));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteTodo = (todoId) => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-gray-200 font-medium">Bu görevi silmek istediğinize emin misiniz?</p>
        <div className="flex gap-2 justify-end">
          <button 
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium rounded transition-colors"
            onClick={() => toast.dismiss(t.id)}
          >
            İptal
          </button>
          <button 
            className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded transition-colors"
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await api.deleteOpportunityTodo(id, todoId);
                setTodos(todos.filter(t => t.id !== todoId));
                toast.success('Görev silindi');
              } catch (err) {
                toast.error(err.message);
              }
            }}
          >
            Sil
          </button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;

    if (sourceIndex === destIndex) return;

    const newTodos = Array.from(todos);
    const [movedItem] = newTodos.splice(sourceIndex, 1);
    newTodos.splice(destIndex, 0, movedItem);

    setTodos(newTodos);

    try {
      const items = newTodos.map((t, index) => ({ id: t.id, sort_order: index }));
      await api.reorderOpportunityTodos(id, items);
    } catch (err) {
      toast.error('Sıralama kaydedilemedi: ' + err.message);
      // Revert if error
      setTodos(todos);
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
          <button onClick={handleDeleteOpportunity} className="text-red-400 hover:text-red-300 text-sm font-medium">
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
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-2">İhtimal / Proje Adı</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:border-transparent focus:ring-cyan-500/50 transition-all shadow-inner" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-2">İlgili Kurum</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsInstitutionDropdownOpen(!isInstitutionDropdownOpen)}
                      className="w-full flex items-center justify-between bg-gray-800/50 border border-gray-700 hover:border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all shadow-inner"
                    >
                      {(() => {
                        const activeInst = institutionOptions.find(i => i.value === formData.institution);
                        if (!activeInst) return <span className="text-gray-500">Seçiniz...</span>;
                        return (
                          <div className="flex items-center gap-3">
                            {activeInst.logo ? (
                              <div className="bg-white rounded p-1 flex items-center justify-center w-10 h-7 shrink-0">
                                <img src={activeInst.logo} alt={activeInst.label} className="h-full w-full object-contain" />
                              </div>
                            ) : (
                              <div className="w-10 h-7 flex items-center justify-center shrink-0">
                                {activeInst.icon}
                              </div>
                            )}
                            <span className="font-medium text-sm text-gray-200">{activeInst.label}</span>
                          </div>
                        );
                      })()}
                      <svg className={`w-5 h-5 text-gray-400 transition-transform ${isInstitutionDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {isInstitutionDropdownOpen && (
                      <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden py-1 max-h-60 overflow-y-auto">
                        <button
                          type="button"
                          className="w-full text-left px-4 py-3 hover:bg-gray-800 transition-colors flex items-center gap-3 text-gray-400 text-sm italic"
                          onClick={() => {
                            setFormData({ ...formData, institution: '' });
                            setIsInstitutionDropdownOpen(false);
                          }}
                        >
                          Temizle
                        </button>
                        {institutionOptions.map(option => (
                          <button
                            key={option.value}
                            type="button"
                            className={`w-full text-left px-4 py-3 hover:bg-gray-800 transition-colors flex items-center gap-3 ${formData.institution === option.value ? 'bg-gray-800/50' : ''}`}
                            onClick={() => {
                              setFormData({ ...formData, institution: option.value });
                              setIsInstitutionDropdownOpen(false);
                            }}
                          >
                            <div className="w-10 flex justify-center items-center shrink-0">
                              {option.logo ? (
                                <div className="bg-white rounded p-1 flex items-center justify-center w-10 h-7">
                                  <img src={option.logo} alt={option.label} className="h-full w-full object-contain" />
                                </div>
                              ) : (
                                <div className="w-10 h-7 flex items-center justify-center">
                                  {option.icon}
                                </div>
                              )}
                            </div>
                            <span className="font-medium text-sm text-gray-200">{option.label}</span>
                            {formData.institution === option.value && (
                              <svg className="w-5 h-5 ml-auto text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Durum</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                      className="w-full flex items-center justify-between bg-gray-800/50 border border-gray-700 hover:border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all shadow-inner"
                    >
                      {(() => {
                        const activeStatus = statusOptions.find(s => s.value === formData.status) || statusOptions[0];
                        return (
                          <div className="flex-1 min-w-0 flex items-center mr-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${activeStatus.bg} ${activeStatus.color} ${activeStatus.border} border truncate block max-w-full`}>
                              {activeStatus.label}
                            </span>
                          </div>
                        );
                      })()}
                      <svg className={`w-5 h-5 text-gray-400 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {isStatusDropdownOpen && (
                      <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden py-1">
                        {statusOptions.map(option => (
                          <button
                            key={option.value}
                            type="button"
                            className={`w-full text-left px-4 py-3 hover:bg-gray-800 transition-colors flex items-center gap-3 ${formData.status === option.value ? 'bg-gray-800/50' : ''}`}
                            onClick={() => {
                              setFormData({ ...formData, status: option.value });
                              setIsStatusDropdownOpen(false);
                            }}
                          >
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${option.bg} ${option.color} ${option.border} border truncate`}>
                              {option.label}
                            </span>
                            {formData.status === option.value && (
                              <svg className="w-5 h-5 ml-auto text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Başvuru Noktası (Şirket/Şahıs)</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsApplicationPointDropdownOpen(!isApplicationPointDropdownOpen)}
                      className="w-full flex items-center justify-between bg-gray-800/50 border border-gray-700 hover:border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all shadow-inner"
                    >
                      <span className={`font-medium text-sm ${formData.application_point ? 'text-gray-200' : 'text-gray-500'}`}>
                        {formData.application_point || 'Seçiniz...'}
                      </span>
                      <svg className={`w-5 h-5 text-gray-400 transition-transform ${isApplicationPointDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {isApplicationPointDropdownOpen && (
                      <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden py-1 max-h-60 overflow-y-auto">
                        <button
                          type="button"
                          className="w-full text-left px-4 py-3 hover:bg-gray-800 transition-colors flex items-center gap-3 text-gray-400 text-sm italic"
                          onClick={() => {
                            setFormData({ ...formData, application_point: '' });
                            setIsApplicationPointDropdownOpen(false);
                          }}
                        >
                          Temizle
                        </button>
                        {applicationPoints.map(point => (
                          <button
                            key={point}
                            type="button"
                            className={`w-full text-left px-4 py-3 hover:bg-gray-800 transition-colors flex items-center gap-3 ${formData.application_point === point ? 'bg-gray-800/50' : ''}`}
                            onClick={() => {
                              setFormData({ ...formData, application_point: point });
                              setIsApplicationPointDropdownOpen(false);
                            }}
                          >
                            <span className="font-medium text-sm text-gray-200">{point}</span>
                            {formData.application_point === point && (
                              <svg className="w-5 h-5 ml-auto text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {formData.application_point === 'Şahıs - Diğer' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Diğer Başvuru Noktası</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.application_point_other} 
                      onChange={e => setFormData({...formData, application_point_other: e.target.value})} 
                      placeholder="Lütfen belirtiniz..."
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:border-transparent focus:ring-cyan-500/50 transition-all shadow-inner" 
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Kısa Açıklama</label>
                <textarea rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:border-transparent focus:ring-cyan-500/50 transition-all shadow-inner" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Başvuru Bilgi Sayfası / Link</label>
                <input type="url" value={formData.application_url} onChange={e => setFormData({...formData, application_url: e.target.value})} className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:border-transparent focus:ring-cyan-500/50 transition-all shadow-inner" placeholder="https://" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Drive Klasör Linki</label>
                <input type="url" value={formData.drive_url} onChange={e => setFormData({...formData, drive_url: e.target.value})} className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:border-transparent focus:ring-cyan-500/50 transition-all shadow-inner" placeholder="https://" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 flex justify-between">
                  Odak Puanı <span className="text-cyan-400 font-bold">{formData.focus_rating}/10</span>
                </label>
                <div className="relative pt-2">
                  <input type="range" min="0" max="10" value={formData.focus_rating} onChange={e => setFormData({...formData, focus_rating: parseInt(e.target.value)})} className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer shadow-inner" style={{ accentColor: '#22d3ee' }} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 flex justify-between">
                  Olma Olasılığı <span className="font-bold" style={{ color: getAccentColor(formData.probability_rating) }}>{formData.probability_rating}/10</span>
                </label>
                <div className="relative pt-2">
                  <input type="range" min="0" max="10" value={formData.probability_rating} onChange={e => setFormData({...formData, probability_rating: parseInt(e.target.value)})} className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer shadow-inner" style={{ accentColor: getAccentColor(formData.probability_rating) }} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-400 uppercase font-bold tracking-wider">Başvuru Tarihi</label>
                <DatePicker
                  locale="tr"
                  dateFormat="dd.MM.yyyy"
                  placeholderText="Tarih seçin"
                  selected={toDate(formData.application_date)}
                  onChange={(date) => setFormData({...formData, application_date: toStr(date)})}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:border-transparent focus:ring-cyan-500/50 transition-all shadow-inner"
                  wrapperClassName="w-full"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-400 uppercase font-bold tracking-wider">Olası Bitiş Tarihi</label>
                <DatePicker
                  locale="tr"
                  dateFormat="dd.MM.yyyy"
                  placeholderText="Tarih seçin"
                  selected={toDate(formData.expected_end_date)}
                  onChange={(date) => setFormData({...formData, expected_end_date: toStr(date)})}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:border-transparent focus:ring-cyan-500/50 transition-all shadow-inner"
                  wrapperClassName="w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-800 pt-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Toplam Olası Kazanç / Getiri</label>
                <input type="number" step="0.01" value={formData.total_income} onChange={e => setFormData({...formData, total_income: parseFloat(e.target.value)})} className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:border-transparent focus:ring-cyan-500/50 transition-all shadow-inner" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Para Birimi</label>
                <div className="relative">
                  <select value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})} className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:ring-2 focus:border-transparent focus:ring-cyan-500/50 transition-all shadow-inner">
                    <option value="TRY">TRY</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
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
              
              <form onSubmit={handleAddTodo} className="flex flex-col sm:flex-row gap-3 mb-6 bg-gray-800/50 p-4 rounded-xl border border-gray-800">
                <input type="text" required placeholder="Yeni görev ekle..." value={newTodoText} onChange={e => setNewTodoText(e.target.value)} className="flex-1 bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:border-transparent focus:ring-cyan-500 shadow-inner" />
                <div className="flex gap-3">
                  <DatePicker
                    locale="tr"
                    dateFormat="dd.MM.yyyy"
                    placeholderText="Son Teslim Tarihi"
                    selected={toDate(newTodoDeadline)}
                    onChange={(date) => setNewTodoDeadline(toStr(date))}
                    className="w-full sm:w-40 bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:border-transparent focus:ring-cyan-500 shadow-inner"
                    wrapperClassName="w-full sm:w-40"
                  />
                  <button type="submit" className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold rounded-lg shadow-md transition-colors flex items-center justify-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Ekle
                  </button>
                </div>
              </form>

              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="todos-list">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                      {todos.map((todo, index) => (
                        <Draggable key={todo.id.toString()} draggableId={todo.id.toString()} index={index}>
                          {(provided, snapshot) => (
                            <div 
                              ref={provided.innerRef} 
                              {...provided.draggableProps}
                              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                                snapshot.isDragging ? 'bg-gray-800 shadow-[0_0_15px_rgba(34,211,238,0.2)] border-cyan-500 z-10' 
                                : todo.is_completed ? 'bg-gray-800/30 border-gray-800' : 'bg-gray-800 border-gray-700'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {/* Grip Icon */}
                                <div {...provided.dragHandleProps} className="text-gray-600 hover:text-cyan-400 cursor-grab active:cursor-grabbing p-1 -ml-1 flex items-center justify-center">
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                  </svg>
                                </div>
                                <button 
                                  type="button"
                                  onClick={() => handleToggleTodo(todo)}
                                  className={`w-6 h-6 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                                    todo.is_completed 
                                      ? 'bg-cyan-500 border-cyan-500 text-gray-900 shadow-[0_0_10px_rgba(34,211,238,0.4)]' 
                                      : 'bg-gray-800/50 border-gray-600 hover:border-cyan-400 hover:bg-gray-800'
                                  }`}
                                >
                                  {todo.is_completed && (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </button>
                                <div>
                                  <p className={`text-sm ${todo.is_completed ? 'text-gray-500 line-through' : 'text-gray-200'}`}>{todo.text}</p>
                                  {todo.deadline && (
                                    <p className="text-[10px] text-gray-500 mt-0.5">Son: {new Date(todo.deadline).toLocaleDateString('tr-TR')}</p>
                                  )}
                                </div>
                              </div>
                              <button onClick={() => handleDeleteTodo(todo.id)} className="text-gray-500 hover:text-red-400 p-1 transition-colors">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {todos.length === 0 && <p className="text-sm text-gray-500 text-center py-4">Henüz görev eklenmemiş.</p>}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
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
                <div className="relative">
                  <select value={displayCurrency} onChange={e => setDisplayCurrency(e.target.value)} className="bg-gray-800/50 border border-gray-700 text-xs text-white rounded-lg pl-3 pr-8 py-1.5 appearance-none focus:outline-none focus:ring-1 focus:ring-cyan-500 shadow-inner">
                    <option value="TRY">TRY Göster</option>
                    <option value="USD">USD Göster</option>
                    <option value="EUR">EUR Göster</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-400">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
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
                <div className={`p-4 rounded-lg border ${remainingIncome > 0 ? 'bg-cyan-500/10 border-cyan-500/20' : 'bg-gray-800/50 border-gray-800'}`}>
                  <p className={`text-xs mb-1 ${remainingIncome > 0 ? 'text-cyan-400/80' : 'text-gray-400'}`}>Kalan Ödeme</p>
                  <p className={`text-xl font-bold ${remainingIncome > 0 ? 'text-cyan-400' : 'text-white'}`}>
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
                  <input type="number" step="0.01" required placeholder="Miktar" value={newPayment.amount} onChange={e => setNewPayment({...newPayment, amount: e.target.value})} className="bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:border-transparent focus:ring-green-500 shadow-inner" />
                  <div className="relative">
                    <select value={newPayment.currency} onChange={e => setNewPayment({...newPayment, currency: e.target.value})} className="w-full bg-gray-800/50 border border-gray-700 rounded-lg pl-3 pr-8 py-2 text-white text-sm appearance-none focus:outline-none focus:ring-1 focus:border-transparent focus:ring-green-500 shadow-inner">
                      <option value="TRY">TRY</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 w-full">
                  <div className="flex-1">
                    <DatePicker
                      locale="tr"
                      dateFormat="dd.MM.yyyy"
                      placeholderText="Ödeme Tarihi *"
                      selected={toDate(newPayment.payment_date)}
                      onChange={(date) => setNewPayment({...newPayment, payment_date: toStr(date)})}
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:border-transparent focus:ring-green-500 shadow-inner"
                      wrapperClassName="w-full"
                      required
                    />
                  </div>
                  <button type="submit" className="px-5 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-lg shadow-md transition-colors">Ekle</button>
                </div>
              </form>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {payments.map(payment => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700">
                    <div>
                      <p className="text-sm font-bold text-green-400">
                        {formatMoney(payment.amount, payment.currency)}
                        {payment.currency !== displayCurrency && (
                          <span className="text-xs text-gray-400/70 font-normal ml-2">
                            (≈ {formatMoney(convertAmount(payment.amount, payment.currency, displayCurrency, payment.exchange_rates ? (typeof payment.exchange_rates === 'string' ? JSON.parse(payment.exchange_rates) : payment.exchange_rates) : rates), displayCurrency)})
                          </span>
                        )}
                      </p>
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
