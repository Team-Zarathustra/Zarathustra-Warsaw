import { Outlet, useLocation } from "react-router-dom";
import { Navigation } from "@/component/navigation";
import { Flex, Grid } from "@/component/layout";

export function Layout() {
  const location = useLocation();
  const isAuthRoute = location.pathname === '/login';

  return (
    <Flex className={isAuthRoute ? 'min-h-screen' : ''}>
      {/*<Navigation />*/}
      <Grid
        columns="12"
        align="start"
        gap="4"
        className={`w-full ${
          isAuthRoute 
            ? 'min-h-screen grid place-items-center' 
            : 'grid-rows-[auto_1fr] py-4 px-6 relative z-0'
        }`}
      >
        <Flex 
          as="main" 
          className={
            isAuthRoute 
              ? 'w-full lg:ml-16' 
              : 'mb-16 lg:mb-0 lg:ml-16 col-span-12'
          }
        >
          <Outlet />
        </Flex>
      </Grid>
    </Flex>
  );
}