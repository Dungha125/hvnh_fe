<script setup>
import LecturerHeader from "@/components/LecturerHeader.vue";
import { useRoute } from "vue-router";
import { onBeforeMount, ref } from "vue";
import axiosInstance from "@/configs/axios.js";
import { message } from "ant-design-vue";
import { EditOutlined } from "@ant-design/icons-vue";

// Route và biến cơ bản
const route = useRoute();
const questionList = ref([]);
const problems = ref([]); 
const pagination = ref({
  current: 1,
  pageSize: 50,
  total: 0,
});

// Modal & State
const editModalVisible = ref(false);
const selectedRowKeys = ref([]);
const isLoading = ref(false);

/** Luôn đọc lại từ localStorage khi mở modal / fetch — tránh dùng course_id cũ từ lần import module trước. */
const getActiveCourseId = () => {
  try {
    const raw = localStorage.getItem("currentCourse");
    if (raw) {
      const obj = JSON.parse(raw);
      const id = obj?.id;
      if (id != null && id !== "") return id;
    }
  } catch {
    /* ignore */
  }
  const legacy = localStorage.getItem("course_id");
  if (legacy != null && legacy !== "") {
    const n = Number(legacy);
    if (!Number.isNaN(n)) return n;
  }
  return null;
};

// Lấy danh sách khóa học đang học
onBeforeMount(async () => {
    await fetchQuestionList(); // ✅ Load danh sách câu hỏi sau khi lấy được course
});

// Lấy danh sách câu hỏi hiện tại
const fetchQuestionList = async () => {
  try {
    const response = await axiosInstance.get(`contests/${route.params.id}/question_list`);
    if (response.data && response.data.code === 200) {
        questionList.value = response.data?.data[0].map((q) => ({
        id: q.id,
        code: q.code,
        title: q.name ?? "",
        group: q.group?.name ?? "",
        sub_group: q.sub_group?.name ?? "",
        level: q.level ?? "Không xác định",
        point: q.pivot?.point ?? 0,
      }));

      pagination.value.total = questionList.value.length;
    }
  } catch (error) {
    console.error(error);
    message.error("Lỗi khi tải danh sách câu hỏi!");
  }
};


// Lấy toàn bộ câu hỏi có thể chọn
const fetchProblems = async () => {
  isLoading.value = true;
  problems.value = []; // ✅ Clear trước khi set lại

  const courseId = getActiveCourseId();
  if (!courseId) {
    message.warning(
      "Chưa xác định lớp học. Vào mục Câu hỏi, chọn đúng môn/lớp (dropdown Môn học) rồi thử lại."
    );
    isLoading.value = false;
    return;
  }

  try {
    const res = await axiosInstance.get(
      `/questions?page=1&per_page=500&order=asc&by=code&course_id=${courseId}`
    );

    const raw = res.data?.data;
    const rows = Array.isArray(raw)
      ? raw
      : raw && Array.isArray(raw.data)
        ? raw.data
        : [];

    if (rows.length) {
      problems.value = rows.map((q) => ({
        id: q.id,
        code: q.code ?? "",
        title: q.name ?? "Không có tiêu đề",
        group: q.group?.name ?? "Không có nhóm",
        sub_group: q.sub_group?.name ?? [],
        level: q.level ?? "Không xác định",
        point: q.point ?? 0,
      }));
    }
  } catch (error) {
    message.error("Lỗi khi lấy danh sách câu hỏi");
    console.error("Lỗi:", error.response?.data || error.message);
  } finally {
    isLoading.value = false;
  }
};

// Mở modal sửa
const showEditModal = async () => {
  await fetchProblems();
  selectedRowKeys.value = questionList.value.map(q => q.code);
  editModalVisible.value = true;
};

// Submit cập nhật câu hỏi
const handleUpdate = async () => {
  try {
    if (selectedRowKeys.value.length === 0) {
      message.warning("Vui lòng chọn ít nhất một câu hỏi!");
      return;
    }
    const payload = {
      question_list: selectedRowKeys.value.join('\n')+"\n"
    };
    await axiosInstance.post(`contests/${route.params.id}/sync_question`, payload);
    message.success("Cập nhật thành công!");
    editModalVisible.value = false;
    await fetchQuestionList();
  } catch (error) {
    console.error(error);
    message.error("Cập nhật thất bại!");
  }
};

// Sự kiện chọn bài
const onSelectChange = (selected) => {
  selectedRowKeys.value = selected;
};

// Cột
const columns = [
  { title: "STT", dataIndex: "id", key: "id" },
  { title: "Mã", dataIndex: "code", key: "code" },
  { title: "Tiêu đề", dataIndex: "title", key: "title" },
  { title: "Nhóm", dataIndex: "group", key: "group" },
  { title: "Chủ đề con", dataIndex: "sub_group", key: "sub_group" },
  { title: "Độ khó", dataIndex: "level", key: "level" },
  { title: "Điểm", dataIndex: "point", key: "point" },
  { title: "Thao tác", dataIndex: "ajust_point", key: "ajust_point" },
];
</script>



<template>
  <LecturerHeader />
  <a-card title="Danh Sách Câu hỏi" style="width: 100%; margin: auto; padding-top: 70px">
    <div class="cta" style="display: flex; justify-content: flex-end; gap: 10px; padding-bottom: 20px">
      <a-button @click="showEditModal" style="background-color: #a7453c; color: white">Sửa</a-button>
    </div>
    

    <a-table
      :data-source="questionList"
      :columns="columns"
      :row-key="(record) => record.id"
      :pagination="pagination"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'id'">
          <span style="font-weight: bold; color: red;">{{ record.id }}</span>
        </template>
        <template v-if="column.dataIndex === 'actions'">
          <a-dropdown>
            <a-button>⋮</a-button>
            <template #overlay>
              <a-menu>
                <a-menu-item @click="console.log(record.point)">
                  <EditOutlined /> Adjust point
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </template>
      </template>
    </a-table>
  </a-card>

  <!-- Modal -->
  <a-modal v-model:open="editModalVisible" title="Chỉnh sửa danh sách câu hỏi" width="90%">
  <p><strong>Danh sách đã chọn:</strong></p>
  <pre>{{ selectedRowKeys.join(', ') }}</pre>

  <a-table
    :dataSource="problems"
    :columns="columns.filter(col => col.dataIndex !== 'actions')"
    :loading="isLoading"
    rowKey="code"
    :rowSelection="{ selectedRowKeys, onChange: onSelectChange }"
  />

  <template #footer>
    <a-button @click="editModalVisible = false">Hủy</a-button>
    <a-button type="primary" @click="handleUpdate">Cập nhật</a-button>
  </template>
</a-modal>

</template>

<style scoped>

</style>