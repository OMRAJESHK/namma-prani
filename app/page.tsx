"use client";

import { useEffect, useMemo, useState } from "react";
import { Camera, MapPin, Send, ShieldCheck } from "lucide-react";

export default function Home() {
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [media, setMedia] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");
  const [geoMessage, setGeoMessage] = useState<string>("Detecting device location...");

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoMessage("Geolocation is not available in this browser.");
      return;
    }

    setGeoMessage("Detecting location... (can take up to 60 seconds)");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setGeoMessage(`Location captured (accuracy: ±${Math.round(position.coords.accuracy)}m).`);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setGeoMessage("Location detection failed. You can still submit and enter address manually.");
      },
      {
        enableHighAccuracy: true,
        timeout: 60000, // 60 seconds for GPS lock
        maximumAge: 0, // Don't use cached position
      }
    );
  }, []);

  useEffect(() => {
    if (!media) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(media);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [media]);

  const locationLabel = useMemo(() => {
    if (latitude != null && longitude != null) {
      return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
    }
    return "Not captured";
  }, [latitude, longitude]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");

    const formData = new FormData();
    formData.append("description", description);
    formData.append("address", address);
    formData.append("latitude", latitude?.toString() ?? "");
    formData.append("longitude", longitude?.toString() ?? "");
    if (media) {
      formData.append("media", media);
    }

    const response = await fetch("/api/reports", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    if (response.ok && result.success) {
      setStatus("success");
      setMessage("Report sent successfully. Help is on the way.");
      setDescription("");
      setAddress("");
      setMedia(null);
    } else {
      setStatus("error");
      setMessage(result.error || "We could not send the report. Try again.");
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setMedia(file);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/60">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-emerald-500 text-white">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Namma Prani Rescue</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Report an injured animal quickly</h1>
          </div>
        </div>

        <div className="mb-8 grid gap-6 rounded-3xl bg-slate-50 p-6">
          <div className="flex items-center gap-3 text-slate-700">
            <MapPin size={18} />
            <span className="text-sm font-medium">Device GPS location</span>
          </div>
          <p className="text-sm text-slate-600">{geoMessage}</p>
          <p className="text-sm text-slate-700">Current coordinates: <strong>{locationLabel}</strong></p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              placeholder="What is the animal's condition? Where did you find it?"
              className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Address (optional)</label>
            <input
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              type="text"
              placeholder="Street, area, or landmark"
              className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <label className="block text-sm font-medium text-slate-700">Photo or video</label>
            <div className="flex items-center gap-2 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3">
              <Camera size={16} className="text-slate-600" />
              <span className="text-sm text-slate-600">Upload one file</span>
            </div>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="col-span-full w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition file:cursor-pointer file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-slate-700"
            />
          </div>

          {previewUrl ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              {media?.type.startsWith("video/") ? (
                <video controls className="max-h-96 w-full rounded-3xl object-cover">
                  <source src={previewUrl} type={media.type} />
                  Your browser does not support video preview.
                </video>
              ) : (
                <img src={previewUrl} alt="Media preview" className="max-h-96 w-full rounded-3xl object-cover" />
              )}
            </div>
          ) : null}

          <div>
            <button
              type="submit"
              disabled={status === "submitting"}
              className="inline-flex items-center justify-center gap-2 rounded-3xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
            >
              <Send size={18} />
              {status === "submitting" ? "Sending..." : "Send / Get help"}
            </button>
          </div>

          {status === "success" || status === "error" ? (
            <div className={`rounded-3xl px-4 py-3 text-sm ${status === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
              {message}
            </div>
          ) : null}
        </form>
      </div>
    </main>
  );
}
