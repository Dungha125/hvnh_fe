<script setup>
import {reactive, ref, toRaw, onBeforeMount, computed, watch, createVNode} from 'vue';
import axios from "@/configs/axios.js";
import {message, Modal} from "ant-design-vue";
import {ExclamationCircleOutlined, PlusOutlined} from "@ant-design/icons-vue";
import dayjs from "dayjs";

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
        selectedCourse.value = subjects.value[0].value; // Mặc định chọn môn đầu tiên
        createContestDTO.value.subject = subjects.value[0].value; // Gán mặc định cho form
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
  "submit_type": "1",
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
    title: 'Xác nhận thêm bài thực hành mới',
    icon: createVNode(ExclamationCircleOutlined),
    content: createVNode(
        'div',
        {
          style: 'color:red;',
        },
        'Hãy kiểm tra kỹ thông tin trước khi thêm bài thực hành mới!',
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
  <div class="form-container">
    <!-- Cột 1 -->
    <div class="form-column">
      <a-form-item label="Tên">
        <a-input v-model:value="createContestDTO.name"/>
      </a-form-item>
      <a-form-item label="Địa điểm">
        <a-input v-model:value="createContestDTO.address"/>
      </a-form-item>
      <a-form-item label="Môn Học">
        <a-select v-model:value="selectedCourse">
          <a-select-option v-for="subject in subjects" :key="subject.value" :value="subject.value">
            {{ subject.label }}
          </a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item label="Học kỳ">
        <a-select v-model:value="createContestDTO.semester">
          <a-select-option v-for="semester in semesters" :key="semester.value" :value="semester.value">
            {{ semester.label }}
          </a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item label="Nhóm">
        <a-select v-model:value="createContestDTO.course" :disabled="filteredGroups.length === 0">
          <a-select-option v-for="group in filteredGroups" :key="group.value" :value="group.value">
            {{ group.label }}
          </a-select-option>
        </a-select>
      </a-form-item>
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

    <!-- Cột 2 -->
    <div class="form-column">
      <a-form-item label="Bài thực hành số">
        <a-input-number v-model:value="createContestDTO.ordinal" :min="1"/>
      </a-form-item>
      <a-form-item label="Trạng thái">
        <a-radio-group v-model:value="createContestDTO.status">
          <a-radio value="1">Hoạt động</a-radio>
          <a-radio value="0">Không hoạt động</a-radio>
        </a-radio-group>
      </a-form-item>
      <!-- CHECKBOXES -->
      <a-form-item label="Tùy chọn">
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
      </a-form-item>

      <a-form-item label="Thời gian phạt">
        <a-input-number v-model:value="createContestDTO.penalty_time" :min="20"/>
      </a-form-item>
      <a-form-item label="Thời gian đóng băng">
        <a-input-number v-model:value="createContestDTO.frozen_time" :min="30"/>
      </a-form-item>
      <a-form-item label="Loại nộp bài">
        <a-radio-group v-model:value="createContestDTO.submit_type">
          <a-radio value="1">Tải lên</a-radio>
          <a-radio value="2">Chấm thủ công</a-radio>
        </a-radio-group>
      </a-form-item>

    </div>
    <a-button @click="showConfirm">Thêm</a-button>
  </div>
</template>


<style scoped>
/* Container tổng thể của form */
.form-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  max-width: 900px;
  overflow-y: auto; /* Bật thanh cuộn */
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  border: 1px solid #ddd;
  background: #ffffff;
}

/* Mỗi cột chiếm 48% để tạo khoảng cách */
.form-column {
  width: 48%;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

/* Label */
a-form-item label {
  font-weight: 600;
  color: #444;
  display: block;
  margin-bottom: 5px;
}

/* Input và select */
a-input,
a-input-number,
a-select,
a-date-picker {
  width: 100% !important;
  border-radius: 6px;
  border: 1px solid #ccc;
  padding: 8px;
  font-size: 14px;
}

/* Checkbox group */
.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Căn chỉnh checkbox */
a-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Căn chỉnh radio group */
a-radio-group {
  display: flex;
  gap: 20px;
}

/* Button */
a-button {
  background-color: #1890ff;
  color: white;
  font-weight: bold;
  border: none;
  padding: 12px 20px;
  border-radius: 6px;
}

a-button:hover {
  background-color: #40a9ff;
  transform: scale(1.02);
}

/* Khoảng cách giữa các mục */
a-form-item {
  margin-bottom: 15px !important;
}

</style>
