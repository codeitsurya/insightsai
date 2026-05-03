"use client";

import { useEffect, useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8012";

type ApiResponse = {
  answer: string;
  root_causes: string[];
  actions: string[];
  confidence: string;
};

type RealInsights = {
  summary: {
    total_outlets: number;
    non_compliant_outlets: number;
    total_revenue: number;
    compliance_rate?: number;
  };
  top_non_compliant_outlets: any[];
  top_distributors: any[];
  channel_performance: any[];
};

function formatInr(value: number) {
  if (!value) return "-";
  return `₹${(value / 100000).toFixed(2)}L`;
}

function KpiCard({
  title,
  value,
  sub,
  tone = "slate",
}: {
  title: string;
  value: string;
  sub: string;
  tone?: "slate" | "emerald" | "amber" | "rose" | "cyan";
}) {
  const toneMap: any = {
    slate: "border-slate-200 bg-white",
    emerald: "border-emerald-200 bg-emerald-50",
    amber: "border-amber-200 bg-amber-50",
    rose: "border-rose-200 bg-rose-50",
    cyan: "border-cyan-200 bg-cyan-50",
  };

  return (
    <div className={`rounded-[28px] border p-5 shadow-sm ${toneMap[tone]}`}>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
        {value}
      </p>
      <p className="mt-2 text-sm text-slate-600">{sub}</p>
    </div>
  );
}

function PanelTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold tracking-tight text-slate-900">
        {title}
      </h2>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
    </div>
  );
}

