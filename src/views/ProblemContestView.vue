<script setup>
import { ref, onMounted, onUnmounted, computed, h } from 'vue';
import { usePagination } from 'vue-request';
import { useRouter } from 'vue-router';
import axios from "@/configs/axios.js";
import { message } from "ant-design-vue";
import { CheckCircleTwoTone, CloseCircleTwoTone, FieldTimeOutlined, UserOutlined, WarningOutlined } from "@ant-design/icons-vue";
import HeaderContest from '@/components/HeaderContest.vue';
import dayjs from "dayjs";

// --- STATE MANAGEMENT ---
const isLoading = ref(true);
const router = useRouter();
const problems = ref([]);
const countdown = ref('');
const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
let countdownInterval = null;

// --- PAGINATION LOGIC ---
const queryData = async () => {
  // Trả về danh sách bài tập đã được lọc hoặc toàn bộ
  return problems.value;
};

const { data: dataSource, run, loading, current, pageSize } = usePagination(queryData, {
  pagination: {
    currentKey: 'page',
    pageSizeKey: 'results',
    defaultPageSize: 50,
  },
});

const pagination = computed(() => ({
  total: problems.value.length,
  current: current.value,
  pageSize: pageSize.value,
}));

// --- API & DATA FETCHING ---
const fetchProblems = async () => {
  const contestId = sessionStorage.getItem('contest_id');
  if (!contestId) {
    message.error('Không tìm thấy kỳ thi. Vui lòng thử lại.');
    router.push('/');
    return;
  }

  isLoading.value = true;
  try {
    const response = await axios.get(`contests/${contestId}/question`);
    if (response.data.code === 200) {
      const listProblems = response.data.data.questions;
      
      problems.value = listProblems.map((problem, index) => ({
        index: index + 1,
        code: problem.code,
        id: problem.id,
        title: problem.name,
        is_solved: problem.is_ac,
        is_tried: problem.is_fail,
      }));

      // FIX: Chạy lại usePagination để cập nhật dataSource sau khi có dữ liệu
      run(); 

    }
  } catch (error) {
    message.error('Lỗi khi tải danh sách bài tập!');
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchProblems();
  updateCountdown();
  countdownInterval = setInterval(updateCountdown, 1000);
});

onUnmounted(() => {
  if (countdownInterval) clearInterval(countdownInterval);
});

const handleTableChange = (pag) => {
  run({
    results: pag.pageSize,
    page: pag?.current,
  });
};

