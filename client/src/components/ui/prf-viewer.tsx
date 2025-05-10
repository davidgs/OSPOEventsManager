import { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

interface PRFViewerProps {
  filePath: string;
  scale: number;
  rotation: number;
}

export function PRFViewer({ filePath, scale, rotation }: PRFViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pages, setPages] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    let isMounted = true;
    
    const fetchPRFContent = async () => {
      try {
        setIsLoading(true);
        
        // In a real implementation, this would make a server request to convert PRF to viewable format
        // Here we'll simulate a delay and then show a placeholder
        const response = await fetch(filePath, { method: 'HEAD' });
        
        if (!isMounted) return;

        if (!response.ok) {
          throw new Error('Could not load PRF file');
        }
        
        // Simulate PRF parsing
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Generate placeholder pages
        setPages(['page1', 'page2', 'page3']);
        setIsLoading(false);
        
      } catch (err) {
        if (!isMounted) return;
        console.error('Error loading PRF file:', err);
        setError('Failed to load PRF file. Please try downloading the file instead.');
        setIsLoading(false);
      }
    };
    
    fetchPRFContent();
    
    return () => {
      isMounted = false;
    };
  }, [filePath]);
  
  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-sm text-muted-foreground">Loading PRF document...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-destructive mb-2">{error}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      ref={containerRef}
      className="w-full h-full overflow-auto"
      style={{
        transform: `scale(${scale}) rotate(${rotation}deg)`,
        transformOrigin: 'center center',
        transition: 'transform 0.3s ease'
      }}
    >
      <div className="flex flex-col items-center justify-start p-4 bg-white">
        {pages.map((page, index) => (
          <div 
            key={`page-${index}`}
            className="mb-4 w-full max-w-[600px] bg-white shadow-md rounded border border-gray-200"
          >
            <div className="p-6 min-h-[800px] flex flex-col">
              <div className="text-center border-b pb-4 mb-6">
                <h3 className="text-xl font-bold">PRF Document Preview</h3>
                <p className="text-sm text-muted-foreground">Page {index + 1} of {pages.length}</p>
              </div>
              
              <div className="flex-1 flex flex-col">
                {/* Simulated PRF content */}
                <div className="space-y-4">
                  <div className="h-8 bg-muted/30 rounded-full w-3/4 animate-pulse" />
                  <div className="h-8 bg-muted/30 rounded-full w-1/2 animate-pulse" />
                  <div className="h-4 bg-muted/30 rounded-full w-full animate-pulse" />
                  <div className="h-4 bg-muted/30 rounded-full w-full animate-pulse" />
                  <div className="h-4 bg-muted/30 rounded-full w-5/6 animate-pulse" />
                  <div className="h-4 bg-muted/30 rounded-full w-full animate-pulse" />
                  <div className="h-24 bg-muted/30 rounded-lg w-full animate-pulse mt-6" />
                  <div className="h-4 bg-muted/30 rounded-full w-4/5 animate-pulse mt-6" />
                  <div className="h-4 bg-muted/30 rounded-full w-full animate-pulse" />
                  <div className="h-4 bg-muted/30 rounded-full w-2/3 animate-pulse" />
                </div>
              </div>
              
              <div className="mt-auto text-right">
                <p className="text-sm text-muted-foreground">PRF Viewer</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}