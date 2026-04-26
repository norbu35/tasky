import fs from 'node:fs';
import path from 'node:path';

const mobileRoot = path.resolve(__dirname, '..');

describe('Android Google Maps native config', () => {
  it('binds the Maps SDK key through a manifest placeholder resolved from env files', () => {
    const manifest = fs.readFileSync(
      path.join(mobileRoot, 'android/app/src/main/AndroidManifest.xml'),
      'utf8',
    );
    const buildGradle = fs.readFileSync(path.join(mobileRoot, 'android/app/build.gradle'), 'utf8');

    expect(manifest).toContain('android:name="com.google.android.geo.API_KEY"');
    expect(manifest).toContain('android:value="${googleMapsApiKey}"');
    expect(buildGradle).toContain('manifestPlaceholders["googleMapsApiKey"]');
    expect(buildGradle).toContain('GOOGLE_MAPS_ANDROID_API_KEY');
    expect(buildGradle).toContain('GOOGLE_MAPS_API_KEY');
  });
});
