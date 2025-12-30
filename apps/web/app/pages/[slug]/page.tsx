import { getTenantDb, pages } from '@benotes/core';
import { ChessPlugin } from '@benotes/plugin-chess';
import { eq, and, notInArray } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import Editor from '../../../components/editor/Editor';
import Link from 'next/link';
import { auth } from '@/auth';

// Helper to extract chess positions from Tiptap JSON
function extractChessPositions(doc: any) {
  const positions: any[] = [];
  
  function traverse(node: any) {
    if (node.type === 'chess' && node.attrs && node.attrs.fen && node.attrs.id) {
      positions.push({
        id: node.attrs.id,
        fen: node.attrs.fen,
      });
    }
    
    if (node.content) {
      node.content.forEach(traverse);
    }
  }
  
  traverse(doc);
  return positions;
}

export default async function PageEditor({ params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session?.user?.name) {
    redirect('/login');
  }

  const db = getTenantDb(session.user.name);
  const { slug } = await params;

  // Fetch Page
  const page = db.select().from(pages).where(eq(pages.slug, slug)).get();

  if (!page) {
    notFound();
  }

  // Server Action to Save
  async function savePage(content: any) {
    'use server';
    const session = await auth();
    if (!session?.user?.name) {
       return;
    }
    const db = getTenantDb(session.user.name);
    
    // 1. Save the Document
    db.update(pages)
      .set({ 
        content: JSON.stringify(content),
        updatedAt: new Date() 
      })
      .where(eq(pages.slug, slug))
      .run();
    
    // 2. Indexing: Extract and Save Chess Positions
    const chessPositions = extractChessPositions(content);
    // @ts-ignore
    const { chess_positions } = ChessPlugin.schema;
    
    // Cleanup: Delete positions that are no longer in the document for this page
    const currentIds = chessPositions.map(p => p.id);
    
    // If we found positions, delete any FOR THIS PAGE that are NOT in the list
    if (currentIds.length > 0) {
        db.delete(chess_positions)
          .where(and(
              eq(chess_positions.pageId, page!.id),
              notInArray(chess_positions.id, currentIds)
          ))
          .run();
    } else {
        // If NO positions found, delete ALL for this page
        db.delete(chess_positions)
          .where(eq(chess_positions.pageId, page!.id))
          .run();
    }
    
    // Sync: Upsert found positions
    for (const pos of chessPositions) {
        db.insert(chess_positions).values({
            id: pos.id,
            pageId: page!.id,
            fen: pos.fen,
            updatedAt: new Date()
        }).onConflictDoUpdate({
            // @ts-ignore
            target: chess_positions.id,
            set: { fen: pos.fen, updatedAt: new Date() }
        }).run();
    }
    
    revalidatePath(`/pages/${slug}`);
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
           <Link href="/" className="text-sm text-gray-500 hover:underline">← Back to Home</Link>
           <h1 className="text-3xl font-bold mt-2">{page.title}</h1>
        </div>
        <div className="text-sm text-gray-400">
            {page.updatedAt ? `Last saved: ${new Date(page.updatedAt).toLocaleTimeString()}` : 'Unsaved'}
        </div>
      </div>

      <div className="bg-white p-8 rounded-lg shadow min-h-[70vh]">
        <ClientEditorWrapper 
          initialContent={page.content ? JSON.parse(page.content) : undefined} 
          onSave={savePage} 
        />
      </div>
    </div>
  );
}

// Client Wrapper to handle Editor events
import ClientEditorWrapper from './ClientEditorWrapper';
