import { useState, useEffect } from 'react';
import { useLang } from '../context/LanguageContext';

function mapProject(row, lang) {
  const l = lang === 'tr' ? 'tr' : 'en';
  return {
    id: row.slug,
    title: row[`title_${l}`],
    date: row[`date_${l}`],
    tags: row[`tags_${l}`] || [],
    shortDesc: row[`short_desc_${l}`],
    challenge: row[`challenge_${l}`],
    solution: row[`solution_${l}`],
    impact: row[`impact_${l}`],
    technologies: row.technologies || [],
    grant: row.grant_info,
    university: row.university,
    academicStaff: row.academic_staff,
    partner: row.partner,
    budget: row.budget,
    imageUrl: row.image_url,
  };
}

export function useProjects() {
  const { lang } = useLang();
  const [projects, setProjects] = useState(null);

  useEffect(() => {
    fetch('/api/projects')
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((rows) => setProjects(rows.map((r) => mapProject(r, lang))))
      .catch(() => setProjects(null));
  }, [lang]);

  return projects ?? [];
}

export function useProject(id) {
  const { lang } = useLang();
  const [project, setProject] = useState(undefined); // undefined = loading

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((row) => setProject(mapProject(row, lang)))
      .catch(() => setProject(null));
  }, [id, lang]);

  if (project === undefined) return { loading: true, project: null };
  if (project === null) {
    return { loading: false, project: null };
  }
  return { loading: false, project };
}
