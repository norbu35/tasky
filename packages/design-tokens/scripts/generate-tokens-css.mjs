#!/usr/bin/env node
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import prettier from 'prettier';
import ts from 'typescript';

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const sourceRoot = join(packageRoot, 'src');
const tokensCssPath = join(sourceRoot, 'styles/tokens.css');

const sectionLabels = {
  primitives: 'Primitives (--tenger-*)',
  semanticAliases: 'Semantic aliases (--color-*)',
  radius: 'Radius',
  typography: 'Typography',
  typographyVariants: 'Composed Typography Variants',
  motion: 'Motion',
  interactionStates: 'Interaction States',
  overlays: 'Overlays',
  iconSizes: 'Icon Sizes',
  elevationLayers: 'Elevation Layers',
  shadows: 'Shadows',
  animationPresets: 'Animation Presets',
  opacityColorSteps: 'Opacity Color Steps',
  density: 'Density',
  contentRules: 'Content Rules',
};

const listSourceFiles = (directory) => {
  const results = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      results.push(...listSourceFiles(entryPath));
      continue;
    }

    if (entry.name.endsWith('.ts')) {
      results.push(entryPath);
    }
  }

  return results;
};

const hasRuntimeExtension = (specifier) => extname(specifier) !== '';

const addRuntimeExtensions = (source) =>
  source.replace(/(from\s+['"])(\.{1,2}\/[^'"]+)(['"])/g, (match, prefix, specifier, suffix) =>
    hasRuntimeExtension(specifier) ? match : `${prefix}${specifier}.js${suffix}`,
  );

const compileTokenSources = () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'tasky-design-tokens-'));
  writeFileSync(join(tempRoot, 'package.json'), `${JSON.stringify({ type: 'module' })}\n`);

  for (const sourceFile of listSourceFiles(sourceRoot)) {
    const relativeSourcePath = relative(packageRoot, sourceFile);
    const outputPath = join(tempRoot, relativeSourcePath).replace(/\.ts$/, '.js');
    const transpiled = ts.transpileModule(readFileSync(sourceFile, 'utf8'), {
      fileName: sourceFile,
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ES2022,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        isolatedModules: true,
        verbatimModuleSyntax: true,
      },
    }).outputText;

    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, addRuntimeExtensions(transpiled));
  }

  return tempRoot;
};

const loadWebTokens = async () => {
  const tempRoot = compileTokenSources();

  try {
    const moduleUrl = pathToFileURL(join(tempRoot, 'src/platform/web.js')).href;
    const { webTokens } = await import(moduleUrl);

    return webTokens;
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
};

const renderVariables = (variables) =>
  Object.entries(variables)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join('\n');

const renderSection = (sectionName, variables) =>
  [
    `  /* ===== ${sectionLabels[sectionName] ?? sectionName} ===== */`,
    renderVariables(variables),
  ].join('\n');

export const renderTokensCss = (webTokens) => {
  const rootSections = Object.entries(webTokens.cssVariableSections)
    .map(([sectionName, variables]) => renderSection(sectionName, variables))
    .join('\n\n');
  const darkVariables = renderVariables(webTokens.darkCssVariables);

  return `:root {\n${rootSections}\n}\n\n.dark {\n${darkVariables}\n}\n`;
};

export const generateTokensCss = async () => {
  const prettierConfig = (await prettier.resolveConfig(tokensCssPath)) ?? {};

  return prettier.format(renderTokensCss(await loadWebTokens()), {
    ...prettierConfig,
    parser: 'css',
  });
};

const cliPath = process.argv[1] ? resolve(process.argv[1]) : undefined;
const isCli = cliPath === fileURLToPath(import.meta.url);

if (isCli) {
  const generated = await generateTokensCss();

  if (process.argv.includes('--write')) {
    writeFileSync(tokensCssPath, generated);
  } else if (process.argv.includes('--check')) {
    const current = readFileSync(tokensCssPath, 'utf8');

    if (current !== generated) {
      console.error(
        'Generated tokens.css is stale. Run node packages/design-tokens/scripts/generate-tokens-css.mjs --write.',
      );
      process.exit(1);
    }
  } else {
    process.stdout.write(generated);
  }
}
