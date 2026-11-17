import { useCases, usePanicAlerts } from "@/hooks/useEntityQueries";
import LoadingState from "@/components/LoadingState";
import StatsCard from "../components/StatsCard";
import { Button } from "@/components/ui/button";
import { Shield, Clock, AlertTriangle, CheckCircle, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { motion } from "framer-motion";

const COLORS = ["hsl(255,65%,52%)", "hsl(340,75%,55%)", "hsl(160,60%,42%)", "hsl(35,90%,55%)", "hsl(200,75%,50%)"];

const incidentLabels = {
  physical_violence: "Physical",
  sexual_violence: "Sexual",
  emotional_abuse: "Emotional",
  economic_abuse: "Economic",
  stalking: "Stalking",
  trafficking: "Trafficking",
  forced_marriage: "Forced Marriage",
  other: "Other",
};

export default function Analytics() {
  const { data: cases = [], isLoading: loadingCases } = useCases({}, { sort: "-created_date", limit: 500 });
  const { data: alerts = [], isLoading: loadingAlerts } = usePanicAlerts({}, { sort: "-created_date", limit: 200 });

  if (loadingCases || loadingAlerts) return <LoadingState />;

  const active = cases.filter((c) => !["resolved", "closed"].includes(c.status));
  const critical = cases.filter((c) => c.risk_level === "critical" || c.risk_level === "high");
  const resolved = cases.filter((c) => c.status === "resolved" || c.status === "closed");

  // Incident type distribution
  const typeDistribution = Object.entries(
    cases.reduce((acc, c) => {
      acc[c.incident_type] = (acc[c.incident_type] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name: incidentLabels[name] || name, value }));

  // Status distribution
  const statusDistribution = Object.entries(
    cases.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name: name.replace("_", " "), value }));

  // Risk distribution
  const riskDistribution = Object.entries(
    cases.reduce((acc, c) => {
      acc[c.risk_level] = (acc[c.risk_level] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  // Monthly trend (last 6 months)
  const monthlyTrend = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const month = date.toLocaleDateString("en", { month: "short" });
    const year = date.getFullYear();
    const m = date.getMonth();
    const count = cases.filter((c) => {
      const d = new Date(c.created_date);
      return d.getMonth() === m && d.getFullYear() === year;
    }).length;
    const alertCount = alerts.filter((a) => {
      const d = new Date(a.created_date);
      return d.getMonth() === m && d.getFullYear() === year;
    }).length;
    monthlyTrend.push({ month, cases: count, alerts: alertCount });
  }

  const exportReport = () => {
    const escape = (v) => {
      if (v == null) return "";
      const s = String(v).replace(/"/g, '""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    };
    const section = (label, rows, headers) => {
      const lines = [label, headers.join(",")];
      rows.forEach((r) => lines.push(headers.map((h) => escape(r[h])).join(",")));
      return lines.join("\n");
    };
    const csv = [
      section("Incidents by Type", typeDistribution, ["name", "value"]),
      "",
      section("Status Distribution", statusDistribution, ["name", "value"]),
      "",
      section("Risk Distribution", riskDistribution, ["name", "value"]),
      "",
      section("Monthly Trend", monthlyTrend, ["month", "cases", "alerts"]),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "analytics-report.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">Overview of case data and trends</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={exportReport}>
          <Download className="w-4 h-4" /> Export Report
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Cases" value={cases.length} icon={Shield} color="primary" />
        <StatsCard title="Active" value={active.length} icon={Clock} color="warning" />
        <StatsCard title="Critical/High" value={critical.length} icon={AlertTriangle} color="critical" />
        <StatsCard title="Resolved" value={resolved.length} icon={CheckCircle} color="success" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm font-semibold mb-4">Monthly Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(225,15%,90%)" />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="cases" stroke="hsl(255,65%,52%)" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="alerts" stroke="hsl(0,84%,60%)" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Incident Types */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm font-semibold mb-4">Incident Types</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={typeDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                {typeDistribution.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Status Distribution */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm font-semibold mb-4">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={statusDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(225,15%,90%)" />
              <XAxis dataKey="name" fontSize={11} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(255,65%,52%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Risk Distribution */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm font-semibold mb-4">Risk Levels</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={riskDistribution} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(225,15%,90%)" />
              <XAxis type="number" fontSize={12} />
              <YAxis dataKey="name" type="category" fontSize={12} width={60} />
              <Tooltip />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {riskDistribution.map((entry, i) => {
                  const colorMap = { low: "hsl(160,60%,42%)", medium: "hsl(35,90%,55%)", high: "hsl(25,90%,55%)", critical: "hsl(0,84%,60%)" };
                  return <Cell key={i} fill={colorMap[entry.name] || COLORS[i]} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}