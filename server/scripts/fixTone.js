import pool from '../db.js';

const replacements = [
  // Suffixes and common verbs
  { from: /geliştirdik/g, to: 'geliştirir' },
  { from: /sunduk/g, to: 'sunar' },
  { from: /getirdik/g, to: 'getirir' },
  { from: /kurduk/g, to: 'kurar' },
  { from: /ettik/g, to: 'eder' },
  { from: /oluşturduk/g, to: 'oluşturur' },
  { from: /sağladık/g, to: 'sağlar' },
  { from: /çözdük/g, to: 'çözer' },
  { from: /yaptık/g, to: 'yapar' },
  { from: /izledik/g, to: 'izler' },
  { from: /analiz ettik/g, to: 'analiz eder' },
  { from: /entegre ettik/g, to: 'entegre eder' },
  { from: /optimize ettik/g, to: 'optimize eder' },
  { from: /yönetiyoruz/g, to: 'yönetir' },
  { from: /çözüyoruz/g, to: 'çözer' },
  { from: /sunuyoruz/g, to: 'sunar' },
  { from: /kuruyoruz/g, to: 'kurar' },
  { from: /sağlıyoruz/g, to: 'sağlar' },
  { from: /geliştiriyoruz/g, to: 'geliştirir' },
  
  // Potential mood (yapılabilir/edilebilir style) where it sounds better
  { from: /kurar\./g, to: 'kurulabilir.' },
  { from: /sunar\./g, to: 'sunulabilir.' },
  { from: /geliştirir\./g, to: 'geliştirilebilir.' },
  { from: /getirir\./g, to: 'getirilebilir.' },
  { from: /çözer\./g, to: 'çözülebilir.' },
  { from: /sağlar\./g, to: 'sağlanabilir.' }
];

async function fixTone() {
  console.log('Fixing use case tone (Turkish)...');
  
  try {
    const { rows: useCases } = await pool.query('SELECT id, solution_tr, title_tr, problem_tr FROM use_cases');
    
    for (const uc of useCases) {
      let tr = uc.solution_tr || '';
      let title = uc.title_tr || '';
      let problem = uc.problem_tr || '';
      
      replacements.forEach(r => {
        tr = tr.replace(r.from, r.to);
        title = title.replace(r.from, r.to);
        problem = problem.replace(r.from, r.to);
      });

      // Special case: "Cerilas ... sunar" is fine, but "Geliştirdik" -> "Geliştirir" might need "Cerilas" in front.
      // If we see a sentence ending in "geliştirir.", we might want "geliştirilir." or "geliştirilebilir."
      // I've added some of these above.

      if (tr !== uc.solution_tr || title !== uc.title_tr || problem !== uc.problem_tr) {
        await pool.query(
          'UPDATE use_cases SET solution_tr = $1, title_tr = $2, problem_tr = $3 WHERE id = $4',
          [tr, title, problem, uc.id]
        );
        process.stdout.write('.');
      }
    }

    console.log('\nDone! Tone revised to 3rd person / potential mood.');
  } catch (error) {
    console.error('Error fixing tone:', error);
  } finally {
    process.exit(0);
  }
}

fixTone();
