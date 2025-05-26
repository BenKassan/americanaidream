
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCcw, TrendingUp, Globe, Bot } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Report {
  id: string;
  rating: number;
  summary: string;
  created_at: string;
}

const Index = () => {
  const [latestReport, setLatestReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const { toast } = useToast();

  // Mock data for demonstration - will be replaced with Supabase data
  const mockReport: Report = {
    id: '1',
    rating: 7.5,
    summary: `**Key AI Developments**: Recent advancements in AI technology continue to reshape multiple industries, with significant breakthroughs in natural language processing and automation technologies driving unprecedented adoption rates across enterprise sectors.

**Economic Implications**: The integration of AI systems is creating both opportunities and challenges in the job market, with estimates suggesting 12 million new roles while potentially displacing 8 million traditional positions over the next 18 months.

**Overall Assessment**: Current AI economic impact shows strong positive momentum with measured disruption. Investment flows remain robust while regulatory frameworks are adapting to ensure sustainable growth patterns.`,
    created_at: new Date().toISOString()
  };

  useEffect(() => {
    // Initialize with mock data
    setLatestReport(mockReport);
    setLastUpdated(formatTimeAgo(mockReport.created_at));
  }, []);

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      // Simulate API call - will be replaced with actual edge function call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update with fresh mock data
      const updatedReport = {
        ...mockReport,
        rating: Math.round((Math.random() * 4 + 6) * 10) / 10, // Random rating between 6-10
        created_at: new Date().toISOString()
      };
      
      setLatestReport(updatedReport);
      setLastUpdated(formatTimeAgo(updatedReport.created_at));
      
      toast({
        title: "Data refreshed successfully",
        description: "Latest AI economic analysis has been updated",
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Unable to fetch latest data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return "bg-green-500";
    if (rating >= 6) return "bg-yellow-500";
    if (rating >= 4) return "bg-orange-500";
    return "bg-red-500";
  };

  const getRatingBadgeVariant = (rating: number) => {
    if (rating >= 8) return "default";
    if (rating >= 6) return "secondary";
    return "destructive";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center space-x-3">
            <Globe className="h-8 w-8 text-blue-600" />
            <Bot className="h-8 w-8 text-purple-600" />
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-center mt-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI-Economy Monitor
          </h1>
          <p className="text-center text-gray-600 mt-2 text-lg">
            Real-time analysis of AI's impact on global economics
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        
        {/* Rating Badge Section */}
        <div className="text-center">
          <div className="inline-flex items-center space-x-4 bg-white rounded-2xl shadow-lg border p-8">
            <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              Current Impact Rating
            </div>
            <Badge 
              variant={latestReport ? getRatingBadgeVariant(latestReport.rating) : "secondary"}
              className="text-4xl font-bold px-6 py-3 rounded-full"
            >
              {latestReport?.rating || 0} / 10
            </Badge>
          </div>
        </div>

        {/* Summary Card */}
        {latestReport && (
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2">
                <Bot className="h-5 w-5 text-blue-600" />
                <span>Executive Summary</span>
              </CardTitle>
              <CardDescription>
                AI economic impact analysis • Last updated {lastUpdated}
              </CardDescription>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none">
              <div className="whitespace-pre-line text-gray-700 leading-relaxed">
                {latestReport.summary}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Impact Rating Explanation */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span>Rating Scale</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-red-50 border border-red-200">
                <div className="text-2xl font-bold text-red-600">1-3</div>
                <div className="text-sm text-red-700">Negative Impact</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-600">4-7</div>
                <div className="text-sm text-yellow-700">Mixed Signals</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
                <div className="text-2xl font-bold text-green-600">8-10</div>
                <div className="text-sm text-green-700">Strong Positive</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Control Panel */}
        <div className="flex justify-center">
          <Button 
            onClick={handleRefresh}
            disabled={isLoading}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-3 rounded-full shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            <RefreshCcw className={`h-5 w-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Analyzing...' : 'Refresh Analysis'}
          </Button>
        </div>

        {/* Integration Status */}
        <Card className="shadow-lg border-2 border-dashed border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-blue-800">🔧 Integration Setup Required</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-blue-700">
              <p><strong>Next Steps:</strong></p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Connect to Supabase using the green button in the top-right corner</li>
                <li>Set up environment variables for NEWS_API_KEY and OPENAI_API_KEY</li>
                <li>Deploy the edge function for automated news analysis</li>
                <li>Configure the cron job for periodic updates</li>
              </ol>
              <p className="text-sm bg-blue-100 p-3 rounded-lg mt-4">
                💡 Currently displaying mock data. Real analysis will replace this once integrations are complete.
              </p>
            </div>
          </CardContent>
        </Card>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-4xl mx-auto px-6 py-8 text-center text-gray-500">
          <p>AI-Economy Monitor • Powered by OpenAI & NewsAPI • Built with Lovable</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
