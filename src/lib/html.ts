export function escapeHtml(value: string | number | null | undefined) {
  const text = value == null ? "" : String(value);

  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function escapeHtmlAttribute(value: string | number | null | undefined) {
  return escapeHtml(value);
}
