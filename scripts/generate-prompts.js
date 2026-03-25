#!/usr/bin/env node
/**
 * generate-prompts.js — Transforms screen-specs/ into Stitch-ready prompt YAMLs
 *
 * Reads:  docs/design/screen-specs/SCR-*.yaml
 *         docs/design/journey-catalog.yaml
 *         docs/design/screen-inventory.yaml
 *
 * Writes: docs/design/prompts/screens/SCR-*.yaml
 *         docs/design/prompts/journeys/JRN-*.yaml
 *         docs/design/prompts/prompt-manifest.yaml
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const DESIGN_DIR = path.join(__dirname, '..', 'docs', 'design');
const SPECS_DIR = path.join(DESIGN_DIR, 'screen-specs');
const PROMPTS_DIR = path.join(DESIGN_DIR, 'prompts');
const SCREENS_OUT = path.join(PROMPTS_DIR, 'screens');
const JOURNEYS_OUT = path.join(PROMPTS_DIR, 'journeys');

// ─── Ensure output dirs ───────────────────────────
[SCREENS_OUT, JOURNEYS_OUT].forEach(dir => {
  fs.mkdirSync(dir, { recursive: true });
});

// ─── Load source data ─────────────────────────────
function loadYaml(filepath) {
  return yaml.load(fs.readFileSync(filepath, 'utf8'));
}

const inventory = loadYaml(path.join(DESIGN_DIR, 'screen-inventory.yaml'));
const journeyCatalog = loadYaml(path.join(DESIGN_DIR, 'journey-catalog.yaml'));

// Build screen ID → inventory entry map
const inventoryMap = {};
for (const screen of inventory.screens) {
  inventoryMap[screen.id] = screen;
}

// Build screen ID → journey memberships
const screenToJourneys = {};
for (const journey of journeyCatalog.journeys) {
  const screens = new Set();
  if (journey.happy_path) {
    for (const step of journey.happy_path) {
      if (step.screen) screens.add(step.screen);
    }
  }
  if (journey.alternate_paths) {
    for (const alt of journey.alternate_paths) {
      if (alt.screens) {
        for (const s of alt.screens) screens.add(s);
      }
    }
  }
  for (const scrId of screens) {
    if (!screenToJourneys[scrId]) screenToJourneys[scrId] = [];
    screenToJourneys[scrId].push(journey.id);
  }
}

// ─── Role display label ───────────────────────────
function roleLabel(roles) {
  if (!roles) return 'both';
  if (Array.isArray(roles)) {
    if (roles.includes('customer') && roles.includes('tasker')) return 'both';
    return roles[0];
  }
  return roles;
}

// ─── Template description ─────────────────────────
const templateDescriptions = {
  auth: 'Centered content with single CTA and trust messaging. Comfortable density, vertically centered, primary CTA at bottom.',
  feed_list: 'Sticky header (search bar + filter bar) above a scrollable card feed. Pull-to-refresh, infinite scroll pagination, skeleton loading placeholders.',
  detail: 'Navigation header at top, scrollable content area, sticky bottom CTA bar for primary action.',
  form_wizard: 'Step indicator showing progress, scrollable form fields, back/next navigation at bottom. Keyboard-aware scrolling.',
  settings: 'Grouped list rows with section headers and disclosure indicators. 44pt touch targets.',
  modal_sheet: 'Bottom sheet overlay with drag handle bar, content area, and max 2 action buttons. Branded scrim backdrop.',
  empty_state: 'Centered illustration above headline, description, and actionable CTA button. Comfortable density with generous whitespace.',
  error_state: 'Centered error icon, message text, and retry CTA button. Comfortable density.',
  success_celebration: 'Animated checkmark with spring bounce, headline, "what happens next" text, primary + secondary CTAs.'
};

// ─── Generate screen prompt YAML ──────────────────
function generateScreenPrompt(specPath) {
  const spec = loadYaml(specPath);
  const invEntry = inventoryMap[spec.screen_id] || {};
  const journeys = screenToJourneys[spec.screen_id] || [];

  // Build component list for prompt
  const componentDescriptions = [];
  if (spec.components) {
    for (const comp of spec.components) {
      componentDescriptions.push({
        component: comp.id,
        variant: comp.variant || 'default',
        usage: comp.usage || ''
      });
    }
  }

  // Build state descriptions
  const stateDescriptions = [];
  if (spec.states) {
    for (const state of spec.states) {
      stateDescriptions.push({
        id: state.id,
        description: state.description || '',
        visible: state.components_visible || [],
        hidden: state.components_hidden || []
      });
    }
  }

  // Build copy table
  const copyEntries = [];
  if (spec.copy) {
    for (const c of spec.copy) {
      copyEntries.push({
        key: c.key,
        mn: c.mn,
        en: c.en
      });
    }
  }

  // Compose the natural-language prompt for Stitch
  const role = roleLabel(spec.role);
  const roleText = role === 'both' ? 'both Customer and Tasker roles' :
                   role === 'customer' ? 'Customer role' : 'Tasker role';
  const templateDesc = templateDescriptions[spec.template] || spec.template;

  let promptParts = [];
  promptParts.push(`Design a mobile app screen for "${spec.name}" (${spec.screen_id}) in the Tasky app — Mongolia's domestic service marketplace.`);
  promptParts.push(`This screen is used by ${roleText}.`);
  promptParts.push(`Template: ${spec.template} — ${templateDesc}`);

  if (spec.layout && spec.layout.structure) {
    promptParts.push(`Layout structure: ${spec.layout.structure}`);
  }

  if (componentDescriptions.length > 0) {
    promptParts.push('Components used:');
    for (const cd of componentDescriptions) {
      promptParts.push(`  • ${cd.component} (${cd.variant}): ${cd.usage}`);
    }
  }

  if (stateDescriptions.length > 0) {
    promptParts.push(`This screen has ${stateDescriptions.length} states — generate the primary/default state:`);
    promptParts.push(`  Primary state: ${stateDescriptions[0].description}`);
  }

  if (copyEntries.length > 0) {
    promptParts.push('Key copy (Mongolian primary):');
    for (const ce of copyEntries.slice(0, 6)) { // limit to avoid overlong prompt
      promptParts.push(`  • ${ce.key}: "${ce.mn}" (${ce.en})`);
    }
  }

  promptParts.push('Style: Deep blue (#1B3A5C) primary, gold (#C49A3C) accents, off-white (#F9F8F5) background. Manrope for headings, Plus Jakarta Sans for body. 16px minimum body text. Clean, professional, premium feel. Mongolian Cyrillic text.');

  const prompt = promptParts.join('\n');

  // Build the output YAML object
  const output = {
    screen_id: spec.screen_id,
    name: spec.name,
    role: spec.role,
    phase: spec.phase,
    template: spec.template,
    route: spec.route || null,

    context_refs: {
      global: 'prompts/global-context.yaml',
      journeys: journeys.length > 0 ? journeys.map(j => `prompts/journeys/${j}.yaml`) : ['none']
    },

    stitch_prompt: prompt,

    layout: spec.layout || {},

    components: componentDescriptions,

    states: stateDescriptions,

    copy: copyEntries,

    acceptance_criteria: spec.acceptance_criteria || [],

    api_endpoints: spec.api_endpoints || [],
    analytics_events: spec.analytics_events || [],

    state_prompts: stateDescriptions.map(s => {
      const parts = [];
      parts.push(`Generate the "${s.id}" state of "${spec.name}".`);
      parts.push(s.description);
      if (s.visible && s.visible.length > 0) {
        parts.push(`Visible elements: ${s.visible.join(', ')}`);
      }
      if (s.hidden && s.hidden.length > 0) {
        parts.push(`Hidden elements: ${s.hidden.join(', ')}`);
      }
      parts.push('Style: Deep blue (#1B3A5C) primary, gold (#C49A3C) accents, off-white (#F9F8F5) background. Mongolian Cyrillic text. 16px minimum body text.');
      return {
        state_id: s.id,
        prompt: parts.join('\n')
      };
    })
  };

  return output;
}

// ─── Generate journey context YAML ────────────────
function generateJourneyContext(journey) {
  const steps = [];
  if (journey.happy_path) {
    for (const step of journey.happy_path) {
      const inv = inventoryMap[step.screen] || {};
      steps.push({
        step: step.step,
        screen_id: step.screen,
        screen_name: inv.name || step.screen,
        action: step.action,
        next: step.next || null,
        lifecycle: step.lifecycle || null
      });
    }
  }

  const alternates = [];
  if (journey.alternate_paths) {
    for (const alt of journey.alternate_paths) {
      alternates.push({
        id: alt.id,
        name: alt.name,
        branch_at_step: alt.branch_at,
        condition: alt.condition,
        screens: alt.screens || [],
        outcome: alt.outcome
      });
    }
  }

  return {
    journey_id: journey.id,
    name: journey.name,
    actor: journey.actor,
    phase: journey.phase,
    goal: journey.goal,
    entry_screen: journey.entry,
    exit_screens: journey.exit,
    happy_path: steps,
    alternate_paths: alternates,
    visual_consistency_note: `All screens in this journey should share visual continuity — consistent header style, navigation patterns, and color usage. Screens in sequence should feel like a cohesive flow.`
  };
}

// ─── Main ─────────────────────────────────────────
function main() {
  console.log('🎨 Generating Stitch prompt files...\n');

  // 1. Generate journey context files
  const journeyIds = [];
  for (const journey of journeyCatalog.journeys) {
    const ctx = generateJourneyContext(journey);
    const outPath = path.join(JOURNEYS_OUT, `${journey.id}.yaml`);
    fs.writeFileSync(outPath, yaml.dump(ctx, { lineWidth: 120, noRefs: true }));
    journeyIds.push(journey.id);
    console.log(`  ✓ Journey: ${journey.id} — ${journey.name}`);
  }
  console.log(`\n  📁 ${journeyIds.length} journey context files generated.\n`);

  // 2. Generate screen prompt files
  const specFiles = fs.readdirSync(SPECS_DIR).filter(f => f.endsWith('.yaml')).sort();
  const manifest = [];
  let count = 0;

  for (const file of specFiles) {
    const specPath = path.join(SPECS_DIR, file);
    const promptData = generateScreenPrompt(specPath);
    const outPath = path.join(SCREENS_OUT, file);
    fs.writeFileSync(outPath, yaml.dump(promptData, { lineWidth: 120, noRefs: true }));

    manifest.push({
      screen_id: promptData.screen_id,
      name: promptData.name,
      role: promptData.role,
      phase: promptData.phase,
      template: promptData.template,
      journeys: screenToJourneys[promptData.screen_id] || [],
      prompt_file: `prompts/screens/${file}`,
      state_count: promptData.states.length,
      has_api: (promptData.api_endpoints && promptData.api_endpoints.length > 0)
    });

    count++;
    console.log(`  ✓ Screen: ${promptData.screen_id} — ${promptData.name}`);
  }
  console.log(`\n  📁 ${count} screen prompt files generated.\n`);

  // 3. Generate prompt manifest
  const manifestData = {
    version: '1.0',
    generated_at: new Date().toISOString(),
    total_screens: count,
    total_journeys: journeyIds.length,
    generation_order: [
      { group: 'shared', description: 'Auth, onboarding, profile, inbox — foundation screens', screens: manifest.filter(m => m.screen_id.startsWith('SCR-SHARED')).map(m => m.screen_id) },
      { group: 'infrastructure', description: 'Error, offline, update, legal — system screens', screens: manifest.filter(m => m.screen_id.startsWith('SCR-INFRA')).map(m => m.screen_id) },
      { group: 'customer', description: 'Task posting, applicants, bookings, disputes — customer flow', screens: manifest.filter(m => m.screen_id.startsWith('SCR-CUST')).map(m => m.screen_id) },
      { group: 'tasker', description: 'Browse, verify, apply, manage jobs — tasker flow', screens: manifest.filter(m => m.screen_id.startsWith('SCR-TASK')).map(m => m.screen_id) },
      { group: 'b2b', description: 'Business accounts, account-scoped posting, task oversight, and billing', screens: manifest.filter(m => m.screen_id.startsWith('SCR-B2B')).map(m => m.screen_id) },
      { group: 'phase_2', description: 'Credits, payments, referrals — monetization', screens: manifest.filter(m => m.screen_id.startsWith('SCR-P2')).map(m => m.screen_id) },
      { group: 'phase_3', description: 'Wallet, escrow, subscription, instant match — advanced', screens: manifest.filter(m => m.screen_id.startsWith('SCR-P3')).map(m => m.screen_id) }
    ],
    screens: manifest
  };

  const manifestPath = path.join(PROMPTS_DIR, 'prompt-manifest.yaml');
  fs.writeFileSync(manifestPath, yaml.dump(manifestData, { lineWidth: 120, noRefs: true }));
  console.log(`  ✓ Manifest: prompt-manifest.yaml\n`);

  console.log('✅ Done! All prompt files generated.');
  console.log(`   Screens: ${count}`);
  console.log(`   Journeys: ${journeyIds.length}`);
  console.log(`   Manifest: prompt-manifest.yaml`);
}

main();
