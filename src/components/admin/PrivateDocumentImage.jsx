import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, FileText, ExternalLink } from "lucide-react";

/**
 * Displays a private file (stored via UploadPrivateFile) by creating a
 * signed URL on mount. Shows a loading spinner, then the image or a
 * file-link fallback for non-image documents.
 */
export default function PrivateDocumentImage({ fileUri, label, className }) {
  const [signedUrl, setSignedUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!fileUri) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(false);
    base44.integrations.Core.CreateFileSignedUrl({ file_uri: fileUri, expires_in: 300 })
      .then((res) => {
        if (cancelled) return;
        setSignedUrl(res?.signed_url || null);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [fileUri]);

  if (!fileUri) return null;

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className || "w-full h-32"} bg-gray-100 rounded-2xl border border-gray-200`}>
        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (error || !signedUrl) {
    return (
      <div className={`flex flex-col items-center justify-center gap-1 ${className || "w-full h-32"} bg-gray-100 rounded-2xl border border-gray-200 p-3`}>
        <FileText className="w-6 h-6 text-gray-400" />
        <p className="text-xs text-gray-500">{label || "document"}</p>
        <p className="text-xs text-gray-400">unavailable</p>
      </div>
    );
  }

  return (
    <div className="relative group">
      <img
        src={signedUrl}
        alt={label || "document"}
        className={`${className || "w-full h-32"} object-cover rounded-2xl border border-gray-200`}
      />
      <a
        href={signedUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}