<script setup>
import {onBeforeMount, ref} from 'vue'
import {useRoute} from 'vue-router'
import axiosInstance from "@/configs/axios.js";
import LecturerHeader from "@/components/LecturerHeader.vue";
import {EditOutlined} from "@ant-design/icons-vue";
import {message} from "ant-design-vue";

const lecturers = ref([]);
const route = useRoute();
const isModalVisible = ref(false);
const editLecturer = ref({accountList: ""});

const columns = [
  {title: "STT", dataIndex: "id", key: "id"},
  {title: "Tài khoản", dataIndex: "account", key: "account"},
  {title: "Họ", dataIndex: "last_name", key: "last_name"},
  {title: "Tên", dataIndex: "first_name", key: "first_name"},
  {title: "Làm đúng", dataIndex: "solved", key: "solved"},
  {title: "Đã thử", dataIndex: "tried", key: "tried"},
  {title: "Thao tác", dataIndex: "actions", key: "actions"},
]
const fetchLecturers = async (page = 1) => {
  try {
    const response = await axiosInstance.get(`/contests/${route.params.id}/teacher_list`);
    console.log(response.data.data);
    if (response.data && response.data.data) {
      lecturers.value = response.data.data.map((lecturer, index) => ({
        id: (page - 1) * pagination.value.pageSize + (index + 1),
        account: lecturer.username,
        last_name: lecturer.last_name,
        first_name: lecturer.first_name,
        tried: lecturer.tried || "",
        solved: lecturer.solved || "",
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
});
const handleTableChange = (paginationData) => {
  pagination.value.current = paginationData.current;
  fetchLecturers(paginationData.current);
};
const showEditModal = () => {
  editLecturer.value.accountList = lecturers.value.map(lecturer => lecturer.account).join("\n");
  isModalVisible.value = true;
};

const handleUpdate = async () => {
  try {
    // Khởi tạo payload
    const payload = { username_list: [] };

    // Tách danh sách tài khoản (mỗi dòng là một username)
    const accountList = editLecturer.value.accountList.split("\n").map(acc => acc.trim()).filter(acc => acc);

    console.log("Danh sách tài khoản:", accountList);

    for (let account of accountList) {
      payload.username_list.push(account);
    }

    console.log("Payload gửi đi:", payload);

    if (payload.username_list.length === 0) {
      message.warning("Không có tài khoản hợp lệ để cập nhật!");
      return;
    }

    await axiosInstance.post(`contests/${route.params.id}/sync_teacher`, payload);
    message.success("Cập nhật thành công!");
    isModalVisible.value = false;
    await fetchLecturers();
  } catch (error) {
    console.error(error);
    message.error("Cập nhật thất bại!");
  }
};

</script>

<template>
  <LecturerHeader/>
  <a-card title="Giảng viên" style="width: 100%; margin: auto; padding-top: 70px">
    <a-table
        :data-source="lecturers"
        :columns="columns"
        :row-key="record => record.id"
        :pagination="pagination"
        @change="handleTableChange"
    >
      <template #bodyCell="{column, record}">
        <template v-if="column.dataIndex === 'account'">
          <span style="font-weight: bold; color: red">
            {{ record.account }}
          </span>
        </template>
        <!-- Cột thao tác -->
        <template v-if="column.dataIndex === 'actions'">
          <a-dropdown>
            <a-button>
              ⋮
            </a-button>
            <template #overlay>
              <a-menu @click="">
                <a-menu-item @click="showEditModal(record)">
                  <EditOutlined/>
                  Sửa
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </template>
      </template>
    </a-table>
  </a-card>
  <a-modal v-model:open="isModalVisible" title="Chỉnh sửa danh sách giảng viên">
    <a-form layout="vertical">
      <a-row :gutter="16">
        <!-- Cột chú thích -->
        <a-col :span="6" style="display: flex; align-items: center;">
          <span><b>Danh sách tài khoản</b> <br/>(Mỗi tài khoản một dòng)</span>
        </a-col>
        <!-- Cột textarea -->
        <a-col :span="18">
          <a-textarea v-model:value="editLecturer.accountList" rows="6"/>
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

<style scoped>

</style>