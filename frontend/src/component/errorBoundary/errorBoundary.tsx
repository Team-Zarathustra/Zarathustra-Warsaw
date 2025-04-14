import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';
import { Button } from "@/component/common/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/component/common/ui/card";
import { ArrowUpRight, AlertTriangle } from "lucide-react";
import { Flex } from "@/component/layout";
import { Avatar, AvatarFallback } from "@/component/common/ui/avatar";

export function ErrorBoundary() {
  const error = useRouteError();

  let errorTitle = "An unexpected error occurred";
  let errorDescription = "We're sorry, but something went wrong. Please try again later.";
  let errorStatus = "500";

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      errorTitle = "Sorry, page not found!";
      errorDescription = "The page you're looking for doesn't exist or has been moved.";
      errorStatus = "404";
    } else {
      errorTitle = `Error ${error.status}`;
      errorDescription = error.statusText || "An error occurred while processing your request.";
      errorStatus = error.status.toString();
    }
  }

  return (
    <Flex className="h-screen w-screen items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold mb-2">{errorTitle}</CardTitle>
          <CardDescription className="text-sm text-gray-500">{errorDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <Flex direction="column" align="center" gap="6" className="py-6">
            <Avatar className="w-20 h-20 bg-red-100">
              <AvatarFallback className="text-red-500">
                <AlertTriangle size={40} />
              </AvatarFallback>
            </Avatar>
            <div className="text-base font-bold text-red-500 text-6xl">{errorStatus}</div>
            <Button asChild size="lg" className="mt-2">
              <Link to="/" className="flex items-center gap-2">
                Go back to homepage
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </Flex>
        </CardContent>
      </Card>
    </Flex>
  );
}