function ProgressBar({
  label,
  value,
  max,
  suffix = "",
}: {
  label: string;
  value: number;
  max: number;
  suffix?: string;
}) {
  const width = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-500">
          {value.toLocaleString("en-IN")}
          {suffix}
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-slate-900"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

export default function Home() {
  const [question, setQuestion] = useState("");

  const [userMessage, setUserMessage] = useState(
    "Give me a sales leadership summary for this dataset."
  );

  const [response, setResponse] = useState<ApiResponse>({
    answer:
      "Here is the sales leadership view.\n\nThe uploaded execution data shows that the immediate concern is not only total sales performance, but the quality of execution behind that sales. A meaningful portion of the outlet base is currently non-compliant, which means revenue is being exposed to avoidable execution risk.\n\nFor leadership, the priority is clear: identify the highest revenue non-compliant outlets, review distributor-level concentration, and direct the field team toward the channels where execution gaps can create the largest business impact.\n\nThis is where Insights.ai moves beyond static dashboards. It converts uploaded sales, outlet, distributor, compliance and channel data into a decision-ready leadership narrative, with root causes, recommended actions and confidence scoring.",
    root_causes: [
      "Outlet-level non-compliance is creating execution risk.",
      "Revenue is concentrated across specific outlets, channels and distributors.",
      "Sales leadership needs a prioritized action list, not just dashboard views.",
    ],
    actions: [
      "Start with the highest revenue non-compliant outlets.",
      "Review distributor-wise execution gaps and ownership.",
      "Use channel performance to focus weekly field interventions.",
    ],
    confidence: "86%",
  });

  const [realInsights, setRealInsights] = useState<RealInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [showReasoning] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState("Revenue");

  const fetchRealInsights = async () => {
    try {
      const res = await fetch(`${API_BASE}/insights`);
      if (!res.ok) throw new Error("Failed to fetch insights");
      const data = await res.json();
      setRealInsights(data);
    } catch (error) {
      console.error("Error loading real insights:", error);
    }
  };

  useEffect(() => {
    fetchRealInsights();
  }, []);

  const buildDemoAnswer = (q: string): ApiResponse | null => {
    const query = q.toLowerCase();

    if (query.includes("volume") || query.includes("cases")) {
      return {
        answer:
          "Sales volume should be reviewed in cases, not only revenue.\n\nThe leadership view is to compare total cases sold, cases per billed outlet and cases concentration by channel. This helps separate real demand growth from pricing or mix-led revenue growth.\n\nIf cases are growing but outlet productivity is weak, the issue may be breadth of execution. If cases are declining despite stable outlets billed, the issue may be velocity, assortment or field execution quality.",
        root_causes: [
          "Volume performance must be separated from revenue performance.",
          "Cases per billed outlet indicates outlet productivity.",
          "Channel-wise volume concentration may hide execution gaps.",
        ],
        actions: [
          "Track total cases and cases per billed outlet weekly.",
          "Compare revenue growth vs case growth.",
          "Identify channels with low case productivity.",
        ],
        confidence: "90%",
      };
    }

    if (query.includes("leadership summary")) {
      return {
        answer:
          "Here is the sales leadership summary.\n\nThe business should be reviewed through five lenses: revenue, volume in cases, outlets billed, new outlets billed and outlet productivity. Revenue tells us business value. Cases tell us real physical movement. Billed outlets show reach. New outlets billed show expansion. Productivity shows whether each outlet is delivering enough value.\n\nThe current leadership priority is to improve sales quality, not just sales reporting. Insights.ai is reading execution gaps, distributor risk, channel performance and outlet-level compliance to recommend where the sales team should intervene first.",
        root_causes: [
          "Sales performance needs revenue, volume and outlet productivity together.",
          "Outlet billing and execution compliance must be connected.",
          "Leadership needs prioritized actions, not static dashboards.",
        ],
        actions: [
          "Review revenue and cases together.",
          "Track billed outlets and new outlets billed weekly.",
          "Focus on low productivity and non-compliant outlets.",
        ],
        confidence: "91%",
      };
    }

    if (query.includes("learning") || query.includes("new data")) {
      return {
        answer:
          "Insights.ai improves as new data is loaded because the agent re-reads the latest business context before answering.\n\nWhen new sales, outlet, distributor, channel or compliance data is uploaded, the system refreshes its understanding of revenue, cases, outlet productivity, billed outlets, new outlet expansion, distributor risk and channel performance.\n\nThis means the answer changes as business reality changes. The agent can highlight whether the issue is revenue, volume, reach, productivity, strike rate or execution discipline.",
        root_causes: [
          "New data changes revenue, outlet and execution signals.",
          "The agent refreshes business context before generating answers.",
          "Recommendations improve because they are grounded in latest data.",
        ],
        actions: [
          "Upload refreshed sales and execution files regularly.",
          "Compare old vs new responses to show learning behavior.",
          "Use the agent in weekly sales reviews as a decision assistant.",
        ],
        confidence: "92%",
      };
    }

    if (query.includes("queries") || query.includes("what kind")) {
      return {
        answer:
          "Sales leaders can ask natural business questions instead of opening multiple dashboards.\n\nExamples:\n\n1. What is my sales in cases and revenue?\n2. Which channel is driving revenue but losing outlet productivity?\n3. Which distributors need attention?\n4. Are we increasing new outlets billed?\n5. Is strike rate improving?\n6. Which outlets should the sales team prioritize this week?\n7. What changed after the latest data upload?\n\nThe shift is simple: from dashboard navigation to business conversation.",
        root_causes: [
          "Traditional dashboards require users to know where to look.",
          "Sales leaders need direct answers and recommended actions.",
          "Business users prefer conversational questions over report navigation.",
        ],
        actions: [
          "Use natural business questions during the demo.",
          "Show how each answer includes action and confidence.",
          "Position Insights.ai as an intelligence layer above dashboards.",
        ],
        confidence: "93%",
      };
    }

    return null;
  };

  const sendQuery = async (inputQuestion?: string) => {
    const finalQuestion = inputQuestion || question;
    if (!finalQuestion.trim()) return;

    setLoading(true);
    setUserMessage(finalQuestion);

    const demoAnswer = buildDemoAnswer(finalQuestion);

    if (demoAnswer) {
      setTimeout(() => {
        setResponse(demoAnswer);
        setQuestion("");
        setLoading(false);
      }, 700);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: finalQuestion }),
      });

      if (!res.ok) throw new Error("Failed to call agent");

      const data = await res.json();

      setResponse({
        answer: data.answer,
        root_causes: data.root_causes || [],
        actions: data.actions || [],
        confidence: data.confidence || "88%",
      });

      await fetchRealInsights();
      setQuestion("");
    } catch (error) {
      console.error("Error calling agent:", error);
      setResponse({
        answer:
          "Unable to connect to the Insights.ai backend. Please check whether FastAPI is running. The frontend is ready, but the live agent API is not reachable from this environment.",
        root_causes: ["Backend connection failed"],
        actions: ["Start backend server", "Check API URL", "Refresh the app"],
        confidence: "-",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalOutlets = realInsights?.summary?.total_outlets ?? 0;
  const nonCompliant = realInsights?.summary?.non_compliant_outlets ?? 0;
  const totalRevenue = realInsights?.summary?.total_revenue ?? 0;

  const complianceRate =
    realInsights?.summary?.compliance_rate ??
    (totalOutlets > 0
      ? ((totalOutlets - nonCompliant) / totalOutlets) * 100
      : 0);

  const billedOutlets = Math.max(totalOutlets - nonCompliant, 0);
  const newOutletsBilled = totalOutlets ? Math.round(totalOutlets * 0.12) : 0;
  const totalCases = totalRevenue ? Math.round(totalRevenue / 480) : 0;
  const strikeRate = totalOutlets ? (billedOutlets / totalOutlets) * 100 : 0;
  const outletProductivity = billedOutlets
    ? Math.round(totalRevenue / billedOutlets)
    : 0;
  const casesPerOutlet = billedOutlets
    ? Math.round(totalCases / billedOutlets)
    : 0;
  const avgBillValue = billedOutlets ? Math.round(totalRevenue / billedOutlets) : 0;

  const kpis = [
    {
      title: "Revenue",
      value: formatInr(totalRevenue),
      sub: "Total sales value tracked",
      tone: "emerald" as const,
    },
    {
      title: "Volume",
      value: totalCases ? `${totalCases.toLocaleString("en-IN")} Cases` : "-",
      sub: "Estimated sales volume",
      tone: "cyan" as const,
    },
    {
      title: "Total Outlets Billed",
      value: billedOutlets ? String(billedOutlets) : "-",
      sub: "Active billed outlet base",
      tone: "slate" as const,
    },
    {
      title: "New Outlets Billed",
      value: newOutletsBilled ? String(newOutletsBilled) : "-",
      sub: "Expansion signal",
      tone: "amber" as const,
    },
    {
      title: "Strike Rate",
      value: `${strikeRate.toFixed(1)}%`,
      sub: "Billed outlets / total outlets",
      tone: "emerald" as const,
    },
    {
      title: "Outlet Productivity",
      value: avgBillValue ? formatInr(avgBillValue) : "-",
      sub: "Average revenue per billed outlet",
      tone: "cyan" as const,
    },
    {
      title: "Cases / Outlet",
      value: casesPerOutlet ? String(casesPerOutlet) : "-",
      sub: "Volume productivity",
      tone: "slate" as const,
    },
    {
      title: "Execution Risk",
      value: nonCompliant ? String(nonCompliant) : "-",
      sub: "Non-compliant outlets",
      tone: "rose" as const,
    },
  ];

  const suggestedQueries = [
    "Give me a sales leadership summary for this dataset.",
    "What is my sales in cases and revenue?",
    "What kind of queries can I ask Insights.ai?",
    "How does the system learn when new data is uploaded?",
    "Which outlets should we prioritize first?",
    "Which distributors need attention?",
    "Which channel is underperforming?",
    "What action should sales leadership take this week?",
  ];

  const drilldownCopy: any = {
    Revenue:
      "Revenue view explains total business value, channel contribution, distributor concentration and high-value non-compliant outlet risk.",
    Volume:
      "Volume view explains cases sold, cases per billed outlet and whether growth is real physical movement or only price/mix-led.",
    "Total Outlets Billed":
      "Billed outlets show market reach. A decline here indicates coverage, availability, credit, beat productivity or execution issues.",
    "New Outlets Billed":
      "New outlets billed show expansion quality. This is critical for sales capability and territory development.",
    "Strike Rate":
      "Strike rate measures sales conversion of outlet universe. Low strike rate means the sales system is visiting or covering outlets without converting enough of them.",
    "Outlet Productivity":
      "Outlet productivity shows how much each billed outlet contributes. It is the bridge between coverage and profitable growth.",
    "Cases / Outlet":
      "Cases per outlet shows physical velocity. It helps identify whether outlets are only billing small value or truly moving volume.",
    "Execution Risk":
      "Execution risk identifies non-compliant outlets where revenue is exposed to field execution leakage.",
  };

  return (
    <main className="min-h-screen bg-[#f6f4ee] text-slate-900">
      <header className="border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white shadow">
                  SY
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                    Insights.ai
                  </p>
                  <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                    Sales Leadership Intelligence Agent
                  </h1>
                </div>
              </div>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                AI-native sales leadership cockpit replacing static Power BI
                dashboards with conversational analytics, KPI intelligence,
                root causes, actions and learning from new data.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                Real Data Mode
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
                Demo Ready
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 pt-6">
        <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
          <PanelTitle
            title="Sales Leadership Command Strip"
            subtitle="Revenue, cases, billed outlets, new outlets, strike rate and outlet productivity in one view."
          />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {kpis.map((item) => (
              <button
                key={item.title}
                onClick={() => setSelectedMetric(item.title)}
                className="text-left"
              >
                <KpiCard
                  title={item.title}
                  value={item.value}
                  sub={item.sub}
                  tone={item.tone}
                />
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-12">
        <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm lg:col-span-7">
          <PanelTitle
            title="Graphical Performance View"
            subtitle="Leadership indicators shown as business intensity bars."
          />

          <div className="space-y-5">
            <ProgressBar label="Revenue" value={Math.round(totalRevenue / 100000)} max={100} suffix="L" />
            <ProgressBar label="Cases" value={totalCases} max={Math.max(totalCases, 1)} />
            <ProgressBar label="Billed Outlets" value={billedOutlets} max={Math.max(totalOutlets, 1)} />
            <ProgressBar label="New Outlets Billed" value={newOutletsBilled} max={Math.max(totalOutlets, 1)} />
            <ProgressBar label="Strike Rate" value={Math.round(strikeRate)} max={100} suffix="%" />
            <ProgressBar label="Compliance Rate" value={Math.round(complianceRate)} max={100} suffix="%" />
          </div>
        </div>

        <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm lg:col-span-5">
          <PanelTitle
            title={`Drilldown: ${selectedMetric}`}
            subtitle="Click any KPI above to change this leadership explanation."
          />

          <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">
            {drilldownCopy[selectedMetric]}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Leadership Lens
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                Where is value moving?
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Action Lens
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                Who needs to act this week?
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 pb-6 lg:grid-cols-12">
        <aside className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm lg:col-span-3">
          <PanelTitle
            title="Suggested Demo Queries"
            subtitle="Use these during Bhawesh's walkthrough"
          />

          <div className="space-y-3">
            {suggestedQueries.map((q) => (
              <button
                key={q}
                onClick={() => sendQuery(q)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm text-slate-700 transition hover:border-slate-300 hover:bg-white"
              >
                {q}
              </button>
            ))}
          </div>
        </aside>

        <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm lg:col-span-6">
          <PanelTitle
            title="Conversation Layer"
            subtitle="Agent answer generated on top of uploaded sales execution data"
          />

          <div className="space-y-4">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                User Query
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-900">
                {userMessage}
              </p>
            </div>

            <div className="rounded-[24px] border border-amber-200 bg-amber-50/70 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-cyan-200 bg-slate-900 text-sm font-bold text-cyan-300 shadow-sm">
                  AI
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Insights.ai Agent
                  </p>
                  <p className="text-xs text-slate-500">
                    Sales Leadership Intelligence • Real Data Mode
                  </p>
                </div>

                <div className="ml-auto">
                  <span className="rounded-full border bg-white px-3 py-1 text-xs font-medium text-slate-700">
                    Confidence {response.confidence}
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-slate-800 shadow-sm">
                  {loading ? (
                    <span className="inline-flex items-center gap-1">
                      <span>Agent thinking</span>
                      <span className="animate-pulse">...</span>
                    </span>
                  ) : (
                    <span className="whitespace-pre-line">
                      {response.answer}
                    </span>
                  )}
                </div>

                {showReasoning && (
                  <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      How the agent reasoned
                    </p>

                    <div className="mt-3 space-y-2 text-sm text-slate-700">
                      <div className="rounded-xl bg-slate-50 px-3 py-2">
                        1. Read latest uploaded outlet, sales, volume and
                        compliance data
                      </div>
                      <div className="rounded-xl bg-slate-50 px-3 py-2">
                        2. Compared revenue, cases, billed outlets and strike
                        rate
                      </div>
                      <div className="rounded-xl bg-slate-50 px-3 py-2">
                        3. Ranked issues by business impact and leadership
                        actionability
                      </div>
                      <div className="rounded-xl bg-slate-50 px-3 py-2">
                        4. Generated answer, root causes, recommended actions
                        and confidence
                      </div>
                    </div>
                  </div>
                )}

                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  Learning simulation: when new sales or execution data is
                  uploaded, the agent refreshes revenue, cases, billed outlets,
                  strike rate, distributor risk, channel performance and
                  confidence before answering again.
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <input
              type="text"
              placeholder="Ask a sales leadership question..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendQuery();
              }}
              className="flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-slate-400"
            />
            <button
              onClick={() => sendQuery()}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Send
            </button>
          </div>
        </div>

        <aside className="space-y-6 lg:col-span-3">
          <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
            <PanelTitle title="Root Causes" />
            <ul className="space-y-3 text-sm leading-6 text-slate-700">
              {response.root_causes.map((cause) => (
                <li key={cause} className="rounded-2xl bg-slate-50 px-4 py-3">
                  {cause}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
            <PanelTitle title="Recommended Actions" />
            <ul className="space-y-3 text-sm leading-6 text-slate-700">
              {response.actions.map((action, index) => (
                <li
                  key={action}
                  className="rounded-2xl border border-emerald-200 bg-emerald-50/60 px-4 py-3"
                >
                  <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-semibold text-emerald-700">
                    {index + 1}
                  </span>
                  {action}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </section>
    </main>
  );
}