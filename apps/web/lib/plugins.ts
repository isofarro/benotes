import { AnyExtension } from '@tiptap/core';
import { Editor } from '@tiptap/react';

export interface ClientPlugin {
  id: string;
  name: string;
  editorExtension?: AnyExtension;
  toolbarButton?: {
    icon: string;
    label: string;
    action: (editor: Editor) => void;
    isActive?: (editor: Editor) => boolean;
  };
}
