import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { api } from '../../lib/api';

const MultiSelectFilter = ({ options, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const toggleOption = (optValue) => {
    if (value.includes(optValue)) {
      onChange(value.filter(v => v !== optValue));
    } else {
      onChange([...value, optValue]);
    }
  };

  const clearAll = (e) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <div className="relative w-full sm:w-auto sm:min-w-[140px]">
      <div 
        className="w-full h-full min-h-[38px] bg-gray-800/80 border border-gray-700 hover:border-cyan-500/50 rounded-lg px-3 py-1.5 text-white text-sm cursor-pointer flex justify-between items-center transition-colors shadow-inner"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-1 items-center overflow-hidden flex-1">
          {value.length === 0 ? (
            <span className="text-gray-400 select-none truncate">{placeholder}</span>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-cyan-400 font-semibold select-none">{value.length} seçili</span>
              <button onClick={clearAll} className="p-0.5 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition-colors focus:outline-none">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          )}
        </div>
        <svg className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1.5 w-full sm:w-max sm:min-w-[200px] bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50 py-2 overflow-hidden">
            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {options.map(opt => (
                <div 
                  key={opt.value} 
                  className="flex items-center gap-3 px-4 py-2 hover:bg-gray-700/50 cursor-pointer text-sm text-gray-200 transition-colors"
                  onClick={() => toggleOption(opt.value)}
                >
                  <div className={`w-4 h-4 rounded flex-shrink-0 border flex items-center justify-center transition-colors ${value.includes(opt.value) ? 'bg-cyan-500 border-cyan-500 text-white' : 'border-gray-500'}`}>
                    {value.includes(opt.value) && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <span className="select-none">{opt.label}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const SingleSelectFilter = ({ options, value, onChange, placeholder, icon, onIconClick, iconTitle }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => o.value === value);

  return (
    <div className="relative w-full sm:w-auto sm:min-w-[160px] flex gap-2">
      <div 
        className="flex-1 h-full min-h-[38px] bg-gray-800/80 border border-gray-700 hover:border-cyan-500/50 rounded-lg px-3 py-1.5 text-white text-sm cursor-pointer flex justify-between items-center transition-colors shadow-inner"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-gray-200 select-none truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </div>

      {icon && (
        <button 
          onClick={onIconClick}
          title={iconTitle}
          className="h-full min-h-[38px] px-3 bg-gray-800/80 border border-gray-700 hover:border-cyan-500/50 rounded-lg flex items-center justify-center text-gray-400 hover:text-cyan-400 transition-colors shadow-inner focus:outline-none flex-shrink-0"
        >
          {icon}
        </button>
      )}

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full right-0 mt-1.5 w-full sm:w-max sm:min-w-[200px] bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50 py-2 overflow-hidden">
            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {options.map(opt => (
                <div 
                  key={opt.value} 
                  className={`flex items-center gap-3 px-4 py-2 hover:bg-gray-700/50 cursor-pointer text-sm transition-colors ${value === opt.value ? 'text-cyan-400 font-medium' : 'text-gray-200'}`}
                  onClick={() => { onChange(opt.value); setIsOpen(false); }}
                >
                  <span className="select-none flex-1">{opt.label}</span>
                  {value === opt.value && (
                    <svg className="w-4 h-4 text-cyan-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default function OpportunitiesList() {
  const [opportunities, setOpportunities] = useState([]);
  const [rates, setRates] = useState({ TRY: 1, USD: 35, EUR: 38 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('application_date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterProb, setFilterProb] = useState([]);
  const [filterStatus, setFilterStatus] = useState([]);
  const [filterInstitution, setFilterInstitution] = useState([]);
  const [ganttZoom, setGanttZoom] = useState(1);
  const [ganttFullscreen, setGanttFullscreen] = useState(false);
  const [ganttProbFilter, setGanttProbFilter] = useState(['1-2', '3-4', '5-6', '7-9', '10']);
  const [showGanttFilter, setShowGanttFilter] = useState(false);
  const [selectedMonthDetails, setSelectedMonthDetails] = useState(null);
  const [showActiveTasksModal, setShowActiveTasksModal] = useState(false);

  const ganttProbGroups = [
    { id: '0', label: 'Başarısız (0)' },
    { id: '1-2', label: 'Çok Düşük (1-2)' },
    { id: '3-4', label: 'Düşük (3-4)' },
    { id: '5-6', label: 'Orta (5-6)' },
    { id: '7-9', label: 'Yüksek (7-9)' },
    { id: '10', label: 'Kesin (10)' }
  ];

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

  const filteredAndSortedOpps = useMemo(() => {
    let result = [...opportunities];

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(o => 
        (o.name || '').toLowerCase().includes(lower) || 
        (o.client_name || '').toLowerCase().includes(lower) ||
        (o.description || '').toLowerCase().includes(lower)
      );
    }

    if (filterProb.length > 0) {
      result = result.filter(o => {
        const p = parseInt(o.probability_rating) || 0;
        return filterProb.some(f => {
          if (f === 'certain') return p === 10;
          if (f === 'high') return p >= 7 && p <= 9;
          if (f === 'medium') return p >= 5 && p <= 6;
          if (f === 'low') return p >= 1 && p <= 4;
          if (f === 'failed') return p === 0;
          return false;
        });
      });
    }

    if (filterStatus.length > 0) {
      result = result.filter(o => filterStatus.includes(o.status || 'Aktif'));
    }

    if (filterInstitution.length > 0) {
      result = result.filter(o => filterInstitution.includes(o.institution || ''));
    }

    result.sort((a, b) => {
      let valA, valB;
      if (sortBy === 'application_date') {
        valA = new Date(a.application_date || 0).getTime();
        valB = new Date(b.application_date || 0).getTime();
      } else if (sortBy === 'focus') {
        valA = parseInt(a.focus_rating) || 0;
        valB = parseInt(b.focus_rating) || 0;
      } else if (sortBy === 'probability') {
        valA = parseInt(a.probability_rating) || 0;
        valB = parseInt(b.probability_rating) || 0;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [opportunities, searchTerm, filterProb, filterStatus, filterInstitution, sortBy, sortOrder]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [oppsData, ratesData] = await Promise.all([
        api.getOpportunities(),
        api.getExchangeRates().catch(() => ({ TRY: 1, USD: 35, EUR: 38 }))
      ]);
      setOpportunities(oppsData);
      setRates(ratesData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const convertAmount = (amount, fromCurr, toCurr, customRates) => {
    const activeRates = customRates || rates;
    const val = parseFloat(amount) || 0;
    const inTry = val * (activeRates[fromCurr] || 1);
    return inTry / (activeRates[toCurr] || 1);
  };

  const calculateRemaining = (opp) => {
    const totalPaymentsInOppCurr = (opp.payments || []).reduce((sum, p) => {
      let pRates = rates;
      if (p.exchange_rates) {
        pRates = typeof p.exchange_rates === 'string' ? JSON.parse(p.exchange_rates) : p.exchange_rates;
      }
      return sum + convertAmount(p.amount, p.currency, opp.currency, pRates);
    }, 0);
    const expected = parseFloat(opp.total_income) || 0;
    return Math.max(0, expected - totalPaymentsInOppCurr);
  };

  const getProbabilityColor = (rating) => {
    // 0 is red, 5 is yellow, 10 is green
    if (rating <= 3) return 'bg-red-500';
    if (rating <= 7) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusBadge = (status) => {
    const s = status || 'Aktif';
    switch (s) {
      case 'Aktif': return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Aktif</span>;
      case 'Pasif': return <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Pasif</span>;
      case 'Beklemede': return <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Beklemede</span>;
      case 'Tamamlandı': return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Tamamlandı</span>;
      case 'Arşiv': return <span className="bg-gray-700/50 text-gray-400 border border-gray-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Arşiv</span>;
      default: return <span className="bg-gray-800 text-gray-400 border border-gray-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">{status || 'Aktif'}</span>;
    }
  };

  const formatMoney = (amount, currency) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: currency || 'TRY' }).format(amount);
  };

  const getDashboardStats = useMemo(() => {
    const baseCurr = 'TRY';
    const probData = [
      { name: 'Başarısız (0)', count: 0, color: '#ef4444' }, // red
      { name: 'Çok Düşük (1-2)', count: 0, color: '#f97316' }, // orange
      { name: 'Düşük (3-4)', count: 0, color: '#eab308' }, // yellow
      { name: 'Orta (5-6)', count: 0, color: '#3b82f6' }, // blue
      { name: 'Yüksek (7-9)', count: 0, color: '#06b6d4' }, // cyan
      { name: 'Kesin (10)', count: 0, color: '#22c55e' } // green
    ];

    let totalActiveTodos = 0;
    let totalFocus = 0;
    let totalHighProbBudget = 0; // 7-9
    let totalCertainBudget = 0; // 10
    let totalCertainRemaining = 0; // 10
    let currentActiveFocusSum = 0;
    const paymentsByMonth = {};
    const activeTasksBreakdown = [];
    
    let totalAllTimeGrossBudget = 0;
    opportunities.forEach(opp => {
      const oppTotalIncomeInTry = convertAmount(opp.total_income, opp.currency, baseCurr);
      totalAllTimeGrossBudget += oppTotalIncomeInTry;
    });

    filteredAndSortedOpps.forEach(opp => {
      const p = parseInt(opp.probability_rating) || 0;
      if (p === 0) probData[0].count++;
      else if (p <= 2) probData[1].count++;
      else if (p <= 4) probData[2].count++;
      else if (p <= 6) probData[3].count++;
      else if (p <= 9) probData[4].count++;
      else if (p === 10) probData[5].count++;

      totalFocus += (parseInt(opp.focus_rating) || 0);

      if (opp.status === 'Aktif' && opp.application_date && opp.expected_end_date) {
        const s = new Date(opp.application_date).getTime();
        const e = new Date(opp.expected_end_date).getTime();
        const now = new Date().getTime();
        if (now >= s && now <= e) {
          currentActiveFocusSum += (parseInt(opp.focus_rating) || 0);
        }
      }

      const activeTodosCount = parseInt(opp.active_todos) || 0;
      totalActiveTodos += activeTodosCount;
      if (activeTodosCount > 0) {
        activeTasksBreakdown.push({
          id: opp.id,
          name: opp.name,
          count: activeTodosCount
        });
      }

      const oppTotalIncomeInTry = convertAmount(opp.total_income, opp.currency, baseCurr);
      const oppRemainingInTry = convertAmount(calculateRemaining(opp), opp.currency, baseCurr);

      if (p >= 7 && p <= 9) totalHighProbBudget += oppTotalIncomeInTry;
      if (p === 10) {
        totalCertainBudget += oppTotalIncomeInTry;
        totalCertainRemaining += oppRemainingInTry;
      }

      (opp.payments || []).forEach(payment => {
        const d = new Date(payment.payment_date);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        
        let pRates = rates;
        if (payment.exchange_rates) {
          pRates = typeof payment.exchange_rates === 'string' ? JSON.parse(payment.exchange_rates) : payment.exchange_rates;
        }
        const paymentInTry = convertAmount(payment.amount, payment.currency, baseCurr, pRates);

        if (!paymentsByMonth[monthKey]) paymentsByMonth[monthKey] = { total: 0, details: [] };
        paymentsByMonth[monthKey].total += paymentInTry;
        paymentsByMonth[monthKey].details.push({
          oppName: opp.name,
          amountInTry: paymentInTry,
          originalAmount: payment.amount,
          currency: payment.currency,
          date: payment.payment_date,
          notes: payment.notes
        });
      });
    });

    const timelineData = Object.keys(paymentsByMonth).sort().map(k => ({
      name: k,
      total: paymentsByMonth[k].total,
      details: paymentsByMonth[k].details
    }));

    const totalReceivedInTry = timelineData.reduce((sum, item) => sum + item.total, 0);
    const avgFocus = filteredAndSortedOpps.length ? (totalFocus / filteredAndSortedOpps.length).toFixed(1) : 0;

    // Gantt / Timeline Calculations
    const projectTimeline = [];
    let minDate = new Date();
    let maxDate = new Date();
    let hasTimelineData = false;

    filteredAndSortedOpps.forEach(opp => {
      if (opp.application_date || opp.expected_end_date) {
        hasTimelineData = true;
        const start = opp.application_date ? new Date(opp.application_date) : new Date(opp.expected_end_date);
        const end = opp.expected_end_date ? new Date(opp.expected_end_date) : new Date(opp.application_date);
        
        const p = parseInt(opp.probability_rating) || 0;
        let groupId = '0';
        if (p === 10) groupId = '10';
        else if (p >= 7) groupId = '7-9';
        else if (p >= 5) groupId = '5-6';
        else if (p >= 3) groupId = '3-4';
        else if (p >= 1) groupId = '1-2';

        if (ganttProbFilter.includes(groupId)) {
          if (start < minDate) minDate = new Date(start);
          if (end > maxDate) maxDate = new Date(end);

          projectTimeline.push({
            id: opp.id,
          name: opp.name,
          start: start,
          end: end,
          startStr: opp.application_date ? opp.application_date.split('T')[0] : null,
          endStr: opp.expected_end_date ? opp.expected_end_date.split('T')[0] : null,
          prob: parseInt(opp.probability_rating) || 0,
          status: opp.status || 'Aktif',
          colorClass: getProbabilityColor(parseInt(opp.probability_rating) || 0)
        });
        }
      }
    });

    const months = [];
    let todayPercent = null;
    if (hasTimelineData) {
      // Add 1 month buffer
      minDate = new Date(minDate.getFullYear(), minDate.getMonth() - 1, 1);
      maxDate = new Date(maxDate.getFullYear(), maxDate.getMonth() + 2, 0);
      
      const totalMs = maxDate - minDate;

      projectTimeline.forEach(pt => {
        pt.leftPercent = Math.max(((pt.start - minDate) / totalMs) * 100, 0);
        pt.widthPercent = Math.max(((pt.end - pt.start) / totalMs) * 100, 0.5); // minimum width for dots
      });

      let currentMonth = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
      while (currentMonth <= maxDate) {
        months.push({
          label: currentMonth.toLocaleString('tr-TR', { month: 'short', year: 'numeric' }),
          date: new Date(currentMonth),
          leftPercent: ((currentMonth - minDate) / totalMs) * 100
        });
        currentMonth.setMonth(currentMonth.getMonth() + 1);
      }

      const today = new Date();
      if (today >= minDate && today <= maxDate) {
        todayPercent = ((today - minDate) / totalMs) * 100;
      }
    }

    // Sort timeline by start date
    projectTimeline.sort((a, b) => a.start - b.start);

    // Calculate dynamic width based on number of months (e.g. 120px per month)
    const totalMonthsCount = months.length;
    const timelineMinWidth = Math.max(800, totalMonthsCount * 120) * ganttZoom;

    const now = new Date();
    const getPastMonthKeys = (monthsCount) => {
      const keys = [];
      for (let i = 0; i < monthsCount; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      }
      return keys;
    };

    const avg3 = getPastMonthKeys(3).reduce((sum, key) => sum + (paymentsByMonth[key]?.total || 0), 0) / 3;
    const avg6 = getPastMonthKeys(6).reduce((sum, key) => sum + (paymentsByMonth[key]?.total || 0), 0) / 6;
    const avg12 = getPastMonthKeys(12).reduce((sum, key) => sum + (paymentsByMonth[key]?.total || 0), 0) / 12;

    return { 
      probData, timelineData, totalReceivedInTry, totalHighProbBudget, totalCertainBudget, 
      totalCertainRemaining, totalActiveTodos, avgFocus, baseCurr, currentActiveFocusSum,
      projectTimeline, timelineMonths: months, todayPercent, timelineMinWidth, totalAllTimeGrossBudget,
      averages: { avg3, avg6, avg12 },
      activeTasksBreakdown
    };
  }, [filteredAndSortedOpps, opportunities, rates, ganttZoom, ganttProbFilter]);

  if (loading) {
    return <div className="text-white">Yükleniyor...</div>;
  }


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">İhtimal Listesi</h1>
          <p className="text-gray-400">Proje başvurularını, ihtimalleri ve süreçleri buradan takip edin.</p>
        </div>
        <button
          onClick={() => navigate('/admin/opportunities/new')}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Yeni İhtimal Ekle
        </button>
      </div>

      {/* DASHBOARD SECTION */}
      {opportunities.length > 0 && (
        <div className="mb-10 flex flex-col gap-6">
          {/* Top Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col shadow-lg relative overflow-visible">
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <svg className="w-16 h-16 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div className="flex items-center gap-1.5 z-10">
                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Toplam Tahsilat</span>
                <div className="relative group flex items-center">
                  <svg className="w-4 h-4 text-gray-600 hover:text-cyan-400 cursor-pointer transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2.5 bg-gray-800 border border-gray-700 text-xs text-gray-300 rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none text-center">
                    Arşivlenmiş veya pasif olanlar dahil, bugüne kadar sisteme girilmiş tüm projelerden alınan ödemelerin güncel kur ile {getDashboardStats.baseCurr} karşılığının toplamıdır.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                  </div>
                </div>
              </div>
              <span className="text-2xl font-black text-white mt-1 z-10">{formatMoney(getDashboardStats.totalReceivedInTry, getDashboardStats.baseCurr)}</span>
            </div>
            
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col shadow-lg relative overflow-visible">
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <svg className="w-16 h-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
              </div>
              <div className="flex items-center gap-1.5 z-10">
                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Kesinleşen Kalan</span>
                <div className="relative group flex items-center">
                  <svg className="w-4 h-4 text-gray-600 hover:text-green-400 cursor-pointer transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2.5 bg-gray-800 border border-gray-700 text-xs text-gray-300 rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none text-center">
                    İhtimal derecesi 10 (Kesin) olan projelerin toplam bütçesinden (KDV Hariç), bugüne kadar alınan tahsilatların çıkarılmasıyla elde edilen bekleyen aktif bakiye.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                  </div>
                </div>
              </div>
              <span className="text-2xl font-black text-green-400 mt-1 z-10">{formatMoney(getDashboardStats.totalCertainRemaining, getDashboardStats.baseCurr)}</span>
              <span className="text-xs text-gray-500 mt-1 z-10">Toplam Bütçe: {formatMoney(getDashboardStats.totalCertainBudget, getDashboardStats.baseCurr)}</span>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col shadow-lg relative overflow-visible">
              <div className="flex items-center gap-1.5 z-10">
                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Yüksek İhtimal (7-9)</span>
                <div className="relative group flex items-center">
                  <svg className="w-4 h-4 text-gray-600 hover:text-cyan-400 cursor-pointer transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2.5 bg-gray-800 border border-gray-700 text-xs text-gray-300 rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none text-center">
                    İhtimal derecesi 7, 8 veya 9 olarak seçilen, yüksek potansiyelli projelerin henüz kesinleşmese de güncel kur ile hesaplanan brüt bütçe beklentisidir.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                  </div>
                </div>
              </div>
              <span className="text-2xl font-black text-cyan-400 mt-1 z-10">{formatMoney(getDashboardStats.totalHighProbBudget, getDashboardStats.baseCurr)}</span>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col shadow-lg overflow-visible">
              <div className="flex justify-between items-center h-full">
                <div 
                  className="flex-1 cursor-pointer group/task hover:bg-gray-800/40 p-2 rounded-xl transition-colors -m-2"
                  onClick={() => setShowActiveTasksModal(true)}
                >
                  <div className="flex items-center gap-1.5 z-10">
                    <span className="text-xs text-gray-500 group-hover/task:text-gray-300 font-bold uppercase tracking-wider block transition-colors">Aktif Görevler</span>
                    <div className="relative group flex items-center">
                      <svg className="w-3.5 h-3.5 text-gray-600 hover:text-white cursor-pointer transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <div className="absolute z-50 bottom-full left-0 mb-2 w-48 p-2 bg-gray-800 border border-gray-700 text-[11px] text-gray-300 rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none text-left">
                        Aşağıdaki tabloda listelenen, durumu Pasif/Arşiv OLMAYAN projelerin içindeki henüz "Tamamlandı" olarak işaretlenmemiş olan aktif yapılacaklar sayısı.
                      </div>
                    </div>
                  </div>
                  <span className="text-2xl font-black text-white">{getDashboardStats.totalActiveTodos}</span>
                </div>
                <div className="text-right flex-1 border-l border-gray-800 pl-4 ml-4">
                  <div className="flex items-center justify-end gap-1.5 z-10">
                    <div className="relative group flex items-center">
                      <svg className="w-3.5 h-3.5 text-gray-600 hover:text-white cursor-pointer transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <div className="absolute z-50 bottom-full right-0 mb-2 w-48 p-2 bg-gray-800 border border-gray-700 text-[11px] text-gray-300 rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none text-right">
                        Durumu "Aktif" olan ve tarih aralığı "bugün"ü kapsayan projelerin toplam odak (efor) puanıdır. Ekibin anlık olarak ne kadar dolu olduğunu gösterir. Toplam kapasite 10 olarak kabul edilir.
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block">Anlık Kapasite</span>
                  </div>
                  <div className="flex flex-col items-end mt-1">
                    <span className={`text-2xl font-black ${getDashboardStats.currentActiveFocusSum > 10 ? 'text-red-400' : 'text-white'}`}>
                      {getDashboardStats.currentActiveFocusSum} <span className="text-sm text-gray-500">/ 10</span>
                    </span>
                    <span className="text-[10px] text-gray-500 mt-0.5">
                      {getDashboardStats.currentActiveFocusSum > 10 
                        ? `Kapasite ${getDashboardStats.currentActiveFocusSum - 10} puan aşıldı!` 
                        : `${10 - getDashboardStats.currentActiveFocusSum} boş odak noktası`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* All-Time Budget Note */}
          <div className="flex justify-end mb-4">
            <div className="text-[10px] text-gray-500/70 italic bg-gray-800/30 px-3 py-1.5 rounded-lg border border-gray-800/50">
              Sisteme girilmiş tüm projelerin (arşiv ve pasifler dahil) brüt bütçe hacmi: <span className="font-semibold text-gray-400/80">{formatMoney(getDashboardStats.totalAllTimeGrossBudget, getDashboardStats.baseCurr)}</span>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Probability Distribution */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6">İhtimal (Olasılık) Dağılımı</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getDashboardStats.probData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                    <RechartsTooltip 
                      cursor={{ fill: '#374151', opacity: 0.4 }}
                      contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '0.5rem', color: '#fff' }}
                      itemStyle={{ color: '#e5e7eb' }}
                      formatter={(value) => [value, 'Proje Sayısı']}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {getDashboardStats.probData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6">Aylık Tahsilat Hacmi</h3>
              <div className="h-64">
                {getDashboardStats.timelineData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart 
                      data={getDashboardStats.timelineData} 
                      margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                      onClick={(e) => {
                        if (e && e.activePayload && e.activePayload.length > 0) {
                          setSelectedMonthDetails(e.activePayload[0].payload);
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `₺${(val/1000).toFixed(0)}k`} />
                      <RechartsTooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-gray-800 border border-gray-700 p-4 rounded-xl shadow-xl z-50">
                                <p className="font-bold text-white mb-1">{label}</p>
                                <p className="text-cyan-400 font-medium mb-3">Tahsilat: {formatMoney(data.total, getDashboardStats.baseCurr)}</p>
                                {data.details && data.details.length > 0 && (
                                  <div className="space-y-2 border-t border-gray-700 pt-3">
                                    {data.details.map((d, i) => (
                                      <div key={i} className="text-xs flex flex-col gap-0.5">
                                        <span className="text-gray-400 font-semibold">{d.oppName}</span>
                                        <div className="flex items-center justify-between gap-4">
                                          <span className="text-gray-500">{new Date(d.date).toLocaleDateString('tr-TR')}</span>
                                          <span className="text-white font-medium">
                                            {formatMoney(d.originalAmount, d.currency)}
                                            {d.currency !== getDashboardStats.baseCurr && ` (${formatMoney(d.amountInTry, getDashboardStats.baseCurr)})`}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area type="monotone" dataKey="total" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-600 text-sm">Henüz tahsilat verisi yok</div>
                )}
              </div>

              {/* Averages */}
              {getDashboardStats.timelineData.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-4 justify-between border-t border-gray-800 pt-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Son 3 Ay Ort.</span>
                    <span className="text-sm font-bold text-gray-200">{formatMoney(getDashboardStats.averages.avg3, getDashboardStats.baseCurr)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Son 6 Ay Ort.</span>
                    <span className="text-sm font-bold text-cyan-400/80">{formatMoney(getDashboardStats.averages.avg6, getDashboardStats.baseCurr)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Son 12 Ay Ort.</span>
                    <span className="text-sm font-bold text-cyan-500">{formatMoney(getDashboardStats.averages.avg12, getDashboardStats.baseCurr)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Gantt Timeline Row */}
          <div className={ganttFullscreen ? 'fixed inset-0 z-[100] bg-gray-950 p-4 sm:p-10 flex flex-col overflow-x-auto overflow-y-hidden' : 'mt-6 bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg overflow-x-auto relative block custom-scrollbar'}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sticky left-0 z-[60]">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Proje Zaman Çizelgesi (Gantt)</h3>
              <div className="flex items-center gap-3 relative">
                
                {/* Gantt Filter Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setShowGanttFilter(!showGanttFilter)} 
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition text-xs font-semibold ${showGanttFilter || ganttProbFilter.length < 6 ? 'bg-cyan-900/50 text-cyan-400 border-cyan-800' : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white hover:bg-gray-700'}`}
                    title="İhtimal Filtresi"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                    Filtre ({ganttProbFilter.length})
                  </button>
                  
                  {showGanttFilter && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 p-2 overflow-hidden flex flex-col gap-1">
                      <div className="text-[10px] text-gray-500 font-bold uppercase px-2 py-1 mb-1 border-b border-gray-700">İhtimal Grupları</div>
                      {ganttProbGroups.map(group => (
                        <label key={group.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-700/50 rounded cursor-pointer text-sm text-gray-300">
                          <input 
                            type="checkbox" 
                            className="w-3.5 h-3.5 bg-gray-900 border-gray-600 rounded text-cyan-500 focus:ring-cyan-500/20"
                            checked={ganttProbFilter.includes(group.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setGanttProbFilter([...ganttProbFilter, group.id]);
                              } else {
                                setGanttProbFilter(ganttProbFilter.filter(id => id !== group.id));
                              }
                            }}
                          />
                          {group.label}
                        </label>
                      ))}
                      <div className="flex justify-between items-center mt-2 px-1 pt-2 border-t border-gray-700">
                        <button onClick={() => setGanttProbFilter([])} className="text-[10px] text-gray-400 hover:text-white transition">Temizle</button>
                        <button onClick={() => setGanttProbFilter(ganttProbGroups.map(g=>g.id))} className="text-[10px] text-cyan-500 hover:text-cyan-400 transition">Tümü</button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center bg-gray-800 rounded-lg p-1 border border-gray-700">
                  <button onClick={() => setGanttZoom(z => Math.max(0.1, z - 0.1))} className="px-2 py-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition" title="Uzaklaştır">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                  </button>
                  <div className="text-[11px] font-bold text-cyan-400 px-2 min-w-[50px] text-center">%{(ganttZoom * 100).toFixed(0)}</div>
                  <button onClick={() => setGanttZoom(z => Math.min(4, z + 0.1))} className="px-2 py-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition" title="Yakınlaştır">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  </button>
                  <button onClick={() => setGanttZoom(1)} className="px-2 py-1 text-gray-500 hover:text-white hover:bg-gray-700 rounded border-l border-gray-700 ml-1 transition text-xs font-bold" title="Sıfırla">
                    1x
                  </button>
                </div>
                <button onClick={() => setGanttFullscreen(!ganttFullscreen)} className="p-2 bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg border border-gray-700 transition" title={ganttFullscreen ? 'Tam Ekrandan Çık' : 'Tam Ekran Yap'}>
                  {ganttFullscreen ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h4V4m0 4l-5-5m15 5h-4V4m0 4l5-5M4 16h4v4m0-4l-5 5m15-5h-4v4m0-4l5 5" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                  )}
                </button>
              </div>
            </div>
            
            {getDashboardStats.projectTimeline && getDashboardStats.projectTimeline.length > 0 ? (
              <div className={`mt-8 flex flex-col ${ganttFullscreen ? 'flex-1 min-h-0' : ''}`} style={{ minWidth: `${getDashboardStats.timelineMinWidth}px` }}>
                {/* Months Header */}
                <div className="relative h-6 w-full">
                  {getDashboardStats.timelineMonths.map((m, i) => (
                    <div 
                      key={i} 
                      className="absolute bottom-1 text-xs text-gray-500 font-medium w-max"
                      style={{ left: `calc(${m.leftPercent}% - 16px)` }}
                    >
                      {m.label}
                    </div>
                  ))}
                  
                  {/* Today Header Marker */}
                  {getDashboardStats.todayPercent !== null && (
                    <div 
                      className="absolute bottom-1 text-[10px] text-cyan-400 font-bold bg-gray-900 px-1 rounded z-20 shadow-md border border-cyan-500/30"
                      style={{ left: `calc(${getDashboardStats.todayPercent}% - 18px)` }}
                      title="Bugün"
                    >
                      Bugün
                    </div>
                  )}
                </div>

                {/* Scrollable Container */}
                <div className={(ganttFullscreen ? 'flex-1 ' : 'max-h-[400px] ') + "overflow-y-auto custom-scrollbar border-t border-gray-800 relative"}>
                  <div className="relative min-h-full pb-4">
                    {/* Grid Lines */}
                    <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none">
                      {getDashboardStats.timelineMonths.map((m, i) => (
                        <div 
                          key={i} 
                          className="absolute top-0 bottom-0 border-l border-gray-800/50"
                          style={{ left: `${m.leftPercent}%` }}
                        />
                      ))}
                    </div>

                    {/* Today Vertical Line */}
                    {getDashboardStats.todayPercent !== null && (
                      <div 
                        className="absolute top-0 bottom-0 border-l-2 border-dashed border-cyan-500/40 z-10 pointer-events-none"
                        style={{ left: `${getDashboardStats.todayPercent}%` }}
                      />
                    )}

                    {/* Projects */}
                    <div className="relative z-10 flex flex-col gap-6 pt-6 pb-2">
                      {getDashboardStats.projectTimeline.map((pt) => (
                        <div key={pt.id} className="relative h-6 group">
                          {/* Name Label */}
                          <div 
                            className="absolute -top-5 text-[10px] font-bold text-gray-300 w-max max-w-xs truncate z-20 pointer-events-none drop-shadow-md"
                            style={{ left: `${pt.leftPercent}%` }}
                          >
                            {pt.name}
                          </div>
                          
                          {/* Gantt Bar */}
                          <div 
                            className={`absolute top-1/2 -translate-y-1/2 h-4 rounded-full ${pt.colorClass} shadow-[0_0_10px_rgba(0,0,0,0.5)] cursor-pointer transition-all hover:brightness-125`}
                            style={{ 
                              left: `${pt.leftPercent}%`, 
                              width: `${pt.widthPercent}%`,
                              minWidth: '16px'
                            }}
                            title={`${pt.name}\nBaşvuru: ${pt.startStr ? new Date(pt.start).toLocaleDateString('tr-TR') : 'Belirsiz'}\nBitiş: ${pt.endStr ? new Date(pt.end).toLocaleDateString('tr-TR') : 'Belirsiz'}`}
                          >
                            {/* Start/End indicators */}
                            {pt.startStr && <div className="absolute left-[2px] top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-sm" />}
                            {pt.endStr && pt.endStr !== pt.startStr && <div className="absolute right-[2px] top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-sm" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-gray-600 text-sm">Zaman çizelgesi için tarih verisi bulunamadı. Lütfen projelere başvuru veya bitiş tarihi ekleyin.</div>
            )}
          </div>
        </div>
      )}

      {opportunities.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6 flex flex-col gap-4 shadow-lg">
          <div className="w-full relative">
            <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              placeholder="İhtimal adı, firma veya detaylarda ara..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-1 focus:border-transparent focus:ring-cyan-500 shadow-inner"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:flex md:flex-wrap gap-3 w-full">
            <MultiSelectFilter 
              placeholder="Tüm İhtimaller"
              value={filterProb}
              onChange={setFilterProb}
              options={[
                { value: 'certain', label: 'Kesin (10)' },
                { value: 'high', label: 'Yüksek (7-9)' },
                { value: 'medium', label: 'Orta (5-6)' },
                { value: 'low', label: 'Düşük (1-4)' },
                { value: 'failed', label: 'Başarısız (0)' }
              ]}
            />

            <MultiSelectFilter 
              placeholder="Tüm Durumlar"
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { value: 'Aktif', label: 'Aktif Projeler' },
                { value: 'Pasif', label: 'Pasif Projeler' },
                { value: 'Beklemede', label: 'Beklemede' },
                { value: 'Tamamlandı', label: 'Tamamlananlar' },
                { value: 'Arşiv', label: 'Arşivlenenler' }
              ]}
            />

            <MultiSelectFilter 
              placeholder="Tüm Kurumlar"
              value={filterInstitution}
              onChange={setFilterInstitution}
              options={institutionOptions.map(o => ({ value: o.value, label: o.label }))}
            />

            <div className="ml-auto flex w-full md:w-auto">
              <SingleSelectFilter 
                placeholder="Sıralama"
                value={sortBy}
                onChange={setSortBy}
                options={[
                  { value: 'application_date', label: 'Başvuru Tarihi' },
                  { value: 'probability', label: 'Olasılık' },
                  { value: 'focus', label: 'Odak Seviyesi' }
                ]}
                iconTitle={sortOrder === 'asc' ? 'Artan' : 'Azalan'}
                onIconClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {sortOrder === 'asc' 
                      ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                      : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                    }
                  </svg>
                }
              />
            </div>
          </div>
        </div>
      )}

      {filteredAndSortedOpps.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center">
          <p className="text-gray-400 mb-4">Arama kriterlerine uygun ihtimal bulunamadı.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedOpps.map(opp => (
            <Link
              key={opp.id}
              to={`/admin/opportunities/${opp.id}`}
              className="bg-gray-900 border border-gray-800 hover:border-cyan-500/50 rounded-xl p-6 transition-all group block relative overflow-hidden"
            >
              {/* Probability Indicator Line */}
              <div className={`absolute top-0 left-0 w-full h-1 ${getProbabilityColor(opp.probability_rating)}`} />
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const activeInst = institutionOptions.find(i => i.value === opp.institution);
                      if (activeInst) {
                        return (
                          <div className="flex items-center justify-center bg-white border border-gray-200 rounded-lg p-1.5 w-10 h-10 shadow-sm" title={activeInst.label}>
                            {activeInst.logo ? (
                              <img src={activeInst.logo} alt={activeInst.label} className="w-full h-full object-contain" />
                            ) : (
                              activeInst.icon
                            )}
                          </div>
                        );
                      }
                      return null;
                    })()}
                    {getStatusBadge(opp.status)}
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-2">
                    {opp.name}
                  </h3>
                </div>
                {opp.active_todos > 0 && (
                  <span className="flex-shrink-0 bg-gray-800 text-cyan-400 text-xs font-bold px-2 py-1 rounded-md border border-gray-700 whitespace-nowrap ml-2">
                    {opp.active_todos} Görev
                  </span>
                )}
              </div>
              
              <p className="text-sm text-gray-400 line-clamp-2 mb-4 h-10">
                {opp.description || 'Açıklama yok...'}
              </p>

              {(opp.application_date || opp.expected_end_date) && (
                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-800/50">
                  {opp.application_date && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <span className="text-xs text-gray-400">{new Date(opp.application_date).toLocaleDateString('tr-TR')}</span>
                    </div>
                  )}
                  {opp.expected_end_date && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-cyan-600/70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span className="text-xs text-cyan-500/70">{new Date(opp.expected_end_date).toLocaleDateString('tr-TR')}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Olma Olasılığı</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{opp.probability_rating}/10</span>
                    <div className="w-16 h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getProbabilityColor(opp.probability_rating)}`} 
                        style={{ width: `${opp.probability_rating * 10}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Odak Seviyesi</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{opp.focus_rating}/10</span>
                    <div className="w-16 h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-cyan-500" 
                        style={{ width: `${opp.focus_rating * 10}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm pt-3 border-t border-gray-800">
                  <span className="text-gray-500">Olası Kazanç</span>
                  <span className="text-white font-bold">{formatMoney(opp.total_income, opp.currency)}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm pt-2">
                  <span className="text-gray-500">Kalan Ödeme</span>
                  <span className="text-cyan-400 font-bold text-lg">{formatMoney(calculateRemaining(opp), opp.currency)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Selected Month Details Modal */}
      {selectedMonthDetails && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedMonthDetails.name} Tahsilat Detayları</h3>
                <p className="text-sm text-cyan-400 font-medium mt-1">
                  Toplam: {formatMoney(selectedMonthDetails.total, getDashboardStats.baseCurr)}
                </p>
              </div>
              <button 
                onClick={() => setSelectedMonthDetails(null)} 
                className="p-2 text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="overflow-y-auto custom-scrollbar flex-1 -mx-2 px-2">
              {selectedMonthDetails.details && selectedMonthDetails.details.length > 0 ? (
                <div className="space-y-4">
                  {selectedMonthDetails.details.map((d, idx) => (
                    <div key={idx} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                      <h4 className="text-white font-bold mb-2">{d.oppName}</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                        <div>
                          <span className="text-gray-500 block text-xs mb-0.5">Tutar</span>
                          <span className="text-gray-200 font-medium">{formatMoney(d.originalAmount, d.currency)}</span>
                          {d.currency !== getDashboardStats.baseCurr && (
                            <span className="text-gray-500 text-xs ml-1">
                              ({formatMoney(d.amountInTry, getDashboardStats.baseCurr)})
                            </span>
                          )}
                        </div>
                        <div>
                          <span className="text-gray-500 block text-xs mb-0.5">Tarih</span>
                          <span className="text-gray-200">{new Date(d.date).toLocaleDateString('tr-TR')}</span>
                        </div>
                      </div>
                      {d.notes && (
                        <div className="text-sm mt-3 pt-3 border-t border-gray-700/50">
                          <span className="text-gray-500 block text-xs mb-0.5">Not</span>
                          <p className="text-gray-300">{d.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">Bu ay için detaylı işlem bulunamadı.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Active Tasks Modal */}
      {showActiveTasksModal && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">Aktif Görev Dağılımı</h3>
                <p className="text-sm text-cyan-400 font-medium mt-1">
                  Toplam: {getDashboardStats.totalActiveTodos} Görev
                </p>
              </div>
              <button 
                onClick={() => setShowActiveTasksModal(false)} 
                className="p-2 text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="overflow-y-auto custom-scrollbar flex-1 -mx-2 px-2">
              {getDashboardStats.activeTasksBreakdown && getDashboardStats.activeTasksBreakdown.length > 0 ? (
                <div className="space-y-3">
                  {getDashboardStats.activeTasksBreakdown.map((item, index) => (
                    <Link
                      key={item.id}
                      to={`/admin/opportunities/${item.id}`}
                      className="flex items-center justify-between p-4 bg-gray-800/50 hover:bg-gray-800 rounded-xl border border-gray-700/50 hover:border-cyan-500/50 transition-all group"
                      onClick={() => setShowActiveTasksModal(false)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </div>
                        <span className="font-medium text-gray-200 group-hover:text-cyan-400 transition-colors">{item.name}</span>
                      </div>
                      <span className="bg-gray-900 px-3 py-1 rounded-lg text-sm font-bold text-white border border-gray-700 shadow-inner whitespace-nowrap">
                        {item.count} Görev
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">Aktif görev bulunamadı.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
