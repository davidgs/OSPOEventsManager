import { Card, CardContent, CardHeader } from "./card";
import { Skeleton } from "./skeleton";

export function SkeletonCard() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-1/2 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </CardContent>
    </Card>
  );
}