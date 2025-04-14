import { cn } from "@/lib/utils";

interface AlertDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export function AlertDescription({ className, ...props }: AlertDescriptionProps) {
  return (
    <div
      className={cn("text-sm", className)}
      {...props}
    />
  );
}

export { Alert } from "./alert";