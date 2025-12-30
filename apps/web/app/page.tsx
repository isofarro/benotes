import { getSystemDb, initTenant, getTenantDb, pages, resetTenantDb } from '@benotes/core';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';
import Link from 'next/link';
import { auth, signOut } from '@/auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await auth();
  if (!session?.user?.name) {
    redirect('/login');
  }

  const username = session.user.name;

  // Ensure tenant exists
  // initTenant('demo', 'Demo Tenant');
  
  // DEBUG: Reset DB to ensure schema is correct (Remove this in prod)
  // This line is commented out by default, uncomment if schema is broken
  // resetTenantDb('demo');
  initTenant(username, username);

  const db = getTenantDb(username);
  
  // Fetch pages
  const allPages = db.select().from(pages).all();

  // Server Action
  async function createPage(formData: FormData) {
    'use server';
    const session = await auth();
    if (!session?.user?.name) return;

    const title = formData.get('title') as string;
    if (!title) return;
    
    const db = getTenantDb(session.user.name);
    db.insert(pages).values({
      id: randomUUID(),
      title,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      content: '',
      createdAt: new Date(),
      updatedAt: new Date()
    }).run();
    
    revalidatePath('/');
  }

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Benotes</h1>
        <div className="flex items-center gap-4">
           <Link href="/dashboard" className="text-sm font-medium text-blue-600 hover:underline">
             ♟️ Chess Dashboard
           </Link>
           <span className="text-sm text-gray-600">User: {username}</span>
           <form action={async () => {
             'use server';
             await signOut();
           }}>
             <button type="submit" className="text-sm text-red-600 hover:underline">Logout</button>
           </form>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Create New Page</h2>
        <form action={createPage} className="flex gap-2">
          <input 
            name="title" 
            placeholder="Page Title" 
            className="flex-1 border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button 
            type="submit" 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Create
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Pages ({allPages.length})</h2>
        {allPages.length === 0 ? (
          <p className="text-gray-500 italic">No pages yet. Create one above.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {allPages.map(page => (
              <Link href={`/pages/${page.slug}`} key={page.id} className="block p-4 border border-gray-200 rounded hover:shadow-md transition-shadow">
                <h3 className="font-bold text-lg">{page.title}</h3>
                <p className="text-sm text-gray-500 font-mono mt-1">/{page.slug}</p>
                <div className="text-xs text-gray-400 mt-2">
                  Created: {new Date(page.createdAt!).toLocaleDateString()}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
