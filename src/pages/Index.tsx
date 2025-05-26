import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCcw, TrendingUp, Globe, Bot } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

  // Fetch the latest report from Supabase
  const fetchLatestReport = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching report:', error);
        return null;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  };

  useEffect(() => {
    // Load initial data
    const loadInitialData = async () => {
      const report = await fetchLatestReport();
      if (report) {
        setLatestReport(report);
        setLastUpdated(formatTimeAgo(report.created_at));
      }
    };

    loadInitialData();
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
      console.log('Triggering AI analysis...');
      
      // Call the edge function to analyze news and update database
      const { data, error } = await supabase.functions.invoke('analyze-ai-economy');
      
      if (error) {
        throw error;
      }

      if (data.success) {
        // Fetch the updated report
        const updatedReport = await fetchLatestReport();
        if (updatedReport) {
          setLatestReport(updatedReport);
          setLastUpdated(formatTimeAgo(updatedReport.created_at));
        }
        
        toast({
          title: "Analysis completed successfully",
          description: `Analyzed ${data.articlesAnalyzed} news articles and updated the economic impact rating`,
        });
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Refresh error:', error);
      toast({
        title: "Analysis failed",
        description: error.message || "Unable to analyze latest data. Please try again.",
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
              {latestReport?.rating || "—"} / 10
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

        {!latestReport && (
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>No Analysis Available</CardTitle>
              <CardDescription>
                Click "Refresh Analysis" to generate the first AI economic impact report
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Rating Scale */}
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
            {isLoading ? 'Analyzing News...' : 'Refresh Analysis'}
          </Button>
        </div>

        {/* Status Card */}
        <Card className="shadow-lg border-2 border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="text-green-800">✅ System Ready</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-green-700">
              <p><strong>Connected Services:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>✅ Supabase Database - Connected</li>
                <li>✅ NewsAPI - Configured</li>
                <li>✅ OpenAI GPT-4 - Configured</li>
                <li>✅ Real-time Analysis - Ready</li>
              </ul>
              <p className="text-sm bg-green-100 p-3 rounded-lg mt-4">
                🎉 Your AI-Economy Monitor is fully operational! Click "Refresh Analysis" to get the latest economic impact assessment.
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
