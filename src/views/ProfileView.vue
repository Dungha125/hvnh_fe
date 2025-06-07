<script setup>
import Header from '../components/Header.vue';
import {
  SolutionOutlined,
  ReadOutlined,
  MailOutlined,
  CalendarOutlined,
  WomanOutlined,
  ManOutlined,
  MessageOutlined,
  HomeOutlined,
  HistoryOutlined,
  BarsOutlined, LoadingOutlined
} from "@ant-design/icons-vue";
import {ref, onMounted, onUnmounted, h, reactive, computed} from "vue";
import axios from "@/configs/axios.js";
import {usePagination} from "vue-request";
import {useRouter} from "vue-router";
import AdminHeader from "@/components/AdminHeader.vue";
import MonacoEditor from 'monaco-editor-vue3';
import {message} from "ant-design-vue";
import LecturerHeader from "@/components/LecturerHeader.vue";

const router = useRouter();
const isLoading = ref(false);
const infoContainerRef = ref(null);
const avatarSize = ref(128);
const currentTab = ref(['general']);
const items = ref([
  {
    key: 'general',
    icon: () => h(BarsOutlined),
    label: 'Tổng quan',
    title: 'Tổng quan',
  },
  {
    key: 'history',
    icon: () => h(HistoryOutlined),
    label: 'Lịch sử',
    title: 'Lịch sử',
  }]);

const courses = reactive([]);
const status = reactive([]);
const currentUser = ref(JSON.parse(localStorage.getItem('user')) || {});
console.log(currentUser.value);
const isOpenCodeEditor = ref(false);
const currentSubmission = ref(null);
const submittedCode = ref('');

const editorOptions = {
  fontSize: 14,
  minimap: {enabled: false},
  automaticLayout: true,
};

const showEditor = async (id) => {
  if (id === null) {
    message.error('Không thể mở bài làm này!');
    return;
  }

  isLoading.value = true;
  const response = await axios.get(`solutions/${id}`);
  if (response.status === 200) {
    if (response.data.code === 200) {
      submittedCode.value = response.data.data.source_code;
      currentSubmission.value = response.data.data;
      isOpenCodeEditor.value = true;
    } else {
      message.error('Không thể mở bài làm này!');
    }
  } else {
    message.error('Không thể mở bài làm này!');
  }
  isLoading.value = false;
}

const getAvatarName = (fullName) => {
  return fullName
      .split(' ')
      .map((name) => name.charAt(0).toUpperCase())
      .join('');
};

const calculateAvatarSize = () => {
  if (infoContainerRef.value) {
    avatarSize.value = 0.5 * infoContainerRef.value.offsetWidth;
  }
};

onMounted(async () => {
  calculateAvatarSize();
  window.addEventListener("resize", calculateAvatarSize);

  isLoading.value = true;

  try {
    const response = await axios.get('courses/studying');
    const data = response.data.data;
    let stt = 1;
    data.forEach(course => {
      courses.push({
        stt: stt++,
        id: course.id,
        group: course.name,
        subject: course.subject.name,
        semester: course.semester.name,
        status: course.status,
      });
    });
  } catch (error) {
    console.error(error);
  }

  try {
    const currentUser = localStorage.getItem('username');

    await axios.get('solutions?username=' + currentUser).then(response => {
      if (response.status === 200) {
        isLoading.value = false;
        const statusResponse = response.data.data;
        statusResponse.forEach(sts => {
          let runTime = sts.run_time;
          if (runTime)
            runTime = runTime?.toFixed(2);

          let createdDate = new Date(sts.created_at);

          const month = createdDate.getMonth() + 1;

          sts.created_at = (createdDate.getDate() > 9 ? createdDate.getDate() : '0' + createdDate.getDate()) + '/' + (month > 9 ? month : '0' + month) + '/' + createdDate.getFullYear();

          let username = sts.user.username + ' - ' + sts.user.first_name + ' ' + sts.user.last_name;

          status.push({
            id: sts.id,
            date: sts.created_at,
            account: username,
            result: sts.result,
            problem: sts.question.code + ' - ' + sts.question.name,
            time: runTime ? runTime + 's' : '',
            memory: sts.memory ? sts.memory + 'Kb' : '',
            compiler: sts.compiler.code,
            code: sts.question.code,
          });
        });
      }
    });
  } catch (error) {
    console.error(error);
  }

  isLoading.value = false;
});

