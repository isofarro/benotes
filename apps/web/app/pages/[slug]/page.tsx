import { getTenantDb, pages } from '@benotes/core';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import Editor from '../../../components/editor/Editor';
import Link from 'next/link';

export default async function PageEditor({ params }: { params: Promise<{ slug: string }> }) {
  const db = getTenantDb('demo');
  const { slug } = await params;

  // Fetch Page
  const page = db.select().from(pages).where(eq(pages.slug, slug)).get();

  if (!page) {
    notFound();
  }

  // Server Action to Save
  async function savePage(content: object) {
    'use server';
    const db = getTenantDb('demo');
    db.update(pages)
      .set({ 
        content: JSON.stringify(content),
        updatedAt: new Date() 
      })
      .where(eq(pages.slug, slug))
      .run();
    
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
