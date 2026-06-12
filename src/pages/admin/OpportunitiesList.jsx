import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { api } from '../../lib/api';

export default function OpportunitiesList() {
  const [opportunities, setOpportunities] = useState([]);
  const [rates, setRates] = useState({ TRY: 1, USD: 35, EUR: 38 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('application_date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterProb, setFilterProb] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterInstitution, setFilterInstitution] = useState('all');

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

    if (filterProb !== 'all') {
      result = result.filter(o => {
        const p = parseInt(o.probability_rating) || 0;
        if (filterProb === 'certain') return p === 10;
        if (filterProb === 'high') return p >= 7 && p <= 9;
        if (filterProb === 'medium') return p >= 5 && p <= 6;
        if (filterProb === 'low') return p >= 1 && p <= 4;
        if (filterProb === 'failed') return p === 0;
        return true;
      });
    }

    if (filterStatus !== 'all') {
      result = result.filter(o => (o.status || 'Aktif') === filterStatus);
    }

    if (filterInstitution !== 'all') {
      result = result.filter(o => (o.institution || '') === filterInstitution);
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
    const paymentsByMonth = {};
    
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

      const todos = opp.todos || [];
      totalActiveTodos += todos.filter(t => !t.is_completed).length;

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

        if (!paymentsByMonth[monthKey]) paymentsByMonth[monthKey] = 0;
        paymentsByMonth[monthKey] += paymentInTry;
      });
    });

    const timelineData = Object.keys(paymentsByMonth).sort().map(k => ({
      name: k,
      total: paymentsByMonth[k]
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
    const timelineMinWidth = Math.max(800, totalMonthsCount * 120);

    return { 
      probData, timelineData, totalReceivedInTry, totalHighProbBudget, totalCertainBudget, 
      totalCertainRemaining, totalActiveTodos, avgFocus, baseCurr, 
      projectTimeline, timelineMonths: months, todayPercent, timelineMinWidth, totalAllTimeGrossBudget
    };
  }, [filteredAndSortedOpps, opportunities, rates]);

  if (loading) {
    return <div className="text-white">Yükleniyor...</div>;
  }


  return (
    <div className="max-w-7xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Hibe & Teşvik Takibi</h1>
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
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <svg className="w-16 h-16 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Toplam Tahsilat (Tüm Zamanlar)</span>
              <span className="text-2xl font-black text-white mt-1">{formatMoney(getDashboardStats.totalReceivedInTry, getDashboardStats.baseCurr)}</span>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <svg className="w-16 h-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
              </div>
              <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Kesinleşenler Kalan Bütçe</span>
              <span className="text-2xl font-black text-green-400 mt-1">{formatMoney(getDashboardStats.totalCertainRemaining, getDashboardStats.baseCurr)}</span>
              <span className="text-xs text-gray-500 mt-1">Toplam Bütçe: {formatMoney(getDashboardStats.totalCertainBudget, getDashboardStats.baseCurr)}</span>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col shadow-lg relative overflow-hidden">
              <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Yüksek İhtimal (7-9) Toplamı</span>
              <span className="text-2xl font-black text-cyan-400 mt-1">{formatMoney(getDashboardStats.totalHighProbBudget, getDashboardStats.baseCurr)}</span>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col shadow-lg">
              <div className="flex justify-between items-center h-full">
                <div>
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block">Aktif Görevler</span>
                  <span className="text-2xl font-black text-white">{getDashboardStats.totalActiveTodos}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block">Ort. Odak</span>
                  <span className="text-2xl font-black text-white">{getDashboardStats.avgFocus} <span className="text-sm text-gray-500">/ 10</span></span>
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
                    <AreaChart data={getDashboardStats.timelineData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `₺${(val/1000).toFixed(0)}k`} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '0.5rem', color: '#fff' }}
                        itemStyle={{ color: '#e5e7eb' }}
                        formatter={(value) => [formatMoney(value, getDashboardStats.baseCurr), 'Tahsilat']}
                      />
                      <Area type="monotone" dataKey="total" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-600 text-sm">Henüz tahsilat verisi yok</div>
                )}
              </div>
            </div>
          </div>

          {/* Gantt Timeline Row */}
          <div className="mt-6 bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-lg overflow-x-auto relative hidden md:block custom-scrollbar">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6">Proje Zaman Çizelgesi (Gantt)</h3>
            {getDashboardStats.projectTimeline && getDashboardStats.projectTimeline.length > 0 ? (
              <div className="mt-8 flex flex-col" style={{ minWidth: `${getDashboardStats.timelineMinWidth}px` }}>
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
                <div className="max-h-[400px] overflow-y-auto custom-scrollbar border-t border-gray-800 relative">
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
                            className="absolute -top-5 text-[10px] font-bold text-gray-300 w-max max-w-xs truncate opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none drop-shadow-md"
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
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6 flex flex-col lg:flex-row gap-4 items-center justify-between shadow-lg">
          <div className="flex-1 w-full relative">
            <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              placeholder="İhtimal adı, firma veya detaylarda ara..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-1 focus:border-transparent focus:ring-cyan-500 shadow-inner"
            />
          </div>
          <div className="flex flex-wrap gap-4 w-full lg:w-auto">
            <select 
              value={filterProb} 
              onChange={(e) => setFilterProb(e.target.value)}
              className="bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="all">Tüm İhtimaller</option>
              <option value="certain">Kesin (10)</option>
              <option value="high">Yüksek (7-9)</option>
              <option value="medium">Orta (5-6)</option>
              <option value="low">Düşük/Çok Düşük (1-4)</option>
              <option value="failed">Başarısız (0)</option>
            </select>

            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="Aktif">Aktif Projeler</option>
              <option value="Pasif">Pasif Projeler</option>
              <option value="Beklemede">Beklemede Olanlar</option>
              <option value="Tamamlandı">Tamamlananlar</option>
              <option value="Arşiv">Arşivlenenler</option>
            </select>

            <select 
              value={filterInstitution} 
              onChange={(e) => setFilterInstitution(e.target.value)}
              className="bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="all">Tüm Kurumlar</option>
              {institutionOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="application_date">Başvuru Tarihine Göre</option>
              <option value="probability">Olma Olasılığına Göre</option>
              <option value="focus">Odak Seviyesine Göre</option>
            </select>

            <button 
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="bg-gray-800 border border-gray-700 hover:border-cyan-500 rounded-lg p-2 text-gray-400 hover:text-cyan-400 transition-colors"
              title={sortOrder === 'asc' ? 'Artan' : 'Azalan'}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {sortOrder === 'asc' 
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                }
              </svg>
            </button>
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
    </div>
  );
}
