<script setup>
import {reactive, ref, toRaw, onBeforeMount, computed, watch, createVNode} from 'vue';
import axios from "@/configs/axios.js";
import {message, Modal} from "ant-design-vue";
import {ExclamationCircleOutlined, PlusOutlined} from "@ant-design/icons-vue";
import dayjs from "dayjs";
import { SS_KEYS, restorePick } from "@/utils/selectionPersistence.js";

const subjects = ref([]);
const courses = ref({});
const groups = ref([]);
const semesters = ref({});
const current_subject = ref(null);

const selectedCourse = ref(null);
const selectedGroup = ref(null);


onBeforeMount(async () => {
  try {
    // Fetch danh sách môn học
    const resSubjects = await axios.get("/subjects");
    if (resSubjects.data.data) {
      subjects.value = resSubjects.data.data.map((subject) => ({
        label: `${subject.code} - ${subject.name}`,
        value: subject.id,
      }));

      if (subjects.value.length > 0) {
        const saved = sessionStorage.getItem(SS_KEYS.adminContestConfigSubject);
        const picked = restorePick(saved, subjects.value);
        selectedCourse.value = picked ?? subjects.value[0].value;
        createContestDTO.value.subject = selectedCourse.value;
      }
    }
  } catch (error) {
    message.error("Lỗi khi lấy danh sách môn học");
    console.error(error);
  }

  try {
    // Fetch danh sách nhóm câu hỏi
    const resGroups = await axios.get("/question_groups");
    if (resGroups.data.code === 200 && resGroups.data.data) {
      groups.value = resGroups.data.data.map((group) => ({
        label: `${group.code} - ${group.subject.name}`,
        value: group.id,
        subjectCode: group.subject.id, // Mã môn học của nhóm này
      }));
    }
  } catch (error) {
    message.error("Lỗi khi lấy danh sách nhóm");
    console.error(error);
  }
  try {
    // Fetch danh sách nhóm câu hỏi
    const resSemester = await axios.get("/semesters");
    if (resSemester.data.code === 200 && resSemester.data.data) {
      semesters.value = resSemester.data.data.map((semester) => ({
        label: `${semester.name}`,
        value: semester.id,
      }));
    }
  } catch (error) {
    message.error("Lỗi khi lấy danh sách các học kỳ");
    console.error(error);
  }
});


watch(selectedCourse, (newValue) => {
  if (newValue != null && newValue !== "") {
    sessionStorage.setItem(SS_KEYS.adminContestConfigSubject, String(newValue));
  }
  createContestDTO.value.subject = newValue;
});
const filteredGroups = computed(() => {
  return groups.value.filter((group) => group.subjectCode === selectedCourse.value);
});

const createContestDTO = ref({
  "name": "",
  "subject": "",
  "course": "",
  "address": "",
  "ordinal": 1,
  "display_detail": 0,
  "public_ranking": 1,
  "is_frozen": 0,
  "allow_browser": 1,
  "ioi": 0,
  "icpc": 0,
  "penalty_time": 20,
  "frozen_time": 30,
  "description": "",
  "semester": "",
  "status": "1",
  "start_time": null,
  "end_time": null,
  "ranking_stop_time": null,
  "submit_type": "2",
  "file": ""
})

const formatDateTime = (date) => {
  return dayjs(date).format("YYYY-MM-DD HH:mm:ss"); // Ensure correct format
};

