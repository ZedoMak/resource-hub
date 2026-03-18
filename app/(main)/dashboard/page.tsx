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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            Welcome back, {session.user.name.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground">
            Explore, download, and contribute to your university hub.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SearchBar />
          {/* Our professional upload modal trigger */}
          <UploadResource />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-10">
        {/* --- Desktop Sidebar --- */}
        <aside className="hidden lg:block">
          <DashboardSidebar currentType={params.type} />
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
            <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed rounded-3xl bg-zinc-50/50">
              <div className="h-16 w-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
                <LayoutGrid className="h-8 w-8 text-zinc-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900">No resources found</h3>
              <p className="text-sm text-zinc-500 max-w-[280px] text-center mb-6">
                We couldn't find any documents for this category. Why not be the first to upload one?
              </p>
              <UploadResource />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}