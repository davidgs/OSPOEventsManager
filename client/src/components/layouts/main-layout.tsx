import { FC, ReactNode } from "react";
import Sidebar from "@/components/layouts/sidebar";
import { useMobile } from "@/hooks/use-mobile";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: FC<MainLayoutProps> = ({ children }) => {
  const isMobile = useMobile();

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      {isMobile && <Sidebar />}
      <div className="flex h-full">
        {!isMobile && <Sidebar />}
        <div className="flex flex-col flex-1 w-0 overflow-hidden">
          <main className={cn("relative flex-1 overflow-y-auto focus:outline-none", {
            "pt-16": isMobile,
            "p-4": true,
          })}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;

// Helper function
function cn(...classes: (string | boolean | undefined | null | { [key: string]: boolean })[]): string {
  return classes
    .filter(Boolean)
    .map((cls) => {
      if (typeof cls === "object" && cls !== null) {
        return Object.entries(cls)
          .filter(([, value]) => Boolean(value))
          .map(([key]) => key);
      }
      return cls;
    })
    .flat()
    .join(" ");
}
