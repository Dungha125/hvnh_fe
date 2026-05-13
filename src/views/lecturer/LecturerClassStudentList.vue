<template>
  <AdminHeader v-if="isAdminClassRoute" />
  <LecturerHeader v-else />
  <a-card
      title="Danh sách sinh viên"
      style="width: 100%; margin: auto; padding-top: 70px"
  >
    <div
        class="cta"
        style="
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        padding-bottom: 20px;
      "
    >
      <a-button style="background-color: #a7453c; color: white"
      >Import</a-button
      >
      <a-button
          v-if="isAdminClassRoute"
          type="primary"
          @click="showEditModal"
      >Thêm / cập nhật sinh viên</a-button>
      <a-button
          v-else
          @click="showEditModal"
          style="background-color: #a7453c; color: white"
      >Sửa</a-button>
    </div>
    <a-table
        :dataSource="studentList"
        :columns="columns"
        :rowKey="(record) => record.user_id"
        :pagination="pagination"
        @change="handleTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'account'">
          <span style="font-weight: bold; color: red">{{
              record.account
            }}</span>
        </template>
        <template v-if="column.dataIndex === 'solved'">
          <a-tag :color="record.solved > 0 ? 'green' : 'red'">
            {{ record.solved }}
          </a-tag>
        </template>
        <template v-if="column.dataIndex === 'tried'">
          <a-tag :color="record.tried > 0 ? 'blue' : 'gray'">
            {{ record.tried }}
          </a-tag>
        </template>
        <template v-if="column.dataIndex === 'finish'">
          <a-tag :color="record.finish ? 'purple' : 'volcano'">
            {{ record.finish ? "Hoàn thành" : "Chưa hoàn thành" }}
          </a-tag>
        </template>

        <!-- Cột thao tác -->
        <template v-if="column.dataIndex === 'actions'">
          <a-dropdown>
            <a-button> ⋮ </a-button>
            <template #overlay>
              <a-menu @click="({ key }) => handleAction(key, record)">
                <a-menu-item key="login">Đăng nhập
                </a-menu-item>
                <a-menu-divider />
                <a-menu-item key="delete" danger>Xóa</a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </template>
      </template>
    </a-table>
  </a-card>
  <a-modal
      v-model:open="isModalVisible"
      :title="isCourseStudentRoute ? 'Danh sách sinh viên lớp (mỗi dòng một tài khoản)' : 'Chỉnh sửa danh sách sinh viên'"
      style="min-width: 1000px"
  >
    <a-form layout="vertical">
      <a-row :gutter="16">
        <!-- Cột chú thích -->
        <a-col :span="6" style="display: flex; align-items: center">
          <span><b>Danh sách tài khoản</b> <br />(Mỗi tài khoản một dòng)</span>
        </a-col>
        <!-- Cột textarea -->
        <a-col :span="18">
          <a-textarea v-model:value="editStudent.student_list" rows="20" />
        </a-col>
      </a-row>
    </a-form>

    <!-- Footer chứa nút OK và Hủy -->
    <template #footer>
      <a-button @click="isModalVisible = false">Hủy</a-button>
      <a-button type="primary" @click="handleUpdate">Cập nhật</a-button>
    </template>
  </a-modal>
</template>

