import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const appRoot = process.cwd();
const repoRoot = resolve(appRoot, '..', '..');

describe('Generic web container overlay contract', () => {
  test('TID-TASK-111-ENV-WEB-CONTAINER-OVERLAY keeps base compose generic and isolates web adapter config', () => {
    const baseCompose = readFileSync(resolve(repoRoot, 'docker-compose.yml'), 'utf8');
    const overlayCompose = readFileSync(resolve(repoRoot, 'docker-compose.web.yml'), 'utf8');

    expect(baseCompose).not.toContain('tasky-web');

    expect(overlayCompose).toContain('services:');
    expect(overlayCompose).toContain('web:');
    expect(overlayCompose).toContain('dockerfile: apps/web/Dockerfile');
    expect(overlayCompose).toContain('ports:');
    expect(overlayCompose).toContain('WEB_PORT');
    expect(overlayCompose).not.toContain('the-grid');
  });

  test('TID-TASK-111-WEB-CADDY-SPA-FALLBACK uses the Caddy runtime with SPA fallback', () => {
    const dockerfile = readFileSync(resolve(appRoot, 'Dockerfile'), 'utf8');
    const caddyfile = readFileSync(resolve(appRoot, 'Caddyfile'), 'utf8');

    expect(dockerfile).toContain('FROM caddy:2.9-alpine');
    expect(dockerfile).toContain('COPY apps/web/Caddyfile /etc/caddy/Caddyfile');
    expect(dockerfile).toContain('COPY --from=build /workspace/apps/web/dist /srv');

    expect(caddyfile).toContain(':80');
    expect(caddyfile).toContain('root * /srv');
    expect(caddyfile).toContain('try_files {path} /index.html');
    expect(caddyfile).toContain('file_server');
  });

  test('TID-TASK-111-DOC-GENERIC-CONTAINER-RUNBOOK documents generic overlay commands without server-specific routing', () => {
    const readme = readFileSync(resolve(repoRoot, 'README.md'), 'utf8');

    expect(readme).toContain(
      'docker compose -f docker-compose.yml -f docker-compose.web.yml build web',
    );
    expect(readme).toContain(
      'docker compose -f docker-compose.yml -f docker-compose.web.yml up -d web',
    );
    expect(readme).not.toContain('tasky.norbu.dev');
    expect(readme).not.toContain('the-grid');
  });
});
