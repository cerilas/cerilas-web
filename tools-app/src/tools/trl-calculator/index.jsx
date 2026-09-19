import React, { useState, useMemo, useCallback } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  ArrowDown,
  Sparkles,
  RotateCcw,
  HelpCircle,
  Layers,
  Bookmark,
  GitCommit,
  Compass,
  Award,
  Copy,
  Download,
  Check,
  Users,
  Activity,
  FlaskConical,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { trlCalculatorManifest } from './manifest';
import {
  TRL_FRAMEWORKS,
  TRL_LEVELS,
  ASSESSMENT_QUESTIONS,
  PRESET_PROJECTS,
  calculateTrlAssessment
} from './trlEngine';
import { useToolAnalytics } from '../../hooks/useToolAnalytics';
import { Badge, ToolHeader } from '../../components/ui';
import ToolSeoDivider from '../../components/ui/ToolSeoDivider';
import TrlCalculatorSeo from './components/TrlCalculatorSeo';
import './trl-calculator.css';

// 5 Chronological R&D Phases grouping for questionnaire
const PHASES = [
  { id: 'phase-1', name: 'Aşama 1: Temel Bilimsel İlkeler', en: 'Phase 1: Basic Principles & Concept', trlRange: 'TRL 1 – 2' },
  { id: 'phase-2', name: 'Aşama 2: Laboratuvar Doğrulama & PoC', en: 'Phase 2: Laboratory Validation & Breadboards', trlRange: 'TRL 3 – 4' },
  { id: 'phase-3', name: 'Aşama 3: İlgili Ortamda Test & Prototip', en: 'Phase 3: Relevant Environment Testing', trlRange: 'TRL 5 – 6' },
  { id: 'phase-4', name: 'Aşama 4: Operasyonel Ortamda Kalifikasyon', en: 'Phase 4: Operational Field Qualification', trlRange: 'TRL 7 – 8' },
  { id: 'phase-5', name: 'Aşama 5: Ticari ve Görev Kanıtlı Dağıtım', en: 'Phase 5: Mission Proven & Commercial Scale', trlRange: 'TRL 9' }
];

