'use client';

import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { Chessground } from 'chessground';
import { Chess } from 'chess.js';
import { useState, useEffect, useRef, useCallback } from 'react';
import 'chessground/assets/chessground.base.css';
import 'chessground/assets/chessground.brown.css';
import 'chessground/assets/chessground.cburnett.css';

export default function ChessNodeView(props: NodeViewProps) {
  const [fen, setFen] = useState(props.node.attrs.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const containerRef = useRef<HTMLDivElement>(null);
  const groundRef = useRef<any>(null); // Keep track of the Chessground instance

  // Sync state with Tiptap updates
  useEffect(() => {
    if (props.node.attrs.fen && props.node.attrs.fen !== fen) {
      setFen(props.node.attrs.fen);
      if (groundRef.current) {
        groundRef.current.set({ fen: props.node.attrs.fen });
      }
    }
  }, [props.node.attrs.fen]);

  useEffect(() => {
    if (!containerRef.current) return;

    const game = new Chess(fen);

    // Initialize Chessground
    // @ts-ignore - Chessground types can be tricky
    const ground = Chessground(containerRef.current, {
      fen: fen,
      turnColor: toColor(game), // Explicitly set turn color
      movable: {
        color: toColor(game), // Dynamic based on turn
        free: false,
        dests: toDests(game),
        events: {
          after: (orig, dest) => {
             // Handle move
             try {
                // Use the closure 'game' which was created from 'fen' at effect start.
                const move = game.move({ from: orig, to: dest, promotion: 'q' });
                if (move) {
                    const newFen = game.fen();
                    setFen(newFen);
                    props.updateAttributes({ fen: newFen });
                    // No need to manually update ground here, as the effect will re-run on fen change
                }
             } catch (e) {
                 console.error(e);
                 // Snap back if invalid
                 ground.set({ fen: fen });
             }
          }
        }
      }
    });

    groundRef.current = ground;

    return () => {
        ground.destroy();
    };
  }, [fen]); // Re-initialize on FEN change (simplest for now)

  return (
    <NodeViewWrapper className="chess-node-view my-4 border rounded p-4 bg-gray-50 max-w-md mx-auto">
      <div className="mb-2 text-sm text-gray-500 font-mono text-center truncate">
        {fen}
      </div>
      
      {/* Container for Chessground */}
      <div 
        ref={containerRef} 
        className="aspect-square w-full h-[400px] is2d"
        style={{ height: '400px', width: '400px' }} // Explicit size needed for Chessground
      />

      <div className="mt-2 flex justify-center gap-2">
          <button 
            className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
            onClick={() => {
                const g = new Chess();
                const newFen = g.fen();
                setFen(newFen);
                props.updateAttributes({ fen: newFen });
            }}
          >
            Reset
          </button>
      </div>
    </NodeViewWrapper>
  );
}

// Helpers for Chessground
function toDests(chess: any) {
  const dests = new Map();
  chess.moves({ verbose: true }).forEach((m: any) => {
    if (!dests.has(m.from)) dests.set(m.from, []);
    dests.get(m.from).push(m.to);
  });
  return dests;
}

function toColor(chess: any) {
  return chess.turn() === 'w' ? 'white' : 'black';
}
