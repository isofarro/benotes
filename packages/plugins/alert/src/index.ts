import { PluginDefinition } from '@benotes/core';
export { AlertExtension } from './ui/extension';

export const AlertPlugin: PluginDefinition = {
  id: 'alert',
  name: 'Alert Plugin',
  description: 'Simple alert blocks',
  schema: {}, // No DB schema needed for this simple block
};
