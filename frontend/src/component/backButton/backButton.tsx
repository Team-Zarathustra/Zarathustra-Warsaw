import { ChevronLeft } from "lucide-react";
import { Button } from "@/component/common/ui/button";
import { Tooltip } from "@/component/common/ui/tooltip";
import { Link } from "react-router-dom";

type Props = {
  label: string;
  to: string;
  ariaLabel: string;
};

export function BackButton({ label, to, ariaLabel }: Props) {
  return (
    <Tooltip
      content={label}
      side="right"
    >
      <Link to={to} style={{ display: "inline-flex", alignItems: "center" }}>
        <Button
          variant="outline"
          size="icon"
          aria-label={ariaLabel}
          className="w-7 h-7 flex items-center justify-center"
          style={{
            display: "inline-flex",
            verticalAlign: "middle",
          }}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </Link>
    </Tooltip>
  );
}