<script setup>
import { ref, onBeforeMount, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { message } from "ant-design-vue";
import axiosInstance from "@/configs/axios.js";
import LecturerHeader from "@/components/LecturerHeader.vue";
import AdminHeader from "@/components/AdminHeader.vue";

const route = useRoute();
const isAdminClassRoute = computed(() => route.path.startsWith("/admin/class/"));
/** Danh sách SV theo lớp (course), không phải theo cuộc thi (contest) */
const isCourseStudentRoute = computed(
  () => route.path.includes("/class/") && route.path.includes("student_list")
);
const router = useRouter();
/** Toàn bộ SV lớp (API luôn trả full list, không phân trang server) */
const courseStudentsAll = ref([]);
const studentList = ref([]);
const pagination = ref({
  current: 1,
  pageSize: 50,
  total: 0,
});
const contestDetail = ref({});
const editStudent = ref({ student_list: "" });
const isModalVisible = ref(false);
const showEditModal = () => {
  editStudent.value.student_list = courseStudentsAll.value
      .map((student) => student.account)
      .join("\n");
  isModalVisible.value = true;
};
onBeforeMount(async () => {
  if (!isCourseStudentRoute.value) {
    await fetchContestDetail();
  }
  await fetchStudentList();
});

watch(
  () => route.params.id,
  () => {
    if (isCourseStudentRoute.value) {
      pagination.value.current = 1;
      fetchStudentList();
    }
  }
);
const handleUpdate = async () => {
  try {
    const accountList = editStudent.value.student_list
        .split("\n")
        .map((acc) => acc.trim())
        .filter((acc) => acc);

    if (accountList.length === 0) {
      message.warning("Không có tài khoản hợp lệ để cập nhật!");
      return;
    }

    const syncPath = isCourseStudentRoute.value
      ? `/courses/${route.params.id}/sync_student`
      : `/contests/${route.params.id}/sync_student`;

    const payload = isCourseStudentRoute.value
      ? {
          username_list: accountList,
          practice_group: accountList.map(() => ""),
        }
      : { username_list: accountList };

    await axiosInstance.post(syncPath, payload);
    message.success("Cập nhật thành công!");
    isModalVisible.value = false;
    await fetchStudentList({ resetPage: true });
  } catch (error) {
    console.error(error);
    message.error("Cập nhật thất bại!");
  }
};

const columns = [
  { title: "STT", dataIndex: "stt", key: "stt" },
  { title: "Tài khoản", dataIndex: "account", key: "account" },
  { title: "Họ", dataIndex: "last_name", key: "last_name" },
  { title: "Tên", dataIndex: "first_name", key: "first_name" },
  { title: "Tổ TH", dataIndex: "sub_group", key: "sub_group" },
  { title: "Làm đúng", dataIndex: "solved", key: "solved" },
  { title: "Đã thử", dataIndex: "tried", key: "tried" },
  { title: "Thao tác", dataIndex: "actions", key: "actions" },
];

const mapCourseStudent = (student) => ({
  user_id: student.id,
  account: student.username,
  last_name: student.last_name,
  first_name: student.first_name,
  room: student.room || "",
  ip: student.ip || "",
  computer: student.computer || "",
  exam: student.exam || "",
  solved: student.pivot?.solved ?? 0,
  tried: student.pivot?.tried ?? 0,
  submitted: student.pivot?.submitted ?? 0,
});

const parseStudentListPayload = (root) => {
  const inner = root.data && !Array.isArray(root.data) ? root.data : null;
  if (Array.isArray(root.data)) return root.data;
  if (inner && Array.isArray(inner.data)) return inner.data;
  return [];
};

/** Cắt trang trên FE từ courseStudentsAll */
const applyCourseStudentPage = () => {
  const all = courseStudentsAll.value;
  const pageSize = pagination.value.pageSize;
  let current = pagination.value.current;
  pagination.value.total = all.length;
  const maxPage = Math.max(1, Math.ceil(all.length / pageSize) || 1);
  if (current > maxPage) {
    current = maxPage;
    pagination.value.current = current;
  }
  const start = (current - 1) * pageSize;
  const slice = all.slice(start, start + pageSize);
  studentList.value = slice.map((row, index) => ({
    ...row,
    stt: start + index + 1,
  }));
};

/**
 * Tải full danh sách sinh viên lớp (backend bỏ qua page/per_page).
 * @param {object} opts
 * @param {boolean} [opts.resetPage] — về trang 1 sau khi load (sau sync/xóa)
 */
const fetchStudentList = async (opts = {}) => {
  const resetPage = typeof opts === "boolean" ? opts : opts?.resetPage === true;
  if (!isCourseStudentRoute.value) {
    await fetchStudentListContestLegacy();
    return;
  }
  try {
    const response = await axiosInstance.get(
      `/courses/${route.params.id}/student_list`
    );
    const root = response.data || {};
    const rows = parseStudentListPayload(root);
    courseStudentsAll.value = rows.map(mapCourseStudent);
    if (resetPage) pagination.value.current = 1;
    applyCourseStudentPage();
  } catch (error) {
    console.error(error);
  }
};

/** Giữ luồng cũ nếu không phải trang lớp (hiện tại ít dùng) */
const fetchStudentListContestLegacy = async () => {
  try {
    const response = await axiosInstance.get(
      `/courses/${route.params.id}/student_list`
    );
    const root = response.data || {};
    const rows = parseStudentListPayload(root);
    courseStudentsAll.value = rows.map(mapCourseStudent);
    pagination.value.current = 1;
    applyCourseStudentPage();
  } catch (error) {
    console.error(error);
  }
};

const handleTableChange = (pag, _filters, _sorter) => {
  const p = pag && typeof pag === "object" ? pag : {};
  const nextCurrent = typeof p.current === "number" ? p.current : pagination.value.current;
  const nextPageSize = typeof p.pageSize === "number" ? p.pageSize : pagination.value.pageSize;
  const pageSizeChanged = nextPageSize !== pagination.value.pageSize;
  pagination.value.pageSize = nextPageSize;
  pagination.value.current = pageSizeChanged ? 1 : nextCurrent;
  if (isCourseStudentRoute.value) {
    applyCourseStudentPage();
  } else {
    fetchStudentListContestLegacy();
  }
};

// Xử lý các thao tác trong dropdown
const handleAction = (key, record) => {
  if (key === "login") {
    handleLoginStudent(record.user_id);
  } else if (key === "delete") {
    handleDeleteStudent(record.user_id);
  }
};

const handleLoginStudent = async (studentID) => {
  try {
    const response = await axiosInstance.get(`/users/${studentID}/login`);

    if (response.status === 200) {
      const { access_token, user } = response.data.data;

      if (!sessionStorage.getItem("teacher_access_token")) {
        sessionStorage.setItem("teacher_access_token", localStorage.getItem("access_token"));
        sessionStorage.setItem("user_teacher", localStorage.getItem("user"));
        sessionStorage.setItem("username_teacher", localStorage.getItem("username"));
      }

      localStorage.setItem("access_token", access_token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("username", user.username);
      message.info(`Đăng nhập vào tài khoản sinh viên: ${user.username}`);
      router.push(`/lecturer/contest/student`);
    }
  } catch (error) {
    console.error("Login Error:", error);
    message.error("Đăng nhập thất bại!");
  }
};

const handleDeleteStudent = async (studentID) => {
  try {
    const response = await axiosInstance.get(`/courses/${route.params.id}/delete_student/${studentID}`);
    if (response.status === 200) {
      message.success("Xóa sinh viên thành công!");
      await fetchStudentList({ resetPage: false });
    }
  } catch (error) {
    console.error(error);
    message.error("Xóa sinh viên thất bại!");
  }
};
const fetchContestDetail = async () => {
  try {
    const response = await axiosInstance.get(`/contests/${route.params.id}`);
    if (response.data && response.data.data) {
      contestDetail.value = response.data.data;
    }
  } catch (error) {
    console.error(error);
    message.error(error.message);
  }
};
</script>

<style scoped>
a-card {
  max-width: 1200px;
  padding: 20px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  border-radius: 8px;
}

a-table {
  margin-top: 16px;
}

a-tag {
  font-weight: bold;
  padding: 5px 10px;
}

a-button {
  background: transparent;
  border: none;
  color: #000;
  font-size: 16px;
}

a-dropdown {
  text-align: center;
}

a-menu {
  width: 150px;
}
</style>
