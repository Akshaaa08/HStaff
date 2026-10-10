import type { Express } from 'express';

interface Layer {
  route?: { path: string; methods: Record<string, boolean> };
  name: string;
  regexp: RegExp;
  handle: { stack?: Layer[] };
}

// Walks Express's router stack (mounts are static paths) and returns "METHOD /full/path" for every route.
export function listRoutes(app: Express): string[] {
  const out: string[] = [];
  const walk = (stack: Layer[], prefix: string) => {
    for (const l of stack) {
      if (l.route) {
        for (const m of Object.keys(l.route.methods))
          out.push(
            `${m.toUpperCase()} ${prefix}${l.route.path}`.replace(/\/$/, '').replace(/:(\w+)/g, '{$1}'),
          );
      } else if (l.name === 'router' && l.handle.stack) {
        const mount = l.regexp.source.replace('^\\/', '/').replace('\\/?(?=\\/|$)', '').replace(/\\\//g, '/');
        walk(l.handle.stack, prefix + (mount === '/' ? '' : mount));
      }
    }
  };
   
  walk((app as any)._router.stack, '');
  return [...new Set(out)].sort();
}
