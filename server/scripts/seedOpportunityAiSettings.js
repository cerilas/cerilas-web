import 'dotenv/config';
import process from 'node:process';
import pool from '../db.js';
import {
  DEFAULT_OPPORTUNITY_AI_SETTINGS,
  ensureOpportunityAutomationTables,
} from '../services/opportunityScanner.js';

async function seedOpportunityAiSettings() {
  await ensureOpportunityAutomationTables();
  const settings = DEFAULT_OPPORTUNITY_AI_SETTINGS;
  const result = await pool.query(
    `UPDATE opportunity_ai_settings SET
      provider=$1, extraction_model=$2, scoring_model=$3, fallback_model=$4,
      company_profile=$5, personal_profile=$6, opportunity_types=$7,
      excluded_opportunities=$8, target_regions=$9, eligibility_preferences=$10,
      custom_instructions=$11, shortlist_threshold=$12,
      max_candidates_per_source=$13, temperature=$14, score_weights=$15,
      updated_by=NULL, updated_at=NOW()
     WHERE id=1 RETURNING id, provider, extraction_model, scoring_model,
       shortlist_threshold, max_candidates_per_source, updated_at`,
    [
      settings.provider,
      settings.extraction_model,
      settings.scoring_model,
      settings.fallback_model,
      settings.company_profile,
      settings.personal_profile,
      settings.opportunity_types,
      settings.excluded_opportunities,
      settings.target_regions,
      settings.eligibility_preferences,
      settings.custom_instructions,
      settings.shortlist_threshold,
      settings.max_candidates_per_source,
      settings.temperature,
      JSON.stringify(settings.score_weights),
    ]
  );
  console.log('Opportunity AI settings seeded:', result.rows[0]);
}

seedOpportunityAiSettings()
  .catch((error) => {
    console.error('Opportunity AI settings seed failed:', error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
