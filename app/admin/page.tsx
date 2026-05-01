"use client";

import { useState } from "react";
import { CheckCircle2, ListChecks, Lock } from "lucide-react";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [statusUpdated, setStatusUpdated] = useState<string>("");

  async function loadReports() {
    setLoading(true);
    setError("");

    const response = await fetch("/api/admin/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    const result = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(result.error || "Unable to load reports.");
      return;
    }

    setReports(result.reports || []);
    setAuthenticated(true);
  }

  async function updateReportStatus(reportId: number, status: string) {
    setLoading(true);
    setError("");

    const response = await fetch("/api/admin/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, reportId, status }),
    });

    const result = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(result.error || "Unable to update status.");
      return;
    }

    setStatusUpdated(`Report ${reportId} updated to ${status}.`);
    setReports((current) => current.map((report) => (report.id === reportId ? result.report : report)));
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/60">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-800 text-white">
            <Lock size={24} />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Admin dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">View and manage reports</h1>
          </div>
        </div>

        {!authenticated ? (
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm text-slate-700">Enter the admin password to view recent reports.</p>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Admin password"
                className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-100"
              />
              <button
                onClick={loadReports}
                className="inline-flex items-center justify-center gap-2 rounded-3xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                disabled={loading || !password}
              >
                <ListChecks size={18} />
                {loading ? "Loading..." : "Open reports"}
              </button>
            </div>
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-3xl bg-slate-50 p-6">
              <p className="text-sm text-slate-700">Reports are loaded from the SQLite database and protected by the admin password.</p>
              <button
                onClick={loadReports}
                className="mt-4 inline-flex items-center gap-2 rounded-3xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Refresh reports
              </button>
            </div>

            {statusUpdated ? (
              <div className="rounded-3xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{statusUpdated}</div>
            ) : null}

            <div className="space-y-4">
              {reports.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-700">No reports found yet.</div>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <article key={report.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">#{report.id}</p>
                          <p className="mt-2 text-base font-semibold text-slate-900">{report.description || "No description provided"}</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <CheckCircle2 size={16} />
                          <span>{report.status}</span>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-3xl bg-white p-4 shadow-sm">
                          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Address</p>
                          <p className="mt-2 text-sm text-slate-700">{report.address || "No address"}</p>
                        </div>
                        <div className="rounded-3xl bg-white p-4 shadow-sm">
                          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Coordinates</p>
                          <p className="mt-2 text-sm text-slate-700">{report.gps_lat && report.gps_lng ? `${report.gps_lat.toFixed(5)}, ${report.gps_lng.toFixed(5)}` : "Not available"}</p>
                        </div>
                      </div>

                      {report.media_url ? (
                        <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Media</p>
                          <a href={report.media_url} target="_blank" rel="noreferrer" className="mt-2 block text-sm font-medium text-slate-900 underline">
                            View attached media
                          </a>
                        </div>
                      ) : null}

                      <div className="mt-4 flex flex-wrap gap-2">
                        {[
                          ["new", "New"] ,
                          ["in-progress", "In progress"],
                          ["resolved", "Resolved"]
                        ].map(([value,label]) => (
                          <button
                            key={value}
                            onClick={() => updateReportStatus(report.id, String(value))}
                            className="rounded-3xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
