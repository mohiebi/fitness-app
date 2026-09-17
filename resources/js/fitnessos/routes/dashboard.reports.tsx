import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@fitnessos/components/app-shell";
import { Card } from "@fitnessos/components/ui/card";
import { StatCard } from "@fitnessos/components/stat-card";
import { revenueSeries, adherenceSeries } from "@fitnessos/lib/mock-data";
import { DollarSign, RefreshCcw, Percent, Users, Dumbbell, Utensils } from "lucide-react";
import { Line, LineChart, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend, RadialBarChart, RadialBar } from "recharts";

export const Route = createFileRoute("/dashboard/reports")({ component: Reports });

const ttStyle = { background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12 };

function Reports() {
  return (
    <div>
      <PageHeader title="Reports" description="Business analytics and performance insights." />

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Revenue" value="$42.2k" delta="+18%" trend="up" icon={DollarSign} />
        <StatCard label="Retention" value="92%" delta="+2%" trend="up" icon={RefreshCcw} />
        <StatCard label="Lead conv." value="28%" delta="+4%" trend="up" icon={Percent} />
        <StatCard label="Client success" value="94%" delta="+1%" trend="up" icon={Users} />
        <StatCard label="Workout compl." value="88%" delta="-2%" trend="down" icon={Dumbbell} />
        <StatCard label="Nutrition adh." value="82%" delta="+3%" trend="up" icon={Utensils} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="border-border/60 bg-card p-6 shadow-card-premium lg:col-span-2">
          <h3 className="mb-4 font-semibold">Revenue vs client growth</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={revenueSeries}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="m" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis yAxisId="l" stroke="var(--color-muted-foreground)" fontSize={12} tickFormatter={v => `$${v/1000}k`} />
                <YAxis yAxisId="r" orientation="right" stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={ttStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line yAxisId="l" dataKey="revenue" stroke="var(--color-chart-1)" strokeWidth={2.5} />
                <Line yAxisId="r" dataKey="clients" stroke="var(--color-chart-2)" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="border-border/60 bg-card p-6 shadow-card-premium">
          <h3 className="mb-4 font-semibold">Success rate</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <RadialBarChart innerRadius="50%" outerRadius="90%" data={[{ name: "Goal reached", value: 94, fill: "var(--color-chart-1)" }]}>
                <RadialBar background dataKey="value" cornerRadius={20} />
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground" style={{ fontSize: 40, fontWeight: 600 }}>94%</text>
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="border-border/60 bg-card p-6 shadow-card-premium lg:col-span-3">
          <h3 className="mb-4 font-semibold">Adherence breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={adherenceSeries}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="d" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={ttStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="workout" fill="var(--color-chart-1)" radius={[6,6,0,0]} />
                <Bar dataKey="nutrition" fill="var(--color-chart-2)" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
