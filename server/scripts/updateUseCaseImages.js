import pool from '../db.js';

const imageMapping = {
  'HealthTech': [
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1504813184591-01592fd03cf7?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&q=80&w=1200'
  ],
  'Manufacturing': [
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1565034946487-077786996e27?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1537462715879-360eeb61a0ad?auto=format&fit=crop&q=80&w=1200'
  ],
  'Logistics & Smart Cities': [
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1473960104312-d2e11b03031e?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1519003722824-191d446d33db?auto=format&fit=crop&q=80&w=1200'
  ],
  'Finance & FinTech': [
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1454165833267-020556f8f553?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1611974714851-eb605161ca25?auto=format&fit=crop&q=80&w=1200'
  ],
  'Retail & E-commerce': [
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1556742044-3c52d6e88c62?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=1200'
  ],
  'HR & Recruiting': [
    'https://images.unsplash.com/photo-1521737706045-8a1836b95938?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=1200'
  ],
  'Energy & Sustainability': [
    'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1466611653911-95281773ad90?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&q=80&w=1200'
  ],
  'Customer Experience': [
    'https://images.unsplash.com/photo-1534536281715-e28d76689b4d?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=1200'
  ],
  'Legal & Enterprise': [
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1200'
  ],
  'Aviation & Defense': [
    'https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1530893609608-32a9af3aa95c?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=1200'
  ]
};

async function updateImages() {
  console.log('Starting image update process...');
  
  try {
    // 1. Get all use cases
    const { rows: useCases } = await pool.query('SELECT id, tags_en, title_en FROM use_cases');
    
    console.log(`Found ${useCases.length} use cases to update.`);

    for (const uc of useCases) {
      // Find matching sector based on tags or title
      let matchedSector = 'Legal & Enterprise'; // default
      
      for (const sector of Object.keys(imageMapping)) {
        if (uc.tags_en && uc.tags_en.some(tag => sector.toLowerCase().includes(tag.toLowerCase()))) {
          matchedSector = sector;
          break;
        }
      }

      // If no tag match, try title keywords (crude but works for seed data)
      if (matchedSector === 'Legal & Enterprise') {
        const titleLine = uc.title_en.toLowerCase();
        if (titleLine.includes('health') || titleLine.includes('patient') || titleLine.includes('medical')) matchedSector = 'HealthTech';
        else if (titleLine.includes('manufact') || titleLine.includes('facto') || titleLine.includes('robot')) matchedSector = 'Manufacturing';
        else if (titleLine.includes('logist') || titleLine.includes('city') || titleLine.includes('drone')) matchedSector = 'Logistics & Smart Cities';
        else if (titleLine.includes('finan') || titleLine.includes('bank') || titleLine.includes('invest')) matchedSector = 'Finance & FinTech';
        else if (titleLine.includes('retail') || titleLine.includes('shop') || titleLine.includes('e-com')) matchedSector = 'Retail & E-commerce';
        else if (titleLine.includes('hr') || titleLine.includes('recruit') || titleLine.includes('office')) matchedSector = 'HR & Recruiting';
        else if (titleLine.includes('energy') || titleLine.includes('sustain') || titleLine.includes('solar')) matchedSector = 'Energy & Sustainability';
        else if (titleLine.includes('custom') || titleLine.includes('cx') || titleLine.includes('support')) matchedSector = 'Customer Experience';
        else if (titleLine.includes('aviat') || titleLine.includes('defen') || titleLine.includes('space')) matchedSector = 'Aviation & Defense';
      }

      const images = imageMapping[matchedSector];
      const selectedImage = images[Math.floor(Math.random() * images.length)];

      await pool.query('UPDATE use_cases SET cover_image_url = $1 WHERE id = $2', [selectedImage, uc.id]);
      process.stdout.write('.'); // progress indicator
    }

    console.log('\nSuccessfully updated all use case images!');
  } catch (error) {
    console.error('\nError updating images:', error);
  } finally {
    process.exit(0);
  }
}

updateImages();
