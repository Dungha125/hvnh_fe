<script setup>
import {onBeforeMount, ref, computed} from 'vue'
import {useRoute} from 'vue-router'
import axiosInstance from "@/configs/axios.js";
import LecturerHeader from "@/components/LecturerHeader.vue";
import AdminHeader from "@/components/AdminHeader.vue";
import { PlusOutlined } from "@ant-design/icons-vue";
import { message } from "ant-design-vue";

const route = useRoute();
const isAdminClassRoute = computed(() => route.path.startsWith("/admin/class/"));

const lecturers = ref([]);
const isModalVisible = ref(false);
const editLecturer = ref({accountList: ""});
const addModalVisible = ref(false);
const newLecturerAccounts = ref("");
const addSubmitting = ref(false);

const columns = [
  {title: "STT", dataIndex: "id", key: "id"},
  {title: "Tài khoản", dataIndex: "account", key: "account"},
  {title: "Họ", dataIndex: "last_name", key: "last_name"},
  {title: "Tên", dataIndex: "first_name", key: "first_name"}
]
const fetchLecturers = async (page = 1) => {
  try {
    const response = await axiosInstance.get(`/courses/${route.params.id}/teacher_list`);
    console.log(response.data.data);
    if (response.data && response.data.data) {
      lecturers.value = response.data.data.map((lecturer, index) => ({
        id: (page - 1) * pagination.value.pageSize + (index + 1),
        account: lecturer.username,
        last_name: lecturer.last_name,
        first_name: lecturer.first_name
      }));
      pagination.value.total = response.data.total || 0;

    }
  } catch (error) {
    console.error(error);
  }
};
onBeforeMount(() => {
  fetchLecturers();
});
const pagination = ref({
  current: 1,
  pageSize: 50,
  total: 0,
  size: 'small',
});
const handleTableChange = (paginationData) => {
  pagination.value.current = paginationData.current;
  fetchLecturers(paginationData.current);
};
const showEditModal = () => {
  editLecturer.value.accountList = lecturers.value.map(lecturer => lecturer.account).join("\n");
  isModalVisible.value = true;
};

const showAddLecturerModal = () => {
  newLecturerAccounts.value = "";
  addModalVisible.value = true;
};

const handleAddLecturersSubmit = async () => {
  const incoming = newLecturerAccounts.value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  if (incoming.length === 0) {
    message.warning("Vui lòng nhập ít nhất một tên đăng nhập.");
    return Promise.reject(new Error("validation"));
  }
  const existing = lecturers.value.map((l) => l.account);
  const username_list = [...existing];
  for (const u of incoming) {
    if (!username_list.includes(u)) username_list.push(u);
  }
  addSubmitting.value = true;
  try {
    await axiosInstance.post(`/courses/${route.params.id}/sync_teacher`, {
      username_list,
    });
    message.success("Đã cập nhật danh sách giảng viên.");
    addModalVisible.value = false;
    await fetchLecturers(pagination.value.current);
  } catch (error) {
    console.error(error);
    message.error(
      error.response?.data?.message || "Không thêm được giảng viên. Kiểm tra tài khoản hoặc quyền API."
    );
    throw error;
  } finally {
    addSubmitting.value = false;
  }
};

</script>

<template>
  <AdminHeader v-if="isAdminClassRoute" />
  <LecturerHeader v-else />
  <a-card title="Giảng viên" style="width: 100%; margin: auto; padding-top: 70px">
    <template v-if="isAdminClassRoute" #extra>
      <a-button type="primary" @click="showAddLecturerModal">
        <template #icon><PlusOutlined /></template>
        Thêm giảng viên
      </a-button>
    </template>
    <a-table
        :data-source="lecturers"
        :columns="columns"
        :row-key="record => record.id"
        :pagination="pagination"
        @change="handleTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'account'">
          <span class="account-column">
            {{ record.account }}
          </span>
        </template>
      </template>

    </a-table>
  </a-card>

  <a-modal
    v-model:open="addModalVisible"
    title="Thêm giảng viên"
    :confirm-loading="addSubmitting"
    ok-text="Lưu"
    cancel-text="Hủy"
    @ok="handleAddLecturersSubmit"
  >
    <p class="add-modal-hint">
      Nhập tên đăng nhập cần thêm, mỗi dòng một tài khoản. Các giảng viên hiện tại được giữ nguyên.
    </p>
    <a-textarea
      v-model:value="newLecturerAccounts"
      :rows="8"
      placeholder="Mỗi dòng một tên đăng nhập"
    />
  </a-modal>

</template>

<style scoped>
.add-modal-hint {
  margin: 0 0 12px;
  color: #64748b;
  font-size: 14px;
}

/* Card chỉnh gọn, đổ bóng */
.ant-card {
  max-width: 900px;
  margin: 70px auto 0 auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-radius: 8px;
}

/* Table bo góc, border rõ ràng */
.ant-table {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
}

/* Header màu nhẹ nhàng, đồng bộ với màu brand */
.ant-table-thead > tr > th {
  background-color: #ffeaea;
  color: #b34545;
  font-weight: 600;
  text-align: center;
}

/* Dòng bảng zebra + hover */
.ant-table-tbody > tr:nth-child(odd) {
  background-color: #fff;
}

.ant-table-tbody > tr:nth-child(even) {
  background-color: #fafafa;
}

.ant-table-tbody > tr:hover {
  background-color: #ffeaea;
}

/* Cột Tài khoản in đậm đỏ */
.ant-table-cell.account-column {
  font-weight: 600;
  color: #b34545;
  font-size: 14px;
}

/* Pagination đẩy về phải */
.ant-pagination {
  display: flex;
  justify-content: flex-end;
  padding: 12px;
}

/* Responsive */
@media (max-width: 768px) {
  .ant-card {
    margin: 20px;
    padding: 12px;
  }

  .ant-table-cell {
    font-size: 12px;
    padding: 8px;
  }
}
</style>
