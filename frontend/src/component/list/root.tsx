import { HTMLAttributes } from "react";
import { Grid } from "../layout/grid";

type Props = HTMLAttributes<HTMLUListElement> & {
  className?: string;
};

export function Container(props: Props) {
  const { children, className } = props;
  return (
    <Grid as="ul" className={className}>
      {children}
    </Grid>
  );
}
