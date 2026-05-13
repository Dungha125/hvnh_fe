/**
 * Chuẩn hoá nội dung nhật ký (description): mỗi \n là một dòng.
 * Hỗ trợ newline thật hoặc chuỗi literal "\\n" từ API.
 */
export function normalizeActivityInfo(rawInfo) {
  const s = String(rawInfo ?? "").trim();
  if (!s) return "";

  const normalized = s
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\\n/g, "\n")
    .trimEnd();

  if (normalized.includes("\n")) return normalized;

  const re = /(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/g;
  const parts = normalized.split(re).filter(Boolean);
  if (parts.length <= 1) return normalized;

  const lines = [];
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (!/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}$/.test(p)) continue;
    const msg = String(parts[i + 1] ?? "").trim();
    lines.push(msg ? `${p} ${msg}` : p);
  }
  return lines.length ? lines.join("\n") : normalized;
}
