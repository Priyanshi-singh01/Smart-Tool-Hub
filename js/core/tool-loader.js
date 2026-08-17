/**
 * tool-loader.js — resolves a registry entry's dynamic import and
 * validates the loaded module against the required contract:
 *   { id, mount(container, context) -> cleanupFn | Promise<cleanupFn> }
 *
 * Never fails silently: a bad module throws a clear, specific error
 * that the workspace shell turns into the friendly error state.
 */

export async function loadTool(registryEntry) {
  const mod = await registryEntry.loader();
  const tool = mod.default || mod[Object.keys(mod)[0]];

  if (!tool || typeof tool.mount !== 'function') {
    throw new Error(
      `Tool Module Error: "${registryEntry.id}" does not implement the required mount(container, context) contract.`
    );
  }
  return tool;
}
