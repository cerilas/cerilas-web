/**
 * Cerilas Scientific TRL (Technology Readiness Level) Assessment Engine
 * Complies with European Commission (Horizon Europe / EIC), NASA SP-2016-6105,
 * ISO 16290 Space Standards, and Software Readiness Level (SRL) frameworks.
 */

export const TRL_FRAMEWORKS = [
  {
    id: 'horizon-europe',
    name: 'Horizon Europe & EIC',
    shortName: 'EU Horizon',
    description: 'European Commission standard for RIA, IA, and EIC Accelerator deeptech grants.',
    badge: 'EU Standard'
  },
  {
    id: 'nasa',
    name: 'NASA / Aerospace',
    shortName: 'NASA & Space',
    description: 'Aviation, space systems, and defense hardware readiness (ISO 16290).',
    badge: 'Aerospace'
  },
  {
    id: 'software',
    name: 'Software & DeepTech (SRL)',
    shortName: 'Software SRL',
    description: 'Algorithms, AI/ML models, cloud architecture, synthetic data, and production SLAs.',
    badge: 'Software / AI'
  },
  {
    id: 'tubitak',
    name: 'TÜBİTAK / National R&D',
    shortName: 'TÜBİTAK Ar-Ge',
    description: 'TÜBİTAK 1501, 1507, 1001 ve KOSGEB Ar-Ge/İnovasyon değerlendirme kriterleri.',
    badge: 'TR Ulusal'
  }
];

