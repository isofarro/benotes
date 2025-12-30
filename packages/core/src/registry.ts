import { PluginDefinition } from './plugin';

export const plugins: Record<string, PluginDefinition> = {};

export function registerPlugin(plugin: PluginDefinition) {
  plugins[plugin.id] = plugin;
}

export const getPlugin = (id: string) => plugins[id];
export const getAllPlugins = () => Object.values(plugins);