const handleCreateContest = async () => {
  try {
    const payload = {
      ...createContestDTO.value,
      start_time: createContestDTO.value.start_time ? createContestDTO.value.start_time.format("YYYY-MM-DD HH:mm:ss") : null,
      end_time: createContestDTO.value.end_time ? createContestDTO.value.end_time.format("YYYY-MM-DD HH:mm:ss") : null,
      ranking_stop_time: createContestDTO.value.ranking_stop_time ? createContestDTO.value.ranking_stop_time.format("YYYY-MM-DD HH:mm:ss") : null,
    };

    console.log(payload);
    const res = await axios.post("/contests", payload);

    if (res.data.code === 200) {
      message.success("Tạo kỳ thi thành công");
    } else {
      message.error("Tạo kỳ thi thất bại");
      console.log(res.data);
    }
  } catch (error) {
    message.error("Lỗi khi tạo kỳ thi");
    console.error(error);
  }
};
const showConfirm = () => {
  Modal.confirm({
    title: 'Xác nhận thêm kiểm tra mới',
    icon: createVNode(ExclamationCircleOutlined),
    content: createVNode(
        'div',
        {
          style: 'color:red;',
        },
        'Hãy kiểm tra kỹ thông tin trước khi thêm kiểm tra mới!',
    ),
    onOk() {
      handleCreateContest()

    },
    onCancel() {
    },
    class: 'test',
  });
};
</script>

<template>
  <div class="contest-config-container">
    <div class="header-section">
      <h2 class="section-title">Thêm kiểm tra mới</h2>
      <p class="section-description">Điền đầy đủ thông tin để tạo kiểm tra mới</p>
    </div>

    <div class="form-container">
      <!-- Cột 1: Thông tin cơ bản -->
      <div class="form-column">
        <div class="form-section">
          <h3 class="form-section-title">Thông tin cơ bản</h3>
          
          <a-form-item label="Tên kiểm tra">
            <a-input v-model:value="createContestDTO.name" placeholder="Nhập tên kiểm tra"/>
          </a-form-item>

          <a-form-item label="Địa điểm">
            <a-input v-model:value="createContestDTO.address" placeholder="Nhập địa điểm"/>
          </a-form-item>

          <a-form-item label="Môn Học">
            <a-select v-model:value="selectedCourse" placeholder="Chọn môn học">
              <a-select-option v-for="subject in subjects" :key="subject.value" :value="subject.value">
                {{ subject.label }}
              </a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="Học kỳ">
            <a-select v-model:value="createContestDTO.semester" placeholder="Chọn học kỳ">
              <a-select-option v-for="semester in semesters" :key="semester.value" :value="semester.value">
                {{ semester.label }}
              </a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="Nhóm">
            <a-select v-model:value="createContestDTO.course" :disabled="filteredGroups.length === 0" placeholder="Chọn nhóm">
              <a-select-option v-for="group in filteredGroups" :key="group.value" :value="group.value">
                {{ group.label }}
              </a-select-option>
            </a-select>
          </a-form-item>
        </div>

        <div class="form-section">
          <h3 class="form-section-title">Thời gian</h3>
          
          <a-form-item label="Thời gian bắt đầu">
            <a-date-picker v-model:value="createContestDTO.start_time" show-time format="YYYY-MM-DD HH:mm:ss"
                         placeholder="Chọn thời gian bắt đầu"/>
          </a-form-item>

          <a-form-item label="Thời gian kết thúc">
            <a-date-picker v-model:value="createContestDTO.end_time" show-time format="YYYY-MM-DD HH:mm:ss"
                         placeholder="Chọn thời gian kết thúc"/>
          </a-form-item>

          <a-form-item label="Thời gian dừng xếp hạng">
            <a-date-picker v-model:value="createContestDTO.ranking_stop_time" show-time format="YYYY-MM-DD HH:mm:ss"
                         placeholder="Chọn thời gian dừng xếp hạng"/>
          </a-form-item>
        </div>
      </div>

      <!-- Cột 2: Cấu hình -->
      <div class="form-column">
        <div class="form-section">
          <h3 class="form-section-title">Cấu hình chung</h3>

          <a-form-item label="Kiểm tra số">
            <a-input-number v-model:value="createContestDTO.ordinal" :min="1" class="full-width"/>
          </a-form-item>

          <a-form-item label="Trạng thái">
            <a-radio-group v-model:value="createContestDTO.status" class="status-group">
              <a-radio value="1">Hoạt động</a-radio>
              <a-radio value="0">Không hoạt động</a-radio>
            </a-radio-group>
          </a-form-item>

          <a-form-item label="Thời gian phạt (phút)">
            <a-input-number v-model:value="createContestDTO.penalty_time" :min="20" class="full-width"/>
          </a-form-item>

          <a-form-item label="Thời gian đóng băng (phút)">
            <a-input-number v-model:value="createContestDTO.frozen_time" :min="30" class="full-width"/>
          </a-form-item>
        </div>

        <div class="form-section">
          <h3 class="form-section-title">Tùy chọn nâng cao</h3>
          
          <div class="checkbox-group">
            <a-checkbox
                :checked="createContestDTO.frozen_time === 1"
                @change="createContestDTO.frozen_time = $event.target.checked ? 1 : 0"
            >
              Đóng băng bài thi
            </a-checkbox>

            <a-checkbox
                :checked="createContestDTO.allow_browser === 1"
                @change="createContestDTO.allow_browser = $event.target.checked ? 1 : 0"
            >
              Cho phép trình duyệt
            </a-checkbox>

            <a-checkbox
                :checked="createContestDTO.ioi === 1"
                @change="createContestDTO.ioi = $event.target.checked ? 1 : 0"
            >
              Chế độ IOI
            </a-checkbox>

            <a-checkbox
                :checked="createContestDTO.icpc === 1"
                @change="createContestDTO.icpc = $event.target.checked ? 1 : 0"
            >
              Chế độ ICPC
            </a-checkbox>

            <a-checkbox
                :checked="createContestDTO.display_detail === 1"
                @change="createContestDTO.display_detail = $event.target.checked ? 1 : 0"
            >
              Ẩn câu hỏi
            </a-checkbox>

            <a-checkbox
                :checked="createContestDTO.public_ranking === 1"
                @change="createContestDTO.public_ranking = $event.target.checked ? 1 : 0"
            >
              Công khai bảng xếp hạng
            </a-checkbox>
          </div>
        </div>
      </div>
    </div>

    <div class="form-actions">
      <a-button type="primary" size="large" @click="showConfirm">
        <template #icon><PlusOutlined /></template>
        Thêm kiểm tra
      </a-button>
    </div>
  </div>
