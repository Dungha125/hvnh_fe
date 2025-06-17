<script setup>
import {ref, onBeforeMount, computed, watch, createVNode} from "vue";
import axios from "@/configs/axios.js";
import {message, Modal} from "ant-design-vue";
import {ExclamationCircleOutlined, EllipsisOutlined} from "@ant-design/icons-vue";
import {useRoute, useRouter} from "vue-router";
import axiosInstance from "@/configs/axios.js";
import dayjs from "dayjs";

const subjects = ref([]);
const courses = ref([]);
const groups = ref([]);
const semesters = ref({});
const listContests = ref([]);
const selectedCourse = ref(null);
const selectedGroup = ref(null);
const router = useRouter();
const route = useRoute();
const contestDetails = ref({});
const contestIDs = ref([]);
const activeTabKey = ref('1');
onBeforeMount(async () => {
  try {
    const response = await axiosInstance.get("courses/studying");

    if (response.data.code === 200 && Array.isArray(response.data.data)) {
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

      // Chọn mặc định giá trị đầu tiên nếu có dữ liệu
      if (subjects.value.length > 0) {
        selectedCourse.value = subjects.value[0].value;
        createContestDTO.value.subject = subjects.value[0].value;
      }
    } else {
      message.error("Không tìm thấy dữ liệu môn học từ API");
    }
  } catch (error) {
    message.error("Lỗi khi tải danh sách môn học từ API");
    console.error(error);
  }

  try {
    const resCourses = await axios.get("/courses/studying");
    // console.log(resCourses.data);
    if (resCourses.data.code === 200 && resCourses.data.data) {
      courses.value = resCourses.data.data.map((course) => ({
        label: `${course.subject.name} - Nhóm ${course.name}`,
        value: course.id,
      }));

      if (groups.value.length > 0) {
        selectedGroup.value = groups.value[0].value;
      }
    }
  } catch (error) {
    message.error("Lỗi khi lấy danh sách nhóm");
    console.error(error);
  }
});
const fetchContests = async (subjectID, course_id) => {
  try {
    const resContests = await axiosInstance.get(
        `/contests?subject_id=${subjectID}&course_id=${course_id}`
    );
    // console.log("Lấy danh sách bài thực hành:", resContests.data);

    if (resContests.data.code === 200 && resContests.data) {
      listContests.value = resContests.data.data.map((contest, index) => ({
        id: contest.id,
        index: index + 1,
        icpc: contest.icpc,
        ioi: contest.ioi,
        name: contest.name,
        ordinal: contest.ordinal,
        startTime: contest.start_time,
        course_id: getCourseLabel(contest.course_id),
        subject_id: getSubjectLabel(contest.subject_id),
        endTime: contest.end_time,
        status: contest.status,
      }));
    }
  } catch (error) {
    message.error("Lỗi khi tải danh sách bài thực hành");
    console.error(error);
  }
};

const fetchDetailsContest = async (contestID) => {
  try {
    const response = await axiosInstance.get(`/contests/${contestID}`);
    if (response.data && response.data.data) {
      const data = response.data.data;

      contestDetails.value = {
        name: data.name || "",
        subject: data.subject || "",
        course: data.course_id || "",
        address: data.address || "",
        ordinal: data.ordinal || 1,
        display_detail: data.display_detail ?? 0,
        public_ranking: data.public_ranking ?? 1,
        is_frozen: data.is_frozen ?? 0,
        mc_shuffle: data.mc_shuffle ?? 0,
        mc_option_shuffle: data.mc_option_shuffle ?? 0,
        allow_browser: data.allow_browser ?? 1,
        ioi: data.ioi ?? 0,
        icpc: data.icpc ?? 0,
        penalty_time: data.penalty_time ?? 20,
        frozen_time: data.frozen_time ?? 30,
        description: data.description || "",
        semester: data.semester_id || "",
        status: String(data.status),
        // 🔥 Chuyển đổi từ chuỗi -> dayjs để `a-date-picker` nhận diện đúng
        start_time: data.start_time
            ? dayjs(data.start_time, "YYYY-MM-DD HH:mm:ss")
            : null,
        end_time: data.end_time
            ? dayjs(data.end_time, "YYYY-MM-DD HH:mm:ss")
            : null,
        ranking_stop_time: data.ranking_stop_time
            ? dayjs(data.ranking_stop_time, "YYYY-MM-DD HH:mm:ss")
            : null,
        submit_type: String(data.submit_type) ?? "1",
        file: data.file || "",
      };
    }
    console.log("Fetched Contest Details:", contestDetails.value);
  } catch (error) {
    console.error("Lỗi khi fetch chi tiết bài thực hành:", error);
    message.error("Lỗi khi tải dữ liệu bài thực hành.");
  }
};
watch(selectedCourse, async (newValue) => {
  if (newValue) {
    const [subject_id, course_id] = newValue.split("_");
    createContestDTO.value.subject = subject_id;
    createContestDTO.value.course = course_id;
    await fetchContests(subject_id, course_id);
  }
});

