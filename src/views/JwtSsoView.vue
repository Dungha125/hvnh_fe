<script setup>
/**
 * SSO / deep-link từ CMC (hoặc hệ thống khác): mở HVNh-FE với token trên URL.
 *
 * Hỗ trợ query (ưu tiên từ trái sang phải):
 *   ?access_token=... | ?token=... | ?jwt=... | ?t=... | ?id_token=...
 * Hoặc hash: #access_token=...&token_type=Bearer (OAuth implicit kiểu cũ)
 *
 * Tham số tùy chọn: ?redirect=/home (chỉ đường dẫn nội bộ, bắt đầu bằng /)
 *
 * Lưu ý: token trên URL có thể lộ qua Referer / log — nên dùng redirect một lần
 * rồi xóa query (đã replace sau đăng nhập). Nếu token chỉ hợp lệ trên domain CMC,
 * backend HVNh cần endpoint đổi code/token (ví dụ POST auth/jwt) — khi đó bổ sung gọi API tại đây.
 */
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "@/configs/axios.js";
import { message } from "ant-design-vue";
import { parseContestsAvailableList, persistContestCourseFromRecord } from "@/utils/contestCourseContext.js";

const route = useRoute();
const router = useRouter();
const hint = ref("Đang xác thực từ liên kết đăng nhập…");

function extractTokenFromLocation() {
  const q = route.query;
  const fromQuery = [
    q.access_token,
    q.token,
    q.jwt,
    q.t,
    q.id_token,
  ].find((v) => v != null && String(v).trim() !== "");
  if (fromQuery) return String(fromQuery).trim();

  const hash = (typeof window !== "undefined" && window.location.hash) || "";
  const h = hash.replace(/^#/, "");
  if (!h || !h.includes("=")) return null;
  try {
    const params = new URLSearchParams(h);
    return (
      params.get("access_token") ||
      params.get("token") ||
      params.get("id_token") ||
      null
    );
  } catch {
    return null;
  }
}

function safeInternalPath(raw) {
  if (raw == null || typeof raw !== "string") return null;
  let p = raw.trim();
  try {
    p = decodeURIComponent(p);
  } catch {
    return null;
  }
  if (!p.startsWith("/") || p.startsWith("//")) return null;
  return p;
}

async function redirectByRole(user) {
  const custom = safeInternalPath(route.query.redirect);
  if (custom) {
    router.replace(custom);
    return;
  }

  const role =
    user.role ||
    (user.member_group === 1 ? "student" : user.member_group === 2 ? "teacher" : null);

  if (role === "student") {
    try {
      const contestResponse = await axios.get("contests/available");
      const list = parseContestsAvailableList(contestResponse.data);
      if (list.length > 0) {
        persistContestCourseFromRecord(list[0]);
        sessionStorage.setItem("contest", "true");
        router.replace("/contest");
        return;
      }
    } catch {
      /* bỏ qua, về home */
    }
    router.replace("/home");
    return;
  }

  if (role === "teacher") {
    router.replace("/lecturer/questions");
    return;
  }

  if (role === "admin") {
    router.replace("/admin/users");
    return;
  }

  message.warning("Vai trò chưa được cấu hình chuyển hướng.");
  router.replace("/home");
}

onMounted(async () => {
  const token = extractTokenFromLocation();
  if (!token) {
    hint.value =
      "Không có token trên URL. CMC cần chuyển hướng dạng: /jwt?access_token=... hoặc ?token=...";
    message.error(
      "Thiếu token. Kiểm tra cấu hình redirect (access_token / token / jwt)."
    );
    router.replace("/login");
    return;
  }

  try {
    localStorage.setItem("access_token", token);
    const profileRes = await axios.get("auth/profile");
    const user = profileRes.data?.data;
    if (!user || typeof user !== "object") {
      throw new Error("auth/profile không trả về user");
    }
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("username", user.username || "");
    message.success("Đăng nhập thành công!");
    await redirectByRole(user);
  } catch (e) {
    console.error(e);
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    localStorage.removeItem("username");
    hint.value =
      "Token không hợp lệ với API HVNh (có thể chỉ dùng được trên CMC). Cần backend cấp token đồng bộ hoặc endpoint đổi code.";
    message.error(
      "Không đăng nhập được bằng token này. Kiểm tra VITE_BASE_URL và backend (Bearer /auth/profile)."
    );
    router.replace("/login");
  }
});
</script>

<template>
  <div class="jwt-wrap">
    <a-spin size="large" :tip="hint" />
  </div>
</template>

<style scoped>
.jwt-wrap {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
}
</style>