export const TRL_LEVELS = [
  {
    level: 1,
    title: 'Basic Principles Observed',
    titleTr: 'Temel Prensiplerin Gözlenmesi',
    phase: 'Discovery',
    phaseTr: 'Keşif',
    color: '#64748b',
    summary: 'Scientific research begins to be translated into applied research and development.',
    summaryTr: 'Temel bilimsel ilkelerin gözlemlenmesi ve literatür araştırmasıyla belgelenmesi.',
    deliverables: [
      'Published academic papers or internal scientific whitepapers',
      'Mathematical formulations and theoretical hypotheses',
      'Initial patent landscape and freedom-to-operate survey'
    ],
    risks: 'Purely theoretical; no practical applications or experimental proof exist yet.'
  },
  {
    level: 2,
    title: 'Technology Concept Formulated',
    titleTr: 'Teknoloji Konseptinin Formüle Edilmesi',
    phase: 'Concept',
    phaseTr: 'Kavram',
    color: '#0284c7',
    summary: 'Practical applications can be invented. Analytical studies support the concept.',
    summaryTr: 'Kullanım alanları belirlenmiş, temel uygulama fikirleri ve teorik modeller oluşturulmuştur.',
    deliverables: [
      'Application requirement specifications and target use cases',
      'Preliminary design equations and computer simulation models',
      'Initial intellectual property (patent) application draft'
    ],
    risks: 'Still speculative; lack of physical or experimental validation.'
  },
  {
    level: 3,
    title: 'Experimental Proof of Concept',
    titleTr: 'Deneysel Kavram Kanıtı (POC)',
    phase: 'Proof of Concept',
    phaseTr: 'Kavram Kanıtı',
    color: '#06b6d4',
    summary: 'Active R&D initiated. Analytical and laboratory studies confirm physical predictions.',
    summaryTr: 'Laboratuvar ortamında temel fonksiyonel testler ve analitik modellerle kavram doğrulanmıştır.',
    deliverables: [
      'Laboratory test data proving feasibility of core mechanisms',
      'Synthetic benchmark results or table-top experiment data',
      'Analytical validation of core performance parameters'
    ],
    risks: 'Non-integrated components; not tested in realistic environmental conditions.'
  },
  {
    level: 4,
    title: 'Component Validation in Laboratory',
    titleTr: 'Laboratuvar Ortamında Bileşen Doğrulaması',
    phase: 'Lab Prototype',
    phaseTr: 'Laboratuvar Prototipi',
    color: '#10b981',
    summary: 'Basic technological components are integrated and tested in laboratory conditions.',
    summaryTr: 'Temel bileşenler bir araya getirilerek kontrollü laboratuvar şartlarında test edilmiştir.',
    deliverables: [
      'Functional breadboard or software prototype demonstrating integration',
      'Reproducible laboratory test protocols and error margins',
      'Initial bill-of-materials (BOM) or architectural schema'
    ],
    risks: 'Laboratory environment is ideal; real-world industrial noise and stressors are absent.'
  },
  {
    level: 5,
    title: 'Validation in Relevant Environment',
    titleTr: 'İlgili/Temsili Ortamda Doğrulama',
    phase: 'Relevant Environment',
    phaseTr: 'Temsili Ortam',
    color: '#3b82f6',
    summary: 'Basic components are integrated with reasonably realistic supporting elements.',
    summaryTr: 'Prototip bileşenler, hedeflenen gerçek çalışma şartlarını simüle eden temsili ortamda doğrulanmıştır.',
    deliverables: [
      'High-fidelity laboratory or industrial test rig validation',
      'Testing under simulated temperature, load, or data variability',
      'Preliminary regulatory and compliance gap assessment'
    ],
    risks: 'Integration challenges between sub-systems; scale remains limited.'
  },
  {
    level: 6,
    title: 'Prototype Demonstration in Relevant Environment',
    titleTr: 'İlgili Ortamda Prototip Gösterimi',
    phase: 'Engineering Prototype',
    phaseTr: 'Mühendislik Prototipi',
    color: '#6366f1',
    summary: 'Representative engineering model is tested in a relevant simulated/industrial environment.',
    summaryTr: 'Tam ölçekli veya mühendislik prototipi, gerçekçi operasyonel ortamda başarıyla çalıştırılmıştır.',
    deliverables: [
      'Engineering prototype operating under near-operational conditions',
      'Comprehensive performance characterization report',
      'EIC Accelerator & TÜBİTAK 1501 sweet-spot milestone delivery'
    ],
    risks: 'Requires substantial capital for industrial piloting, tooling, and supply chain scaling.'
  },
  {
    level: 7,
    title: 'System Prototype in Operational Environment',
    titleTr: 'Operasyonel Ortamda Sistem Prototipi',
    phase: 'Operational Pilot',
    phaseTr: 'Operasyonel Pilot',
    color: '#8b5cf6',
    summary: 'Prototype near or at planned operational system demonstrated in real field conditions.',
    summaryTr: 'Sistem prototipi doğrudan sahada, gerçek kullanıcılarla veya operasyonel test sahasında denenmiştir.',
    deliverables: [
      'Field pilot trial results with actual industrial users or customers',
      'Official safety, CE, EMC, or ISO compliance test reports',
      'Reliability, failure modes, and effect analysis (FMEA)'
    ],
    risks: 'Edge cases, unexpected field failures, and regulatory certification hurdles.'
  },
  {
    level: 8,
    title: 'Actual System Completed and Qualified',
    titleTr: 'Sistem Tamamlandı ve Kalifiye Edildi',
    phase: 'Qualified Product',
    phaseTr: 'Kalifiye Ürün',
    color: '#d946ef',
    summary: 'Technology in its final form is proven through extensive qualification testing.',
    summaryTr: 'Nihai ürün formu tamamlanmış, tüm sertifikasyon ve tip testlerinden başarıyla geçmiştir.',
    deliverables: [
      'Certified product documentation, user manuals, and technical specs',
      'Final factory acceptance testing (FAT) and QA procedures',
      'Pilot manufacturing run or production deployment in client environments'
    ],
    risks: 'Manufacturing yield variations, customer onboarding friction, scaling unit economics.'
  },
  {
    level: 9,
    title: 'Actual System Proven in Operational Mission',
    titleTr: 'Kanıtlanmış Başarılı Ticari Sistem',
    phase: 'Commercialization',
    phaseTr: 'Ticari Başarı',
    color: '#10b981',
    summary: 'Actual application of the technology in its final form under full mission/commercial conditions.',
    summaryTr: 'Ürün ticari pazarda tam ölçekli olarak satılmakta ve sahada kesintisiz hizmet vermektedir.',
    deliverables: [
      'Commercial sales revenues and signed enterprise SLAs',
      'Established mass production / continuous cloud deployment pipeline',
      'Sustained field reliability metrics and customer support telemetry'
    ],
    risks: 'Competitive market displacement and continuous sustaining engineering.'
  }
];

