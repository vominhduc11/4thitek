import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";

interface ChartData {
  month?: string;
  period?: string;
  revenue?: number;
  orders?: number;
  customers?: number;
  current?: number;
  growth?: number;
  label?: string;
}

interface RevenueChartProps {
  title: string;
  data: ChartData[];
  type?: 'line' | 'area' | 'bar';
  dataKey: string;
  color?: string;
  height?: number;
  showTooltip?: boolean;
  showDataLabels?: boolean;
}

export function RevenueChart({
  title,
  data,
  type = 'line',
  dataKey,
  color = "#2563eb",
  height = 300,
  showTooltip = true,
  showDataLabels = true
}: RevenueChartProps) {
  const formatTooltip = (value: any, name: any, props: any) => {
    // Check chart title to determine data type
    const isCustomerChart = title.includes('khách hàng');
    const isOrderChart = title.includes('đơn hàng');
    const isRevenueChart = title.includes('doanh thu');

    if (dataKey === 'revenue') {
      return [new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value)), "Doanh thu"];
    }
    if (dataKey === 'current') {
      // Determine data type based on chart title
      if (isCustomerChart) {
        return [`${value} khách`, "Số lượng khách hàng"];
      } else if (isOrderChart) {
        return [`${value} đơn`, "Số lượng đơn hàng"];
      } else {
        return [new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value)), "Doanh thu"];
      }
    }
    if (dataKey === 'orders') {
      return [`${value} đơn`, "Số lượng"];
    }
    if (dataKey === 'customers') {
      return [`${value} khách hàng`, "Khách hàng"];
    }
    if (dataKey === 'growth') {
      return [`${value}%`, "Tăng trưởng"];
    }
    return [value, dataKey];
  };

  const formatDataLabel = (value: any) => {
    if (dataKey === 'revenue' || dataKey === 'current') {
      // Check if it's currency data
      const isRevenueChart = title.includes('doanh thu');
      const isCustomerChart = title.includes('khách hàng');
      const isOrderChart = title.includes('đơn hàng');

      if (isRevenueChart && !isCustomerChart && !isOrderChart) {
        // Format as currency for revenue
        return new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND',
          notation: 'compact',
          maximumFractionDigits: 1
        }).format(Number(value));
      }
    }

    if (dataKey === 'growth') {
      return `${value}%`;
    }

    // For other cases, return formatted number
    return new Intl.NumberFormat('vi-VN', {
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(Number(value));
  };

  const renderChart = () => {
    const xAxisDataKey = data[0]?.month ? "month" : "period";
    const commonProps = {
      data,
      children: [
        <CartesianGrid key="grid" strokeDasharray="3 3" />,
        <XAxis key="xaxis" dataKey={xAxisDataKey} />,
        <YAxis key="yaxis" />,
        showTooltip && <Tooltip key="tooltip" formatter={formatTooltip} />
      ]
    };

    switch (type) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              fill={color}
              fillOpacity={0.1}
            >
              {showDataLabels && (
                <LabelList
                  dataKey={dataKey}
                  position="top"
                  formatter={formatDataLabel}
                  style={{
                    fill: color,
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                />
              )}
            </Area>
          </AreaChart>
        );
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <Bar dataKey={dataKey} fill={color}>
              {showDataLabels && (
                <LabelList
                  dataKey={dataKey}
                  position="top"
                  formatter={formatDataLabel}
                  style={{
                    fill: color,
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                />
              )}
            </Bar>
          </BarChart>
        );
      default:
        return (
          <LineChart {...commonProps}>
            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2}>
              {showDataLabels && (
                <LabelList
                  dataKey={dataKey}
                  position="top"
                  formatter={formatDataLabel}
                  style={{
                    fill: color,
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                />
              )}
            </Line>
          </LineChart>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}