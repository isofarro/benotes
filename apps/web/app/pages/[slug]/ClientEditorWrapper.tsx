'use client';

import Editor from '../../../components/editor/Editor';
import { useState, useEffect } from 'react';

export default function ClientEditorWrapper({ 
  initialContent, 
  onSave 
}: { 
  initialContent?: any, 
  onSave: (content: object) => Promise<void> 
}) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Debounce save
  const handleChange = (content: object) => {
    setStatus('saving');
    // Simple debounce could go here, but for now we rely on the user stopping typing or manual logic? 
    // Actually, let's just save after 1 second of inactivity.
  };

  // For this PoC, we will save automatically on every change with a debounce
  useEffect(() => {
    // Setup debounce logic if we were storing state locally
  }, []);

  const handleUpdate = async (content: object) => {
     setStatus('saving');
     try {
       await onSave(content);
       setStatus('saved');
       setTimeout(() => setStatus('idle'), 2000);
     } catch (e) {
       console.error(e);
       setStatus('idle'); // Error state handling needed
     }
  };
  
  // Custom debounce hook implementation inline for simplicity
  const useDebouncedSave = (callback: (c: object) => Promise<void>, delay: number) => {
      const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
      
      const save = (content: object) => {
          if (timer) clearTimeout(timer);
          setStatus('saving');
          const newTimer = setTimeout(async () => {
              // Ensure content is a plain object to avoid "Client Reference" issues
              const cleanContent = JSON.parse(JSON.stringify(content));
              await callback(cleanContent);
              setStatus('saved');
              setTimeout(() => setStatus('idle'), 2000);
          }, delay);
          setTimer(newTimer);
      };
      return save;
  };

  const debouncedSave = useDebouncedSave(onSave, 1000);

  return (
    <div className="relative">
      <div className="absolute top-0 right-0 text-xs text-gray-400">
        {status === 'saving' && 'Saving...'}
        {status === 'saved' && 'Saved'}
      </div>
      <Editor initialContent={initialContent} onChange={debouncedSave} />
    </div>
  );
}
