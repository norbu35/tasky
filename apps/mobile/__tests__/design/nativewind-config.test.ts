import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('NativeWind configuration', () => {
  it('TID-TASK-116-MOBILE-NATIVEWIND-FOUNDATION wires the stable NativeWind v4 Expo setup at the app root', () => {
    const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const babelSource = readFileSync(resolve(process.cwd(), 'babel.config.js'), 'utf8');
    const appConfig = JSON.parse(readFileSync(resolve(process.cwd(), 'app.json'), 'utf8')) as {
      expo?: { plugins?: (string | [string, Record<string, unknown>])[] };
    };
    const tsconfig = JSON.parse(readFileSync(resolve(process.cwd(), 'tsconfig.json'), 'utf8')) as {
      include?: string[];
    };
    const rootLayoutSource = readFileSync(resolve(process.cwd(), 'src/app/_layout.tsx'), 'utf8');
    const tailwindConfigSource = readFileSync(resolve(process.cwd(), 'tailwind.config.ts'), 'utf8');
    const metroConfigSource = readFileSync(resolve(process.cwd(), 'metro.config.js'), 'utf8');
    const globalCssSource = readFileSync(resolve(process.cwd(), 'global.css'), 'utf8');
    const nativewindEnvSource = readFileSync(
      resolve(process.cwd(), 'nativewind-env.d.ts'),
      'utf8',
    );

    expect(packageJson.dependencies?.nativewind).toBeDefined();
    expect(packageJson.devDependencies?.tailwindcss).toBeDefined();
    expect(packageJson.dependencies?.['expo-font']).toBeDefined();
    expect(babelSource).toContain('jsxImportSource');
    expect(babelSource).toContain('nativewind');
    expect(babelSource).toContain('react-native-reanimated/plugin');
    expect(rootLayoutSource).toMatch(/import\s+['"]\.\.\/\.\.\/global\.css['"]/);
    expect(tailwindConfigSource).toContain("nativewind/preset");
    expect(tailwindConfigSource).toContain('nativeTokens');
    expect(metroConfigSource).toContain('withNativeWind');
    expect(globalCssSource).toContain('@tailwind base;');
    expect(globalCssSource).toContain('@tailwind utilities;');
    expect(nativewindEnvSource).toContain('nativewind/types');
    expect(tsconfig.include).toContain('nativewind-env.d.ts');
    expect(appConfig.expo?.plugins?.some((entry) => Array.isArray(entry) && entry[0] === 'expo-font')).toBe(
      true,
    );
  });
});