export default function TrlCalculator({ onBack, toolMeta }) {
  const {
    trackUse,
    trackDownload,
    trackCopy,
    visitorCount,
    conversionCount,
    getConversionLabel
  } = useToolAnalytics(trlCalculatorManifest.slug, toolMeta);

  const [projectName, setProjectName] = useState('Ar-Ge Projem');
  const [selectedFramework, setSelectedFramework] = useState('horizon-europe');
  const [viewMode, setViewMode] = useState('questionnaire'); // 'questionnaire' | 'matrix' | 'roadmap' | 'grants'
  const [copied, setCopied] = useState(false);

  // Answers map: { [questionId]: 0 | 1 | 2 } - default to empty to prompt user to answer!
  const [answers, setAnswers] = useState({});

  // Count answered questions
  const totalQuestions = ASSESSMENT_QUESTIONS.length;
  const answeredCount = useMemo(() => {
    return Object.keys(answers).filter(
      (k) => answers[k] !== undefined && answers[k] !== null
    ).length;
  }, [answers]);

  const answeredPercent = Math.round((answeredCount / totalQuestions) * 100);

  // Calculate assessment
  const assessment = useMemo(() => {
    return calculateTrlAssessment(answers, selectedFramework);
  }, [answers, selectedFramework]);

  // Current level data
  const currentLevelData = useMemo(() => {
    const lvl = Math.max(1, assessment.strictTrl);
    return TRL_LEVELS.find((l) => l.level === lvl) || TRL_LEVELS[0];
  }, [assessment.strictTrl]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value
    }));
    trackUse?.({ action: 'answer_question', questionId, value });
  };

  const loadPreset = useCallback((preset) => {
    setSelectedFramework(preset.framework);
    setAnswers(preset.answers);
    setProjectName(preset.name);
    trackUse?.({ action: 'load_preset', presetId: preset.id });
  }, [trackUse]);

  const handleReset = () => {
    setAnswers({});
    setProjectName('Ar-Ge Projem');
    trackUse?.({ action: 'reset' });
  };

  const handleScrollToQuestions = () => {
    setViewMode('questionnaire');
    setTimeout(() => {
      const firstUnanswered = document.querySelector('.trl-q-card.is-unanswered') || document.querySelector('.trl-questions-workspace');
      if (firstUnanswered) {
        firstUnanswered.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  // Copy Executive Markdown Summary
  const handleCopyReport = () => {
    const report = `# Teknoloji Hazırlık Seviyesi (TRL) Değerlendirme Raporu
**Proje Adı:** ${projectName}
**Standart Çerçeve:** ${assessment.activeFramework.name} (${assessment.activeFramework.badge})
**Değerlendirme Tarihi:** ${new Date().toLocaleDateString('tr-TR')}
**Cevaplanan Teşhis Sorusu:** ${answeredCount} / ${totalQuestions} (%${answeredPercent})

## Yönetici Özeti
- **Kesin Doğrulanmış TRL Seviyesi:** TRL ${answeredCount === 0 ? '0 (Değerlendirme Yapılmadı)' : assessment.strictTrl} (${currentLevelData.title})
- **Genel Teknolojik Olgunluk Skoru:** %${assessment.overallReadiness}
- **Sonraki Hedefe (TRL ${assessment.nextLevel}) İlerleme:** %${assessment.nextLevelProgress}
- **Mevcut Aşama:** ${currentLevelData.phase}

## Tamamlanan Temel Çıktılar
${currentLevelData.deliverables.map((d) => `- [x] ${d}`).join('\n')}

## TRL ${assessment.nextLevel} Seviyesine Geçiş İçin Kritik Eksiklikler (${assessment.gaps.length} Madde)
${assessment.gaps.length === 0 ? '- Kritik bir eksik bulunmuyor. Bir sonraki aşamaya hazırsınız.' : assessment.gaps.map((g) => `- [ ] ${g.actionRequired}`).join('\n')}

## Eşleşen Hibe ve Fon Destekleri (${assessment.eligibleGrants.length} Çağrı)
${assessment.eligibleGrants.map((gr) => `- **${gr.name}** (${gr.provider}) - ${gr.grantType} [Bütçe: ${gr.budget}]`).join('\n')}

---
*Cerilas TRL Calculator ile değerlendirildi (https://tools.cerilas.com/#/tool/trl-calculator)*
`;

    navigator.clipboard.writeText(report);
    setCopied(true);
    trackCopy?.({ format: 'markdown' });
    setTimeout(() => setCopied(false), 2000);
  };

  // Export JSON Report
  const handleExportJson = () => {
    const jsonReport = {
      evaluatedAt: new Date().toISOString(),
      projectName,
      framework: assessment.activeFramework,
      answeredQuestionsCount: answeredCount,
      totalQuestionsCount: totalQuestions,
      strictTrl: assessment.strictTrl,
      nextLevel: assessment.nextLevel,
      nextLevelProgress: assessment.nextLevelProgress,
      overallReadiness: assessment.overallReadiness,
      levelDetails: currentLevelData,
      gaps: assessment.gaps,
      eligibleGrants: assessment.eligibleGrants,
      answers
    };

    const blob = new Blob([JSON.stringify(jsonReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trl-raporu-${projectName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    trackDownload?.({ format: 'json' });
  };

  return (
    <div className="c-tool-page-container trl-root">
      {/* Cerilas Standardized ToolHeader */}
      <ToolHeader
        title={trlCalculatorManifest.title}
        subtitle={trlCalculatorManifest.shortDescription}
        onBack={onBack}
        slug={trlCalculatorManifest.slug}
        badges={
          <>
            {visitorCount > 0 && (
              <Badge variant="blue" icon={<Users size={12} strokeWidth={2} />}>
                {visitorCount.toLocaleString()} visitors
              </Badge>
            )}
            {conversionCount > 0 && (
              <Badge variant="brand" icon={<Activity size={12} strokeWidth={2} />}>
                {conversionCount.toLocaleString()} {getConversionLabel()}
              </Badge>
            )}
            <Badge variant="neutral" icon={<FlaskConical size={12} strokeWidth={2} />}>
              Ar-Ge & Hibe
            </Badge>
            <Badge variant="success" icon={<ShieldCheck size={12} strokeWidth={2} />}>
              %100 İstemci Taraflı Gizlilik
            </Badge>
          </>
        }
      />

      {/* Target Framework & Presets Selector Card */}
      <div className="trl-top-card">
        <div className="trl-top-row">
          <div className="trl-top-label">
            <Layers size={14} />
            <span>Hedef Standart Çerçeve (Framework):</span>
          </div>
          <div className="trl-framework-pills">
            {TRL_FRAMEWORKS.map((fw) => (
              <button
                key={fw.id}
                type="button"
                className={`trl-fw-btn ${selectedFramework === fw.id ? 'active' : ''}`}
                onClick={() => setSelectedFramework(fw.id)}
              >
                <span>{fw.shortName}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="trl-top-row">
          <div className="trl-top-label">
            <Bookmark size={14} />
            <span>Hazır Proje Şablonları (Presets):</span>
          </div>
          <div className="trl-presets-row">
            {PRESET_PROJECTS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className="trl-preset-chip"
                onClick={() => loadPreset(preset)}
                title={preset.description}
              >
                <Sparkles size={13} style={{ color: '#6366f1' }} />
                <span>{preset.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* PROMINENT NOTICE / WARNING BANNER (User Request #2: Bilgilendirme Uyarısı) */}
      <div
        className={`trl-notice-banner ${
          answeredCount === 0
            ? 'is-empty'
            : answeredCount === totalQuestions
            ? 'is-complete'
            : 'is-progress'
        }`}
      >
        <div className="trl-notice-icon-wrap">
          <div className="trl-notice-icon-bubble">
            {answeredCount === 0 ? (
              <AlertTriangle size={22} />
            ) : answeredCount === totalQuestions ? (
              <CheckCircle2 size={22} />
            ) : (
              <Info size={22} />
            )}
          </div>
        </div>

        <div className="trl-notice-body">
          <div className="trl-notice-header-row">
            <span className="trl-notice-badge">
              {answeredCount === 0
                ? 'TRL HESAPLAMA UYARISI'
                : answeredCount === totalQuestions
                ? 'DEĞERLENDİRME TAMAMLANDI'
                : 'TEŞHİS DEVAM EDİYOR'}
            </span>
            <span className="trl-notice-counter">
              {answeredCount} / {totalQuestions} Soru Yanıtlandı (%{answeredPercent})
            </span>
          </div>

          <h3 className="trl-notice-title">
            {answeredCount === 0
              ? 'TRL Seviyenizin Hesaplanabilmesi İçin Aşağıdaki Soruları Yanıtlamalısınız'
              : answeredCount === totalQuestions
              ? 'Tüm Sorular Yanıtlandı — Projenizin TRL Düzeyi ve Hibeleri Doğrulandı'
              : `TRL Hesaplaması Devam Ediyor — Kesin Sonuç İçin Kalan ${totalQuestions - answeredCount} Soruyu Yanıtlayınız`}
          </h3>

          <p className="trl-notice-text">
            {answeredCount === 0
              ? 'Ar-Ge projenizin teknolojik hazırlık düzeyini (TRL 1–9) doğru hesaplamak, bir üst aşamaya geçişteki kritik eksiklikleri tespit etmek ve uygun hibe programlarını (TÜBİTAK 1501/1507, Horizon Europe EIC, vb.) eşleştirmek için lütfen aşağıdaki 18 soruyu (Hayır / Kısmen / Tamamlandı) yanıtlayınız. İsterseniz yukarıdaki hazır proje şablonlarından birini seçerek de başlayabilirsiniz.'
              : answeredCount === totalQuestions
              ? 'Projenizin tüm teşhis soruları değerlendirilmiştir. Katı önkoşul kurallarına göre belirlenen resmi TRL seviyenizi, eksik adımlarınızı ve eşleşen hibe çağrılarını aşağıdaki sekmelerden inceleyebilirsiniz.'
              : `Şu ana kadar ${answeredCount} soru yanıtlandı. Projenizin kesin ve sertifikasyon kalitesinde TRL derecesi alabilmesi için kalan ${totalQuestions - answeredCount} soruyu da projenize göre işaretleyiniz.`}
          </p>

          <p className="trl-notice-subtext">
            *(Answer the diagnostic questions below to calculate your validated TRL level, milestone gaps, and grant eligibility).*
          </p>

          {/* Progress Bar inside Notice Banner */}
          <div className="trl-notice-progress-bar">
            <div
              className="trl-notice-progress-fill"
              style={{ width: `${Math.max(4, answeredPercent)}%` }}
            />
          </div>

          {/* Banner Quick Helper Actions */}
          <div className="trl-notice-actions">
            {answeredCount < totalQuestions && (
              <button
                type="button"
                className="trl-notice-btn highlight"
                onClick={handleScrollToQuestions}
              >
                <ArrowDown size={14} />
                <span>{answeredCount === 0 ? 'Aşağıdaki Soruları Yanıtlamaya Başla' : 'Kalan Soruları Yanıtla'}</span>
              </button>
            )}

            <button
              type="button"
              className="trl-notice-btn"
              onClick={() => loadPreset(PRESET_PROJECTS[0])}
            >
              <Sparkles size={13} />
              <span>Örnek Proje Yükle (TRL 3)</span>
            </button>

            <button
              type="button"
              className="trl-notice-btn"
              onClick={() => loadPreset(PRESET_PROJECTS[1])}
            >
              <Sparkles size={13} />
              <span>Örnek Proje Yükle (TRL 5)</span>
            </button>

            {answeredCount > 0 && (
              <button
                type="button"
                className="trl-notice-btn danger"
                onClick={handleReset}
              >
                <RotateCcw size={13} />
                <span>Tüm Yanıtları Sıfırla</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Executive Summary Dashboard Card */}
      <div className="trl-dashboard-card">
        <div className="trl-badge-hero">
          <div className="trl-big-number">
            {answeredCount === 0 ? 'TRL --' : `TRL ${assessment.strictTrl}`}
          </div>
          <div className="trl-big-title">
            {answeredCount === 0 ? 'Değerlendirme Bekleniyor' : currentLevelData.title}
          </div>
          <div className="trl-phase-tag">
            {answeredCount === 0
              ? `${totalQuestions} Soru Yanıt Bekliyor`
              : `${currentLevelData.phase} Aşaması`}
          </div>
        </div>

        <div className="trl-dash-content">
          <div className="trl-roadmap-bar-wrap">
            <div className="trl-roadmap-header">
              <span>
                {answeredCount === 0 ? (
                  <span>Değerlendirme İlerlemesi:</span>
                ) : (
                  <span>
                    Hedef: <strong>TRL {assessment.nextLevel}</strong> Yol Haritası
                  </span>
                )}
              </span>
              <strong style={{ color: '#0284c7' }}>
                {answeredCount === 0 ? `%${answeredPercent}` : `%${assessment.nextLevelProgress}`}
              </strong>
            </div>
            <div className="trl-dash-track">
              <div
                className="trl-dash-fill"
                style={{
                  width: `${answeredCount === 0 ? answeredPercent : assessment.nextLevelProgress}%`
                }}
              />
            </div>
          </div>

          <div className="trl-stat-metrics-row">
            <div className="trl-stat-box">
              <span className="trl-stat-val">
                {answeredCount === 0 ? '-- / 9' : `${assessment.strictTrl} / 9`}
              </span>
              <span className="trl-stat-lbl">Kesin Doğrulanmış TRL</span>
            </div>
            <div className="trl-stat-box">
              <span className="trl-stat-val">
                {answeredCount === 0 ? '%0' : `%${assessment.overallReadiness}`}
              </span>
              <span className="trl-stat-lbl">Teknolojik Olgunluk Skoru</span>
            </div>
            <div className="trl-stat-box">
              <span
                className="trl-stat-val"
                style={{
                  color:
                    answeredCount === 0
                      ? 'var(--text-muted)'
                      : assessment.gaps.length > 0
                      ? '#f59e0b'
                      : '#10b981'
                }}
              >
                {answeredCount === 0 ? totalQuestions : assessment.gaps.length}
              </span>
              <span className="trl-stat-lbl">
                {answeredCount === 0 ? 'Kalan Teşhis Sorusu' : 'Geçiş İçin Kritik Eksikler'}
              </span>
            </div>
          </div>

          <div className="trl-dash-button-row">
            <button
              type="button"
              className="trl-main-btn primary"
              onClick={handleCopyReport}
              disabled={answeredCount === 0}
              title={answeredCount === 0 ? 'Rapor için soruları yanıtlayınız' : 'Raporu Kopyala'}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Rapor Kopyalandı!' : 'Değerlendirme Raporunu Kopyala'}</span>
            </button>

            <button
              type="button"
              className="trl-main-btn secondary"
              onClick={handleExportJson}
              disabled={answeredCount === 0}
            >
              <Download size={14} />
              <span>Raporu İndir (JSON)</span>
            </button>

            <button
              type="button"
              className="trl-main-btn secondary"
              onClick={handleReset}
              title="Tüm soruları sıfırla"
            >
              <RotateCcw size={14} />
              <span>Sıfırla</span>
            </button>
          </div>
        </div>
      </div>

      {/* Segmented Navigation Tabs (Matching Universal Token Counter & Cerilas Standards) */}
      <div className="trl-tab-container">
        <div className="trl-segmented-bar">
          <button
            type="button"
            className={`trl-segment-btn ${viewMode === 'questionnaire' ? 'active' : ''}`}
            onClick={() => setViewMode('questionnaire')}
          >
            <GitCommit size={15} />
            <span>Teşhis Anketi</span>
            <span className="trl-pill-badge">{answeredCount} / {totalQuestions}</span>
          </button>

          <button
            type="button"
            className={`trl-segment-btn ${viewMode === 'matrix' ? 'active' : ''}`}
            onClick={() => setViewMode('matrix')}
          >
            <Layers size={15} />
            <span>9-Seviye Kriter Matrisi</span>
          </button>

          <button
            type="button"
            className={`trl-segment-btn ${viewMode === 'roadmap' ? 'active' : ''}`}
            onClick={() => setViewMode('roadmap')}
          >
            <Compass size={15} />
            <span>Eksik Analizi & Yol Haritası</span>
            {assessment.gaps.length > 0 && (
              <span
                className="trl-pill-badge"
                style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}
              >
                {assessment.gaps.length}
              </span>
            )}
          </button>

          <button
            type="button"
            className={`trl-segment-btn ${viewMode === 'grants' ? 'active' : ''}`}
            onClick={() => setViewMode('grants')}
          >
            <Award size={15} />
            <span>Eşleşen Hibe Çağrıları</span>
            <span
              className="trl-pill-badge"
              style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}
            >
              {assessment.eligibleGrants.length}
            </span>
          </button>
        </div>
      </div>

      {/* VIEW 1: Diagnostic Questionnaire */}
      {viewMode === 'questionnaire' && (
        <div className="trl-questions-workspace">
          {PHASES.map((phase) => {
            const phaseQuestions = ASSESSMENT_QUESTIONS.filter((q) => {
              if (phase.id === 'phase-1') return q.targetTrl <= 2;
              if (phase.id === 'phase-2') return q.targetTrl === 3 || q.targetTrl === 4;
              if (phase.id === 'phase-3') return q.targetTrl === 5 || q.targetTrl === 6;
              if (phase.id === 'phase-4') return q.targetTrl === 7 || q.targetTrl === 8;
              return q.targetTrl === 9;
            });

            return (
              <div key={phase.id} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="trl-phase-section-title">
                  <h4>
                    <FlaskConical size={16} style={{ color: '#6366f1' }} />
                    <span>{phase.name}</span>
                  </h4>
                  <span className="trl-phase-badge-pill">{phase.trlRange}</span>
                </div>

                {phaseQuestions.map((q) => {
                  const currentVal = answers[q.id];
                  const isAnswered = currentVal !== undefined && currentVal !== null;
                  const questionGlobalIdx = ASSESSMENT_QUESTIONS.findIndex((item) => item.id === q.id) + 1;

                  return (
                    <div
                      key={q.id}
                      className={`trl-q-card ${isAnswered ? 'is-answered' : 'is-unanswered'}`}
                    >
                      <div className="trl-q-top-meta">
                        <div className="trl-q-left-tags">
                          <span className="trl-q-number">Soru {questionGlobalIdx} / {totalQuestions}</span>
                          <span className="trl-q-target-badge">Gate TRL {q.targetTrl} Önkoşulu</span>
                        </div>

                        <span
                          className={`trl-q-state-indicator ${isAnswered ? 'done' : 'pending'}`}
                        >
                          {isAnswered ? '✓ Yanıtlandı' : '⏳ Yanıt Bekleniyor'}
                        </span>
                      </div>

                      <div className="trl-q-texts">
                        <h5 className="trl-q-tr-title">{q.questionTr || q.question}</h5>
                        <p className="trl-q-en-subtitle">{q.question}</p>
                        <p className="trl-q-help-box">
                          <strong>Kılavuz / Açıklama:</strong> {q.helpTextTr || q.helpText}
                        </p>
                      </div>

                      <div className="trl-button-choices">
                        <button
                          type="button"
                          className={`trl-choice-pill ${currentVal === 0 ? 'active-no' : ''}`}
                          onClick={() => handleAnswerChange(q.id, 0)}
                        >
                          <AlertCircle size={15} />
                          <span>Hayır / Başlanmadı (0)</span>
                        </button>

                        <button
                          type="button"
                          className={`trl-choice-pill ${currentVal === 1 ? 'active-partial' : ''}`}
                          onClick={() => handleAnswerChange(q.id, 1)}
                        >
                          <HelpCircle size={15} />
                          <span>Kısmen Doğrulandı (1)</span>
                        </button>

                        <button
                          type="button"
                          className={`trl-choice-pill ${currentVal === 2 ? 'active-yes' : ''}`}
                          onClick={() => handleAnswerChange(q.id, 2)}
                        >
                          <CheckCircle2 size={15} />
                          <span>Evet / Tamamlandı (2)</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: 9-Level Criteria Matrix */}
      {viewMode === 'matrix' && (
        <div className="trl-matrix-grid">
          {TRL_LEVELS.map((lvl) => {
            const scoreData = assessment.levelScores[lvl.level];
            const status = scoreData?.status || 'missing';

            return (
              <div key={lvl.level} className={`trl-m-card ${status}`}>
                <div>
                  <div className="trl-m-card-top">
                    <span className="trl-m-level-badge" style={{ background: lvl.color }}>
                      TRL {lvl.level}
                    </span>
                    <span className={`trl-m-status-text ${status}`}>
                      {status === 'validated'
                        ? 'Doğrulandı'
                        : status === 'in-progress'
                        ? 'Devam Ediyor'
                        : 'Beklemede'}
                    </span>
                  </div>

                  <h4 className="trl-m-title">{lvl.title}</h4>
                  <p className="trl-m-desc">{lvl.summary}</p>
                </div>

                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.75rem',
                      marginBottom: '0.25rem',
                      color: 'var(--text-muted)'
                    }}
                  >
                    <span>Ölçüt Karşılama Oranı</span>
                    <strong>%{scoreData?.percentage || 0}</strong>
                  </div>

                  <div className="trl-dash-track" style={{ height: '6px' }}>
                    <div
                      className="trl-dash-fill"
                      style={{
                        width: `${scoreData?.percentage || 0}%`,
                        background:
                          status === 'validated'
                            ? '#10b981'
                            : status === 'in-progress'
                            ? '#f59e0b'
                            : '#64748b'
                      }}
                    />
                  </div>

                  <div className="trl-m-deliverables">
                    <strong>Gerekli Başlıca Çıktılar:</strong>
                    <ul>
                      {lvl.deliverables.slice(0, 2).map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 3: Gap Analysis & Roadmap */}
      {viewMode === 'roadmap' && (
        <div className="trl-gap-panel">
          {assessment.gaps.length === 0 ? (
            <div
              className="trl-q-card"
              style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}
            >
              <CheckCircle2 size={44} style={{ color: '#10b981', margin: '0 auto 1rem auto' }} />
              <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>
                Kritik Kilometre Taşı Eksikliği Bulunmuyor!
              </h3>
              <p style={{ margin: 0, color: 'var(--text-muted)', maxWidth: '540px', marginInline: 'auto' }}>
                Projeniz TRL {assessment.strictTrl} seviyesindeki tüm temel kriterleri karşılamaktadır. Resmi sertifikasyon veya ticarileşme adımlarına hazırsınız.
              </p>
            </div>
          ) : (
            assessment.gaps.map((gap) => (
              <div key={gap.id} className="trl-gap-item-card">
                <div className="trl-gap-top-header">
                  <span>TRL {gap.level} Seviyesine Geçiş İçin Önkoşul</span>
                  <span style={{ textTransform: 'uppercase', fontSize: '0.72rem' }}>
                    Durum: {gap.currentStatus === 'Partially Fulfilled' ? 'Kısmen Tamamlandı' : 'Başlanmadı'}
                  </span>
                </div>
                <h4 className="trl-gap-headline">{gap.actionRequired}</h4>
                <p className="trl-gap-guidance">{gap.helpTextTr || gap.helpText}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* VIEW 4: Matched Grants */}
      {viewMode === 'grants' && (
        <div className="trl-grants-grid">
          {assessment.eligibleGrants.length === 0 ? (
            <div
              className="trl-q-card"
              style={{ textAlign: 'center', padding: '3.5rem 1.5rem', gridColumn: '1 / -1' }}
            >
              <Info size={44} style={{ color: '#0284c7', margin: '0 auto 1rem auto' }} />
              <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>
                Doğrudan Eşleşen Hibe Bulunamadı
              </h3>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                Soruları yanıtlayarak projenizin TRL seviyesini netleştiriniz.
              </p>
            </div>
          ) : (
            assessment.eligibleGrants.map((grant) => (
              <div key={grant.id} className="trl-grant-card">
                <div>
                  <div className="trl-grant-top">
                    <div>
                      <h4 className="trl-grant-title">{grant.name}</h4>
                      <span className="trl-grant-provider">{grant.provider}</span>
                    </div>
                    <span className="trl-grant-badge">
                      TRL {grant.minTrl} – {grant.maxTrl}
                    </span>
                  </div>
                  <p className="trl-grant-desc" style={{ marginTop: '0.75rem' }}>
                    {grant.description}
                  </p>
                </div>

                <div className="trl-grant-meta-row">
                  <span>
                    <strong>Destek Türü:</strong> {grant.grantType}
                  </span>
                  <span>
                    <strong>Bütçe:</strong> {grant.budget}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* SEO Divider and Structured FAQ Content */}
      <ToolSeoDivider />
      <TrlCalculatorSeo />
    </div>
  );
}
