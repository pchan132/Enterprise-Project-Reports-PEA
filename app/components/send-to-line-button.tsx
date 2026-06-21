"use client";

import { useCallback, useState } from "react";

type SendToLineButtonProps = {
  /** The request ID or requestNo to send */
  requestId: string;
  /** Optional extra CSS classes for the wrapper */
  className?: string;
};

type ToastState = {
  visible: boolean;
  type: "success" | "error";
  message: string;
};

export default function SendToLineButton({
  requestId,
  className,
}: SendToLineButtonProps) {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    type: "success",
    message: "",
  });

  const showToast = useCallback(
    (type: ToastState["type"], message: string) => {
      setToast({ visible: true, type, message });
      setTimeout(() => {
        setToast((prev) => ({ ...prev, visible: false }));
      }, 4000);
    },
    [],
  );

  const handleSend = useCallback(async () => {
    if (loading) return;
    setLoading(true);

    try {
      const response = await fetch(
        `/api/${encodeURIComponent(requestId)}/send-line`,
        { method: "POST" },
      );

      const payload = (await response.json()) as {
        success: boolean;
        message: string;
      };

      if (!response.ok || !payload.success) {
        showToast("error", payload.message || "ส่งแจ้งเตือน LINE ไม่สำเร็จ");
        return;
      }

      showToast("success", payload.message || "ส่งแจ้งเตือน LINE สำเร็จ");
    } catch {
      showToast(
        "error",
        "ไม่สามารถส่งแจ้งเตือน LINE ได้ในขณะนี้ กรุณาตรวจสอบอินเทอร์เน็ตหรือลองใหม่อีกครั้ง",
      );
    } finally {
      setLoading(false);
    }
  }, [loading, requestId, showToast]);

  return (
    <>
      <button
        type="button"
        onClick={handleSend}
        disabled={loading}
        className={[
          "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 text-sm font-semibold text-emerald-800 transition",
          "hover:border-emerald-500 hover:bg-emerald-100",
          "focus:outline-none focus:ring-2 focus:ring-emerald-400/40",
          "disabled:cursor-wait disabled:opacity-60",
          "sm:h-11 sm:px-4",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {loading ? (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.155.75.75 0 0 0 0-1.114A28.897 28.897 0 0 0 3.105 2.288Z" />
          </svg>
        )}
        {loading ? "กำลังส่ง..." : "ส่งแจ้งเตือน LINE"}
      </button>

      {/* ── Toast notification ── */}
      <div
        aria-live="polite"
        className={[
          "fixed right-4 top-4 z-[9999] max-w-sm transform rounded-lg px-4 py-3 shadow-lg transition-all duration-300",
          toast.visible
            ? "translate-y-0 opacity-100"
            : "-translate-y-2 pointer-events-none opacity-0",
          toast.type === "success"
            ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border border-rose-200 bg-rose-50 text-rose-800",
        ].join(" ")}
      >
        <div className="flex items-center gap-2">
          {toast.type === "success" ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5 shrink-0"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5 shrink-0"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                clipRule="evenodd"
              />
            </svg>
          )}
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
      </div>
    </>
  );
}