onUnmounted(() => {
  window.removeEventListener("resize", calculateAvatarSize);
});

const queryData = async params => {
  return courses;
};

const queryDataHistory = async params => {
  return status;
};

const {
  data: dataSourceHistory
} = usePagination(queryDataHistory, {
  formatResult: res => {
    return Array.isArray(res) ? res : [];
  },
  pagination: {
    currentKey: 'page',
    pageSizeKey: 'status',
  },
});

const {data: dataSource, run, loading, current, pageSize} = usePagination(queryData, {
  formatResult: res => {
    return Array.isArray(res) ? res : [];
  },
  pagination: {
    currentKey: 'page',
    pageSizeKey: 'status',
  },
});

const pagination = computed(() => ({
  total: queryData().length,
  current: current.value,
  pageSize: pageSize.value,
}));

const genUuid = () => {
  return Math.random().toString(36).substring(7);
};

const handleTableChange = (pag, filters, sorter) => {
  run({
    results: pag.pageSize,
    page: pag?.current,
    sortField: sorter.field,
    sortOrder: sorter.order,
    ...filters,
  });
};

const navigateToProblem = code => {
  router.push(`/problems/${code}`);
};
</script>

<template>
    <Header v-if="currentUser && currentUser.member_group === 1"/>
    <LecturerHeader v-else-if="currentUser && currentUser.member_group === 2"/>
    <AdminHeader v-else/>
  <div class="profile-page">
    
    <a-spin :spinning="isLoading">
      <div class="page-wrapper">
        <div class="body-header">
          <h2>Hồ sơ người dùng</h2>
          <div class="underline"></div>
        </div>

        <div class="profile-layout">
          <!-- Cột thông tin bên trái -->
          <aside class="profile-sidebar">
            <div class="info-card">
              <div class="avatar-section">
                <a-avatar
                    :size="120"
                    class="profile-avatar"
                    :src="currentUser.profile_picture ?? `https://ui-avatars.com/api/?name=${getAvatarName(currentUser.last_name + ' ' + currentUser.first_name)}&background=007ACC&color=FFFFFF`"
                    alt="Avatar"
                />
                <p class="user-name">{{ currentUser.last_name + ' ' + currentUser.first_name }}</p>
              </div>

              <a-button type="primary" block @click="router.push('profile/edit')">
                Chỉnh sửa hồ sơ
              </a-button>

              <div class="detail-list">
                <p class="detail-item"><SolutionOutlined/><span>Tài khoản:</span> {{ currentUser.username }}</p>
                <p class="detail-item"><ReadOutlined/><span>Lớp:</span> {{ currentUser.class }}</p>
                <p class="detail-item"><MailOutlined/><span>Email:</span> {{ currentUser.email }}</p>
                <p class="detail-item"><CalendarOutlined/><span>Ngày sinh:</span> {{ currentUser.birthday }}</p>
                <p class="detail-item">
                  <WomanOutlined v-if="currentUser.gender === 1"/><ManOutlined v-else/>
                  <span>Giới tính:</span> {{ currentUser.gender === 0 ? 'Nam' : currentUser.gender === 1 ? 'Nữ' : '' }}
                </p>
                <p class="detail-item"><HomeOutlined/><span>Địa chỉ:</span> {{ currentUser.address }}</p>
                <p class="detail-item"><MessageOutlined/><span>Giới thiệu:</span> {{ currentUser.about }}</p>
              </div>
            </div>
          </aside>

          <!-- Cột nội dung bên phải -->
          <main class="profile-main-content">
            <div class="content-card">
              <a-menu class="profile-tabs" v-model:selectedKeys="currentTab" mode="horizontal" :items="items"/>

              <div class="tab-content general-container" v-if="currentTab[0] === 'general'">
                <p class="tab-title">Danh sách lớp học đã tham gia:</p>
                <a-table
                    :row-key="genUuid"
                    :data-source="dataSource"
                    :pagination="pagination"
                    :loading="loading"
                    @change="handleTableChange"
                    :scroll="{ x: 'max-content' }"
                >
                  <a-table-column title="STT" data-index="stt" width="8%" />
                  <a-table-column title="Môn học" data-index="subject" />
                  <a-table-column title="Nhóm" data-index="group" width="20%" />
                  <a-table-column title="Học kỳ" data-index="semester" />
                  <a-table-column title="Trạng thái" data-index="status" width="15%">
                    <template #default="{ text }">
                      <a-tag :color="text === 1 ? 'green' : 'red'">
                        {{ text === 1 ? 'Hoạt động' : 'Không hoạt động' }}
                      </a-tag>
                    </template>
                  </a-table-column>
                </a-table>
              </div>

              <div class="tab-content history-container" v-if="currentTab[0] === 'history'">
                <p class="tab-title">Danh sách bài nộp:</p>
                <a-table
                    :row-key="genUuid"
                    :data-source="dataSourceHistory"
                    :pagination="pagination"
                    :loading="loading"
                    @change="handleTableChange"
                    :scroll="{ x: 'max-content' }"
                >
                  <a-table-column title="ID" data-index="id" width="12%">
                    <template #default="{ text }">
                      <a class="table-link" @click="showEditor(text)">{{ text }}</a>
                    </template>
                  </a-table-column>
                  <a-table-column title="Thời gian" data-index="date" width="12%" />
                  <a-table-column title="Kết quả" data-index="result" width="8%">
                     <template #default="{ record }">
                       <a @click="showEditor(record.id)">
                          <a-tag v-if="record.result === 'AC'" color="green">AC</a-tag>
                          <a-tag v-else-if="record.result === 'WA'" color="red">WA</a-tag>
                          <a-tag v-else-if="record.result === 'TLE'" color="orange">TLE</a-tag>
                          <a-tag v-else-if="record.result === 'RTE'" color="red">RTE</a-tag>
                          <a-tag v-else-if="record.result === 'CE'" color="purple">CE</a-tag>
                          <a-tag v-else-if="record.result === 'MLE'" color="red">MLE</a-tag>
                          <a-tag v-else-if="record.result === 'OLE'" color="red">OLE</a-tag>
                          <a-tag v-else-if="record.result === 'IR'" color="red">IR</a-tag>
                          <p v-else-if="record.result === null"><LoadingOutlined/></p>
                       </a>
                     </template>
                  </a-table-column>
                  <a-table-column title="Bài tập" data-index="problem" width="20%">
                     <template #default="{ record }">
                       <a class="table-link" @click="navigateToProblem(record.code)">{{ record.problem }}</a>
                     </template>
                  </a-table-column>
                  <a-table-column title="Thời gian" data-index="time" width="10%" />
                  <a-table-column title="Bộ nhớ" data-index="memory" width="10%" />
                  <a-table-column title="Trình biên dịch" data-index="compiler" width="10%" />
                </a-table>
              </div>
            </div>
          </main>
        </div>
      </div>
    </a-spin>

    <a-modal style="top: 20px" v-model:open="isOpenCodeEditor" width="1000px" :title="currentSubmission?.question?.code + ' - ' + currentSubmission?.question?.name.toUpperCase()">
      <div v-if="currentSubmission" class="submission-details">
        <p><b>Thời gian nộp bài:</b> {{ currentSubmission?.created_at }}</p>
        <p><b>Ngôn ngữ:</b> {{ currentSubmission?.compiler.name }}</p>
        <p><b>Kết quả:</b>
          <span v-if="currentSubmission?.result === 'AC'" style="color: #52c41a">AC</span>
          <span v-else-if="['WA', 'TLE', 'MLE', 'OLE', 'RTE', 'IR', 'CE'].includes(currentSubmission?.result)" style="color: #d9363e">{{ currentSubmission?.result }}</span>
          <span v-else-if="currentSubmission?.result === null"><LoadingOutlined/></span>
        </p>
      </div>
      <div class="editor-container">
        <MonacoEditor theme="vs-light" language="python" :width="900" :height="700" :options="editorOptions" v-model:value="submittedCode" />
      </div>
      <template #footer>
        <a-button type="primary" @click="isOpenCodeEditor = false">Đóng</a-button>
      </template>
    </a-modal>
  </div>
