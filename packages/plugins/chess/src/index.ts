import { PluginDefinition } from '@benotes/core';
import * as schema from './schema';

export const ChessPlugin: PluginDefinition = {
  id: 'chess',
  name: 'Chess Plugin',
  description: 'Manage chess games, positions, and annotations.',
  schema: {
    chess_games: schema.chessGames,
    chess_annotations: schema.chessAnnotations,
  },
};
