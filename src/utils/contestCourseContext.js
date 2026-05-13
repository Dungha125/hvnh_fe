/**
 * Chuẩn hóa danh sách contest từ GET /contests/available (nhiều dạng bọc data).
 * @param {object} apiResponseData - thường là axios `response.data`
 */
export function parseContestsAvailableList(apiResponseData) {
  const root = apiResponseData?.data;
  if (!root) return [];
  if (Array.isArray(root)) return root;
  if (Array.isArray(root.data)) return root.data;
  if (root.data && Array.isArray(root.data.data)) return root.data.data;
  return [];
}

/**
 * Lưu course_id (lớp học) của contest để nộp bài / API khác đọc từ localStorage.
 * Gọi khi sinh viên chọn một dòng từ danh sách available (hoặc khi cần gán tạm bản ghi đầu).
 * @param {object} contest — tối thiểu có course_id; nên có subject_id, semester_id nếu API trả
 */
export function persistContestCourseFromRecord(contest) {
  if (!contest || contest.course_id == null || contest.course_id === "") {
    return;
  }
  const n = Number(contest.course_id);
  if (!Number.isFinite(n) || n <= 0) {
    return;
  }

  localStorage.setItem("course_id", String(n));

  let prev = {};
  try {
    const raw = localStorage.getItem("currentCourse");
    if (raw) prev = JSON.parse(raw) || {};
  } catch {
    prev = {};
  }

  const subjectId = contest.subject_id ?? prev.subject_id;
  const semesterId = contest.semester_id ?? prev.semester_id;

  const merged = {
    ...prev,
    id: n,
    subject_id: subjectId,
    semester_id: semesterId,
  };

  if (subjectId != null) {
    merged.subject =
      typeof prev.subject === "object" && prev.subject
        ? { ...prev.subject, id: subjectId }
        : { id: subjectId };
  }

  localStorage.setItem("currentCourse", JSON.stringify(merged));
  sessionStorage.setItem("contest_course_id", String(n));
}
