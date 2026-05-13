<template>
  <div class="class-config-container">
    <a-config-provider :theme="antDesignTheme">
      <a-table
        :dataSource="classList"
        :pagination="pagination"
        :columns="columns"
        :rowKey="(record) => record.id"
        @change="handleTableChange"
        class="class-table"
        :scroll="{ x: 'max-content' }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'name'">
            <span class="class-name-link">{{ record.name }}</span>
          </template>

          <!-- Cột thao tác -->
          <template v-if="column.dataIndex === 'actions'">
            <a-dropdown :trigger="['click']">
              <a-button type="text" shape="circle" class="action-button">
                <EllipsisOutlined />
              </a-button>
              <template #overlay>
                <a-menu @click="({ key }) => handleAction(key, record)">
                  <a-menu-item key="contest">Thực Hành</a-menu-item>
                  <a-menu-item key="student">Sinh Viên</a-menu-item>
                  <a-menu-item key="lecturer">Giảng viên</a-menu-item>
                  <a-menu-divider/>
                  <a-menu-item key="edit" @click="showEditModal(record)">Sửa</a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </template>
        </template>
      </a-table>

      <a-modal
          v-model:open="isModalVisible"
          :title="`Chỉnh sửa lớp học ${selectedRecord.name || ''}`"
          wrap-class-name="edit-modal"
          @ok="handleUpdate"
          :footer="null"
          centered
      >
        <a-form :model="editForm" layout="vertical" class="edit-form">
          <a-form-item label="Tên lớp học" name="name" :rules="[{ required: true, message: 'Vui lòng nhập tên lớp!' }]">
            <a-input v-model:value="editForm.name" placeholder="Nhập tên lớp"/>
          </a-form-item>

          <a-form-item label="Môn học" name="subject" :rules="[{ required: true, message: 'Vui lòng chọn môn học!' }]">
            <a-select v-model:value="editForm.subject" placeholder="Chọn môn học">
              <a-select-option
                  v-for="subject in subjects"
                  :key="subject.course_id"
                  :value="subject.subject_id"
              >
                {{ subject.label }}
              </a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="Học kỳ" name="semester" :rules="[{ required: true, message: 'Vui lòng chọn học kỳ!' }]">
            <a-select v-model:value="editForm.semester" placeholder="Chọn học kỳ">
              <a-select-option
                  v-for="semester in semesters"
                  :key="semester.value"
                  :value="semester.value"
              >
                {{ semester.label }}
              </a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="Trạng thái" name="status" :rules="[{ required: true, message: 'Vui lòng chọn trạng thái!' }]">
            <a-select v-model:value="editForm.status" placeholder="Chọn trạng thái">
              <a-select-option :value="1">Hoạt động</a-select-option>
              <a-select-option :value="0">Không hoạt động</a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="Thông báo (Hiển thị tới sinh viên - Hỗ trợ HTML)">
            <a-textarea v-model:value="editForm.about" :rows="4" placeholder="Nhập thông báo..."/>
          </a-form-item>

          <div class="required-notice">(*) Bắt buộc</div>
        </a-form>
        
        <template #footer>
          <div class="modal-footer">
              <a-button @click="handleReset">Khôi phục</a-button>
              <a-button type="primary" @click="handleUpdate(selectedRecord.courseID)">Cập nhật</a-button>
          </div>
        </template>
      </a-modal>
    </a-config-provider>
  </div>
</template>


<script setup>
import axiosInstance from "@/configs/axios";
import {onBeforeMount, ref, watch} from "vue";
import {useRoute, useRouter} from "vue-router";
import { EllipsisOutlined } from '@ant-design/icons-vue';
import { SS_KEYS, restorePick } from "@/utils/selectionPersistence.js";

const classList = ref([]);
const pagination = ref({
  current: 1,
  pageSize: 50,
  total: 0,
});

const router = useRouter();
const route = useRoute()
const isModalVisible = ref(false);
const selectedRecord = ref({});
const classDataDetail = ref({});
const editForm = ref({
  name: '',
  subject: '',
  semester: '',
  status: '',
  about: ''
});
const semesters = ref({});
const subjects = ref({});
const selectedCourse = ref(null);
const showEditModal = async (record) => {
  selectedRecord.value = record;
  await fetchClassDetail(record.courseID);
  // Đổ data vào form
  const subjectLabel = subjects.value.find(
      (item) => item.subject_id === classDataDetail.value.subject_id
  )?.label || record.name;

  editForm.value = {
    name: classDataDetail.value.name || record.group,
    subject: subjectLabel,   
    semester: record.semester_id,
    status: classDataDetail.value.status || '0',
    about: classDataDetail.value.about || ''
  };

  isModalVisible.value = true;
};

const handleReset = () => {
  showEditModal(selectedRecord.value);
};

