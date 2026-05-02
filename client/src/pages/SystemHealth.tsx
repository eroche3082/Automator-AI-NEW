
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle, AlertTriangle, XCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface HealthCheck {
  status: '✅' | '❌' | '⚠️';
  details: string;
  response_time?: number;
}

interface SystemHealth {
  timestamp: string;
  app: string;
  environment: string;
  checks: Record<string, HealthCheck>;
  summary: {
    total: number;
    passed: number;
    warnings: number;
    failed: number;
    overall_status: string;
  };
}

const SystemHealth = () => {
  const [healthData, setHealthData] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const { toast } = useToast();

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/system/health');
      if (response.ok) {
        const data = await response.json();
        setHealthData(data);
        setLastCheck(new Date());
        
        if (data.summary.failed > 0) {
          toast({
            title: "System Issues Detected",
            description: `${data.summary.failed} critical issues found`,
            variant: "destructive",
          });
        }
      } else {
        throw new Error('Failed to fetch system health');
      }
    } catch (error) {
      console.error('Error fetching system health:', error);
      toast({
        title: "Health Check Failed",
        description: "Unable to retrieve system health status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchHealthData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case '✅': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case '⚠️': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case '❌': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case '✅': return <Badge className="bg-green-500/20 text-green-500">Operational</Badge>;
      case '⚠️': return <Badge className="bg-yellow-500/20 text-yellow-500">Warning</Badge>;
      case '❌': return <Badge className="bg-red-500/20 text-red-500">Failed</Badge>;
      default: return <Badge className="bg-gray-500/20 text-gray-500">Unknown</Badge>;
    }
  };

  if (loading && !healthData) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">System Health Check</h1>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0047FF] mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Top Bar */}
      <div className="bg-[#151515] border-b border-gray-800 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">System Health Monitor</h1>
            <p className="text-gray-400">Real-time status of all system components</p>
          </div>
          <div className="flex items-center space-x-4">
            {lastCheck && (
              <span className="text-sm text-gray-400">
                Last check: {lastCheck.toLocaleTimeString()}
              </span>
            )}
            <Button
              onClick={fetchHealthData}
              disabled={loading}
              className="bg-[#0047FF] hover:bg-[#0047FF]/80"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Summary Card */}
          {healthData && (
            <Card className="mb-6 bg-[#151515] border-gray-800">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-2xl">{healthData.summary.overall_status}</CardTitle>
                    <CardDescription>
                      {healthData.app} • {healthData.environment} environment
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-[#0047FF]">
                      {healthData.summary.passed}/{healthData.summary.total}
                    </div>
                    <div className="text-sm text-gray-400">Services Online</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">{healthData.summary.passed}</div>
                    <div className="text-sm text-gray-400">Passed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-500">{healthData.summary.warnings}</div>
                    <div className="text-sm text-gray-400">Warnings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-500">{healthData.summary.failed}</div>
                    <div className="text-sm text-gray-400">Failed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-400">{healthData.summary.total}</div>
                    <div className="text-sm text-gray-400">Total</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Service Status Cards */}
          {healthData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(healthData.checks).map(([service, check]) => (
                <Card key={service} className="bg-[#151515] border-gray-800">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{service}</CardTitle>
                      {getStatusIcon(check.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {getStatusBadge(check.status)}
                      <p className="text-sm text-gray-400">{check.details}</p>
                      {check.response_time && (
                        <p className="text-xs text-gray-500">
                          Response time: {check.response_time}ms
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Timestamp */}
          {healthData && (
            <div className="mt-6 text-center text-sm text-gray-400">
              Last updated: {new Date(healthData.timestamp).toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SystemHealth;