export const ASSESSMENT_QUESTIONS = [
  // TRL 1: Principles
  {
    id: 'q_principles_observed',
    targetTrl: 1,
    phase: 'Scientific Basis',
    question: 'Have the fundamental scientific principles underlying your technology been observed and documented?',
    questionTr: 'Teknolojinizin dayandığı temel bilimsel ilkeler gözlemlenmiş ve akademik/teknik olarak belgelenmiş midir?',
    helpText: 'Includes peer-reviewed literature reviews, mathematical equations, or basic physical discoveries.',
    helpTextTr: 'Akademik makaleler, temel matematiksel formülasyonlar veya fiziksel keşifleri kapsar.',
    weight: 1.0
  },
  {
    id: 'q_theoretical_model',
    targetTrl: 1,
    phase: 'Scientific Basis',
    question: 'Are theoretical models or initial mathematical formulations established?',
    questionTr: 'Teorik modeller veya ilk matematiksel formülasyonlar oluşturuldu mu?',
    helpText: 'Calculations or algorithms that describe why the core principle should work in theory.',
    helpTextTr: 'Prensibin teoride neden çalışması gerektiğini açıklayan temel hesaplamalar ve modeller.',
    weight: 1.0
  },

  // TRL 2: Concept
  {
    id: 'q_application_formulated',
    targetTrl: 2,
    phase: 'Concept Formulation',
    question: 'Have practical applications and primary use cases for this technology been identified and scoped?',
    questionTr: 'Bu teknoloji için pratik uygulama alanları ve birincil kullanım senaryoları tanımlandı mı?',
    helpText: 'Clear mapping of how the theoretical discovery can solve a real-world industrial or commercial problem.',
    helpTextTr: 'Bilimsel bulgunun hangi somut sektörel veya ticari sorunu çözeceğinin haritalandırılması.',
    weight: 1.0
  },
  {
    id: 'q_preliminary_feasibility',
    targetTrl: 2,
    phase: 'Concept Formulation',
    question: 'Has a preliminary analytical feasibility study or simulation been completed?',
    questionTr: 'Ön analitik fizibilite çalışması veya bilgisayar destekli simülasyon tamamlandı mı?',
    helpText: 'Simulation data or analytical approximations verifying that physics/logic permit the concept.',
    helpTextTr: 'Fiziksel veya algoritmik mantığın konsepti desteklediğini gösteren simülasyon verileri.',
    weight: 1.0
  },

  // TRL 3: Proof of Concept
  {
    id: 'q_lab_poc',
    targetTrl: 3,
    phase: 'Laboratory Proof of Concept',
    question: 'Has an experimental Proof-of-Concept (PoC) demonstrated feasibility in a laboratory setup?',
    questionTr: 'Laboratuvar ortamında temel kavram kanıtı (Proof of Concept - PoC) testi gerçekleştirildi mi?',
    helpText: 'Active bench-scale experiments validating the critical speculative functions.',
    helpTextTr: 'Kritik fonksiyonların çalıştığını gösteren tezgah üstü veya kontrollü laboratuvar deneyleri.',
    weight: 1.2
  },
  {
    id: 'q_analytical_correlation',
    targetTrl: 3,
    phase: 'Laboratory Proof of Concept',
    question: 'Do the laboratory experimental results correlate with your analytical predictions?',
    questionTr: 'Deneysel laboratuvar sonuçları analitik/teorik tahminlerinizle tutarlı mı?',
    helpText: 'Empirical data should confirm baseline mathematical models with measurable metrics.',
    helpTextTr: 'Ölçülebilir ampirik verilerin teorik modelleri doğrulaması beklenir.',
    weight: 1.0
  },

  // TRL 4: Lab Validation
  {
    id: 'q_component_integration_lab',
    targetTrl: 4,
    phase: 'Component Integration',
    question: 'Are separate components integrated together into a functional breadboard/prototype in the lab?',
    questionTr: 'Ayrı bileşenler bir araya getirilerek laboratuvarda çalışan bir prototip/breadboard oluşturuldu mu?',
    helpText: 'Different modules (e.g. sensor + processor + algorithm, or chemistry + container) work together.',
    helpTextTr: 'Farklı modüllerin (örn. sensör + yazılım + devre) entegre şekilde birlikte çalışması.',
    weight: 1.2
  },
  {
    id: 'q_lab_repeatability',
    targetTrl: 4,
    phase: 'Component Integration',
    question: 'Have tests in laboratory conditions been repeated with consistent and documented results?',
    questionTr: 'Laboratuvar koşullarındaki testler tekrarlanabilir ve tutarlı sonuçlar veriyor mu?',
    helpText: 'Results must be statistically repeatable rather than a lucky one-off trial.',
    helpTextTr: 'Test sonuçlarının tesadüfi değil, belgelenmiş ve tekrarlanabilir olması şarttır.',
    weight: 1.0
  },

  // TRL 5: Relevant Environment
  {
    id: 'q_relevant_environment_test',
    targetTrl: 5,
    phase: 'Relevant Environment Validation',
    question: 'Has the integrated system been tested in a simulated relevant environment (not just clean lab conditions)?',
    questionTr: 'Entegre sistem sadece temiz laboratuvarda değil, simüle edilmiş ilgili/temsili ortamda test edildi mi?',
    helpText: 'Simulating real-world stressors: temperature swings, vibration, industrial noise, or messy real-world datasets.',
    helpTextTr: 'Sıcaklık, titreşim, kirli veri, şebeke gürültüsü gibi gerçek dünya zorluklarının simülasyonu.',
    weight: 1.3
  },
  {
    id: 'q_subsystem_fidelity',
    targetTrl: 5,
    phase: 'Relevant Environment Validation',
    question: 'Are sub-systems designed with realistic engineering forms and industrial materials?',
    questionTr: 'Alt sistemler gerçekçi mühendislik formları ve endüstriyel malzemelerle tasarlandı mı?',
    helpText: 'Moving away from generic evaluation boards/breadboards toward custom PCB, enclosures, or optimized code.',
    helpTextTr: 'Geliştirme kitlerinden özel PCB, endüstriyel kasa veya optimize edilmiş mimariye geçiş.',
    weight: 1.0
  },

  // TRL 6: Relevant Prototype
  {
    id: 'q_prototype_demonstration',
    targetTrl: 6,
    phase: 'Engineering Prototype',
    question: 'Has a fully representative engineering prototype demonstrated core performance in a relevant setting?',
    questionTr: 'Tam ölçekli mühendislik prototipi, ilgili temsili ortamda hedeflenen ana performansı sergiledi mi?',
    helpText: 'Sweet spot for EIC Accelerator and TÜBİTAK 1501 grants. Prototype looks and behaves close to final product.',
    helpTextTr: 'EIC Accelerator ve TÜBİTAK 1501 için kritik eşik. Prototip nihai ürüne yakın davranır.',
    weight: 1.4
  },
  {
    id: 'q_critical_failure_modes',
    targetTrl: 6,
    phase: 'Engineering Prototype',
    question: 'Have critical engineering bottlenecks and failure modes been systematically characterized?',
    questionTr: 'Kritik mühendislik darboğazları ve olası hata modları sistematik olarak analiz edildi mi?',
    helpText: 'FMEA (Failure Mode and Effects Analysis) or robust error telemetry collected during stress tests.',
    helpTextTr: 'Stres testleri esnasında FMEA hata analizlerinin ve telemetri verilerinin toplanması.',
    weight: 1.1
  },

  // TRL 7: Operational Environment
  {
    id: 'q_operational_field_pilot',
    targetTrl: 7,
    phase: 'Operational Pilot',
    question: 'Has the complete system prototype been demonstrated in an actual operational environment (field trial / pilot client)?',
    questionTr: 'Sistem prototipi gerçek operasyonel sahada (pilot müşteri sahası veya gerçek çalışma alanı) denendi mi?',
    helpText: 'Field trials with pilot corporate partners, actual field installations, or live end-user environments.',
    helpTextTr: 'Gerçek kurumsal pilot ortaklarla saha kurulumları veya canlı operasyon denemeleri.',
    weight: 1.4
  },
  {
    id: 'q_regulatory_compliance_testing',
    targetTrl: 7,
    phase: 'Operational Pilot',
    question: 'Have pre-certification regulatory, safety, and industry compliance audits been initiated?',
    questionTr: 'Ön sertifikasyon, mevzuat, iş güvenliği ve CE/EMC/FDA uygunluk testleri başlatıldı mı?',
    helpText: 'Laboratory certification pre-scans, cybersecurity penetration audits, or safety standard verifications.',
    helpTextTr: 'Akredite laboratuvar ön taramaları, siber güvenlik denetimleri veya güvenlik standartları.',
    weight: 1.2
  },

  // TRL 8: Qualified System
  {
    id: 'q_system_qualification_complete',
    targetTrl: 8,
    phase: 'System Qualification',
    question: 'Has the final production-ready system passed all formal qualification and certification tests?',
    questionTr: 'Nihai üretime hazır sistem tüm resmi kalifikasyon ve sertifikasyon testlerinden geçti mi?',
    helpText: 'Final system is 100% frozen in design and has achieved full formal compliance (CE, ISO, FDA, etc.).',
    helpTextTr: 'Tasarım dondurulmuş (design freeze), tüm tip testleri ve resmi onaylar alınmıştır.',
    weight: 1.5
  },
  {
    id: 'q_manufacturing_readiness',
    targetTrl: 8,
    phase: 'System Qualification',
    question: 'Is a pilot manufacturing line, tooling, or repeatable deployment pipeline operational?',
    questionTr: 'Pilot üretim hattı, kalıplar veya tekrarlanabilir kurumsal devreye alma hattı hazır mı?',
    helpText: 'Manufacturing readiness level (MRL) aligns; supply chain agreements and QA documentation are in place.',
    helpTextTr: 'Tedarik zinciri sözleşmeleri, kalite kontrol prosedürleri ve montaj/dağıtım süreçleri hazırdır.',
    weight: 1.2
  },

  // TRL 9: Proven Operation
  {
    id: 'q_commercial_mission_proven',
    targetTrl: 9,
    phase: 'Commercial Deployment',
    question: 'Is the system actively deployed in full-scale commercial or operational mission service?',
    questionTr: 'Sistem pazarda tam ölçekli olarak ticari satışta veya aktif görev hizmetinde mi?',
    helpText: 'Sustained commercial operations, documented customer retention, and serial manufacturing/uptime.',
    helpTextTr: 'Sürekli ticari satış, müşteri SLA başarıları, seri üretim veya aktif kurumsal kullanım.',
    weight: 1.5
  },
  {
    id: 'q_supply_chain_stability',
    targetTrl: 9,
    phase: 'Commercial Deployment',
    question: 'Are supply chain, maintenance support, and mass-scale unit economics stable and profitable?',
    questionTr: 'Tedarik zinciri, bakım/destek süreçleri ve birim maliyet ekonomisi optimize edildi mi?',
    helpText: 'Competitive manufacturing yields, ongoing maintenance telemetry, and commercial maturity.',
    helpTextTr: 'Rekabetçi üretim verimliliği, satış sonrası destek ve pazar payı olgunluğu.',
    weight: 1.0
  }
];

