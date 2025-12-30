import { getTenantDb, pages } from '@benotes/core';
import { ChessPlugin } from '@benotes/plugin-chess';
import { eq, and, notInArray, inArray } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import Editor from '../../../components/editor/Editor';
import Link from 'next/link';
import { auth } from '@/auth';
import { randomUUID } from 'crypto';

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

  // Fetch Sub-pages
  const subPages = db.select().from(pages).where(eq(pages.parentId, page.id)).all();

  // Fetch Chess Positions from Sub-pages (Tournament View)
  // @ts-ignore
  const { chess_positions } = ChessPlugin.schema;
  let tournamentPositions: any[] = [];
  
  if (subPages.length > 0) {
      const subPageIds = subPages.map(p => p.id);
      tournamentPositions = db.select({
          id: chess_positions.id,
          fen: chess_positions.fen,
          pageId: chess_positions.pageId,
          updatedAt: chess_positions.updatedAt,
          pageTitle: pages.title,
          pageSlug: pages.slug,
      })
      .from(chess_positions)
      .leftJoin(pages, eq(chess_positions.pageId, pages.id))
      // @ts-ignore
      .where(inArray(chess_positions.pageId, subPageIds))
      .all();
  }

  // Server Action to Create Sub-page
  async function createSubPage(formData: FormData) {
    'use server';
    const session = await auth();
    if (!session?.user?.name) return;
    
    const title = formData.get('title') as string;
    if (!title) return;

    const db = getTenantDb(session.user.name);
    const newId = randomUUID();
    const newSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    
    db.insert(pages).values({
      id: newId,
      title,
      slug: newSlug,
      parentId: page!.id,
      content: '',
      createdAt: new Date(),
      updatedAt: new Date()
    }).run();

    revalidatePath(`/pages/${slug}`);
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

      <div className="bg-white p-8 rounded-lg shadow min-h-[70vh] mb-8">
        <ClientEditorWrapper 
          initialContent={page.content ? JSON.parse(page.content) : undefined} 
          onSave={savePage} 
        />
      </div>

      {/* Sub-pages Section */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Sub-pages ({subPages.length})</h2>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <form action={createSubPage} className="flex gap-2 mb-6">
                <input 
                    name="title" 
                    placeholder="New sub-page title..." 
                    className="flex-1 px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                />
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-medium">
                    + Create Sub-page
                </button>
            </form>

            {subPages.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subPages.map(sp => (
                        <Link href={`/pages/${sp.slug}`} key={sp.id} className="block bg-white p-4 rounded border hover:shadow-md transition-shadow">
                            <h3 className="font-bold truncate">{sp.title}</h3>
                            <div className="text-xs text-gray-400 mt-1">
                                {new Date(sp.updatedAt!).toLocaleDateString()}
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <p className="text-gray-500 italic text-center">No sub-pages yet.</p>
            )}
        </div>
      </div>

      {/* Tournament View (Chess Boards from Sub-pages) */}
      {tournamentPositions.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Tournament View ({tournamentPositions.length} active games)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {tournamentPositions.map((pos: any) => {
                    const isWhiteTurn = pos.fen.split(' ')[1] === 'w';
                    return (
                        <div key={pos.id} className="bg-white border rounded-lg p-3 shadow-sm hover:shadow-md">
                            <div className="aspect-square bg-gray-100 rounded mb-2 flex items-center justify-center relative group overflow-hidden">
                                <img 
                                    src={`https://lichess1.org/export/fen.gif?fen=${encodeURIComponent(pos.fen)}&color=white`} 
                                    alt="Chess Position"
                                    className="w-full h-full object-contain"
                                />
                                <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-bold shadow bg-white/90 backdrop-blur-sm">
                                    {isWhiteTurn ? '⚪️' : '⚫️'}
                                </div>
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Link 
                                        href={`/pages/${pos.pageSlug}`}
                                        className="bg-white text-black px-3 py-1 rounded-full text-xs font-bold hover:scale-105 transition-transform"
                                    >
                                        View Game
                                    </Link>
                                </div>
                            </div>
                            <Link href={`/pages/${pos.pageSlug}`} className="font-medium text-sm hover:underline block truncate" title={pos.pageTitle}>
                                {pos.pageTitle}
                            </Link>
                        </div>
                    );
                })}
            </div>
          </div>
      )}
    </div>
  );
}

// Client Wrapper to handle Editor events
import ClientEditorWrapper from './ClientEditorWrapper';
