
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface HealthStatus {
  database: boolean;
  gemini: boolean;
  auth: boolean;
  environment: {
    DATABASE_URL: boolean;
    GOOGLE_AI_API_KEY: boolean;
    GOOGLE_GENAI_API_KEY: boolean;
    JWT_SECRET: boolean;
  };
  timestamp: string;
}

const ConnectionStatus: React.FC = () => {
  const [status, setStatus] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/system/health');
        const data = await response.json();
        setStatus(data);
      } catch (error) {
        console.error('Error fetching health status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card className="bg-[#1A1D23] border-gray-800">
        <CardHeader>
          <CardTitle className="text-[#E6E8EC]">System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-gray-400">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (isConnected: boolean) => {
    return isConnected ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );
  };

  const getStatusBadge = (isConnected: boolean) => {
    return (
      <Badge
        variant={isConnected ? "default" : "destructive"}
        className={isConnected ? "bg-green-500/20 text-green-500" : ""}
      >
        {isConnected ? "Connected" : "Disconnected"}
      </Badge>
    );
  };

  return (
    <Card className="bg-[#1A1D23] border-gray-800">
      <CardHeader>
        <CardTitle className="text-[#E6E8EC]">System Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {status && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getStatusIcon(status.database)}
                <span className="text-[#E6E8EC]">Database</span>
              </div>
              {getStatusBadge(status.database)}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getStatusIcon(status.gemini)}
                <span className="text-[#E6E8EC]">Gemini AI</span>
              </div>
              {getStatusBadge(status.gemini)}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getStatusIcon(status.auth)}
                <span className="text-[#E6E8EC]">Auth (JWT)</span>
              </div>
              {getStatusBadge(status.auth)}
            </div>

            <div className="border-t border-gray-700 pt-4">
              <h4 className="text-sm font-medium text-[#E6E8EC] mb-2">Environment</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">DATABASE_URL</span>
                  {status.environment.DATABASE_URL ? 
                    <CheckCircle className="w-4 h-4 text-green-500" /> : 
                    <XCircle className="w-4 h-4 text-red-500" />
                  }
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">GOOGLE_AI_API_KEY</span>
                  {status.environment.GOOGLE_AI_API_KEY ? 
                    <CheckCircle className="w-4 h-4 text-green-500" /> : 
                    <XCircle className="w-4 h-4 text-red-500" />
                  }
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">JWT_SECRET</span>
                  {status.environment.JWT_SECRET ? 
                    <CheckCircle className="w-4 h-4 text-green-500" /> : 
                    <XCircle className="w-4 h-4 text-red-500" />
                  }
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500">
              Last updated: {new Date(status.timestamp).toLocaleString()}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ConnectionStatus;