const getSubjectLabel = (subject_id) => {
  const subject = subjects.value.find((subject) => subject.subject_id === subject_id);
  return subject ? subject.label : "Không tìm thấy môn học";
};

const getCourseLabel = (course_id) => {
  const course = courses.value.find((course) => course.value === course_id);
  return course ? course.label : "Không tìm thấy nhóm học";
};

const createContestDTO = ref({
  name: "",
  subject: "",
  course: "",
  address: "",
  ordinal: 1,
  display_detail: 0,
  public_ranking: 1,
  is_frozen: 0,
  allow_browser: 1,
  ioi: 0,
  icpc: 0,
  penalty_time: 20,
  frozen_time: 30,
  description: "",
  semester: "",
  status: "1",
  start_time: null,
  end_time: null,
  ranking_stop_time: null,
  submit_type: "1",
  file: "",
});

const handleCreateContest = async () => {
  try {
    const payload = {
  ...createContestDTO.value,
  ordinal: Number(createContestDTO.value.ordinal ?? 1),
  display_detail: Number(createContestDTO.value.display_detail ?? 0),
  public_ranking: Number(createContestDTO.value.public_ranking ?? 1),
  is_frozen: Number(createContestDTO.value.is_frozen ?? 0),
  allow_browser: Number(createContestDTO.value.allow_browser ?? 1),
  ioi: Number(createContestDTO.value.ioi ?? 0),
  icpc: Number(createContestDTO.value.icpc ?? 0),
  penalty_time: Number(createContestDTO.value.penalty_time ?? 20),
  frozen_time: Number(createContestDTO.value.frozen_time ?? 30),
  status: String(createContestDTO.value.status ?? "1"),
  submit_type: String(createContestDTO.value.submit_type ?? "1"),
  start_time: createContestDTO.value.start_time
    ? createContestDTO.value.start_time.format("YYYY-MM-DD HH:mm:ss")
    : null,
  end_time: createContestDTO.value.end_time
    ? createContestDTO.value.end_time.format("YYYY-MM-DD HH:mm:ss")
    : null,
  ranking_stop_time: createContestDTO.value.ranking_stop_time
    ? createContestDTO.value.ranking_stop_time.format("YYYY-MM-DD HH:mm:ss")
    : null,
}

    console.log("Payload gửi đi:", payload);
    const res = await axios.post("contests", payload);

    if (res.data.code === 200) {
      message.success("Tạo kỳ thi thành công");
      await fetchContests(subjects.value[0]?.value);
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
    title: "Xác nhận thêm bài thực hành mới",
    icon: createVNode(ExclamationCircleOutlined),
    content: createVNode(
        "div",
        {
          style: "color:red;",
        },
        "Hãy kiểm tra kỹ thông tin trước khi thêm bài thực hành mới!"
    ),
    onOk() {
      handleCreateContest();
    },
    onCancel() {
    },
    class: "test",
  });
};
const getStatusTag = (status) => {
  return status === 1 ? "success" : "error";
};

const getStatusText = (status) => {
  return status === 1 ? "Hoạt động" : "Không hoạt động";
};

const handleAction = (key, record) => {
  if (key === "student") {
    router.push(`${route.path}/${record.id}/student_list`);
  } else if (key === "exam_room") {
    router.push(`${route.path}/${record.id}/exam_room`);
  } 
  else if (key === "ranking") {
    localStorage.setItem('contest_id', record.id);
    sessionStorage.setItem('contest_icpc', record.icpc);
    sessionStorage.setItem('contest_ioi', record.ioi);
    router.push(`${route.path}/${record.id}/ranking_contest`);
    
  }
  else if (key === "teacher") {
    router.push(`${route.path}/${record.id}/teacher_list`);
  } else if (key === "questions") {
    router.push(`${route.path}/${record.id}/list_question`);
  }
};
const isModalVisible = ref(false);