export const GRANT_FUNDING_PROGRAMS = [
  {
    id: 'erc-proof-of-concept',
    name: 'ERC Proof of Concept & Horizon RIA',
    provider: 'European Commission',
    minTrl: 1,
    maxTrl: 3,
    grantType: '100% Non-Dilutive Grant',
    budget: '€150,000 – €3,000,000',
    description: 'Aimed at groundbreaking frontier research, basic scientific principles, and early lab proofs of concept.',
    tags: ['Research', 'Academic', 'Horizon Europe']
  },
  {
    id: 'tubitak-1001',
    name: 'TÜBİTAK 1001 / 1002 Bilimsel Ar-Ge',
    provider: 'TÜBİTAK',
    minTrl: 1,
    maxTrl: 3,
    grantType: 'Hibe Destek',
    budget: '1.650.000 TL – 2.500.000 TL',
    description: 'Üniversite ve araştırma kurumlarının temel prensip ve kavram kanıtı aşamasındaki Ar-Ge projeleri.',
    tags: ['Temel Araştırma', 'Akademik', 'TÜBİTAK']
  },
  {
    id: 'eic-pathfinder',
    name: 'EIC Pathfinder & Transition',
    provider: 'European Innovation Council',
    minTrl: 2,
    maxTrl: 5,
    grantType: '100% Grant',
    budget: '€2,500,000 – €4,000,000',
    description: 'Radical new deeptech concepts moving from lab proof of concept into relevant validation environments.',
    tags: ['DeepTech', 'Horizon Europe', 'EIC']
  },
  {
    id: 'tubitak-1507',
    name: 'TÜBİTAK 1507 KOBİ Ar-Ge Başlangıç',
    provider: 'TÜBİTAK TEYDEB',
    minTrl: 3,
    maxTrl: 6,
    grantType: '%75 Hibe Destek',
    budget: '2.400.000 TL',
    description: 'KOBİ ölçeğindeki şirketlerin kavram kanıtından mühendislik prototipine geçiş projeleri.',
    tags: ['KOBİ', 'Prototip', 'TEYDEB']
  },
  {
    id: 'tubitak-1501',
    name: 'TÜBİTAK 1501 Sanayi Ar-Ge Destek',
    provider: 'TÜBİTAK TEYDEB',
    minTrl: 4,
    maxTrl: 7,
    grantType: '%75 Hibe Destek',
    budget: 'Bütçe Üst Sınırı Yok',
    description: 'Sanayi prototipi geliştirme, ilgili ortamda doğrulama ve pilot saha testleri aşaması.',
    tags: ['Sanayi Ar-Ge', 'Prototip', 'TEYDEB']
  },
  {
    id: 'eurostars-3',
    name: 'Eurostars-3 (Eureka)',
    provider: 'Eureka / EUREKA Network',
    minTrl: 4,
    maxTrl: 7,
    grantType: 'Joint International Grant',
    budget: '€500,000 – €1,500,000 per partner',
    description: 'International collaborative market-driven R&D projects between European innovative SMEs.',
    tags: ['International', 'SME', 'Eureka']
  },
  {
    id: 'eic-accelerator',
    name: 'EIC Accelerator (DeepTech Flagship)',
    provider: 'European Innovation Council',
    minTrl: 5,
    maxTrl: 8,
    grantType: 'Blended Finance (€2.5M Grant + up to €15M Equity)',
    budget: 'Up to €17,500,000',
    description: 'Deeptech unicorns and game-changing innovations transitioning from TRL 5/6 to mass commercial deployment.',
    tags: ['DeepTech', 'Equity + Grant', 'High Impact']
  },
  {
    id: 'tubitak-1707',
    name: 'TÜBİTAK 1707 Siparişe Dayalı Ar-Ge',
    provider: 'TÜBİTAK',
    minTrl: 6,
    maxTrl: 8,
    grantType: 'Müşteri Kuruluş Destekli Hibe',
    budget: '30.000.000 TL',
    description: 'Operasyonel sahada pilot testi yapılacak ve müşterisi hazır yüksek teknolojili ürün projeleri.',
    tags: ['Ticarileşme', 'Müşteri Ortaklı', 'Saha Pilotu']
  },
  {
    id: 'commercial-growth',
    name: 'Commercial Venture Debt & Growth Equity',
    provider: 'Private VCs & EIB',
    minTrl: 8,
    maxTrl: 9,
    grantType: 'Series A / B / Venture Debt',
    budget: '€5,000,000 – €50,000,000+',
    description: 'Full market penetration, international expansion, manufacturing plant setup, and global sales.',
    tags: ['Commercial', 'Scale-up', 'VC Funding']
  }
];

