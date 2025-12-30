import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useState, useEffect, useCallback } from 'react';

export default function ChessNodeView(props: NodeViewProps) {
  const [game, setGame] = useState(new Chess(props.node.attrs.fen));
  
  // Update local state if FEN changes from outside (e.g. undo/redo)
  useEffect(() => {
      try {
        const newGame = new Chess(props.node.attrs.fen);
        setGame(newGame);
      } catch (e) {
          // ignore invalid fen during typing?
      }
  }, [props.node.attrs.fen]);

  const onDrop = useCallback((sourceSquare: string, targetSquare: string) => {
    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q', // always promote to queen for simplicity
      });

      if (move === null) return false;

      const newFen = game.fen();
      setGame(new Chess(newFen));
      props.updateAttributes({ fen: newFen });
      return true;
    } catch (e) {
        return false;
    }
  }, [game, props]);

  return (
    <NodeViewWrapper className="chess-node-view my-4 border rounded p-4 bg-gray-50 max-w-md mx-auto">
      <div className="mb-2 text-sm text-gray-500 font-mono text-center">
        {props.node.attrs.fen}
      </div>
      <div className="aspect-square">
        {/* @ts-ignore: react-chessboard types might be mismatched */}
        <Chessboard 
            position={game.fen()} 
            onPieceDrop={onDrop}
            boardWidth={400}
        />
      </div>
      <div className="mt-2 flex justify-center gap-2">
          <button 
            className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
            onClick={() => {
                const g = new Chess();
                setGame(g);
                props.updateAttributes({ fen: g.fen() });
            }}
          >
            Reset
          </button>
      </div>
    </NodeViewWrapper>
  );
}
