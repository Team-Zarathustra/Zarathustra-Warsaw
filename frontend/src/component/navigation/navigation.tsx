import { Link, useNavigate } from "react-router-dom";
import { 
  Database, 
  FileText, 
  Compass,
  Bell,
  Mail, 
  User2, 
  BarChart2, 
  CheckSquare, 
  GitBranch,
  Settings,
  LogOut, 
  Home 
} from "lucide-react";
import { Button } from "@/component/common/ui/button";
import { Flex } from "@/component/layout";
import { TNavigation } from "./types";
import { useAuth } from "@/context/authContext";
import { Tooltip } from "@/component/common/ui/tooltip";

const navigation: TNavigation[] = [
  {
    label: "Discovery",
    to: "/discovery",
    icon: <Compass />,
    ariaLabel: "discovery",
    protected: true,
  },
  {
    label: "Templates",
    to: "/templates",
    icon: <FileText />,
    ariaLabel: "templates",
    protected: true,
  },
];

export function Navigation() {
  const { isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();

  const handleNavigation = (to: string) => {
    navigate(to);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Flex
      as="aside"
      justify="start"
      align="center"
      gap="2"
      className="fixed h-16 w-full z-10 bottom-0 px-2 border-t bg-background lg:fixed lg:h-screen lg:w-16 lg:flex-col lg:border-t-0 lg:border-r lg:px-0 lg:py-2"
    >
      <Flex
        justify="center"
        align="center"
        className="h-full pr-2 border-r lg:h-auto lg:pr-0 lg:border-r-0 lg:border-b lg:pb-2 lg:w-full"
      >
        <Button variant="outline" size="icon" aria-label="Zarathustra - Home" onClick={() => handleNavigation('/')}>
          <svg
            id="Layer_2"
            data-name="Layer 2"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1394.55 486.5"
            className="size-5 fill-foreground"
          >
            <defs>
              <style>
                {`.cls-1 { fill: #e02319; stroke-width: 0px; }`}
              </style>
            </defs>
            <g id="home" data-name="home">
              <g>
                <rect className="cls-1" x="672.34" y="191.84" width="396.31" height="101.67" transform="translate(83.37 686.61) rotate(-45)" />
                <polygon className="cls-1" points="819.7 421.77 973 486.5 879.81 321.58 975.29 292.18 979.98 109.46 719.69 321.58 786.56 364.83 819.7 421.77" />
                <polygon className="cls-1" points="256.12 486.5 374.63 396.64 413.79 266.1 488.85 295.48 488.85 109.46 133.13 406.43 73.82 486.5 256.12 486.5" />
                <polygon className="cls-1" points="1394.55 486.5 974.66 66.61 902.77 138.5 1250.76 486.5 1394.55 486.5" />
                <polygon className="cls-1" points="143.79 486.5 486.5 143.79 829.21 486.5 973 486.5 558.39 71.89 486.5 0 414.61 71.89 0 486.5 143.79 486.5" />
              </g>
            </g>
          </svg>
        </Button>
      </Flex>
      <nav className="flex gap-2 lg:flex-col relative z-50">
        {navigation.map((item) => (
          <Tooltip
            key={item.label}
            content={item.label}
            side="right"
          >
            <Button
              variant="ghost"
              size="icon"
              className="rounded-lg"
              aria-label={item.ariaLabel}
              onClick={() => handleNavigation(item.to)}
            >
              {item.icon}
            </Button>
          </Tooltip>
        ))}
        
        {isLoggedIn && (
          <Tooltip
            content="Logout"
            side="right"
          >
            <Button
              variant="ghost"
              size="icon"
              className="rounded-lg"
              aria-label="Logout"
              onClick={handleLogout}
            >
              <LogOut className="h-6 w-6" />
            </Button>
          </Tooltip>
        )}
      </nav>
    </Flex>
  );
}