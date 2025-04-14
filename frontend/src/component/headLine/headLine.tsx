import { Flex } from "@/component/layout/flex";
import { BackButton } from "@/component/backButton";
import { Heading } from "@/component/typography";
import { ReactNode } from "react";

type TBackButton = {
  label: string;
  to: string;
  ariaLabel: string;
};

type Props = {
  text: ReactNode;
  link: TBackButton;
};

export function HeadLine(props: Props) {
  const { text, link } = props;

  return (
    <Flex align="center" gap="4" style={{ display: "flex", alignItems: "center" }}>
      <BackButton label={link.label} to={link.to} ariaLabel={link.ariaLabel} />
      <Heading style={{ margin: 0, lineHeight: "1.5", verticalAlign: "middle" }}>
        {text}
      </Heading>
    </Flex>
  );
}

