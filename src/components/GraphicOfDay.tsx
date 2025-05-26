
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

interface SeriesData {
  date: string;
  value: number;
}

interface GraphicOfDayProps {
  title?: string;
  seriesData?: SeriesData[] | null;
}

const GraphicOfDay = ({ title, seriesData }: GraphicOfDayProps) => {
  // Don't render if no data
  if (!seriesData || !seriesData.length || !title) {
    return null;
  }

  // Format tooltip value based on series type
  const formatValue = (value: number) => {
    if (title.includes('%')) {
      return `${value.toFixed(1)}%`;
    }
    if (title.includes('$')) {
      return `$${value.toFixed(2)}`;
    }
    if (title.includes('hours')) {
      return `${value.toFixed(1)} hrs`;
    }
    if (title.includes('thousands')) {
      return `${(value / 1000).toFixed(1)}M`;
    }
    return value.toLocaleString();
  };

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2 text-green-800">
          <TrendingUp className="h-5 w-5" />
          <span>Graphic of the Day: {title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={seriesData}>
            <XAxis 
              dataKey="date" 
              hide 
            />
            <YAxis 
              width={60}
              tick={{ fontSize: 12 }}
              tickFormatter={formatValue}
            />
            <Tooltip 
              formatter={(value: number) => [formatValue(value), title]}
              labelFormatter={(date) => `Date: ${date}`}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#16a34a"
              strokeWidth={2} 
              dot={false}
              activeDot={{ r: 4, stroke: '#16a34a', strokeWidth: 2, fill: 'white' }}
            />
          </LineChart>
        </ResponsiveContainer>
        <p className="text-sm text-gray-600 mt-2 text-center">
          Economic indicator tracking over time • Source: Federal Reserve Economic Data (FRED)
        </p>
      </CardContent>
    </Card>
  );
};

export default GraphicOfDay;