const showModal = () => {
  isModalVisible.value = true;
};

const handleOk = () => {
  showConfirm();
  isModalVisible.value = false;
};

const handleCancel = () => {
  isModalVisible.value = false;
};

const isModalEditVisible = ref(false);

const showEditModal = (contestID) => {
  fetchDetailsContest(contestID);
  isModalEditVisible.value = true;
};
const handleEditOK = () => {
  isModalEditVisible.value = false;
};
const handleEditCancel = () => {
  isModalEditVisible.value = false;
};

const handleUpdateContest = async (contestID) => {
  try {
    const payload = {
      name: contestDetails.value.name,
      subject: Number(selectedCourse.value),
      course: contestDetails.value.course,
      address: contestDetails.value.address,
      ordinal: contestDetails.value.ordinal,
      display_detail: contestDetails.value.display_detail ? 1 : 0,
      public_ranking: contestDetails.value.public_ranking ? 1 : 0,
      is_frozen: contestDetails.value.is_frozen ? 1 : 0,
      allow_browser: contestDetails.value.allow_browser ? 1 : 0,
      ioi: contestDetails.value.ioi ? 1 : 0,
      icpc: contestDetails.value.icpc ? 1 : 0,
      penalty_time: contestDetails.value.penalty_time,
      frozen_time: contestDetails.value.frozen_time,
      description: contestDetails.value.description,
      semester: contestDetails.value.semester,
      status: contestDetails.value.status,
      start_time: contestDetails.value.start_time
          ? contestDetails.value.start_time.format("YYYY-MM-DD HH:mm:ss")
          : null,
      end_time: contestDetails.value.end_time
          ? contestDetails.value.end_time.format("YYYY-MM-DD HH:mm:ss")
          : null,
      ranking_stop_time: contestDetails.value.ranking_stop_time
          ? contestDetails.value.ranking_stop_time.format("YYYY-MM-DD HH:mm:ss")
          : null,
      submit_type: contestDetails.value.submit_type,
      file: contestDetails.value.file,
    };
    console.log("Payload gửi đi:", payload);
    const res = await axios.put(`contests/${contestID}`, payload);
    if (res.data.code === 200) {
      message.success("Cập nhật bài thực hành thành công");
      await fetchContests(subjects.value[0]?.value);
    } else {
      message.error("Cập nhật bài thực hành thất bại");
    }
  } catch (error) {
    message.error("Lỗi khi cập nhật bài thực hành");
    console.error(error);
  }
  handleEditOK();
};

const frozenTimeChecked = computed({
  get: () => contestDetails.value.is_frozen === 1,
  set: (val) => (contestDetails.value.is_frozen = val ? 1 : 0),
});

const allowBrowserChecked = computed({
  get: () => contestDetails.value.allow_browser === 1,
  set: (val) => (contestDetails.value.allow_browser = val ? 1 : 0),
});

const ioiChecked = computed({
  get: () => contestDetails.value.ioi == 1,
  set: (val) => (contestDetails.value.ioi = val ? 1 : 0),
});

const icpcChecked = computed({
  get: () => contestDetails.value.icpc == 1,
  set: (val) => (contestDetails.value.icpc = val ? 1 : 0),
});

const displayDetailChecked = computed({
  get: () => contestDetails.value.display_detail === 1,
  set: (val) => (contestDetails.value.display_detail = val ? 1 : 0),
});

const publicRankingChecked = computed({
  get: () => contestDetails.value.public_ranking === 1,
  set: (val) => (contestDetails.value.public_ranking = val ? 1 : 0),
});
const handleDeleteContest = async (contestID) => {
  try {
    const res = await axios.delete(`contests/${contestID}`);
    if (res.data.code === 200) {
      message.success("Xóa bài thực hành thành công");
      await fetchContests(subjects.value[0]?.value);
    } else {
      message.error("Xóa bài thực hành thất bại");
    }
  } catch (error) {
    message.error("Lỗi khi xóa bài thực hành");
    console.error(error);
  }
};
const confirmDelete = (contestID) => {
  Modal.confirm({
    title: "Xác nhận xóa bài thực hành",
    content: "Bạn có chắc chắn muốn xóa bài thực hành này không?",
    onOk: () => handleDeleteContest(contestID),
  });
};

