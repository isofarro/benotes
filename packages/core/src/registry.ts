import { PluginDefinition } from '@benotes/core';
import { ChessPlugin } from '@benotes/plugin-chess';

// Hardcoded registry for now (Walking Skeleton)
// In future, this could scan directories or use a dynamic import map
export const plugins: Record<string, PluginDefinition> = {
  [ChessPlugin.id]: ChessPlugin,
};

export const getPlugin = (id: string) => plugins[id];
export const getAllPlugins = () => Object.values(plugins);
