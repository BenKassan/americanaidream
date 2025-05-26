
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";

interface ReportData {
  created_at: string;
  rating: number;
  prod_labor_score: number | null;
  american_dream_score: number | null;
}

interface MetricDeltaCardProps {
  title: string;
  latestValue: number | null;
  deltaValue: number | null;
}

const MetricDeltaCard = ({ title, latestValue, deltaValue }: MetricDeltaCardProps) => {
  const getDeltaColor = (delta: number | null) => {
    if (delta === null || delta === 0) return 'text-gray-600';
    return delta > 0 ? 'text-green-600' : 'text-red-600';
  };

  const getDeltaIcon = (delta: number | null) => {
    if (delta === null || delta === 0) return '—';
    return delta > 0 ? '▲' : '▼';
  };

  return (
    <Card className="shadow-lg">
      <CardContent className="p-6 text-center">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <div className="mt-2 flex justify-center gap-4 items-end">
          <span className="text-4xl font-bold">{latestValue?.toFixed(1) ?? '—'}</span>
          <span className={`text-lg font-semibold ${getDeltaColor(deltaValue)}`}>
            {getDeltaIcon(deltaValue)} {deltaValue !== null ? Math.abs(deltaValue).toFixed(1) : '—'}
          </span>
        </div>
        <p className="mt-1 text-xs text-gray-500">Change since 1 Jan 2025</p>
      </CardContent>
    </Card>
  );
};

const History = () => {
  const [data, setData] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: reports, error } = await supabase
          .from('reports')
          .select(`
            created_at,
            rating,
            prod_labor_score,
            american_dream_score
          `)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Supabase error:', error);
          setError(error.message);
          return;
        }

        setData(reports || []);
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const delta = (a?: number | null, b?: number | null) => {
    if (a == null || b == null) return null;
    return b - a;
  };

  const baseline = data.find(r => new Date(r.created_at) >= new Date('2025-01-01'));
  const latest = data[data.length - 1];

  const formatChartData = (key: keyof ReportData) => {
    return data
      .filter(item => item[key] !== null)
      .map(item => ({
        date: format(new Date(item.created_at), 'MMM dd'),
        value: item[key] as number,
        fullDate: item.created_at
      }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading history...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-20">
            <p className="text-red-600">Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-green-700 hover:text-green-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Home
          </Link>
        </div>

        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            History & Trends
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Track how AI's economic impact has evolved over time with detailed metrics and trend analysis.
          </p>
        </div>

        {/* Delta Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricDeltaCard
            title="Impact Rating"
            latestValue={latest?.rating}
            deltaValue={delta(baseline?.rating, latest?.rating)}
          />
          <MetricDeltaCard
            title="Productivity vs Labor"
            latestValue={latest?.prod_labor_score}
            deltaValue={delta(baseline?.prod_labor_score, latest?.prod_labor_score)}
          />
          <MetricDeltaCard
            title="American Dream Score"
            latestValue={latest?.american_dream_score}
            deltaValue={delta(baseline?.american_dream_score, latest?.american_dream_score)}
          />
        </div>

        {/* Charts Section */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Historical Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="rating" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="rating">Impact Rating</TabsTrigger>
                <TabsTrigger value="prod_labor_score">Productivity vs Labor</TabsTrigger>
                <TabsTrigger value="american_dream_score">American Dream</TabsTrigger>
              </TabsList>
              
              <TabsContent value="rating">
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={formatChartData('rating')}>
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip 
                      formatter={(value: number) => [value.toFixed(1), 'Impact Rating']}
                      labelFormatter={(date) => `Date: ${date}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#16a34a" 
                      strokeWidth={2}
                      dot={{ fill: '#16a34a', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>
              
              <TabsContent value="prod_labor_score">
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={formatChartData('prod_labor_score')}>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [value.toFixed(1), 'Productivity vs Labor Score']}
                      labelFormatter={(date) => `Date: ${date}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#2563eb" 
                      strokeWidth={2}
                      dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>
              
              <TabsContent value="american_dream_score">
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={formatChartData('american_dream_score')}>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [value.toFixed(1), 'American Dream Score']}
                      labelFormatter={(date) => `Date: ${date}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#dc2626" 
                      strokeWidth={2}
                      dot={{ fill: '#dc2626', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        {data.length > 0 && (
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-500">Total Reports</p>
                  <p className="text-2xl font-bold">{data.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">First Report</p>
                  <p className="text-2xl font-bold">
                    {format(new Date(data[0].created_at), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Latest Report</p>
                  <p className="text-2xl font-bold">
                    {format(new Date(latest.created_at), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default History;
