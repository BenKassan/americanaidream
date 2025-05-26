
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCcw, TrendingUp, Briefcase, Flag, Factory, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import GraphicOfDay from "@/components/GraphicOfDay";

interface SeriesData {
  date: string;
  value: number;
}

interface Report {
  id: string;
  rating: number;
  summary: string;
  productivity_insight?: string;
  american_dream_impact?: string;
  prod_labor_score?: number;
  prod_labor_tooltip?: string;
  series_id?: string;
  series_title?: string;
  series_data?: SeriesData[] | null;
  created_at: string;
}

const Index = () => {
  const [latestReport, setLatestReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const { toast } = useToast();

  // Type guard to check if data is SeriesData array
  const isSeriesDataArray = (data: any): data is SeriesData[] => {
    return Array.isArray(data) && 
           data.every(item => 
             typeof item === 'object' && 
             item !== null &&
             typeof item.date === 'string' && 
             typeof item.value === 'number'
           );
  };

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

      if (data && data.length > 0) {
        const rawReport = data[0];
        // Safely convert series_data with type checking
        const seriesData = rawReport.series_data && isSeriesDataArray(rawReport.series_data) 
          ? rawReport.series_data 
          : null;
        
        const transformedReport: Report = {
          ...rawReport,
          series_data: seriesData
        };
        return transformedReport;
      }

      return null;
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
          title: "Economic analysis updated",
          description: `Analyzed ${data.articlesAnalyzed} news articles${data.fredSeries ? ` and loaded ${data.fredSeries} economic data` : ''}`,
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

  const getRatingBadgeVariant = (rating: number) => {
    if (rating >= 8) return "default";
    if (rating >= 6) return "secondary";
    return "destructive";
  };

  const getRatingDescription = (rating: number) => {
    if (rating >= 8) return "Transformative Opportunity";
    if (rating >= 6) return "Mixed Signals";
    if (rating >= 4) return "Concerning Trends";
    return "Critical Disruption";
  };

  const getScoreColor = (score: number) => {
    if (score >= 71) return "text-green-600";
    if (score >= 41) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-blue-100">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Flag className="h-8 w-8 text-blue-600" />
            <Factory className="h-8 w-8 text-red-600" />
            <Briefcase className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-blue-600 via-purple-600 to-red-600 bg-clip-text text-transparent">
            American Dream Monitor
          </h1>
          <p className="text-center text-gray-600 mt-2 text-lg">
            AI's Impact on Work, Wages, and Economic Opportunity
          </p>
          <p className="text-center text-gray-500 mt-1 text-sm">
            Real-time analysis of how artificial intelligence is reshaping the value of labor and the path to prosperity
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        
        {/* Rating Badge Section */}
        <div className="text-center">
          <div className="inline-flex flex-col items-center space-y-3 bg-white rounded-2xl shadow-lg border p-8">
            <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              American Dream Impact Score
            </div>
            <Badge 
              variant={latestReport ? getRatingBadgeVariant(latestReport.rating) : "secondary"}
              className="text-4xl font-bold px-6 py-3 rounded-full"
            >
              {latestReport?.rating || "—"} / 10
            </Badge>
            <div className="text-sm text-gray-600 font-medium">
              {latestReport ? getRatingDescription(latestReport.rating) : "No Data Available"}
            </div>
          </div>
        </div>

        {/* Graphic of the Day */}
        <GraphicOfDay 
          title={latestReport?.series_title}
          seriesData={latestReport?.series_data}
        />

        {/* Key Insights Grid */}
        {latestReport && (
          <>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Productivity vs Labor Value Score */}
              <Card className="shadow-lg border-0 bg-gradient-to-br from-orange-50 to-red-50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-orange-800">
                    <Factory className="h-5 w-5" />
                    <span>Productivity vs. Labor Value</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow">
                    <span className="text-sm uppercase tracking-wide text-gray-500">
                      Productivity vs Labor Value
                    </span>
                    <span className={`mt-2 text-5xl font-bold ${latestReport.prod_labor_score !== undefined ? getScoreColor(latestReport.prod_labor_score) : 'text-gray-400'}`}>
                      {latestReport.prod_labor_score ?? '—'}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">Score /100</span>
                    <p className="text-center text-gray-600 mt-3 text-sm">
                      {latestReport.prod_labor_tooltip || 'No analysis available'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* American Dream Impact */}
              {latestReport.american_dream_impact && (
                <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-purple-50">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2 text-blue-800">
                      <Flag className="h-5 w-5" />
                      <span>American Dream Impact</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-blue-700 leading-relaxed">
                      {latestReport.american_dream_impact}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Comprehensive Analysis */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  <span>Data-Driven Economic Analysis</span>
                </CardTitle>
                <CardDescription>
                  AI analysis based on current news data • Last updated {lastUpdated}
                </CardDescription>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <div className="whitespace-pre-line text-gray-700 leading-relaxed text-base">
                  {latestReport.summary}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {!latestReport && (
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>No Analysis Available</CardTitle>
              <CardDescription>
                Click "Generate Analysis" to create the first American Dream impact assessment based on current news data
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Rating Scale */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span>Impact Assessment Scale</span>
            </CardTitle>
            <CardDescription>How AI affects traditional American ideals of work and prosperity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-red-50 border border-red-200">
                <div className="text-xl font-bold text-red-600">1-3</div>
                <div className="text-sm text-red-700 font-medium">Critical Disruption</div>
                <div className="text-xs text-red-600 mt-1">Severe job displacement, wage stagnation</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-orange-50 border border-orange-200">
                <div className="text-xl font-bold text-orange-600">4-5</div>
                <div className="text-sm text-orange-700 font-medium">Concerning Trends</div>
                <div className="text-xs text-orange-600 mt-1">Notable labor market challenges</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                <div className="text-xl font-bold text-yellow-600">6-7</div>
                <div className="text-sm text-yellow-700 font-medium">Mixed Signals</div>
                <div className="text-xs text-yellow-600 mt-1">Some opportunities, some challenges</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
                <div className="text-xl font-bold text-green-600">8-10</div>
                <div className="text-sm text-green-700 font-medium">Transformative Opportunity</div>
                <div className="text-xs text-green-600 mt-1">New pathways to prosperity</div>
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
            {isLoading ? 'Analyzing Economic Data...' : 'Generate New Analysis'}
          </Button>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-5xl mx-auto px-6 py-8 text-center text-gray-500">
          <p>American Dream Monitor • AI Analysis Based on Real News Data • Tracking Labor & Productivity Trends</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
