<script setup>
import {ref, onBeforeMount, computed, watch, createVNode} from "vue";
import axios from "@/configs/axios.js";
import {message, Modal} from "ant-design-vue";
import {ExclamationCircleOutlined} from "@ant-design/icons-vue";
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
</script>

<template>
  <a-card title="Thực hành" style="width: 1200px; margin: auto">
    <div
        style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
      "
    >
      <a-button
          @click="showModal"
          style="
          margin-bottom: 16px;
          background-color: #a7453c;
          color: white;
          box-shadow: 0 2px 0 rgba(0, 0, 0, 0.02);
        "
      >
        Thêm mới
      </a-button>
      <a-button
          @click="handleExportFile(contestIDs)"
          style="
          margin-bottom: 16px;
          background-color: #a7453c;
          color: white;
          box-shadow: 0 2px 0 rgba(0, 0, 0, 0.02);
        "
      >Xuất bài thực hành
      </a-button
      >
    </div>
    <div class="courses" style="margin: 10px 0">
      <a-select v-model:value="selectedCourse" placeholder="Chọn môn học" style="width: 300px">
        <a-select-option
            v-for="subject in subjects"
            :key="subject.value"
            :value="subject.value"
        >
          {{ subject.label }}
        </a-select-option>
      </a-select>

    </div>
    <a-table
        :dataSource="listContests"
        :rowKey="(record) => record.id"
        bordered
    >
      <a-table-column key="checkbox" width="50px">
        <template #title>
          <a-checkbox
              :checked="
              contestIDs.length === listContests.length &&
              listContests.length > 0
            "
              :indeterminate="
              contestIDs.length > 0 && contestIDs.length < listContests.length
            "
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
      <a-table-column title="STT" dataIndex="index" key="index"/>
      <a-table-column title="Tên" dataIndex="name" key="name">
        <template #default="{ text, record }">
          <span style="color: red; font-weight: bold; cursor: pointer;" @click="goToContestRanking(record)">{{ text }}</span>
        </template>
      </a-table-column>
      <a-table-column title="Môn học" dataIndex="subject_id" key="subject_id"/>
      <a-table-column title="Lớp học" dataIndex="course_id" key="course_id"/>
      <a-table-column title="Bắt đầu" dataIndex="startTime" key="startTime"/>
      <a-table-column title="Kết thúc" dataIndex="endTime" key="endTime"/>
      <a-table-column title="Trạng thái" dataIndex="status" key="status">
        <template #default="{ text }">
          <a-tag :color="getStatusTag(text)">
            {{ getStatusText(text) }}
          </a-tag>
        </template>
      </a-table-column>
      <a-table-column title="Thao tác" key="action">
        <template #default="{ record }">
          <a-dropdown>
            <a-button>⋮</a-button>
            <template #overlay>
              <a-menu @click="({ key }) => handleAction(key, record)">
                <a-menu-item key="student">Sinh viên</a-menu-item>
                <a-menu-item key="exam_room">Phòng thi</a-menu-item>
                <a-menu-item v-if="record.icpc === 1 || record.ioi === 1" key="ranking">Bảng xếp hạng</a-menu-item>
                <a-menu-item key="teacher">Giảng viên</a-menu-item>
                <a-menu-item key="questions">Bài tập</a-menu-item>
                <a-menu-item key="activity">Hoạt động</a-menu-item>
                <a-menu-divider/>
                <a-menu-item key="edit" @click="showEditModal(record.id)">
                  Sửa
                  <a-modal
                      v-model:open="isModalEditVisible"
                      title="Sửa bài thực hành"
                      @ok="handleUpdateContest(record.id)"
                      @cancel="handleEditCancel"
                      style="width: 1000px"
                  >
                    <div class="form-content">
                      <!-- Cột 1 -->
                      <div class="form-column">
                        <a-form-item label="Tên">
                          <a-input v-model:value="contestDetails.name"/>
                        </a-form-item>
                        <a-form-item label="Địa điểm">
                          <a-input v-model:value="contestDetails.address"/>
                        </a-form-item>
                        <a-form-item label="Môn Học">
                          <a-select v-model:value="selectedCourse">
                            <a-select-option
                                v-for="subject in subjects"
                                :key="subject.value"
                                :value="subject.value"
                            >
                              {{ subject.label }}
                            </a-select-option>
                          </a-select>
                        </a-form-item>
                        <a-form-item label="Học kỳ">
                          <a-select v-model:value="contestDetails.semester">
                            <a-select-option
                                v-for="semester in semesters"
                                :key="semester.value"
                                :value="semester.value"
                            >
                              {{ semester.label }}
                            </a-select-option>
                          </a-select>
                        </a-form-item>
                        <a-form-item label="Nhóm">
                          <a-select v-model:value="contestDetails.course">
                            <a-select-option
                                v-for="course in courses"
                                :key="course.value"
                                :value="course.value"
                            >
                              {{ course.label }}
                            </a-select-option>
                          </a-select>
                        </a-form-item>
                        <a-form-item label="Thời gian bắt đầu">
                          <a-date-picker
                              v-model:value="contestDetails.start_time"
                              show-time
                              format="YYYY-MM-DD HH:mm:ss"
                              placeholder="Chọn thời gian bắt đầu"
                          />
                        </a-form-item>
                        <a-form-item label="Thời gian kết thúc">
                          <a-date-picker
                              v-model:value="contestDetails.end_time"
                              show-time
                              format="YYYY-MM-DD HH:mm:ss"
                              placeholder="Chọn thời gian kết thúc"
                          />
                        </a-form-item>
                        <a-form-item label="Thời gian dừng xếp hạng">
                          <a-date-picker
                              v-model:value="contestDetails.ranking_stop_time"
                              show-time
                              format="YYYY-MM-DD HH:mm:ss"
                              placeholder="Chọn thời gian dừng xếp hạng"
                          />
                        </a-form-item>
                      </div>

                      <!-- Cột 2 -->
                      <div class="form-column">
                        <a-form-item label="Bài thực hành số">
                          <a-input-number
                              v-model:value="contestDetails.ordinal"
                              :min="1"
                          />
                        </a-form-item>
                        <a-form-item label="Trạng thái">
                          <a-radio-group v-model:value="contestDetails.status">
                            <a-radio value="1">Hoạt động</a-radio>
                            <a-radio value="0">Không hoạt động</a-radio>
                          </a-radio-group>
                        </a-form-item>
                        <a-form-item label="Tùy chọn">
                          <div class="checkbox-group">
                            <a-checkbox v-model:checked="frozenTimeChecked"
                            >Đóng băng bài thi
                            </a-checkbox
                            >
                            <a-checkbox v-model:checked="allowBrowserChecked"
                            >Cho phép trình duyệt
                            </a-checkbox
                            >
                            <a-checkbox
                              v-model:checked="ioiChecked"
                            >
                              Chế độ IOI
                            </a-checkbox>

                            <a-checkbox
                              v-model:checked="icpcChecked"
                            >
                              Chế độ ICPC
                            </a-checkbox>
                            <a-checkbox v-model:checked="displayDetailChecked"
                            >Ẩn câu hỏi
                            </a-checkbox
                            >
                            <a-checkbox v-model:checked="publicRankingChecked"
                            >Công khai bảng xếp hạng
                            </a-checkbox
                            >
                          </div>
                        </a-form-item>
                        <a-form-item label="Thời gian phạt">
                          <a-input-number
                              v-model:value="contestDetails.penalty_time"
                              :min="20"
                          />
                        </a-form-item>
                        <a-form-item label="Thời gian đóng băng">
                          <a-input-number
                              v-model:value="contestDetails.frozen_time"
                              :min="30"
                          />
                        </a-form-item>
                        <a-form-item label="Loại nộp bài">
                          <a-radio-group
                              v-model:value="contestDetails.submit_type"
                          >
                            <a-radio value="1">Tải lên</a-radio>
                            <a-radio value="2">Chấm thủ công</a-radio>
                          </a-radio-group>
                        </a-form-item>
                      </div>
                    </div>
                  </a-modal>
                </a-menu-item>
                <a-menu-item key="delete" @click="confirmDelete(record.id)"
                >Xóa
                </a-menu-item
                >
              </a-menu>
            </template>
          </a-dropdown>
        </template>
      </a-table-column>
    </a-table>
  </a-card>

  <!-- Modal -->
  <a-modal
      v-model:open="isModalVisible"
      title="Thêm mới kỳ thi"
      @ok="handleOk"
      @cancel="handleCancel"
      style="width: 1000px"
  >
    <div class="form-content">
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
            <a-select-option
                v-for="subject in subjects"
                :key="subject.value"
                :value="subject.value"
            >
              {{ subject.label }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="Học kỳ">
          <a-select v-model:value="createContestDTO.semester">
            <a-select-option
                v-for="semester in semesters"
                :key="semester.value"
                :value="semester.value"
            >
              {{ semester.label }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="Nhóm">
          <a-select v-model:value="createContestDTO.course">
            <a-select-option
                v-for="course in courses"
                :key="course.value"
                :value="course.value"
            >
              {{ course.label }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="Thời gian bắt đầu">
          <a-date-picker
              v-model:value="createContestDTO.start_time"
              show-time
              format="YYYY-MM-DD HH:mm:ss"
              placeholder="Chọn thời gian bắt đầu"
          />
        </a-form-item>
        <a-form-item label="Thời gian kết thúc">
          <a-date-picker
              v-model:value="createContestDTO.end_time"
              show-time
              format="YYYY-MM-DD HH:mm:ss"
              placeholder="Chọn thời gian kết thúc"
          />
        </a-form-item>
        <a-form-item label="Thời gian dừng xếp hạng">
          <a-date-picker
              v-model:value="createContestDTO.ranking_stop_time"
              show-time
              format="YYYY-MM-DD HH:mm:ss"
              placeholder="Chọn thời gian dừng xếp hạng"
          />
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
        <a-form-item label="Tùy chọn">
          <div class="checkbox-group">
            <a-checkbox v-model:checked="createContestDTO.frozen_time"
            >Đóng băng bài thi
            </a-checkbox
            >
            <a-checkbox v-model:checked="createContestDTO.allow_browser"
            >Cho phép trình duyệt
            </a-checkbox
            >
            <a-checkbox v-model:checked="createContestDTO.ioi"
            >Chế độ IOI
            </a-checkbox
            >
            <a-checkbox v-model:checked="createContestDTO.icpc"
            >Chế độ ICPC
            </a-checkbox
            >
            <a-checkbox v-model:checked="createContestDTO.display_detail"
            >Ẩn câu hỏi
            </a-checkbox
            >
            <a-checkbox v-model:checked="createContestDTO.public_ranking"
            >Công khai bảng xếp hạng
            </a-checkbox
            >
          </div>
        </a-form-item>
        <a-form-item label="Thời gian phạt">
          <a-input-number
              v-model:value="createContestDTO.penalty_time"
              :min="20"
          />
        </a-form-item>
        <a-form-item label="Thời gian đóng băng">
          <a-input-number
              v-model:value="createContestDTO.frozen_time"
              :min="30"
          />
        </a-form-item>
        <a-form-item label="Loại nộp bài">
          <a-radio-group v-model:value="createContestDTO.submit_type">
            <a-radio value="1">Tải lên</a-radio>
            <a-radio value="2">Chấm thủ công</a-radio>
          </a-radio-group>
        </a-form-item>
      </div>
    </div>
  </a-modal>
</template>

<style scoped>
/* Container tổng thể của form */
.form-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  max-width: 1200px;
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
  background-color: #a7453c;
  color: white;
  font-weight: bold;
  border: none;
  padding: 12px 20px;
  border-radius: 6px;
}

a-button:hover {
  background-color: #a7453c;
  transform: scale(1.02);
}

/* Khoảng cách giữa các mục */
a-form-item {
  margin-bottom: 15px !important;
}

.form-content {
  display: flex;
  gap: 20px;
}

.form-column {
  width: 50%;
}
</style>
