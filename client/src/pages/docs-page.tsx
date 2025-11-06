/* The MIT License (MIT)
 *
 * Copyright (c) 2022-present David G. Simmons
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, BookOpen, Users, Code, ChevronRight, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface DocSection {
  title: string;
  path: string;
  icon: React.ReactNode;
  children?: { title: string; path: string }[];
}

const docStructure: DocSection[] = [
  {
    title: 'Getting Started',
    path: '/docs',
    icon: <Home className="h-4 w-4" />,
  },
  {
    title: 'User Guide',
    path: '/docs/user',
    icon: <BookOpen className="h-4 w-4" />,
    children: [
      { title: 'Getting Started', path: '/docs/user/getting-started' },
      { title: 'Managing Events', path: '/docs/user/managing-events' },
      { title: 'CFP Submissions', path: '/docs/user/cfp-submissions' },
      { title: 'Attendee Management', path: '/docs/user/attendee-management' },
      { title: 'Sponsorship Management', path: '/docs/user/sponsorship-management' },
      { title: 'File Uploads', path: '/docs/user/file-uploads' },
      { title: 'User Profile', path: '/docs/user/user-profile' },
      { title: 'Approval Workflows', path: '/docs/user/approval-workflows' },
      { title: 'FAQ', path: '/docs/user/faq' },
    ],
  },
  {
    title: 'Administrator Guide',
    path: '/docs/admin',
    icon: <Users className="h-4 w-4" />,
    children: [
      { title: 'User Management', path: '/docs/admin/user-management' },
      { title: 'Event Review', path: '/docs/admin/event-review' },
      { title: 'System Settings', path: '/docs/admin/system-settings' },
      { title: 'Backup & Restore', path: '/docs/admin/backup-restore' },
    ],
  },
  {
    title: 'Developer Guide',
    path: '/docs/developer',
    icon: <Code className="h-4 w-4" />,
    children: [
      { title: 'Architecture', path: '/docs/developer/architecture' },
      { title: 'Development Setup', path: '/docs/developer/setup' },
      { title: 'API Documentation', path: '/docs/developer/api' },
      { title: 'Database Schema', path: '/docs/developer/database' },
      { title: 'Deployment Guide', path: '/docs/developer/deployment' },
      { title: 'Configuration', path: '/docs/developer/configuration' },
      { title: 'Contributing', path: '/docs/developer/contributing' },
      { title: 'Security', path: '/docs/developer/security' },
    ],
  },
];

export default function DocsPage() {
  const [location, setLocation] = useLocation();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get the doc path from the URL
  const docPath = location.replace('/docs', '') || '/index';

  useEffect(() => {
    fetchDocContent(docPath);
  }, [docPath]);

  const fetchDocContent = async (path: string) => {
    setLoading(true);
    setError(null);

    try {
      // Construct the markdown file path
      const mdPath = path === '/index' ? '/index.md' : `${path}.md`;
      const response = await fetch(`/api/docs${mdPath}`);

      if (!response.ok) {
        throw new Error('Documentation page not found');
      }

      const text = await response.text();
      setContent(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documentation');
      setContent('# Error\n\nFailed to load documentation. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const Sidebar = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold mb-4">Documentation</h2>
      <nav className="space-y-1">
        {docStructure.map((section) => (
          <div key={section.path}>
            <Link href={section.path}>
              <Button
                variant={location === section.path ? 'secondary' : 'ghost'}
                className="w-full justify-start"
              >
                {section.icon}
                <span className="ml-2">{section.title}</span>
              </Button>
            </Link>
            {section.children && (
              <div className="ml-6 mt-1 space-y-1">
                {section.children.map((child) => (
                  <Link key={child.path} href={child.path}>
                    <Button
                      variant={location === child.path ? 'secondary' : 'ghost'}
                      className="w-full justify-start text-sm"
                      size="sm"
                    >
                      <ChevronRight className="h-3 w-3 mr-1" />
                      {child.title}
                    </Button>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </div>
  );

  return (
    <div className="container mx-auto py-6">
      <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-6">
        {/* Mobile Sidebar */}
        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Menu className="h-4 w-4 mr-2" />
                Menu
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[250px]">
              <Sidebar />
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-6">
            <Sidebar />
          </div>
        </aside>

        {/* Main Content */}
        <main>
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-red-500 mb-4">{error}</p>
                  <Button onClick={() => fetchDocContent(docPath)} variant="outline">
                    Try Again
                  </Button>
                </div>
              ) : (
                <div className="prose prose-slate max-w-none dark:prose-invert">
                  <ReactMarkdown
                    components={{
                      // Customize heading rendering to add IDs for anchor links
                      h1: ({ children }) => (
                        <h1 className="text-4xl font-bold mb-4 text-primary">{children}</h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-3xl font-semibold mt-8 mb-4 text-primary">{children}</h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-2xl font-semibold mt-6 mb-3">{children}</h3>
                      ),
                      // Style code blocks
                      code: ({ className, children, ...props }) => {
                        const isInline = !className;
                        return isInline ? (
                          <code
                            className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
                            {...props}
                          >
                            {children}
                          </code>
                        ) : (
                          <code
                            className={`block bg-muted p-4 rounded-lg overflow-x-auto ${className}`}
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      },
                      // Style links
                      a: ({ href, children }) => {
                        // Handle internal doc links
                        if (href?.startsWith('/docs/') || href?.endsWith('.md')) {
                          const docHref = href.replace('.md', '');
                          return (
                            <Link href={docHref}>
                              <a className="text-primary hover:underline cursor-pointer">
                                {children}
                              </a>
                            </Link>
                          );
                        }
                        // External links
                        return (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {children}
                          </a>
                        );
                      },
                      // Style tables
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-4">
                          <table className="min-w-full divide-y divide-border">
                            {children}
                          </table>
                        </div>
                      ),
                      // Style blockquotes
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-primary pl-4 italic my-4">
                          {children}
                        </blockquote>
                      ),
                    }}
                  >
                    {content}
                  </ReactMarkdown>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}