</template>

<style scoped>
/*
  CSS cho Trang Hồ sơ người dùng - Chủ đề Neo-Futuristic Sáng
  Đã bao gồm các điều chỉnh để responsive trên di động.
*/

.profile-page {
  background-color: #F5F7FA;
  min-height: 100vh;
}

.page-wrapper {
  margin-top: 90px;
  padding: 24px;
}

/* === Phần Tiêu đề === */
.body-header {
  max-width: 1400px; /* Giới hạn chiều rộng */
  margin: 0 auto 24px auto; /* Căn giữa */
}

h2 {
  font-size: 1.8rem;
  font-weight: 700;
  color: #007ACC;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.underline {
  width: 100%;
  height: 3px;
  margin-top: 8px;
  background: linear-gradient(90deg, #00AFFF, #B3E5FC);
  border-radius: 2px;
}

/* === Bố cục chính === */
.profile-layout {
  display: flex;
  gap: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.profile-sidebar {
  width: 25%;
  min-width: 280px;
  flex-shrink: 0; /* Không cho co lại */
}

.profile-main-content {
  flex-grow: 1; /* Chiếm hết không gian còn lại */
}

/* === Thẻ thông tin bên trái === */
.info-card {
  display: flex;
  flex-direction: column;
  background-color: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 90, 170, 0.08);
  border: 1px solid #D9E2EC;
  padding: 24px;
  height: 100%;
}
.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}
.profile-avatar {
  border: 3px solid #00AFFF;
  box-shadow: 0 4px 10px rgba(0, 175, 255, 0.3);
  margin-bottom: 15px;
}
.user-name {
  margin-top: 10px;
  font-weight: bold;
  font-size: 1.3rem;
  color: #1A2B3C;
}
.info-card .ant-btn-primary {
  background: linear-gradient(90deg, #007ACC, #00AFFF);
  border: none;
  font-weight: 600;
  margin: 0 0 20px 0;
}
.detail-list {
  font-size: 1em;
  border-top: 1px solid #E8EFF5;
  padding-top: 20px;
}
.detail-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  color: #33475B;
}
.detail-item .anticon {
  color: #00AFFF;
  font-size: 1.2em;
}
.detail-item span {
  font-weight: 600;
  color: #1A2B3C;
}

