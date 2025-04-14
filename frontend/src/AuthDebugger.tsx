import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

interface TokenData {
  authToken: string | null;
  refreshToken: string | null;
  userId: string | null;
}

const AuthDebugger = () => {
  const auth = useAuth();
  const [refreshAttempts, setRefreshAttempts] = useState(0);
  const [lastRefreshTime, setLastRefreshTime] = useState<string | null>(null);
  const [tokenData, setTokenData] = useState<TokenData>({
    authToken: null,
    refreshToken: null,
    userId: null
  });

  useEffect(() => {
    const checkTokens = () => {
      const authToken = localStorage.getItem('authToken');
      const refreshToken = localStorage.getItem('refreshToken');
      const userId = localStorage.getItem('userId');
      
      setTokenData({
        authToken: authToken ? `${authToken.substring(0, 10)}...` : null,
        refreshToken: refreshToken ? `${refreshToken.substring(0, 10)}...` : null,
        userId
      });
    };

    checkTokens();
    const interval = setInterval(checkTokens, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (auth.isLoading) {
      setRefreshAttempts(prev => prev + 1);
      setLastRefreshTime(new Date().toISOString());
    }
  }, [auth.isLoading]);

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-md text-sm">
      <h3 className="font-bold mb-2 text-lg">Auth Debug Panel</h3>
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <span className="font-medium">Auth State:</span>
          <span className={auth.isLoggedIn ? "text-green-600" : "text-red-600"}>
            {auth.isLoggedIn ? "Logged In" : "Logged Out"}
          </span>
          
          <span className="font-medium">Loading:</span>
          <span className={auth.isLoading ? "text-yellow-600" : "text-green-600"}>
            {auth.isLoading ? "True" : "False"}
          </span>
          
          <span className="font-medium">User ID:</span>
          <span>{auth.userId || "None"}</span>
          
          <span className="font-medium">Refresh Attempts:</span>
          <span className={refreshAttempts > 5 ? "text-red-600" : "text-gray-600"}>
            {refreshAttempts}
          </span>
        </div>

        <div className="mt-4">
          <h4 className="font-medium mb-1">Local Storage Tokens:</h4>
          <div className="bg-gray-50 p-2 rounded text-xs space-y-1">
            <div>Auth Token: {tokenData.authToken || "None"}</div>
            <div>Refresh Token: {tokenData.refreshToken || "None"}</div>
            <div>Stored User ID: {tokenData.userId || "None"}</div>
          </div>
        </div>

        {lastRefreshTime && (
          <div className="text-xs text-gray-500">
            Last refresh attempt: {lastRefreshTime}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthDebugger;