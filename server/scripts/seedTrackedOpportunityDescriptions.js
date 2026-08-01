import pool from '../db.js';

const updates = [
  {
    id: 2,
    description: 'KOBİ, teknoloji girişimi, dijital dönüşüm, kapasite geliştirme ve teknoloji merkezi odaklı ulusal destek programları.',
    note: 'Konsept: KOBİ ve teknoloji tabanlı girişim destekleri. Alanlar: Ar-Ge, inovasyon, dijital dönüşüm, imalat, savunma/uzay/havacılık, TEKMER ve girişimcilik. Fırsat: Hibe, geri ödemeli destek, kapasite geliştirme ve çağrı bazlı başvurular. Takip: Duyurular ve destek programları aylık kontrol edilmeli.',
  },
  {
    id: 3,
    description: 'TÜBİTAK duyuruları üzerinden sanayi Ar-Ge, TEYDEB, akademik, uluslararası ve yapay zeka odaklı çağrı takibi.',
    note: 'Konsept: Türkiye bilim, teknoloji ve Ar-Ge desteklerinin ana duyuru havuzu. Alanlar: TEYDEB 1501/1507/1707, 1711 yapay zeka, 1812 BiGG, akademik destekler, uluslararası iş birlikleri, yeşil dönüşüm. Fırsat: Hibe, ortaklı Ar-Ge, siparişe dayalı Ar-Ge, girişim yatırımı ve proje çağrıları. Takip: Sanayi ulusal destekler ve duyurular ayrı ayrı izlenmeli.',
  },
  {
    id: 4,
    description: 'Startup, KOBİ ve teknoloji ekipleri için accelerator, grant, challenge ve yatırım programlarını listeleyen global platform.',
    note: 'Konsept: Global startup ve scale-up fırsat pazarı. Alanlar: yapay zeka, SaaS, healthtech, climate, fintech, deep tech, accelerator ve grant programları. Fırsat: Hibe, hızlandırıcı, yatırımcı tanışması, pilot müşteri ve yarışma başvuruları. Takip: Arama filtreleriyle robotics, AI, healthcare, grant, EU funding anahtar kelimeleri takip edilmeli.',
  },
  {
    id: 5,
    description: 'AB cascade funding/FSTP çağrılarını tek yerde izlemek için açık çağrı listesi.',
    note: 'Konsept: Horizon Europe projelerinden KOBİ/startup/araştırmacılara dağıtılan cascade funding çağrıları. Alanlar: yapay zeka, robotik, veri, IoT, dijital dönüşüm, sağlık, enerji, üretim, yeşil teknolojiler. Fırsat: Küçük-orta ölçekli hibe, pilot, testbed, voucher, mentoring ve konsorsiyum başvuruları. Takip: Deadline odaklı haftalık kontrol edilmeli.',
  },
  {
    id: 6,
    description: 'Sağlık teknolojileri, biyoteknoloji, klinik araştırmalar, sağlık verisi ve yapay zeka odaklı TÜSEB çağrıları.',
    note: 'Konsept: Türkiye sağlık Ar-Ge ve proje destekleri. Alanlar: medtech, biotech, dijital sağlık, sağlıkta yapay zeka, klinik araştırmalar, veri, halk sağlığı ve sağlık politikaları. Fırsat: A/B/C/D grubu proje destekleri, ödüller, çağrı programları ve sağlık inovasyonu fonları. Takip: TBYS aktif çağrı ekranı ve proje destekleri menüsü kontrol edilmeli.',
  },
  {
    id: 7,
    description: 'FundingBox/OnePass ekosisteminde AB destekli fırsat, eğitim, teknoloji ve cascade funding çağrıları.',
    note: 'Konsept: AB odaklı fırsat ve topluluk platformu. Alanlar: deep tech, AI, robotics, SME innovation, digital, green, health, manufacturing. Fırsat: Cascade funding, açık çağrı, eğitim, mentorluk, pilot ve proje partnerliği. Takip: Public OnePass fırsat listesi genişletilmiş sayfa boyutu ve açık detay sayfalarıyla günlük otomatik taranır; API ve hesap alanlarına girilmez.',
  },
  {
    id: 8,
    description: 'Horizon Europe ve diğer AB programları için resmi çağrı/proposal havuzu.',
    note: 'Konsept: Avrupa Komisyonu resmi funding portalı. Alanlar: Horizon Europe, Digital Europe, EU4Health, LIFE, innovation actions, RIA/IA/CSA, yapay zeka, robotik, sağlık, enerji, iklim, üretim. Fırsat: Konsorsiyumlu hibe, araştırma ve inovasyon projeleri, pilot/demo çağrıları. Takip: Status=open/upcoming ve startDate sıralamasıyla haftalık izlenmeli.',
  },
  {
    id: 9,
    description: 'AB kurumları ve programları için ihale/tender fırsatlarının resmi takip ekranı.',
    note: 'Konsept: AB ihale ve hizmet alımı fırsatları. Alanlar: danışmanlık, yazılım, araştırma hizmetleri, teknik destek, veri analitiği, platform geliştirme, değerlendirme ve eğitim. Fırsat: Tender, framework contract, service procurement ve teknik teklif başvuruları. Takip: Hibe değil, satış/ihale kanalı olarak ayrı değerlendirilmeli.',
  },
  {
    id: 10,
    description: 'EIC Accelerator 2026 tematik challenge çağrıları; yüksek etkili deep-tech ve game-changing inovasyonlar.',
    note: 'Konsept: Avrupa İnovasyon Konseyi’nin önceden tanımlı stratejik challenge çağrıları. Alanlar: ileri malzemeler, enerji depolama, füzyon, biotech/agritech, kritik hammaddeler, iklim adaptasyonu ve deep tech. Fırsat: Startup/KOBİ için grant + equity/blended finance ve Avrupa ölçeğinde büyüme desteği. Takip: CERİLAS için AI/robotik doğrudan değilse challenge uyumu dikkatle kontrol edilmeli.',
  },
  {
    id: 11,
    description: 'EIC Accelerator Open; TRL 6-8 seviyesinde pazar bozucu teknoloji geliştiren startup ve KOBİ’ler için grant/yatırım.',
    note: 'Konsept: Topic bağımsız Avrupa deep-tech ölçekleme fonu. Alanlar: yapay zeka, robotik, healthtech, medtech, climate/deep tech, ileri mühendislik, yazılım ve donanım ürünleri. Fırsat: 2.5M EUR altı grant, 1-10M EUR yatırım, coaching, mentoring ve BAS destekleri. Takip: Yüksek rekabetli; ürünleşmiş, global pazar ve yatırım hikayesi olan projeler için saklanmalı.',
  },
  {
    id: 12,
    description: 'Eureka program ve çağrıları; uluslararası KOBİ liderliğinde pazara yakın Ar-Ge iş birlikleri.',
    note: 'Konsept: Ülkeler arası Ar-Ge ve inovasyon ağı. Alanlar: Eurostars, Network Projects, Globalstars, Clusters, startup/KOBİ Ar-Ge, endüstriyel teknoloji. Fırsat: Uluslararası ortaklı proje, ülke bazlı ulusal fonlama, pazar odaklı Ar-Ge. Takip: Türkiye uygunluğu için TÜBİTAK/Eureka ülke koşulları birlikte kontrol edilmeli.',
  },
  {
    id: 13,
    description: 'ICMPD güncel ihaleleri; göç, kalkınma, kapasite geliştirme ve dijital hizmet alımları için tender ekranı.',
    note: 'Konsept: Uluslararası kurum ihale platformu. Alanlar: yazılım, veri, eğitim, kapasite geliştirme, araştırma, değerlendirme, proje yönetimi, teknik danışmanlık. Fırsat: Hizmet alımı, danışmanlık ve teknik teklif. Takip: Ar-Ge hibesi değil; uygun başlıklarda teknoloji/danışmanlık satışı fırsatı olarak izlenmeli.',
  },
  {
    id: 14,
    description: 'ICMPD grant application ekranı; proje hibesi ve başvuruya açık grant süreçlerini takip etmek için.',
    note: 'Konsept: ICMPD hibe başvuruları ve appraisal süreçleri. Alanlar: göç, istihdam, kapasite geliştirme, sosyal etki, dijital araçlar, eğitim ve proje uygulama. Fırsat: Grant application ve proje bazlı fonlama. Takip: Anti-bot/JS nedeniyle otomatik scraping zor; manuel girişle aktif grant var mı kontrol edilmeli.',
  },
  {
    id: 15,
    description: 'İpekyolu Kalkınma Ajansı mali destek programları; bölgesel kalkınma, teknoloji ve üretim odaklı çağrılar.',
    note: 'Konsept: Gaziantep/Adıyaman/Kilis bölgesi için bölgesel kalkınma destekleri. Alanlar: üretim, dijitalleşme, yeşil dönüşüm, girişimcilik, istihdam, turizm, sosyal kalkınma, teknik destek. Fırsat: Mali destek, teknik destek, fizibilite ve bölgesel hibe programları. Takip: Bölgesel uygunluk nedeniyle CERİLAS için yüksek öncelikli; site doğrulama/anti-bot çıkarabilir.',
  },
  {
    id: 16,
    description: 'EIT Health açık çağrıları; sağlık inovasyonu, medtech, biotech, digital health ve AI çözümleri için Avrupa fırsatları.',
    note: 'Konsept: Avrupa sağlık inovasyonu ekosistemi. Alanlar: digital health, biotech, medtech, AI, klinik validasyon, market uptake, eğitim ve startup büyütme. Fırsat: Innovation funding, business creation, education, expert pool ve sağlıkta ticarileşme çağrıları. Takip: CERİLAS sağlık teknolojileri için yüksek öncelikli; open/upcoming fırsatlar aylık izlenmeli.',
  },
  {
    id: 17,
    description: 'EIT genel fırsat ekranı; eğitim, startup, inovasyon projesi, business creation ve tematik topluluk çağrıları.',
    note: 'Konsept: EIT Community genel açık fırsat havuzu. Alanlar: digital, health, mobility, food, climate, manufacturing, raw materials, creativity, water. Fırsat: Eğitim, hızlandırıcı, pitch competition, innovation project, venture building ve topluluk çağrıları. Takip: EIT Health dışındaki digital/manufacturing/mobility çağrıları da CERİLAS için taranmalı.',
  },
  {
    id: 18,
    description: 'ITEA4 Eureka Cluster; yazılım inovasyonu ve endüstriyel dijital Ar-Ge projeleri için uluslararası çağrı.',
    note: 'Konsept: Software innovation odaklı Eureka Cluster. Alanlar: yapay zeka, gömülü yazılım, cyber-physical systems, healthcare software, endüstriyel yazılım, IoT, veri platformları. Fırsat: Uluslararası konsorsiyum, PO/FPP başvurusu, ülke bazlı ulusal fonlama. Takip: 2026 çağrı takvimi ve Project Outline tarihleri yakından izlenmeli.',
  },
  {
    id: 19,
    description: 'Xecs Eureka Cluster; elektronik bileşenler, gömülü sistemler ve yarı iletken değer zinciri için uluslararası Ar-Ge fonları.',
    note: 'Konsept: Electronic Components and Systems alanında Eureka Cluster. Alanlar: embedded systems, semiconductors, sensors, edge AI, IoT, hardware/software entegrasyonu, endüstriyel elektronik. Fırsat: Uluslararası proje etiketi, ülke bazlı fonlama ve sanayi konsorsiyumları. Takip: Türkiye fonlama irtibatı TÜBİTAK görünüyor; ulusal başvuru takvimi ayrıca kontrol edilmeli.',
  },
  {
    id: 20,
    description: 'Eurogia 2030; düşük karbon enerji teknolojileri ve sürdürülebilir enerji sistemleri için Eureka Cluster çağrıları.',
    note: 'Konsept: Clean energy ve low-carbon technology odaklı uluslararası Ar-Ge. Alanlar: enerji verimliliği, yenilenebilir enerji, hidrojen, depolama, karbon azaltımı, akıllı şebeke, sürdürülebilir endüstri. Fırsat: Konsorsiyumlu Ar-Ge, Eureka etiketi ve ülke bazlı fonlama. Takip: CERİLAS için enerji/iklim/akıllı sistemler projesi varsa orta-yüksek öncelikli.',
  },
];

async function seed() {
  for (const item of updates) {
    await pool.query(
      `UPDATE tracked_opportunities
       SET description = $1, note = $2, updated_at = NOW()
       WHERE id = $3`,
      [item.description, item.note, item.id]
    );
  }

  console.log(`Seeded ${updates.length} tracked opportunity descriptions.`);
}

seed()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
