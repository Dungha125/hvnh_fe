import { h } from "vue";

/** Khớp dòng bắt đầu bằng `YYYY-MM-DD HH:mm:ss` */
const LINE_TS = /^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s*(.*)$/;

const datetimeStyle = {
  fontWeight: "600",
  color: "#1677ff",
  marginRight: "6px",
};

const infoRootStyle = {
  maxWidth: "100%",
  fontFamily: "inherit",
  fontSize: "inherit",
  lineHeight: "1.5",
};

const lineStyle = {
  wordBreak: "break-word",
  overflowWrap: "anywhere",
};

/** Mỗi dòng: phần ngày giờ đậm + xanh, phần còn lại bình thường */
export function renderActivityInfoRich(text) {
  const raw = String(text ?? "");
  const lines = raw.split("\n");
  return h(
    "div",
    { class: "activity-log-info-rich", style: infoRootStyle },
    lines.map((line, i) => {
      const m = line.match(LINE_TS);
      return h(
        "div",
        { key: i, class: "activity-log-line", style: lineStyle },
        m
          ? [h("span", { style: datetimeStyle }, m[1]), h("span", null, m[2] ?? "")]
          : [line || "\u00a0"],
      );
    }),
  );
}

export function renderActivityAccountRich(text) {
  const s = String(text ?? "").trim();
  if (!s) {
    return h("span", { style: { color: "rgba(0,0,0,0.25)" } }, "—");
  }
  return h(
    "span",
    {
      class: "activity-log-account",
      style: {
        fontWeight: 600,
        color: "#0958d9",
      },
    },
    s,
  );
}
