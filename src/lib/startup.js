const AUTO_FORGE_PARAMS = ['forge', 'autoforge', 'start'];
const DISABLED_VALUES = new Set(['0', 'false', 'no', 'off']);

export function shouldAutoForge(search = globalThis.location?.search || '') {
  const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
  return AUTO_FORGE_PARAMS.some((name) => {
    if (!params.has(name)) return false;
    const value = params.get(name);
    return value === '' || !DISABLED_VALUES.has(String(value).toLowerCase());
  });
}