const handleUpdate = async (courseID) => {
  try {
    const getSubjectID = (subjectLabel) => {
      const subject = subjects.value.find((item) => item.label === subjectLabel || item.subject_id === subjectLabel);
      return subject ? subject.subject_id : null;
    };
    console.log('Submit data:', editForm.value);
    const payload = {
      ...editForm.value,
      subject: getSubjectID(editForm.value.subject),
    }
    const response = await axiosInstance.put(`/courses/${courseID}`, payload);
    if (response.data.code === 200 && response.data) {
      isModalVisible.value = false;
      await fetchAllClass()
    }

  } catch (err) {
    console.log(err);
  }
};

const handleTableChange = (paginationData) => {
  pagination.value.current = paginationData.current;
  fetchAllClass(paginationData.current);
};

const columns = [
  {
    title: "STT",
    dataIndex: "id",
    key: "id",
  },
  {
    title: "Môn học",
    dataIndex: "name",
    key: "name",
  },
  {
    title: "Nhóm",
    dataIndex: "group",
    key: "group",
  },
  {
    title: "Học kỳ",
    dataIndex: "semester",
    key: "semester",
  },
  {
    title: "Trạng thái",
    dataIndex: "status",
    key: "status",
  },
  {
    title: "Thao tác",
    dataIndex: "actions",
    key: "actions",
  },
];

const fetchAllClass = async (page = 1) => {
  try {
    const response = await axiosInstance.get("/courses/studying");
    if (response.data && response.data.data) {
      classList.value = response.data.data.map((item, index) => ({
        id: (page - 1) * pagination.value.pageSize + (index + 1),
        courseID: item.id,
        name: item.subject.name,
        group: item.name,
        status: item.status,
        semester_id: item.semester.id,    // Lưu đúng ID (number)
      }));

      // Lấy danh sách subjects (môn học) từ API
      subjects.value = response.data.data.map((item) => ({
        label: `${item.subject.code} - ${item.subject.name} - ${item.name}`,
        value: `${item.subject.id}_${item.id}`, // Ghép thêm course_id để unique
        subject_id: item.subject.id,
        course_id: item.id,
      }));

      // Lấy danh sách semesters (học kỳ) từ API
      semesters.value = response.data.data
          .map((course) => ({
            label: course.semester.name,
            value: course.semester.id,
          }))
          .filter(
              (value, index, self) =>
                  index === self.findIndex((t) => t.value === value.value) // Lọc bỏ trùng lặp
          );
      // console.log(subjects.value);
      // console.log(semesters.value);

      // Chọn lớp/môn: giữ lựa chọn trước đó (session) khi quay lại màn hình
      const prev = selectedCourse.value;
      const saved = sessionStorage.getItem(SS_KEYS.lecturerClassConfigCourse);
      const fromSaved = restorePick(saved, subjects.value);
      const keepPrev = prev && subjects.value.some((s) => s.value === prev);
      selectedCourse.value = keepPrev ? prev : (fromSaved ?? subjects.value[0]?.value);
    }
    pagination.value.total = response.data.total || 0;
  } catch (error) {
    console.log(error);
  }
};

const fetchClassDetail = async (id) => {
  try {
    const response = await axiosInstance.get(`/courses/${id}`);
    if (response.status === 200 && response.data) {
      // console.log(response.data);
      classDataDetail.value = {
        id: response.data.data.id,
        name: response.data.data.name,
        subject_id: response.data.data.subject_id,
        about: response.data.data.about,
        status: response.data.data.status,
      };
      console.log(classDataDetail.value);
    }
  } catch (error) {
    console.log(error);
  }
}
onBeforeMount(async () => {
  await fetchAllClass();
});

watch(selectedCourse, (v) => {
  if (v != null && v !== "") {
    sessionStorage.setItem(SS_KEYS.lecturerClassConfigCourse, String(v));
  }
});

const handleAction = (key, record) => {
  if (key === "contest") {
    router.push(`${route.path}/contest/${record.id}`);
  } else if (key === "student") {
    router.push(`${route.path}/class/${record.courseID}/student_list`);
  } else if (key === "lecturer") {
    router.push(`${route.path}/class/${record.courseID}/teacher_list`);
  } else if (key === "edit") {
    showEditModal(record);
  }
};
</script>

<style scoped>
/*
  CSS cho Component Cấu hình Lớp học - Chủ đề Neo-Futuristic Sáng
*/


/* === Bảng dữ liệu === */
.class-table :deep(.ant-table) {
  text-align: center;
}
.class-name-link {
  font-weight: 600;
  color: #007ACC; /* THEMED: Màu xanh nhấn đậm */
}
.class-table :deep(.ant-table-cell) {
  text-align: center !important;
}
.action-button {
  font-size: 1.2rem;
  font-weight: bold;
  border: none;
}
.action-button:hover {
  background-color: rgba(0, 175, 255, 0.1);
}

/* === Modal và Form === */
.edit-form {
  padding-top: 12px;
}
:deep(.ant-form-item-label > label) {
    font-weight: 500;
    color: #33475B;
}

.required-notice {
    color: #d9363e;
    font-size: 0.9rem;
    margin-top: -10px;
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 24px;
}
.modal-footer .ant-btn-primary {
    background: linear-gradient(90deg, #007ACC, #00AFFF);
    border: none;
    color: white;
}
</style>
