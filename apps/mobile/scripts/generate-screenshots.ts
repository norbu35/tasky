#!/usr/bin/env npx ts-node
/**
 * generate-screenshots.ts
 *
 * Produces app store screenshots for Tasky across required device sizes and locales.
 * Uses Maestro (https://maestro.mobile.dev/) for headless capture.
 *
 * Usage:
 *   cd apps/mobile
 *   npx ts-node scripts/generate-screenshots.ts [--locale en|mn] [--device 6.7|6.5|5.5]
 *
 * Prerequisites:
 *   - Maestro CLI installed: curl -Ls "https://get.maestro.mobile.dev" | bash
 *   - Android emulator running OR iOS simulator open
 *   - App built and installed on the target device
 *
 * Output:
 *   apps/mobile/screenshots/<locale>/<device>/
 *     01_home.png
 *     02_task_detail.png
 *     03_booking.png
 *     04_profile.png
 *     05_chat.png
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const SCREENSHOTS_DIR = path.resolve(__dirname, '..', 'screenshots');

const LOCALES = ['en', 'mn'] as const;
type Locale = (typeof LOCALES)[number];

const DEVICES = ['6.7', '6.5', '5.5'] as const;
type Device = (typeof DEVICES)[number];

const SCREENS = [
  { name: '01_home', flowId: 'home_screen' },
  { name: '02_task_detail', flowId: 'task_detail_screen' },
  { name: '03_booking', flowId: 'booking_screen' },
  { name: '04_profile', flowId: 'profile_screen' },
  { name: '05_chat', flowId: 'chat_screen' },
] as const;

function parseArgs(): { locale?: Locale; device?: Device } {
  const args = process.argv.slice(2);
  let locale: Locale | undefined;
  let device: Device | undefined;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--locale' && args[i + 1]) {
      locale = args[i + 1] as Locale;
      i++;
    } else if (args[i] === '--device' && args[i + 1]) {
      device = args[i + 1] as Device;
      i++;
    }
  }
  return { locale, device };
}

function runMaestro(flowId: string, outputPath: string): void {
  const flowFile = path.resolve(__dirname, '..', '.maestro', `${flowId}.yaml`);
  if (!fs.existsSync(flowFile)) {
    console.warn(
      `  SKIP: Maestro flow not found at ${flowFile}. Create it to enable screenshot capture.`,
    );
    return;
  }

  try {
    execSync(`maestro test ${flowFile} --format junit`, {
      stdio: 'pipe',
      timeout: 60_000,
    });
    // Maestro saves screenshots to its own output dir; move them.
    // Adjust this logic based on your Maestro screenshot configuration.
    const maestroOutput = path.resolve(__dirname, '..', '.maestro', 'output');
    const latestScreenshot = fs
      .readdirSync(maestroOutput)
      .filter((f) => f.endsWith('.png'))
      .sort()
      .pop();

    if (latestScreenshot) {
      fs.copyFileSync(path.join(maestroOutput, latestScreenshot), outputPath);
      console.log(`  OK: ${outputPath}`);
    }
  } catch {
    console.warn(`  SKIP: Maestro flow ${flowId} failed. Is the app running?`);
  }
}

function main(): void {
  const { locale: filterLocale, device: filterDevice } = parseArgs();
  const locales = filterLocale ? [filterLocale] : [...LOCALES];
  const devices = filterDevice ? [filterDevice] : [...DEVICES];

  console.log('Tasky Screenshot Generator');
  console.log('==========================\n');

  for (const locale of locales) {
    for (const device of devices) {
      const dir = path.join(SCREENSHOTS_DIR, locale, device);
      fs.mkdirSync(dir, { recursive: true });
      console.log(`\n[${locale}] [${device}"] → ${dir}`);

      for (const screen of SCREENS) {
        const outputPath = path.join(dir, `${screen.name}.png`);
        runMaestro(screen.flowId, outputPath);
      }
    }
  }

  console.log('\nDone. Review screenshots in: ' + SCREENSHOTS_DIR);
  console.log('NOTE: If flows were skipped, create Maestro YAML files in apps/mobile/.maestro/');
}

main();
