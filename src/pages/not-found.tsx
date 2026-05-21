import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty";
import { useNavigate } from "@/lib/router";

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <EmptyState
      icon={<Compass className="size-5" />}
      title="Route not found"
      description="The page you're looking for doesn't exist in this UI yet."
      action={<Button onClick={() => navigate("/")}>Back to overview</Button>}
    />
  );
}
