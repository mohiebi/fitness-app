import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@fitnessos/components/app-shell";
import { StatCard } from "@fitnessos/components/stat-card";
import { Card } from "@fitnessos/components/ui/card";
import { Badge } from "@fitnessos/components/ui/badge";
import { Button } from "@fitnessos/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@fitnessos/components/ui/table";
import { revenueSeries, clients } from "@fitnessos/lib/mock-data";
import { DollarSign, TrendingUp, RefreshCcw, AlertCircle, Download } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/dashboard/payments")({ component: Payments });

const payments = clients.slice(0, 6).map((c, i) => ({
  client: c.name, avatar: c.avatar, amount: [199, 399, 199, 99, 199, 399][i], status: ["Paid","Paid","Pending","Failed","Paid","Paid"][i], date: ["Nov 1","Nov 1","Nov 3","Oct 28","Oct 30","Oct 25"][i],
}));

function Payments() {
  return (
    <div>
      <PageHeader title="Payments" description="Track revenue, subscriptions and invoices."
        actions={<Button variant="outline"><Download className="mr-2 h-4 w-4" />Export CSV</Button>} />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="MRR" value="$42,180" delta="+18%" trend="up" icon={DollarSign} />
        <StatCard label="LTV" value="$2,840" delta="+9%" trend="up" icon={TrendingUp} />
        <StatCard label="Churn" value="3.2%" delta="-0.8%" trend="up" icon={RefreshCcw} />
        <StatCard label="Failed payments" value="1" delta="needs action" trend="down" icon={AlertCircle} />
      </div>

      <Card className="mt-6 border-border/60 bg-card p-6 shadow-card-premium">
        <h3 className="mb-4 font-semibold">Revenue trend</h3>
        <div className="h-64">
          <ResponsiveContainer>
            <AreaChart data={revenueSeries}>
              <defs><linearGradient id="p" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.5} /><stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="m" stroke="var(--color-muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickFormatter={v => `$${v/1000}k`} />
              <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
              <Area dataKey="revenue" stroke="var(--color-chart-1)" fill="url(#p)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="mt-6 border-border/60 bg-card p-6 shadow-card-premium">
        <h3 className="mb-4 font-semibold">Recent transactions</h3>
        <Table>
          <TableHeader><TableRow><TableHead>Client</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
          <TableBody>
            {payments.map(p => (
              <TableRow key={p.client + p.date}>
                <TableCell className="font-medium">{p.client}</TableCell>
                <TableCell>${p.amount}.00</TableCell>
                <TableCell>
                  <Badge className={p.status === "Paid" ? "bg-primary/15 text-primary" : p.status === "Pending" ? "bg-chart-3/20 text-chart-3" : "bg-destructive/15 text-destructive"}>{p.status}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{p.date}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
