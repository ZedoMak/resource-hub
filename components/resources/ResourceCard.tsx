import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, ArrowBigUp, Download } from "lucide-react";
import Link from "next/link";

interface ResourceCardProps {
  resource: {
    id: string;
    title: string;
    type: string;
    score: number;
    courseName: string | null;
  };
}

export function ResourceCard({ resource }: ResourceCardProps) {
  return (
    <Card className="group hover:border-zinc-400 transition-all">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="font-mono text-[10px] uppercase">
            {resource.type}
          </Badge>
          <div className="flex items-center text-zinc-500 text-sm">
            <ArrowBigUp className="h-4 w-4 mr-1 text-emerald-600" />
            {resource.score}
          </div>
        </div>
        <CardTitle className="text-lg leading-tight group-hover:text-primary">
          <Link href={`/resources/${resource.id}`} className="hover:underline">
            {resource.title}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground flex items-center">
          <FileText className="h-3 w-3 mr-2" />
          {resource.courseName || "General Resource"}
        </p>
      </CardContent>
      <CardFooter className="border-t pt-4 flex justify-between">
         <Button variant="ghost" size="sm" className="h-8 text-xs">
           View Details
         </Button>
         <Button size="sm" className="h-8 text-xs gap-1">
           <Download className="h-3 w-3" /> Download
         </Button>
      </CardFooter>
    </Card>
  );
}