const handleExportFile = async (contestIDs) => {
  if (!contestIDs.length) {
    message.warning("Vui lòng chọn ít nhất một bài thực hành để xuất");
    return;
  }
  try {
    const res = await axios.post(
        "contests/export",
        {id: contestIDs},
        {responseType: "blob"}
    );

    const blob = new Blob([res.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const fileName = `contest-${contestIDs.join("-")}-export.xlsx`;
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    message.success("Xuất file thành công");
  } catch (error) {
    message.error("Lỗi khi xuất file");
    console.error(error);
  }
};

const toggleSelectAll = (e) => {
  if (e.target.checked) {
    contestIDs.value = listContests.value.map((item) => item.id);
  } else {
    contestIDs.value = [];
  }
};

const toggleSelectContest = (id, checked) => {
  if (checked) {
    if (!contestIDs.value.includes(id)) {
      contestIDs.value.push(id);
    }
  } else {
    contestIDs.value = contestIDs.value.filter((contestId) => contestId !== id);
  }
};
const goToContestRanking = (record) => {
  if(record.icpc === 1 || record.ioi === 1)
{
  localStorage.setItem('contest_id', record.id);
  sessionStorage.setItem('contest_icpc', record.icpc);
  sessionStorage.setItem('contest_ioi', record.ioi);
  router.push(`${route.path}/${record.id}/ranking_contest`);
}
else
{
  router.push(`/contest/${record.id}/ranking`);
}
  
};
const antDesignTheme = {
  token: {
    colorPrimary: '#00AFFF',
    colorLink: '#007ACC',
  }
};
</script>

<template>
  <div class="contest-config-container">
    <a-config-provider :theme="antDesignTheme">
      <a-card title="Cấu hình thực hành">
        <div class="action-bar">
          <div class="action-buttons">
            <a-button type="primary" @click="showModal">Thêm mới</a-button>
            <a-button @click="handleExportFile(contestIDs)">Xuất bài thực hành</a-button>
          </div>
          <div class="filter-controls">
            <a-select v-model:value="selectedCourse" placeholder="Lọc theo môn học" style="width: 250px">
              <a-select-option v-for="subject in subjects" :key="subject.value" :value="subject.value">
                {{ subject.label }}
              </a-select-option>
            </a-select>
          </div>
        </div>

        <a-table
          class="contest-table"
          :dataSource="listContests"
          :rowKey="(record) => record.id"
          bordered
          :scroll="{ x: 'max-content' }"
        >
          <a-table-column key="checkbox" >
            <template #title>
              <a-checkbox
                  :checked="contestIDs.length === listContests.length && listContests.length > 0"
                  :indeterminate="contestIDs.length > 0 && contestIDs.length < listContests.length"
                  @change="toggleSelectAll"
              />
            </template>
            <template #default="{ record }">
              <a-checkbox
                  :checked="contestIDs.includes(record.id)"
                  @change="(e) => toggleSelectContest(record.id, e.target.checked)"
              />
            </template>
          </a-table-column>
          <a-table-column title="STT" dataIndex="index" key="index"  />
          <a-table-column title="Tên" dataIndex="name" key="name">
            <template #default="{ text, record }">
              <a class="contest-name-link" @click="goToContestRanking(record)">{{ text }}</a>
            </template>
          </a-table-column>
          <a-table-column title="Môn học" dataIndex="subject_id" key="subject_id"/>
          <a-table-column title="Lớp học" dataIndex="course_id" key="course_id"/>
          <a-table-column title="Bắt đầu" dataIndex="startTime" key="startTime"/>
          <a-table-column title="Kết thúc" dataIndex="endTime" key="endTime"/>
          <a-table-column title="Trạng thái" dataIndex="status" key="status">
            <template #default="{ text }">
              <a-tag :color="getStatusTag(text)">{{ getStatusText(text) }}</a-tag>
            </template>
          </a-table-column>
          <a-table-column title="Thao tác" key="action" fixed="right" width="100px">
            <template #default="{ record }">
              <a-dropdown>
                <a-button type="text" shape="circle">
                    <EllipsisOutlined />
                </a-button>
                <template #overlay>
                  <a-menu @click="({ key }) => handleAction(key, record)">
                    <a-menu-item key="student">Sinh viên</a-menu-item>
                    <a-menu-item key="exam_room">Phòng thi</a-menu-item>
                    <a-menu-item v-if="record.icpc === 1 || record.ioi === 1" key="ranking">Bảng xếp hạng</a-menu-item>
                    <a-menu-item key="teacher">Giảng viên</a-menu-item>
                    <a-menu-item key="questions">Bài tập</a-menu-item>
                    <a-menu-item key="activity">Hoạt động</a-menu-item>
                    <a-menu-divider/>
                    <a-menu-item key="edit" @click="showEditModal(record.id)">Sửa</a-menu-item>
                    <a-menu-item key="delete" @click="confirmDelete(record.id)">Xóa</a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </template>
          </a-table-column>
        </a-table>
      </a-card>

      <!-- Modal Thêm mới -->
      <a-modal v-model:open="isModalVisible" title="Thêm mới kỳ thi" :footer="null" @cancel="handleCancel" width="90vw" style="max-width: 1100px;" centered>
        <a-form layout="vertical" @finish="handleOk" class="modal-form">
          <a-tabs v-model:activeKey="activeTabKey" class="modal-tabs">
            <a-tab-pane key="1" tab="Thông tin cơ bản">
              <div class="form-grid">
                <a-form-item label="Tên" name="name" :rules="[{ required: true, message: 'Vui lòng nhập tên!' }]"><a-input v-model:value="createContestDTO.name"/></a-form-item>
                <a-form-item label="Địa điểm"><a-input v-model:value="createContestDTO.address"/></a-form-item>
                <a-form-item label="Môn Học" name="subject" :rules="[{ required: true, message: 'Vui lòng chọn môn học!' }]"><a-select v-model:value="selectedCourse" :options="subjects" /></a-form-item>
                <a-form-item label="Học kỳ" name="semester" :rules="[{ required: true, message: 'Vui lòng chọn học kỳ!' }]"><a-select v-model:value="createContestDTO.semester" :options="semesters" /></a-form-item>
                <a-form-item label="Nhóm"><a-select v-model:value="createContestDTO.course" :options="courses" /></a-form-item>
                <a-form-item label="Bài thực hành số"><a-input-number v-model:value="createContestDTO.ordinal" :min="1" style="width: 100%;" /></a-form-item>
              </div>
            </a-tab-pane>
            <a-tab-pane key="2" tab="Cài đặt thời gian">
              <div class="form-grid">
                <a-form-item label="Thời gian bắt đầu" name="start_time" :rules="[{ required: true, message: 'Vui lòng chọn thời gian!' }]"><a-date-picker v-model:value="createContestDTO.start_time" show-time format="YYYY-MM-DD HH:mm:ss" style="width: 100%;" /></a-form-item>
                <a-form-item label="Thời gian kết thúc" name="end_time" :rules="[{ required: true, message: 'Vui lòng chọn thời gian!' }]"><a-date-picker v-model:value="createContestDTO.end_time" show-time format="YYYY-MM-DD HH:mm:ss" style="width: 100%;" /></a-form-item>
                <a-form-item label="Thời gian dừng xếp hạng"><a-date-picker v-model:value="createContestDTO.ranking_stop_time" show-time format="YYYY-MM-DD HH:mm:ss" style="width: 100%;" /></a-form-item>
                <a-form-item label="Thời gian phạt (phút)"><a-input-number v-model:value="createContestDTO.penalty_time" :min="0" style="width: 100%;" /></a-form-item>
                <a-form-item label="Thời gian đóng băng (phút)"><a-input-number v-model:value="createContestDTO.frozen_time" :min="0" style="width: 100%;" /></a-form-item>
              </div>
            </a-tab-pane>
            <a-tab-pane key="3" tab="Chế độ & Tùy chọn">
               <div class="form-grid">
                  <a-form-item label="Trạng thái"><a-radio-group v-model:value="createContestDTO.status"><a-radio value="1">Hoạt động</a-radio><a-radio value="0">Không hoạt động</a-radio></a-radio-group></a-form-item>
                  <a-form-item label="Loại nộp bài"><a-radio-group v-model:value="createContestDTO.submit_type"><a-radio value="1">Tải lên</a-radio><a-radio value="2">Chấm thủ công</a-radio></a-radio-group></a-form-item>
               </div>
               <a-form-item label="Tùy chọn khác">
                  <div class="checkbox-grid">
                      <a-checkbox v-model:checked="createContestDTO.frozen_time">Đóng băng bài thi</a-checkbox>
                      <a-checkbox v-model:checked="createContestDTO.allow_browser">Cho phép trình duyệt</a-checkbox>
                      <a-checkbox v-model:checked="createContestDTO.ioi">Chế độ IOI</a-checkbox>
                      <a-checkbox v-model:checked="createContestDTO.icpc">Chế độ ICPC</a-checkbox>
                      <a-checkbox v-model:checked="createContestDTO.display_detail">Ẩn câu hỏi</a-checkbox>
                      <a-checkbox v-model:checked="createContestDTO.public_ranking">Công khai bảng xếp hạng</a-checkbox>
                  </div>
               </a-form-item>
            </a-tab-pane>
          </a-tabs>
           <a-form-item class="modal-footer">
              <a-button key="back" @click="handleCancel">Hủy</a-button>
              <a-button key="submit" type="primary" html-type="submit">Tạo</a-button>
           </a-form-item>
        </a-form>
      </a-modal>
      
      <!-- Modal Sửa -->
      <a-modal v-model:open="isModalEditVisible" title="Sửa bài thực hành" :footer="null" @cancel="handleEditCancel" width="90vw" style="max-width: 1100px;" centered>
        <a-form layout="vertical" @finish="handleUpdateContest" class="modal-form">
          <a-tabs v-model:activeKey="activeTabKey" class="modal-tabs">
            <a-tab-pane key="1" tab="Thông tin cơ bản">
              <div class="form-grid">
                <a-form-item label="Tên" name="name" :rules="[{ required: true, message: 'Vui lòng nhập tên!' }]"><a-input v-model:value="contestDetails.name"/></a-form-item>
                <a-form-item label="Địa điểm"><a-input v-model:value="contestDetails.address"/></a-form-item>
                <a-form-item label="Môn Học" name="subject" :rules="[{ required: true, message: 'Vui lòng chọn môn học!' }]"><a-select v-model:value="selectedCourse" :options="subjects" /></a-form-item>
                <a-form-item label="Học kỳ" name="semester" :rules="[{ required: true, message: 'Vui lòng chọn học kỳ!' }]"><a-select v-model:value="contestDetails.semester" :options="semesters" /></a-form-item>
                <a-form-item label="Nhóm"><a-select v-model:value="contestDetails.course" :options="courses" /></a-form-item>
                <a-form-item label="Bài thực hành số"><a-input-number v-model:value="contestDetails.ordinal" :min="1" style="width: 100%;" /></a-form-item>
              </div>
            </a-tab-pane>
            <a-tab-pane key="2" tab="Cài đặt thời gian">
              <div class="form-grid">
                <a-form-item label="Thời gian bắt đầu" name="start_time" :rules="[{ required: true, message: 'Vui lòng chọn thời gian!' }]"><a-date-picker v-model:value="contestDetails.start_time" show-time format="YYYY-MM-DD HH:mm:ss" style="width: 100%;" /></a-form-item>
                <a-form-item label="Thời gian kết thúc" name="end_time" :rules="[{ required: true, message: 'Vui lòng chọn thời gian!' }]"><a-date-picker v-model:value="contestDetails.end_time" show-time format="YYYY-MM-DD HH:mm:ss" style="width: 100%;" /></a-form-item>
                <a-form-item label="Thời gian dừng xếp hạng"><a-date-picker v-model:value="contestDetails.ranking_stop_time" show-time format="YYYY-MM-DD HH:mm:ss" style="width: 100%;" /></a-form-item>
                <a-form-item label="Thời gian phạt (phút)"><a-input-number v-model:value="contestDetails.penalty_time" :min="0" style="width: 100%;" /></a-form-item>
                <a-form-item label="Thời gian đóng băng (phút)"><a-input-number v-model:value="contestDetails.frozen_time" :min="0" style="width: 100%;" /></a-form-item>
              </div>
            </a-tab-pane>
            <a-tab-pane key="3" tab="Chế độ & Tùy chọn">
               <div class="form-grid">
                  <a-form-item label="Trạng thái"><a-radio-group v-model:value="contestDetails.status"><a-radio value="1">Hoạt động</a-radio><a-radio value="0">Không hoạt động</a-radio></a-radio-group></a-form-item>
                  <a-form-item label="Loại nộp bài"><a-radio-group v-model:value="contestDetails.submit_type"><a-radio value="1">Tải lên</a-radio><a-radio value="2">Chấm thủ công</a-radio></a-radio-group></a-form-item>
               </div>
               <a-form-item label="Tùy chọn khác">
                  <div class="checkbox-grid">
                      <a-checkbox v-model:checked="contestDetails.frozen_time">Đóng băng bài thi</a-checkbox>
                      <a-checkbox v-model:checked="contestDetails.allow_browser">Cho phép trình duyệt</a-checkbox>
                      <a-checkbox v-model:checked="contestDetails.ioi">Chế độ IOI</a-checkbox>
                      <a-checkbox v-model:checked="contestDetails.icpc">Chế độ ICPC</a-checkbox>
                      <a-checkbox v-model:checked="contestDetails.display_detail">Ẩn câu hỏi</a-checkbox>
                      <a-checkbox v-model:checked="contestDetails.public_ranking">Công khai bảng xếp hạng</a-checkbox>
                  </div>
               </a-form-item>
            </a-tab-pane>
          </a-tabs>
           <a-form-item class="modal-footer">
              <a-button key="back" @click="handleEditCancel">Hủy</a-button>
              <a-button key="submit" type="primary">Lưu thay đổi</a-button>
           </a-form-item>
        </a-form>
      </a-modal>

    </a-config-provider>
  </div>
</template>

<style scoped>
/*
  CSS cho trang Cấu hình Thực hành - Chủ đề Neo-Futuristic Sáng
  Đã được thiết kế lại và responsive.
*/

/* === Thanh hành động và bộ lọc === */
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
}
.action-buttons {
  display: flex;
  gap: 12px;
}
.action-buttons .ant-btn-primary {
    background: linear-gradient(90deg, #007ACC, #00AFFF);
    border: none;
    color: white;
}
.filter-controls {
  display: flex;
  gap: 12px;
}

/* === Bảng dữ liệu === */
.contest-table {
  text-align: center;
}
.contest-name-link {
  color: #007ACC;
  font-weight: 600;
  cursor: pointer;
}
.contest-name-link:hover {
  color: #00AFFF;
}
:deep(.ant-table-cell) {
    text-align: center !important;
}
/* Thêm border và shadow cho table để nó nổi bật khi không còn card */
:deep(.ant-table-wrapper) {
  border-radius: 12px;
  border: 1px solid #D9E2EC;
  box-shadow: 0 4px 15px rgba(0, 90, 170, 0.08);
  overflow: hidden; /* Giúp bo tròn các góc của table */
}

/* === Modal và Form === */
.modal-form {
    padding-top: 12px;
}
.modal-tabs :deep(.ant-tabs-nav) {
    margin-bottom: 24px;
}
.form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0 24px;
}
.checkbox-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 10px;
}

:deep(.ant-form-item-label > label) {
    font-weight: 500;
    color: #33475B;
}
.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 24px;
    padding-top: 24px;
    border-top: 1px solid #f0f0f0;
}
.modal-footer .ant-btn-primary {
    background: linear-gradient(90deg, #007ACC, #00AFFF);
    border: none;
    color: white;
}


/* === RESPONSIVE === */
@media (max-width: 992px) {
  .action-bar {
    flex-direction: column;
    align-items: stretch;
  }
  .filter-controls {
    width: 100%;
  }
  .filter-controls .ant-select {
    width: 100% !important;
  }
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr; /* 1 cột trên màn hình nhỏ */
    gap: 0;
  }
  /* Chuyển tab sang dạng dọc trên mobile */
  .modal-tabs {
    display: flex; 
    flex-direction: column;
  }
  .modal-tabs :deep(.ant-tabs-nav) {
    width: 100%;
  }
  .modal-tabs :deep(.ant-tabs-content-holder) {
    width: 100%;
  }
}

</style>
