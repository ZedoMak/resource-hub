import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ResourceService } from "@/services/resource.service";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { SearchBar } from "@/components/dashboard/SearchBar";
import { UploadResource } from "@/components/dashboard/UploadResource";
import { FileStack, LayoutGrid, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardProps {
  searchParams: Promise<{ type?: string; courseId?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardProps) {
  // 1. Server-side Session Guard
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // 2. Await searchParams (Next.js 15 requirement)
  const params = await searchParams;
  
  // 3. Fetch resources based on URL filters
  const resources = await ResourceService.findMany({
    type: params.type as any,
    courseId: params.courseId,
  });

  return (
    <div className="flex flex-col gap-8">
      {/* --- Top Header Section --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/40 pb-8 pt-4">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-zinc-100 dark:to-zinc-500">
            Welcome back, {session.user.name.split(" ")[0]}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Explore, download, and contribute to your university hub.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SearchBar />
          {/* Our professional upload modal trigger */}
          <UploadResource />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12 pt-2">
        {/* --- Desktop Sidebar --- */}
        <aside className="hidden lg:block relative">
          <div className="sticky top-24">
            <DashboardSidebar currentType={params.type} />
          </div>
        </aside>

        {/* --- Main Content Area --- */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
              <FileStack className="h-4 w-4" />
              <span>{resources.length} Resources Available</span>
            </div>
            
            {/* Mobile Filter Trigger (UI Only for now) */}
            <Button variant="outline" size="sm" className="lg:hidden h-8 text-xs">
              <SlidersHorizontal className="h-3 w-3 mr-2" /> Filters
            </Button>
          </div>

          {/* --- Resource Rendering Logic --- */}
          {resources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {resources.map((res) => (
                <ResourceCard key={res.id} resource={res} />
              ))}
            </div>
          ) : (
            /* --- Empty State --- */
            <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2rem] bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-sm w-full transition-all duration-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/80">
              <div className="h-20 w-20 bg-background rounded-full flex items-center justify-center mb-6 shadow-sm ring-1 ring-border">
                <LayoutGrid className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-foreground mb-2">No resources found</h3>
              <p className="text-muted-foreground max-w-md text-center mb-8">
                We couldn't find any documents for this category. Be the first to start the collection and help your peers!
              </p>
              <UploadResource />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}