</template>

<style scoped>
.contest-config-container {
  padding: 24px;
  background: #fff;
  border-radius: 12px;
}

.header-section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
}

.section-description {
  color: #6b7280;
  font-size: 16px;
}

.form-container {
  display: flex;
  gap: 32px;
  margin-bottom: 24px;
}

.form-column {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-section {
  background: #f9fafb;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.form-section-title {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e5e7eb;
}

:deep(.ant-form-item) {
  margin-bottom: 20px;
}

:deep(.ant-form-item-label) {
  padding-bottom: 8px;
}

:deep(.ant-form-item-label > label) {
  font-weight: 500;
  color: #374151;
}

:deep(.ant-input),
:deep(.ant-select-selector),
:deep(.ant-picker),
:deep(.ant-input-number) {
  border-radius: 8px;
  border-color: #d1d5db;
}

:deep(.ant-input:hover),
:deep(.ant-select-selector:hover),
:deep(.ant-picker:hover),
:deep(.ant-input-number:hover) {
  border-color: #60a5fa;
}

:deep(.ant-input:focus),
:deep(.ant-select-selector:focus),
:deep(.ant-picker:focus),
:deep(.ant-input-number:focus) {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}

.full-width {
  width: 100% !important;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

:deep(.ant-checkbox-wrapper) {
  margin-left: 0;
}

:deep(.ant-radio-group) {
  display: flex;
  gap: 16px;
}

.status-group {
  display: flex;
  gap: 24px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

:deep(.ant-btn-primary) {
  height: 44px;
  padding: 0 24px;
  font-size: 16px;
  border-radius: 8px;
  background: #2563eb;
  border-color: #2563eb;
  display: flex;
  align-items: center;
  gap: 8px;
}

:deep(.ant-btn-primary:hover) {
  background: #1d4ed8;
  border-color: #1d4ed8;
}

@media (max-width: 1024px) {
  .form-container {
    flex-direction: column;
  }
  
  .form-column {
    width: 100%;
  }
}
</style>
