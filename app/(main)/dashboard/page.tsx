import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ResourceService } from "@/services/resource.service";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar"
import { SearchBar } from "@/components/dashboard/SearchBar";
import { FileStack, LayoutGrid, SlidersHorizontal } from "lucide-react";
import {Button} from "@/components/ui/button"

interface DashboardProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function DashboardPage({ searchParams }: DashboardProps) {
  // 1. Security Check
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // 2. Data Fetching (Awaiting searchParams for Next.js 15+ compatibility)
  const params = await searchParams;
  const resources = await ResourceService.findMany({
    type: params.type as any,
    courseId: params.courseId,
  });

  return (
    <div className="flex flex-col gap-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            Welcome back, {session.user.name.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground">
            Explore and contribute to the community resource hub.
          </p>
        </div>
        <div className="flex items-center gap-2">
           <SearchBar />
           <Button size="sm" className="hidden md:flex">
             Upload Resource
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-10">
        {/* Sidebar Filters */}
        <aside className="hidden lg:block">
          <DashboardSidebar currentType={params.type} />
        </aside>

        {/* Main Content Area */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
              <FileStack className="h-4 w-4" />
              <span>{resources.length} Resources found</span>
            </div>
            <div className="flex items-center gap-2">
               <Button variant="outline" size="sm" className="lg:hidden">
                 <SlidersHorizontal className="h-4 w-4 mr-2" /> Filters
               </Button>
            </div>
          </div>

          {/* The Resource Grid */}
          {resources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {resources.map((res) => (
                <ResourceCard key={res.id} resource={res} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed rounded-3xl bg-zinc-50/50">
              <LayoutGrid className="h-12 w-12 text-zinc-300 mb-4" />
              <h3 className="text-lg font-medium text-zinc-900">No resources yet</h3>
              <p className="text-sm text-zinc-500 max-w-[250px] text-center">
                Try adjusting your filters or be the first to upload a document for this category.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}