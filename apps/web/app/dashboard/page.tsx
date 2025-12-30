import { getTenantDb, pages } from '@benotes/core';
import { ChessPlugin } from '@benotes/plugin-chess';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { eq, desc, like } from 'drizzle-orm';
import Link from 'next/link';

// We need to access the plugin-specific table
// Ideally, the core should expose a way to query plugin tables
const { chess_positions } = ChessPlugin.schema as any;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.name) {
    redirect('/login');
  }

  const { q } = await searchParams;
  const db = getTenantDb(session.user.name);
  
  // Build query
  let query = db.select({
    id: chess_positions.id,
    fen: chess_positions.fen,
    pageId: chess_positions.pageId,
    updatedAt: chess_positions.updatedAt,
    pageTitle: pages.title,
    pageSlug: pages.slug,
  })
  .from(chess_positions)
  .leftJoin(pages, eq(chess_positions.pageId, pages.id));

  // Apply search filter if present
  if (q) {
      // @ts-ignore
      query = query.where(like(pages.title, `%${q}%`));
  }
  
  // Apply sorting and execute
  // @ts-ignore
  const positions = query.orderBy(desc(chess_positions.updatedAt)).all();

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
           <Link href="/" className="text-sm text-gray-500 hover:underline">← Back to Home</Link>
           <h1 className="text-3xl font-bold mt-2">Chess Dashboard</h1>
           <p className="text-gray-500">Atomic view of all chess positions across your knowledge base.</p>
        </div>
        
        <form className="w-full md:w-auto">
            <div className="relative">
                <input 
                    name="q" 
                    defaultValue={q}
                    placeholder="Filter by page title..." 
                    className="pl-9 pr-4 py-2 border rounded-full text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
            </div>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {positions.map((pos: any) => {
          const isWhiteTurn = pos.fen.split(' ')[1] === 'w';
          
          return (
          <div key={pos.id} className="bg-white border rounded-lg shadow hover:shadow-md transition-shadow p-4 flex flex-col">
             <div className="aspect-square bg-gray-100 rounded mb-4 flex items-center justify-center relative overflow-hidden group">
                 <img 
                   src={`https://lichess1.org/export/fen.gif?fen=${encodeURIComponent(pos.fen)}&color=white`} 
                   alt="Chess Position"
                   className="w-full h-full object-contain"
                 />
                 
                 {/* Turn Indicator Overlay */}
                 <div className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold shadow bg-white/90 backdrop-blur-sm">
                    {isWhiteTurn ? '⚪️ White to move' : '⚫️ Black to move'}
                 </div>
                 
                 {/* Quick Action Overlay */}
                 <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link 
                        href={`/pages/${pos.pageSlug}`}
                        className="bg-white text-black px-4 py-2 rounded-full font-medium hover:bg-gray-100 transform hover:scale-105 transition-transform"
                    >
                        Go to Game →
                    </Link>
                 </div>
             </div>
             
             <div className="space-y-2 flex-1 flex flex-col justify-end">
                 <div className="text-xs font-mono bg-gray-50 p-1 rounded truncate text-gray-500 select-all" title={pos.fen}>
                    {pos.fen}
                 </div>
                 
                 <div className="flex justify-between items-end border-t pt-2 mt-2">
                    <div>
                        <div className="text-xs text-gray-400">Page</div>
                        <Link href={`/pages/${pos.pageSlug}`} className="font-medium text-blue-600 hover:underline block truncate max-w-[180px]" title={pos.pageTitle}>
                            {pos.pageTitle}
                        </Link>
                    </div>
                    <div className="text-xs text-gray-400 text-right">
                        <div>Updated</div>
                        {new Date(pos.updatedAt).toLocaleDateString()}
                    </div>
                 </div>
             </div>
          </div>
          );
        })}
        
        {positions.length === 0 && (
            <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border border-dashed">
                <p className="text-gray-500">No chess positions found matching your criteria.</p>
                {q ? (
                    <Link href="/dashboard" className="text-blue-600 hover:underline mt-2 inline-block">Clear filter</Link>
                ) : (
                    <p className="text-sm text-gray-400 mt-2">Add a chess board to any page to see it here.</p>
                )}
            </div>
        )}
      </div>
    </div>
  );
}
