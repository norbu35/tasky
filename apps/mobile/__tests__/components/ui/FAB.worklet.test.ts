import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('FAB gesture worklets', () => {
  it('keeps spring animation calls directly worklet-safe inside gesture callbacks', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/components/ui/FAB.tsx'), 'utf8');

    expect(source).toContain("from 'react-native-reanimated'");
    expect(source).toContain('withSpring');
    expect(source).toContain('springs.floating');
    expect(source).not.toContain('withFloatingSpring');
  });
});
