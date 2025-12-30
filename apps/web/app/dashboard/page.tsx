import { getTenantDb, pages } from '@benotes/core';
import { ChessPlugin } from '@benotes/plugin-chess';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { eq, desc } from 'drizzle-orm';
import Link from 'next/link';

// We need to access the plugin-specific table
// Ideally, the core should expose a way to query plugin tables
const { chess_positions } = ChessPlugin.schema as any;

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.name) {
    redirect('/login');
  }

  const db = getTenantDb(session.user.name);
  
  // Join chess_positions with pages to get the context (page title)
  // Drizzle doesn't support easy dynamic joins across modules without more setup
  // So we'll fetch positions and then maybe fetch pages or just list them
  
  // Fetch all chess positions
  const positions = db.select({
    id: chess_positions.id,
    fen: chess_positions.fen,
    pageId: chess_positions.pageId,
    updatedAt: chess_positions.updatedAt,
    pageTitle: pages.title,
    pageSlug: pages.slug,
  })
  .from(chess_positions)
  .leftJoin(pages, eq(chess_positions.pageId, pages.id))
  .orderBy(desc(chess_positions.updatedAt))
  .all();

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
           <Link href="/" className="text-sm text-gray-500 hover:underline">← Back to Home</Link>
           <h1 className="text-3xl font-bold mt-2">Chess Dashboard</h1>
           <p className="text-gray-500">Atomic view of all chess positions across your knowledge base.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {positions.map((pos: any) => (
          <div key={pos.id} className="bg-white border rounded-lg shadow hover:shadow-md transition-shadow p-4">
             <div className="aspect-square bg-gray-100 rounded mb-4 flex items-center justify-center relative">
                 {/* 
                    In a real app, we would render a static chessboard image or a read-only board here.
                    For now, we'll use a placeholder or a simple image if we had one.
                    We can use the FEN string to generate a preview URL from a service, 
                    or just display the FEN text for this MVP.
                 */}
                 <img 
                   src={`https://lichess1.org/export/fen.gif?fen=${encodeURIComponent(pos.fen)}&color=white`} 
                   alt="Chess Position"
                   className="w-full h-full object-contain"
                 />
             </div>
             
             <div className="space-y-2">
                 <div className="text-xs font-mono bg-gray-50 p-1 rounded truncate text-gray-500" title={pos.fen}>
                    {pos.fen}
                 </div>
                 
                 <div className="flex justify-between items-end">
                    <div>
                        <div className="text-xs text-gray-400">Found in</div>
                        <Link href={`/pages/${pos.pageSlug}`} className="font-medium text-blue-600 hover:underline block truncate max-w-[150px]">
                            {pos.pageTitle}
                        </Link>
                    </div>
                    <div className="text-xs text-gray-400">
                        {new Date(pos.updatedAt).toLocaleDateString()}
                    </div>
                 </div>
             </div>
          </div>
        ))}
        
        {positions.length === 0 && (
            <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border border-dashed">
                <p className="text-gray-500">No chess positions found yet.</p>
                <p className="text-sm text-gray-400 mt-2">Add a chess board to any page to see it here.</p>
            </div>
        )}
      </div>
    </div>
  );
}
