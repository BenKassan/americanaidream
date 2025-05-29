import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { format } from "date-fns";

interface ReportData {
  created_at: string;
  rating: number;
  prod_labor_score: number | null;
  american_dream_score: number | null;
}

interface MacroData {
  snapshot_date: string;
  unrate: number | null;
  median_income: number | null;
  gini_index: number | null;
}

interface MetricDeltaCardProps {
  title: string;
  latestValue: number | null;
  deltaValue: number | null;
  isPositiveGood?: boolean;
  formatValue?: (value: number) => string;
}

const MetricDeltaCard = ({ 
  title, 
  latestValue, 
  deltaValue, 
  isPositiveGood = true,
  formatValue 
}: MetricDeltaCardProps) => {
  const getDeltaColor = (delta: number | null) => {
    if (delta === null || delta === 0) return 'text-gray-600';
    const isGood = isPositiveGood ? delta > 0 : delta < 0;
    return isGood ? 'text-green-600' : 'text-red-600';
  };

  const getDeltaIcon = (delta: number | null) => {
    if (delta === null || delta === 0) return '—';
    return delta > 0 ? '▲' : '▼';
  };

  const formatDisplayValue = (value: number | null) => {
    if (value === null || isNaN(value)) return '—';
    return formatValue ? formatValue(value) : value.toFixed(1);
  };

  const formattedValue = formatDisplayValue(latestValue);

  return (
    <Card className="shadow-lg">
      <CardContent className="p-6 text-center">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <div className="mt-2 flex justify-center gap-4 items-end">
          <span className="text-4xl font-bold">{formattedValue}</span>
          <span className={`text-lg font-semibold ${getDeltaColor(deltaValue)}`}>
            {getDeltaIcon(deltaValue)} {deltaValue !== null && !isNaN(deltaValue) ? Math.abs(deltaValue).toFixed(1) : '—'}
          </span>
        </div>
        <p className="mt-1 text-xs text-gray-500">Change since 1 Jan 2025</p>
      </CardContent>
    </Card>
  );
};

