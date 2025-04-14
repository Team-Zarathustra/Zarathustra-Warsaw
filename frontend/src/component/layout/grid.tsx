import { HTMLAttributes } from "react";
import { VariantProps, cva } from "class-variance-authority";
import { TCommonProps, TTag } from "./types";
import { alignTokens, gapTokens, justifyTokens } from "./tokens";
import { cn } from "@/lib/utils";

type Props = HTMLAttributes<HTMLDivElement> &
  TCommonProps &
  VariantProps<typeof gridVariants> & {
    as?: TTag;
  };

export function Grid(props: Props) {
  const {
    as: Tag = "div",
    children,
    className,
    width,
    height,
    display,
    rows,
    columns,
    flow,
    justify,
    align,
    gap,
  } = props;

  return (
    <Tag
      className={cn(
        gridVariants({
          display,
          rows,
          columns,
          flow,
          justify,
          align,
          gap,
        }),
        width,
        height,
        className,
      )}
    >
      {children}
    </Tag>
  );
}

const gridVariants = cva(null, {
  variants: {
    display: {
      grid: "grid",
      "inline-grid": "inline-grid",
    },
    rows: {
      "1": `grid-rows-1`,
      "2": `grid-rows-2`,
      "3": `grid-rows-3`,
      "4": `grid-rows-4`,
      "5": `grid-rows-5`,
      "6": `grid-rows-6`,
      "7": `grid-rows-7`,
      "8": `grid-rows-8`,
      "9": `grid-rows-9`,
      "10": `grid-rows-10`,
      "11": `grid-rows-11`,
      "12": `grid-rows-12`,
      none: `grid-rows-none`,
    },
    columns: {
      "1": `grid-cols-1`,
      "2": `grid-cols-2`,
      "3": `grid-cols-3`,
      "4": `grid-cols-4`,
      "5": `grid-cols-5`,
      "6": `grid-cols-6`,
      "7": `grid-cols-7`,
      "8": `grid-cols-8`,
      "9": `grid-cols-9`,
      "10": `grid-cols-10`,
      "11": `grid-cols-11`,
      "12": `grid-cols-12`,
      none: `grid-cols-none`,
    },
    flow: {
      row: "grid-flow-row",
      column: "grid-flow-col",
      dense: "grid-flow-dense",
      "row-dense": "grid-flow-row-dense",
      "column-dense": "grid-flow-col-dense",
    },
    justify: justifyTokens,
    align: alignTokens,
    gap: gapTokens,
  },
  defaultVariants: {
    display: "grid",
  },
});
