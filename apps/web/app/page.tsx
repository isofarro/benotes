import { getSystemDb, initTenant, getTenantDb, pages } from '@benotes/core';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';

export default async function Home() {
  // Ensure tenant exists
  initTenant('demo', 'Demo Tenant');
  const db = getTenantDb('demo');
  
  // Fetch pages
  const allPages = db.select().from(pages).all();

  // Server Action
  async function createPage(formData: FormData) {
    'use server';
    const title = formData.get('title') as string;
    if (!title) return;
    
    const db = getTenantDb('demo');
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
      <h1 className="text-3xl font-bold mb-8">Benotes</h1>
      
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
              <div key={page.id} className="p-4 border border-gray-200 rounded hover:shadow-md transition-shadow">
                <h3 className="font-bold text-lg">{page.title}</h3>
                <p className="text-sm text-gray-500 font-mono mt-1">/{page.slug}</p>
                <div className="text-xs text-gray-400 mt-2">
                  Created: {new Date(page.createdAt!).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
