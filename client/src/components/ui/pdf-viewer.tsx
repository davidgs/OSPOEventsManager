import { useState, useEffect, useRef } from "react";
import { Loader2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PDFViewerProps {
  filePath: string;
  scale: number;
  rotation: number;
}

export function PDFViewer({ filePath, scale, rotation }: PDFViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  useEffect(() => {
    let isMounted = true;
    
    const loadPdf = async () => {
      try {
        setIsLoading(true);
        // Check if file exists
        const response = await fetch(filePath, { method: 'HEAD' });
        
        if (!isMounted) return;
        
        if (!response.ok) {
          throw new Error('Could not load PDF file');
        }
        
        // Simulate PDF loading
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // In a real implementation, we would get the total pages from the PDF
        // Here we're just simulating a multi-page PDF
        setTotalPages(3);
        setIsLoading(false);
      } catch (err) {
        if (!isMounted) return;
        console.error('Error loading PDF:', err);
        setError('Failed to load PDF. Please try downloading the file instead.');
        setIsLoading(false);
      }
    };
    
    loadPdf();
    
    return () => {
      isMounted = false;
    };
  }, [filePath]);
  
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };
  
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };
  
  if (isLoading) {
    return (
      <div className="w-full h-full min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-sm text-muted-foreground">Loading PDF document...</p>
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
    <div className="w-full h-full flex flex-col">
      {/* PDF viewer controls */}
      <div className="bg-muted/10 p-2 border-b flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={goToPreviousPage} 
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs">
            Page {currentPage} of {totalPages}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={goToNextPage} 
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* PDF content */}
      <div 
        className="flex-1 overflow-auto bg-white"
        style={{
          transformOrigin: 'center center',
        }}
      >
        <div
          className="w-full h-full flex items-center justify-center"
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg)`,
            transition: 'transform 0.3s ease',
          }}
        >
          {/* For a real implementation, we would use an iframe or PDF.js to render the actual PDF
              Here we're just simulating a PDF with a placeholder */}
          <div className="w-full max-w-3xl mx-auto overflow-hidden bg-white shadow-lg rounded-lg">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h3 className="text-lg font-semibold">PDF Document - Page {currentPage}</h3>
            </div>
            
            <div className="p-6">
              {currentPage === 1 && (
                <div className="space-y-6">
                  <div className="h-10 bg-muted/30 rounded-md w-3/4 animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted/30 rounded-full w-full animate-pulse"></div>
                    <div className="h-4 bg-muted/30 rounded-full w-full animate-pulse"></div>
                    <div className="h-4 bg-muted/30 rounded-full w-5/6 animate-pulse"></div>
                  </div>
                  <div className="h-32 bg-muted/30 rounded-md w-full animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted/30 rounded-full w-full animate-pulse"></div>
                    <div className="h-4 bg-muted/30 rounded-full w-4/5 animate-pulse"></div>
                    <div className="h-4 bg-muted/30 rounded-full w-full animate-pulse"></div>
                  </div>
                </div>
              )}
              
              {currentPage === 2 && (
                <div className="space-y-6">
                  <div className="h-8 bg-muted/30 rounded-md w-2/3 animate-pulse"></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-24 bg-muted/30 rounded-md animate-pulse"></div>
                    <div className="h-24 bg-muted/30 rounded-md animate-pulse"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted/30 rounded-full w-full animate-pulse"></div>
                    <div className="h-4 bg-muted/30 rounded-full w-full animate-pulse"></div>
                    <div className="h-4 bg-muted/30 rounded-full w-3/4 animate-pulse"></div>
                  </div>
                  <div className="h-40 bg-muted/30 rounded-md w-full animate-pulse"></div>
                </div>
              )}
              
              {currentPage === 3 && (
                <div className="space-y-6">
                  <div className="h-8 bg-muted/30 rounded-md w-1/2 animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted/30 rounded-full w-full animate-pulse"></div>
                    <div className="h-4 bg-muted/30 rounded-full w-full animate-pulse"></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-16 bg-muted/30 rounded-md animate-pulse"></div>
                    <div className="h-16 bg-muted/30 rounded-md animate-pulse"></div>
                    <div className="h-16 bg-muted/30 rounded-md animate-pulse"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted/30 rounded-full w-full animate-pulse"></div>
                    <div className="h-4 bg-muted/30 rounded-full w-3/4 animate-pulse"></div>
                  </div>
                  <div className="flex justify-end mt-8">
                    <div className="h-10 bg-muted/30 rounded-md w-24 animate-pulse"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}