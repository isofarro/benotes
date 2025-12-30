import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import ChessNodeView from './ChessNodeView';

export interface ChessOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    chess: {
      setChess: (options?: { fen?: string }) => ReturnType;
    };
  }
}

export const ChessExtension = Node.create<ChessOptions>({
  name: 'chess',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      fen: {
        default: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'chess-board',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['chess-board', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ChessNodeView);
  },

  addCommands() {
    return {
      setChess:
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