/* === Khung nội dung bên phải === */
.content-card {
  display: flex;
  flex-direction: column;
  background-color: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 90, 170, 0.08);
  border: 1px solid #D9E2EC;
  padding: 24px;
  min-height: 768px; /* Giữ lại min-height */
}

.profile-tabs {
  font-size: 1.1em;
  border-bottom: 2px solid #E8EFF5;
  margin-bottom: 20px;
}
.tab-content {
  margin-top: 10px;
}
.tab-title {
  margin-top: 10px;
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 15px;
  color: #006BB3;
}
.table-link {
  color: #007ACC;
  font-weight: 500;
}
.table-link:hover {
  color: #005C9E;
}

/* Modal and Editor */
.submission-details p {
  margin-bottom: 8px;
}
.editor-container {
  border: 1px solid #d9e2ec;
  border-radius: 8px;
  overflow: hidden;
  margin-top: 16px;
}

/* === RESPONSIVE === */
@media (max-width: 992px) {
  .profile-layout {
    flex-direction: column; /* Xếp chồng các cột */
  }
  .profile-sidebar, .profile-main-content {
    width: 100%;
    min-width: unset;
  }
}

@media (max-width: 576px) {
  .page-wrapper {
    padding: 15px;
  }
  h2 { font-size: 1.5rem; }
  .info-card, .content-card {
    padding: 15px;
  }
  .profile-tabs {
    font-size: 1em;
  }
}
</style>
