import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';

export default function OpportunitiesList() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.getOpportunities();
      setOpportunities(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getProbabilityColor = (rating) => {
    // 0 is red, 5 is yellow, 10 is green
    if (rating <= 3) return 'bg-red-500';
    if (rating <= 7) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatMoney = (amount, currency) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: currency || 'TRY' }).format(amount);
  };

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

      {opportunities.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center">
          <p className="text-gray-400 mb-4">Henüz hiç ihtimal/başvuru eklenmemiş.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {opportunities.map(opp => (
            <Link
              key={opp.id}
              to={`/admin/opportunities/\${opp.id}`}
              className="bg-gray-900 border border-gray-800 hover:border-cyan-500/50 rounded-xl p-6 transition-all group block relative overflow-hidden"
            >
              {/* Probability Indicator Line */}
              <div className={`absolute top-0 left-0 w-full h-1 \${getProbabilityColor(opp.probability_rating)}`} />
              
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-2">
                  {opp.name}
                </h3>
              </div>
              
              <p className="text-sm text-gray-400 line-clamp-2 mb-6 h-10">
                {opp.description || 'Açıklama yok...'}
              </p>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Olma Olasılığı</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{opp.probability_rating}/10</span>
                    <div className="w-16 h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full \${getProbabilityColor(opp.probability_rating)}`} 
                        style={{ width: `\${opp.probability_rating * 10}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Odak Seviyesi</span>
                  <span className="text-white font-medium">{opp.focus_rating}/10</span>
                </div>

                <div className="flex justify-between items-center text-sm pt-3 border-t border-gray-800">
                  <span className="text-gray-500">Olası Kazanç</span>
                  <span className="text-cyan-400 font-bold text-lg">{formatMoney(opp.total_income, opp.currency)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
