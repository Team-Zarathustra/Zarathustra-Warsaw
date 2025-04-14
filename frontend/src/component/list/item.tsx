import { HTMLAttributes } from "react";
import { Flex } from "@/component/layout/flex";
import { cn } from "@/lib/utils";

type Props = HTMLAttributes<HTMLLIElement> & {
  className?: string;
};

export function Item(props: Props) {
  const { children, className } = props;
  return (
    <Flex as="li" className={cn("items-center py-4", className)}>
      {children}
    </Flex>
  );
}