export const PRESET_PROJECTS = [
  {
    id: 'nanotech-biomedical',
    name: 'Biomedical Nanoparticle Diagnostic (Lab Stage)',
    description: 'Cancer biomarker detection sensor tested in synthetic blood in laboratory bench setups.',
    framework: 'horizon-europe',
    answers: {
      q_principles_observed: 2,
      q_theoretical_model: 2,
      q_application_formulated: 2,
      q_preliminary_feasibility: 2,
      q_lab_poc: 2,
      q_analytical_correlation: 2,
      q_component_integration_lab: 1,
      q_lab_repeatability: 1,
      q_relevant_environment_test: 0,
      q_subsystem_fidelity: 0,
      q_prototype_demonstration: 0,
      q_critical_failure_modes: 0,
      q_operational_field_pilot: 0,
      q_regulatory_compliance_testing: 0,
      q_system_qualification_complete: 0,
      q_manufacturing_readiness: 0,
      q_commercial_mission_proven: 0,
      q_supply_chain_stability: 0
    }
  },
  {
    id: 'autonomous-drone-ai',
    name: 'Autonomous Drone Navigation & Obstacle AI (Prototype Stage)',
    description: 'Computer vision obstacle avoidance drone tested in outdoor warehouse relevant environments.',
    framework: 'software',
    answers: {
      q_principles_observed: 2,
      q_theoretical_model: 2,
      q_application_formulated: 2,
      q_preliminary_feasibility: 2,
      q_lab_poc: 2,
      q_analytical_correlation: 2,
      q_component_integration_lab: 2,
      q_lab_repeatability: 2,
      q_relevant_environment_test: 2,
      q_subsystem_fidelity: 2,
      q_prototype_demonstration: 2,
      q_critical_failure_modes: 1,
      q_operational_field_pilot: 1,
      q_regulatory_compliance_testing: 0,
      q_system_qualification_complete: 0,
      q_manufacturing_readiness: 0,
      q_commercial_mission_proven: 0,
      q_supply_chain_stability: 0
    }
  },
  {
    id: 'industrial-cleantech',
    name: 'Industrial Carbon Capture Unit (Field Pilot Stage)',
    description: 'Containerized solid sorbent carbon capture pilot operational at a commercial cement plant.',
    framework: 'horizon-europe',
    answers: {
      q_principles_observed: 2,
      q_theoretical_model: 2,
      q_application_formulated: 2,
      q_preliminary_feasibility: 2,
      q_lab_poc: 2,
      q_analytical_correlation: 2,
      q_component_integration_lab: 2,
      q_lab_repeatability: 2,
      q_relevant_environment_test: 2,
      q_subsystem_fidelity: 2,
      q_prototype_demonstration: 2,
      q_critical_failure_modes: 2,
      q_operational_field_pilot: 2,
      q_regulatory_compliance_testing: 2,
      q_system_qualification_complete: 1,
      q_manufacturing_readiness: 1,
      q_commercial_mission_proven: 0,
      q_supply_chain_stability: 0
    }
  }
];

