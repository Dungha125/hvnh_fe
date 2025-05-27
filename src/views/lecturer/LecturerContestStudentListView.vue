<template>
  <LecturerHeader />
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
        v-if="contestDetail?.status === 1"
        @click="handleStop"
        style="background-color: #a7453c; color: white"
      >
        Dừng thi
      </a-button>
      <a-button
        v-if="contestDetail?.status === 0"
        @click="handleContinue"
        style="background-color: #a7453c; color: white"
      >
        Tiếp tục thi
      </a-button>
      <a-button
        @click="showEditModal"
        style="background-color: #a7453c; color: white"
        >Sửa</a-button
      >
    </div>
    <a-table
      :dataSource="studentList"
      :columns="columns"
      :rowKey="(record) => record.id"
      :pagination="pagination"
      @change="handleTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'account'">
          <span style="font-weight: medium; color: red">{{
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
                <a-menu-item key="stop">Dừng thi</a-menu-item>
                <a-menu-item key="disallow">Disallow VM</a-menu-item>
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
    title="Chỉnh sửa danh sách sinh viên"
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
import { ref, onBeforeMount } from "vue";
import { useRoute, useRouter } from "vue-router";
import { message } from "ant-design-vue";
import axiosInstance from "@/configs/axios.js";
import LecturerHeader from "@/components/LecturerHeader.vue";

const route = useRoute();
const router = useRouter();
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
  console.log(studentList.value);
  editStudent.value.student_list = studentList.value
    .map((student) => student.account)
    .join("\n");
  isModalVisible.value = true;
};
onBeforeMount(async () => {
  await fetchContestDetail();
  await fetchStudentList();
});
const handleUpdate = async () => {
  try {
    // Khởi tạo payload
    const payload = { username_list: [] };

    // Tách danh sách tài khoản (mỗi dòng là một username)
    const accountList = editStudent.value.student_list
      .split("\n")
      .map((acc) => acc.trim())
      .filter((acc) => acc);

    console.log("Danh sách tài khoản:", accountList);

    for (let account of accountList) {
      payload.username_list.push(account);
    }

    console.log("Payload gửi đi:", payload);

    if (payload.username_list.length === 0) {
      message.warning("Không có tài khoản hợp lệ để cập nhật!");
      return;
    }

    await axiosInstance.post(
      `contests/${route.params.id}/sync_student`,
      payload
    );
    message.success("Cập nhật thành công!");
    isModalVisible.value = false;
    await fetchStudentList();
  } catch (error) {
    console.error(error);
    message.error("Cập nhật thất bại!");
  }
};

const handleStop = async () => {
  try {
    const response = await axiosInstance.post(
      `/contests/${route.params.id}/stop`
    );
    if (response.status === 200) {
      const payload = ref({
        name: contestDetail.value.name,
        subject: contestDetail.value.subject_id,
        course: contestDetail.value.course_id,
        address: contestDetail.value.address,
        ordinal: contestDetail.value.ordinal,
        display_detail: contestDetail.value.display_detail,
        public_ranking: contestDetail.value.public_ranking,
        is_frozen: contestDetail.value.is_frozen,
        mc_shuffle: contestDetail.value.mc_shuffle,
        mc_option_shuffle: contestDetail.value.mc_option_shuffle,
        allow_browser: contestDetail.value.allow_browser,
        ioi: contestDetail.value.ioi,
        icpc: contestDetail.value.icpc,
        update_student: "",
        penalty_time: contestDetail.value.penalty_time,
        frozen_time: contestDetail.value.frozen_time,
        description: contestDetail.value.description,
        semester: contestDetail.value.semester_id,
        status: 0,
        start_time: contestDetail.value.start_time,
        end_time: contestDetail.value.end_time,
        ranking_stop_time: contestDetail.value.ranking_stop_time,
        submit_type: contestDetail.value.submit_type,
        file: "",
      });
      await axiosInstance.put(`/contests/${route.params.id}`, payload.value);
      message.success("Dừng thi thành công!");
      await fetchContestDetail();
      await fetchStudentList();
    }
  } catch (error) {
    console.error(error);
    message.error("Dừng thi thất bại!");
  }
};

const handleContinue = async () => {
  try {
    const response = await axiosInstance.post(
      `/contests/${route.params.id}/continue`
    );
    if (response.status === 200) {
      const payload = ref({
        name: contestDetail.value.name,
        subject: contestDetail.value.subject_id,
        course: contestDetail.value.course_id,
        address: contestDetail.value.address,
        ordinal: contestDetail.value.ordinal,
        display_detail: contestDetail.value.display_detail,
        public_ranking: contestDetail.value.public_ranking,
        is_frozen: contestDetail.value.is_frozen,
        mc_shuffle: contestDetail.value.mc_shuffle,
        mc_option_shuffle: contestDetail.value.mc_option_shuffle,
        allow_browser: contestDetail.value.allow_browser,
        ioi: contestDetail.value.ioi,
        icpc: contestDetail.value.icpc,
        update_student: "",
        penalty_time: contestDetail.value.penalty_time,
        frozen_time: contestDetail.value.frozen_time,
        description: contestDetail.value.description,
        semester: contestDetail.value.semester_id,
        status: 1,
        start_time: contestDetail.value.start_time,
        end_time: contestDetail.value.end_time,
        ranking_stop_time: contestDetail.value.ranking_stop_time,
        submit_type: contestDetail.value.submit_type,
        file: "",
      });
      await axiosInstance.put(`/contests/${route.params.id}`, payload.value);
      message.success("Tiếp tục thi thành công!");
      await fetchContestDetail();
      await fetchStudentList();
    }
  } catch (error) {
    console.error(error);
    message.error("Tiếp tục thi thất bại!");
  }
};

const columns = [
  { title: "STT", dataIndex: "id", key: "id" },
  { title: "Tài khoản", dataIndex: "account", key: "account" },
  { title: "Họ", dataIndex: "last_name", key: "last_name" },
  { title: "Tên", dataIndex: "first_name", key: "first_name" },
  { title: "Phòng thi", dataIndex: "room", key: "room" },
  { title: "Địa chỉ IP", dataIndex: "ip", key: "ip" },
  { title: "Tên máy", dataIndex: "computer", key: "computer" },
  { title: "Đề số", dataIndex: "exam", key: "exam" },
  { title: "Làm đúng", dataIndex: "solved", key: "solved" },
  { title: "Đã thử", dataIndex: "tried", key: "tried" },
  { title: "Đã nộp", dataIndex: "submitted", key: "submitted" },
  { title: "Thao tác", dataIndex: "actions", key: "actions" },
];

const fetchStudentList = async (page = 1) => {
  try {
    const response = await axiosInstance.get(
      `/contests/${route.params.id}/student_list`,
      {
        params: {
          page: page,
          limit: pagination.value.pageSize,
        },
      }
    );

    if (response.data && response.data.data) {
      studentList.value = response.data.data.map((student, index) => ({
        id: (page - 1) * pagination.value.pageSize + (index + 1),
        user_id: student.id,
        account: student.username,
        last_name: student.last_name,
        first_name: student.first_name,
        room: student.room || "",
        ip: student.ip || "",
        computer: student.computer || "",
        exam: student.exam || "",
        solved: student.pivot.solved,
        tried: student.pivot.tried,
        submitted: student.pivot.submitted || 0,
      }));

      pagination.value.total = response.data.total || 0;
    }
  } catch (error) {
    console.error(error);
  }
};

const handleTableChange = (paginationData) => {
  pagination.value.current = paginationData.current;
  fetchStudentList(paginationData.current);
};

// Xử lý các thao tác trong dropdown
const handleAction = (key, record) => {
  if (key === "login") {
    handleLoginStudent(record.user_id);
  } else if (key === "stop") {
    message.warning(`Dừng thi của: ${record.account}`);
  } else if (key === "disallow") {
    message.error(`Disallow VM cho: ${record.account}`);
  } else if (key === "delete") {
    handleDeleteStudent(record.user_id);
  }
};

const handleLoginStudent = async (studentID) => {
  try {
    const response = await axiosInstance.get(`/users/${studentID}/login`);

    if (response.status === 200 && response.data?.data) {
      const { access_token, user } = response.data.data;

      // Lưu thông tin giáo viên nếu chưa tồn tại
      if (!sessionStorage.getItem("teacher_access_token")) {
        sessionStorage.setItem("teacher_access_token", localStorage.getItem("access_token") || "");
        sessionStorage.setItem("user_teacher", localStorage.getItem("user") || "");
        sessionStorage.setItem("username_teacher", localStorage.getItem("username") || "");
        sessionStorage.setItem("teacher_login", "true")
      }

      // Lưu thông tin tài khoản đăng nhập
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("username", user.username);

      message.info(`Đăng nhập vào tài khoản sinh viên: ${user.username}`);
      console.log(user.role);

      if (user.role === "student") {
        try {
          const contestResponse = await axiosInstance.get("/contests/available");
          if (contestResponse.data?.data?.data?.length > 0) {
            sessionStorage.setItem("contest", "true");
            router.push("/contest");
          } else {
            router.push("/problems");
          }
        } catch (contestError) {
          console.error("Lỗi khi lấy danh sách cuộc thi:", contestError);
          message.error("Không thể tải danh sách cuộc thi!");
        }
      } else if (user.role === "teacher") {
        router.push("/lecturer/questions");
      } else if (user.role === "admin") {
        router.push("/admin/users");
      } else {
        message.error("Tính năng đang phát triển!");
      }
    } else {
      message.error("Dữ liệu đăng nhập không hợp lệ!");
    }
  } catch (error) {
    if (error.response?.status === 401) {
      message.error("Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin đăng nhập!");
    } else {
      message.error("Đã xảy ra lỗi. Vui lòng thử lại sau!");
    }
    console.error("Login Error:", error);
  }
};

const handleDeleteStudent = async (studentID) => {
  try {
    const response = await axiosInstance.get(`/contests/${route.params.id}/delete_student/${studentID}`);
    if (response.status === 200) {
      message.success("Xóa sinh viên thành công!");
      await fetchStudentList();
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