// --- HELPER & NAVIGATION ---
const getCountdown = () => {
  const now = dayjs();
  const end = dayjs(sessionStorage.getItem('finish_time'));
  if (now.isAfter(end)) {
    clearInterval(countdownInterval);
    return 'Hết giờ';
  }
  const diff = Math.floor((end - now) / 1000);
  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;

  return `${days.toString().padStart(2, '0')}d:${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const updateCountdown = () => {
  countdown.value = getCountdown();
};

const navigateToProblem = (problemId) => {
  router.push(`/contest/problems/${problemId}`);
};
</script>

<template>
  <div class="page-container">
    <HeaderContest/>
    <div class="page-wrapper">
      <a-spin :spinning="isLoading">
        <div class="countdown-bar">
          <div class="user-info">
            <UserOutlined />
            <span>{{ currentUser.last_name }} {{ currentUser.first_name }} ({{ currentUser.username }})</span>
          </div>
          <div class="timer">
            <FieldTimeOutlined />
            <span>{{ countdown }}</span>
          </div>
        </div>
        
        <div class="contest-layout">
            <main class="main-content">
                <div class="content-card">
                  <div class="header-container">
                    <h2>Danh sách bài tập</h2>
                    <div class="underline"></div>
                  </div>
                  <a-table
                    :columns="[
                      { title: 'STT', dataIndex: 'index', key: 'index', width: 80, align: 'center' },
                      { title: 'Tiêu đề', dataIndex: 'title', key: 'name', customRender: ({ record }) => h('a', { class: 'problem-title-link', onClick: () => navigateToProblem(record.id) }, record.title.toUpperCase()) },
                      { title: 'Trạng thái', key: 'status', width: 120, align: 'center', customRender: ({ record }) => { if (record.is_solved) { return h(CheckCircleTwoTone, { twoToneColor: '#52c41a' }); } else if (record.is_tried) { return h(CloseCircleTwoTone, { twoToneColor: '#eb2f96' }); } return null; } }
                    ]"
                    :dataSource="dataSource"
                    :row-key="record => record.id"
                    :pagination="pagination"
                    @change="handleTableChange"
                    :scroll="{ x: 'max-content' }"
                    bordered
                  />
                </div>
            </main>
            <aside class="sidebar">
                <div class="card-style rules-card">
                    <h3><WarningOutlined /> LƯU Ý & QUY CHẾ</h3>
                    <div class="rules">
                        <h4>Lưu ý chung:</h4>
                        <ul>
                            <li>Trên Desktop có folder Mã SV_XXXX. Sinh viên lưu mã nguồn tại thư mục này.</li>
                            <li>Thoát tất cả các phần mềm không hợp lệ.</li>
                            <li>Quá trình thi sẽ được ghi hình toàn bộ.</li>
                        </ul>
                        <h4>Các trường hợp vi phạm quy chế:</h4>
                        <ul>
                            <li>Đóng phần mềm thi không rõ lý do.</li>
                            <li>Đăng nhập một tài khoản trên nhiều thiết bị.</li>
                            <li>Cài đặt thêm phần mềm không được phép.</li>
                            <li>Sử dụng code có sẵn hoặc tài liệu.</li>
                            <li>Trao đổi với người khác.</li>
                        </ul>
                    </div>
                </div>
            </aside>
        </div>
      </a-spin>
    </div>
  </div>
</template>

<style scoped>
/*
  CSS cho trang Danh sách bài tập trong kỳ thi - Chủ đề Neo-Futuristic Sáng
*/
.page-container {
  background-color: #F5F7FA;
  min-height: 100vh;
}
.page-wrapper {
  margin-top: 70px;
  padding: 24px;
}
.contest-layout {
    display: flex;
    gap: 24px;
    max-width: 1600px;
    margin: 0 auto;
    align-items: flex-start;
}
.main-content {
    width: 75%;
    flex-grow: 1;
}
.sidebar {
    width: 25%;
    min-width: 300px;
    flex-shrink: 0;
    position: sticky;
    top: 140px; /* Dính sau header và countdown bar */
}
.countdown-bar {
  position: sticky;
  top: 70px;
  z-index: 999;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #007acc;
  color: white;
  padding: 10px 24px;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(0, 122, 204, 0.3);
}
.user-info, .timer {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.1rem;
  font-weight: 600;
}
.timer {
  font-family: 'monospace';
  font-size: 1.3rem;
  letter-spacing: 1.5px;
}

.card-style {
  background-color: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 90, 170, 0.08);
  border: 1px solid #D9E2EC;
  padding: 24px;
}
.header-container { margin-bottom: 24px; }
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

.problem-title-link {
    font-weight: 600;
    color: #007ACC;
    cursor: pointer;
}
.problem-title-link:hover {
    color: #00AFFF;
    text-decoration: underline;
}

:deep(.ant-table) { border: 1px solid #E8EFF5; }
:deep(.ant-table-thead > tr > th) {
  background-color: #F0F5FA !important;
  color: #007ACC !important;
  font-weight: 600;
  text-align: center;
}
:deep(.ant-table-tbody > tr > td) {
  padding: 16px 10px;
  color: #33475B;
  border-bottom: 1px solid #E8EFF5;
}
:deep(.ant-table-tbody > tr:first-child > td) {
    border-top: 1px solid #E8EFF5;
}
:deep(.ant-table-tbody > tr.ant-table-row:hover > td) {
  background: rgba(0, 175, 255, 0.05) !important;
}

.rules-card h3 {
  font-size: 1.2rem;
  font-weight: 600;
  color: #d9363e;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #E8EFF5;
  display: flex;
  align-items: center;
  gap: 8px;
}
.rules h4 {
    font-size: 1rem;
    font-weight: 600;
    color: #007ACC;
    margin-top: 16px;
    margin-bottom: 8px;
}
.rules ul {
  padding-left: 20px;
  list-style-type: '✓';
  color: #5A738E;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.rules ul li { padding-left: 10px; }

@media (max-width: 992px) {
  .contest-layout { flex-direction: column; }
  .main-content, .sidebar { width: 100%; min-width: unset; }
  .sidebar { position: static; margin-top: 24px; }
}

@media (max-width: 576px) {
  .page-wrapper { padding: 15px; }
  h2 { font-size: 1.5rem; }
  .card-style { padding: 15px; }
  .countdown-bar { flex-direction: column; gap: 8px; font-size: 0.9rem; }
  .timer { font-size: 1.1rem; }
}
</style>
