import { ChessExtension } from '@benotes/plugin-chess';
import { AlertExtension } from '@benotes/plugin-alert';
import { ClientPlugin } from './plugins';

export const clientPlugins: ClientPlugin[] = [
  {
    id: 'chess',
    name: 'Chess',
    editorExtension: ChessExtension,
    toolbarButton: {
      icon: '♟️',
      label: 'Insert Chess Board',
      action: (editor) => editor.chain().focus().setChess().run(),
      isActive: () => false,
    },
  },
  {
    id: 'alert',
    name: 'Alert',
    editorExtension: AlertExtension,
    toolbarButton: {
      icon: '⚠️',
      label: 'Insert Alert',
      action: (editor) => editor.chain().focus().setAlert({ type: 'info' }).run(),
      isActive: (editor) => editor.isActive('alert'),
    },
  },
];
