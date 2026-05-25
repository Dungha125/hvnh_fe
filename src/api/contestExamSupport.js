import axiosInstance from "@/configs/axios.js";

const ok = (res) => res?.data?.code === 200;

/**
 * Tạo yêu cầu hỗ trợ khi đang làm kiểm tra.
 * @param {{ title: string, content: string, contest_id: number|string, question_id?: number|string, question_code?: string }} payload
 */
export async function createContestSupportRequest(payload) {
  const res = await axiosInstance.post("/supports", payload);
  if (!ok(res)) {
    throw new Error(res?.data?.message || "Gửi yêu cầu hỗ trợ thất bại.");
  }
  return res.data?.data ?? res.data;
}

/**
 * Khóa tài khoản tạm thời trong lúc thi (backend ghi nhật ký hoạt động).
 * @param {number|string} contestId
 * @param {{ reason: string, question_id?: number|string, question_code?: string, support_id?: number|string }} payload
 */
export async function temporaryLockAccountDuringExam(contestId, payload) {
  const body = { contest_id: Number(contestId) || contestId, ...payload };
  try {
    const res = await axiosInstance.post(
      `/contests/${contestId}/temporary-lock`,
      body
    );
    if (!ok(res)) {
      throw new Error(res?.data?.message || "Không thể khóa tài khoản tạm thời.");
    }
    return res.data?.data ?? res.data;
  } catch (e) {
    if (e?.response?.status !== 404 && e?.response?.status !== 405) {
      throw e;
    }
    const fallback = await axiosInstance.post("/users/temporary-lock", body);
    if (!ok(fallback)) {
      throw new Error(
        fallback?.data?.message || "Không thể khóa tài khoản tạm thời."
      );
    }
    return fallback.data?.data ?? fallback.data;
  }
}

/**
 * Kiểm tra trạng thái khóa tạm khi vào màn thi.
 */
export async function fetchExamTemporaryLockStatus(contestId) {
  try {
    const res = await axiosInstance.get(
      `/contests/${contestId}/temporary-lock`
    );
    if (!ok(res)) return { locked: false };
    const data = res.data?.data ?? res.data;
    return {
      locked: Boolean(data?.locked ?? data?.is_locked ?? data?.temporary_locked),
      locked_at: data?.locked_at ?? null,
      reason: data?.reason ?? null,
    };
  } catch (e) {
    if (e?.response?.status === 404) return { locked: false };
    return { locked: false };
  }
}

export function sessionLockKey(contestId) {
  return `contest_exam_locked_${contestId}`;
}

export function setSessionExamLocked(contestId, locked) {
  if (locked) {
    sessionStorage.setItem(sessionLockKey(contestId), "1");
  } else {
    sessionStorage.removeItem(sessionLockKey(contestId));
  }
}

export function isSessionExamLocked(contestId) {
  return sessionStorage.getItem(sessionLockKey(contestId)) === "1";
}

/** Danh sách yêu cầu hỗ trợ của sinh viên (theo đợt kiểm tra). */
export async function fetchMySupportRequests(contestId, page = 1, perPage = 20) {
  const res = await axiosInstance.get("/supports", {
    params: {
      contest_id: Number(contestId) || contestId,
      page,
      per_page: perPage,
    },
  });
  if (!ok(res)) {
    throw new Error(res?.data?.message || "Không tải được yêu cầu hỗ trợ.");
  }
  const root = res.data;
  const list = Array.isArray(root?.data) ? root.data : [];
  return {
    list,
    total: Number(root?.total) || list.length,
    currentPage: Number(root?.current_page) || page,
  };
}

/** Chi tiết một yêu cầu (nội dung + phản hồi children). */
export async function fetchSupportDetail(supportId) {
  const res = await axiosInstance.get(`/supports/${supportId}`);
  if (!ok(res)) {
    throw new Error(res?.data?.message || "Không tải được chi tiết hỗ trợ.");
  }
  const data = res.data?.data ?? {};
  const message = data.message ?? data;
  return {
    id: message.id ?? supportId,
    title: message.title ?? "",
    content: message.content ?? "",
    status: message.status,
    created_at: message.created_at,
    replies: Array.isArray(data.children) ? data.children : [],
  };
}

export function supportStatusLabel(status) {
  const s = parseInt(status, 10);
  if (s === 0) return { color: "blue", text: "Mới" };
  if (s === 1) return { color: "orange", text: "Đang xử lý" };
  if (s === 2) return { color: "default", text: "Đã đóng" };
  return { color: "default", text: "Không xác định" };
}