const History = () => {
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [macroData, setMacroData] = useState<MacroData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [{ data: reports, error: reportsError }, { data: macros, error: macrosError }] = await Promise.all([
          supabase
            .from('reports')
            .select(`
              created_at,
              rating,
              prod_labor_score,
              american_dream_score
            `)
            .order('created_at', { ascending: true }),
          supabase
            .from('macro_snapshots')
            .select('*')
            .order('snapshot_date', { ascending: true })
        ]);

        if (reportsError) {
          console.error('Reports error:', reportsError);
          setError(reportsError.message);
          return;
        }

        if (macrosError) {
          console.error('Macros error:', macrosError);
          // Continue even if macro data fails
        }

        setReportData(reports || []);
        setMacroData(macros || []);
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
    if (a == null || b == null || isNaN(a) || isNaN(b)) return null;
    return b - a;
  };

  // Find baseline and latest with fallback
  const reportsBaseline = reportData.find(r => new Date(r.created_at) >= new Date('2025-01-01')) || reportData[0];
  const reportsLatest = reportData[reportData.length - 1];
  
  const macroBaseline = macroData.find(r => new Date(r.snapshot_date) >= new Date('2025-01-01')) || macroData[0];
  const macroLatest = macroData[macroData.length - 1];

  const formatChartData = (data: any[], key: string, dateKey: string) => {
    // Group data by date (YYYY-MM-DD format) and take the latest value for each day
    const groupedByDate = data
      .filter(item => item[key] !== null && !isNaN(item[key]))
      .reduce((acc, item) => {
        const dateStr = format(new Date(item[dateKey]), 'yyyy-MM-dd');
        
        // If we haven't seen this date yet, or this item is later in the day, use this item
        if (!acc[dateStr] || new Date(item[dateKey]) > new Date(acc[dateStr].fullDate)) {
          acc[dateStr] = {
            date: format(new Date(item[dateKey]), 'MMM dd'),
            value: item[key] as number,
            fullDate: item[dateKey],
            dateStr: dateStr
          };
        }
        
        return acc;
      }, {} as Record<string, any>);

    // Convert back to array and sort by date
    return Object.values(groupedByDate).sort((a: any, b: any) => 
      new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime()
    );
  };

  const formatCurrency = (value: number) => {
    if (isNaN(value)) return '—';
    return `$${(value / 1000).toFixed(0)}k`;
  };

  const formatPercent = (value: number) => {
    if (isNaN(value)) return '—';
    return `${value.toFixed(1)}%`;
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
            Track headline labour & equity indicators alongside AI impact scores (Jan 2025 – today).
          </p>
        </div>

        {/* Delta Cards Grid - 6 cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MetricDeltaCard
            title="Impact Rating"
            latestValue={reportsLatest?.rating}
            deltaValue={delta(reportsBaseline?.rating, reportsLatest?.rating)}
          />
          <MetricDeltaCard
            title="Productivity vs Labor"
            latestValue={reportsLatest?.prod_labor_score}
            deltaValue={delta(reportsBaseline?.prod_labor_score, reportsLatest?.prod_labor_score)}
          />
          <MetricDeltaCard
            title="American Dream"
            latestValue={reportsLatest?.american_dream_score}
            deltaValue={delta(reportsBaseline?.american_dream_score, reportsLatest?.american_dream_score)}
          />
          <MetricDeltaCard
            title="Unemployment Rate"
            latestValue={macroLatest?.unrate}
            deltaValue={delta(macroBaseline?.unrate, macroLatest?.unrate)}
            isPositiveGood={false}
            formatValue={formatPercent}
          />
          <MetricDeltaCard
            title="Median HH Income"
            latestValue={macroLatest?.median_income}
            deltaValue={delta(macroBaseline?.median_income, macroLatest?.median_income)}
            formatValue={formatCurrency}
          />
          <MetricDeltaCard
            title="Gini Index"
            latestValue={macroLatest?.gini_index}
            deltaValue={delta(macroBaseline?.gini_index, macroLatest?.gini_index)}
            isPositiveGood={false}
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
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="rating">Impact</TabsTrigger>
                <TabsTrigger value="prod_labor_score">Prod vs Labor</TabsTrigger>
                <TabsTrigger value="american_dream_score">Dream</TabsTrigger>
                <TabsTrigger value="unemployment">Unemployment</TabsTrigger>
                <TabsTrigger value="income">Income</TabsTrigger>
                <TabsTrigger value="gini">Gini</TabsTrigger>
              </TabsList>
              
              <TabsContent value="rating">
                <ResponsiveContainer width="100%" height={380}>
                  <LineChart data={formatChartData(reportData, 'rating', 'created_at')}>
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
                <ResponsiveContainer width="100%" height={380}>
                  <LineChart data={formatChartData(reportData, 'prod_labor_score', 'created_at')}>
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
                <ResponsiveContainer width="100%" height={380}>
                  <LineChart data={formatChartData(reportData, 'american_dream_score', 'created_at')}>
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

              <TabsContent value="unemployment">
                <ResponsiveContainer width="100%" height={380}>
                  <LineChart data={formatChartData(macroData, 'unrate', 'snapshot_date')}>
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(value) => `${value.toFixed(1)}%`} />
                    <Tooltip 
                      formatter={(value: number) => [`${value.toFixed(1)}%`, 'Unemployment Rate']}
                      labelFormatter={(date) => `Date: ${date}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>

              <TabsContent value="income">
                <ResponsiveContainer width="100%" height={380}>
                  <LineChart data={formatChartData(macroData, 'median_income', 'snapshot_date')}>
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                    <Tooltip 
                      formatter={(value: number) => [`$${(value / 1000).toFixed(1)}k`, 'Median Income']}
                      labelFormatter={(date) => `Date: ${date}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#059669" 
                      strokeWidth={2}
                      dot={{ fill: '#059669', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>

              <TabsContent value="gini">
                <ResponsiveContainer width="100%" height={380}>
                  <LineChart data={formatChartData(macroData, 'gini_index', 'snapshot_date')}>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [value.toFixed(1), 'Gini Index']}
                      labelFormatter={(date) => `Date: ${date}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#7c2d12" 
                      strokeWidth={2}
                      dot={{ fill: '#7c2d12', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        {reportData.length > 0 && (
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-500">AI Reports</p>
                  <p className="text-2xl font-bold">{reportData.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Macro Snapshots</p>
                  <p className="text-2xl font-bold">{macroData.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">First Report</p>
                  <p className="text-2xl font-bold">
                    {reportData.length > 0 ? format(new Date(reportData[0].created_at), 'MMM dd, yyyy') : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Latest Update</p>
                  <p className="text-2xl font-bold">
                    {reportsLatest ? format(new Date(reportsLatest.created_at), 'MMM dd, yyyy') : '—'}
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
