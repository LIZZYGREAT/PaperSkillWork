import { useState } from "react";
import { Button } from "../../foundation/controls/Button";

export function GalleryCodePanel({ title, code, source, level, notice }: {
  title: string;
  code: string;
  source: string;
  level: "runnable" | "fragment";
  notice: string;
}) {
  const [message, setMessage] = useState("");
  const copyLabel = level === "runnable" ? "可运行示例" : "结构片段";
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setMessage(`已复制${copyLabel}`);
    } catch {
      setMessage("无法访问剪贴板；可选中代码复制");
    }
  };
  return <details className="pattern-gallery__code-panel">
    <summary>{title}</summary>
    <div className="pattern-gallery__code-head"><span>来源：<code>{source}</code></span><Button variant="secondary" size="small" onClick={copy}>复制{copyLabel}</Button></div>
    <p className="pattern-gallery__code-notice">{notice}</p>
    <pre><code>{code}</code></pre>
    <p className="pattern-gallery__copy-status" aria-live="polite">{message}</p>
  </details>;
}
