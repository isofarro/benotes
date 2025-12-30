import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    alert: {
      setAlert: (options: { type: string }) => ReturnType;
    };
  }
}

export const AlertExtension = Node.create({
  name: 'alert',

  group: 'block',

  content: 'inline*',

  addAttributes() {
    return {
      type: {
        default: 'info',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="alert"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'alert' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(({ node }) => {
      const type = node.attrs.type || 'info';
      const colors = {
        info: 'bg-blue-50 border-blue-200 text-blue-800',
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        error: 'bg-red-50 border-red-200 text-red-800',
      };
      
      return (
        <NodeViewWrapper className={`p-4 my-4 border rounded-lg ${colors[type as keyof typeof colors]}`}>
          <div className="font-bold mb-1 capitalize" contentEditable={false}>{type}</div>
          <NodeViewContent className="content" />
        </NodeViewWrapper>
      );
    });
  },

  addCommands() {
    return {
      setAlert:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});