/**
 * Calculates deterministic TRL score, progress percentage, level breakdown, gaps, and grant matches.
 * 
 * @param {Object} answers - Map of questionId -> 0 (No), 1 (Partial), 2 (Yes)
 * @param {string} frameworkId - Selected assessment framework
 */
export function calculateTrlAssessment(answers = {}, frameworkId = 'horizon-europe') {
  // 1. Calculate score per TRL level (1 through 9)
  const levelScores = {};
  for (let lvl = 1; lvl <= 9; lvl++) {
    const questionsForLevel = ASSESSMENT_QUESTIONS.filter((q) => q.targetTrl === lvl);
    const maxScore = questionsForLevel.reduce((sum, q) => sum + (q.weight * 2), 0);
    const earnedScore = questionsForLevel.reduce((sum, q) => {
      const val = answers[q.id] !== undefined ? answers[q.id] : 0;
      return sum + (q.weight * val);
    }, 0);

    const ratio = maxScore > 0 ? (earnedScore / maxScore) : 0;
    let status = 'missing';
    if (ratio >= 0.85) {
      status = 'validated';
    } else if (ratio >= 0.35) {
      status = 'in-progress';
    }

    levelScores[lvl] = {
      level: lvl,
      maxScore,
      earnedScore,
      ratio,
      percentage: Math.round(ratio * 100),
      status,
      questions: questionsForLevel
    };
  }

  // 2. Strict TRL: Highest level where this level and all previous levels are 'validated'
  let strictTrl = 0;
  for (let lvl = 1; lvl <= 9; lvl++) {
    if (levelScores[lvl].status === 'validated') {
      strictTrl = lvl;
    } else {
      break; // Sequential prerequisite rule of formal TRL methodology
    }
  }

  // 3. Current Practical TRL (allows partial next level progress)
  let nextLevel = Math.min(9, strictTrl + 1);
  let nextLevelProgress = strictTrl < 9 ? levelScores[nextLevel].percentage : 100;

  // Total weighted readiness score (0 - 100%)
  const totalEarned = Object.values(levelScores).reduce((sum, l) => sum + l.earnedScore, 0);
  const totalMax = Object.values(levelScores).reduce((sum, l) => sum + l.maxScore, 0);
  const overallReadiness = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0;

  // 4. Identify Gaps to advance to the next level
  const gaps = [];
  const targetGapLevel = strictTrl < 9 ? strictTrl + 1 : 9;
  const targetQuestions = levelScores[targetGapLevel]?.questions || [];

  targetQuestions.forEach((q) => {
    const val = answers[q.id] !== undefined ? answers[q.id] : 0;
    if (val < 2) {
      gaps.push({
        id: q.id,
        level: targetGapLevel,
        phase: q.phase,
        question: q.question,
        questionTr: q.questionTr,
        helpText: q.helpText,
        helpTextTr: q.helpTextTr,
        currentStatus: val === 1 ? 'Partially Fulfilled' : 'Not Started',
        actionRequired: val === 1 
          ? `Finalize complete testing and official documentation for: ${q.question}`
          : `Initiate study and provide empirical validation for: ${q.question}`
      });
    }
  });

  // 5. Eligible Grants Matching
  const effectiveTrl = Math.max(1, strictTrl);
  const eligibleGrants = GRANT_FUNDING_PROGRAMS.filter(
    (g) => effectiveTrl >= g.minTrl && effectiveTrl <= g.maxTrl
  );

  return {
    strictTrl,
    nextLevel,
    nextLevelProgress,
    overallReadiness,
    levelScores,
    gaps,
    eligibleGrants,
    activeFramework: TRL_FRAMEWORKS.find((f) => f.id === frameworkId) || TRL_FRAMEWORKS[0]
  };
}
