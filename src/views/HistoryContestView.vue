<script setup>
import { ref, onMounted, onUnmounted, computed, watchEffect, createVNode } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "@/configs/axios.js";
import { message, Modal } from "ant-design-vue";
import { LoadingOutlined, ExclamationCircleOutlined, FieldTimeOutlined, UserOutlined } from "@ant-design/icons-vue";
import HeaderContest from '@/components/HeaderContest.vue';
import MonacoEditor from 'monaco-editor-vue3';
import dayjs from "dayjs";

// --- STATE MANAGEMENT ---
const isLoading = ref(true);
const router = useRouter();
const status = ref([]);
const countdown = ref('');
const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
let countdownInterval = null;

const isOpenCodeEditor = ref(false);
const currentSubmission = ref(null);
const submittedCode = ref('');

const editorOptions = {
  fontSize: 14,
  minimap: { enabled: false },
  automaticLayout: true,
  readOnly: true, // Make editor read-only by default
};

// --- DATA FETCHING ---
onMounted(async () => {
  const contest_id = sessionStorage.getItem('contest_id');
  const contest_start_time = sessionStorage.getItem('start_time');

  try {
    const response = await axios.get(`solutions?username=${currentUser.username}&contest_id=${contest_id}`);
    if (response.status === 200 && response.data?.code === 200) {
      const filteredStatusResponse = response.data.data.filter(sts => 
        new Date(sts.created_at) >= new Date(contest_start_time)
      );

      status.value = filteredStatusResponse.map(sts => {
        let runTime = sts.run_time ? `${sts.run_time.toFixed(2)}s` : '';
        let createdDate = dayjs(sts.created_at).format('DD/MM/YYYY HH:mm:ss');
        let username = `${sts.user.first_name} ${sts.user.last_name} (${sts.user.username})`;
        
        return {
          id: sts.id,
          date: createdDate,
          account: username,
          result: sts.result,
          problem: `${sts.question.code} - ${sts.question.name}`,
          time: runTime,
          memory: sts.memory ? `${sts.memory}Kb` : '',
          compiler: sts.compiler.code,
          code: sts.question.code,
        };
      });
    }
  } catch (error) {
    message.error('Lỗi khi tải lịch sử nộp bài!');
    console.error(error);
  } finally {
    isLoading.value = false;
  }

  // Start countdown
  updateCountdown();
  countdownInterval = setInterval(updateCountdown, 1000);
});

onUnmounted(() => {
  if (countdownInterval) clearInterval(countdownInterval);
});


// --- HELPER & EVENT HANDLERS ---
const getCountdown = () => {
  const now = dayjs();
  const end = dayjs(sessionStorage.getItem('finish_time'));

  if (now.isAfter(end)) {
    clearInterval(countdownInterval);
    return 'Hết giờ';
  }

  const diff = end.diff(now, 'second');
  const days = Math.floor(diff / (3600*24))
  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;

  return `${days.toString().padStart(2, '0')}:${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const updateCountdown = () => {
  countdown.value = getCountdown();
};

const navigateToProblem = code => {
  router.push(`/contest/problems/${code}`);
};

const showEditor = async (submissionId) => {
  if (!submissionId) {
    message.error('Không thể mở bài làm này!');
    return;
  }
  isLoading.value = true;
  try {
    const response = await axios.get(`contest/${submissionId}/history`);
    if (response.status === 200 && response.data?.code === 200) {
      submittedCode.value = response.data.data.source_code;
      currentSubmission.value = response.data.data;
      isOpenCodeEditor.value = true;
    } else {
      message.error('Không thể tải chi tiết bài làm!');
    }
  } catch (error) {
    message.error('Lỗi khi lấy lịch sử bài làm!');
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="page-container">
    <HeaderContest/>
    <a-spin :spinning="isLoading">
      <div class="page-wrapper">
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
        <div class="history-layout">
          <main class="main-content">
            <div class="header-container">
              <h2>Lịch sử nộp bài</h2>
              <div class="underline"></div>
            </div>
            <div class="card-style problem-container">
              <div class="table-container">
                <a-table
                  :row-key="genUuid"
                  :data-source="status"
                  :pagination="{ pageSize: 10, size: 'small' }"
                  :scroll="{ x: 'max-content' }"
                >
                  <a-table-column title="ID" data-index="id" :width="100">
                     <template #default="{ text }">
                       <a class="table-link" @click="showEditor(text)">{{ text }}</a>
                     </template>
                  </a-table-column>
                  <a-table-column title="Thời gian" data-index="date" :width="180" />
                  <a-table-column title="Kết quả" data-index="result" :width="100">
                     <template #default="{ record }">
                       <a @click="showEditor(record.id)" style="cursor:pointer">
                         <a-tag v-if="record.result === 'AC'" color="green">AC</a-tag>
                         <a-tag v-else-if="record.result === 'WA'" color="red">WA</a-tag>
                         <a-tag v-else-if="record.result === 'TLE'" color="orange">TLE</a-tag>
                         <a-tag v-else-if="record.result === 'RTE'" color="red">RTE</a-tag>
                         <a-tag v-else-if="record.result === 'CE'" color="purple">CE</a-tag>
                         <a-tag v-else-if="record.result === 'MLE'" color="red">MLE</a-tag>
                         <a-tag v-else-if="record.result === 'OLE'" color="red">OLE</a-tag>
                         <a-tag v-else-if="record.result === 'IR'" color="red">IR</a-tag>
                         <LoadingOutlined v-else-if="record.result === null"/>
                       </a>
                     </template>
                  </a-table-column>
                  <a-table-column title="Bài tập" data-index="problem">
                    <template #default="{ record }">
                       <a class="table-link" @click="navigateToProblem(record.code)">
                         {{ record.problem.toUpperCase() }}
                       </a>
                    </template>
                  </a-table-column>
                  <a-table-column title="Thời gian chạy" data-index="time" :width="120" />
                  <a-table-column title="Bộ nhớ" data-index="memory" :width="100" />
                  <a-table-column title="Ngôn ngữ" data-index="compiler" :width="120" />
                </a-table>
              </div>
            </div>
          </main>
          <aside class="sidebar">
            <div class="card-style legend-card">
              <h4>Chú giải kết quả</h4>
              <ul>
                <li><a-tag color="green">AC</a-tag> Accepted (Kết quả đúng)</li>
                <li><a-tag color="red">WA</a-tag> Wrong Answer (Kết quả sai)</li>
                <li><a-tag color="orange">TLE</a-tag> Time Limit Exceeded</li>
                <li><a-tag color="red">MLE</a-tag> Memory Limit Exceeded</li>
                <li><a-tag color="red">OLE</a-tag> Output Limit Exceeded</li>
                <li><a-tag color="red">RTE</a-tag> Runtime Error</li>
                <li><a-tag color="red">IR</a-tag> Invalid Return</li>
                <li><a-tag color="purple">CE</a-tag> Compile Error</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </a-spin>
    
    <a-modal class="code-modal" :open="isOpenCodeEditor" @update:open="isOpenCodeEditor = $event" width="80vw" :footer="null" centered>
        <template #title>
            <div class="modal-title">
                <span>{{ currentSubmission?.question?.code }} - {{ currentSubmission?.question?.name.toUpperCase() }}</span>
            </div>
        </template>
        <div v-if="currentSubmission" class="submission-details">
            <p><b>Thời gian nộp bài:</b> {{ dayjs(currentSubmission?.created_at).format('DD/MM/YYYY HH:mm:ss') }}</p>
            <p><b>Ngôn ngữ:</b> {{ currentSubmission?.compiler.name }}</p>
            <p><b>Kết quả:</b>
                <span v-if="currentSubmission?.result === 'AC'" style="color: #52c41a; font-weight: bold;">{{ currentSubmission?.result }}</span>
                <span v-else-if="['WA', 'TLE', 'MLE', 'OLE', 'RTE', 'IR', 'CE'].includes(currentSubmission?.result)" style="color: #d9363e; font-weight: bold;">{{ currentSubmission?.result }}</span>
                <span v-else-if="currentSubmission?.result === null"><LoadingOutlined/></span>
            </p>
        </div>
        <div class="editor-container">
            <MonacoEditor theme="vs-light" language="python" width="100%" height="60vh" :options="editorOptions" v-model:value="submittedCode" />
        </div>
        <div class="modal-footer">
            <a-button type="primary" @click="isOpenCodeEditor = false">Đóng</a-button>
        </div>
    </a-modal>
  </div>
</template>

<style scoped>
/*
  CSS cho trang Lịch sử trong kỳ thi - Chủ đề Neo-Futuristic Sáng
  Đã được thiết kế lại và responsive.
*/

.page-container {
  background-color: #F5F7FA;
  min-height: 100vh;
}
.page-wrapper {
  margin-top: 70px; /* Chiều cao Header */
  padding: 24px;
}

/* === Thanh đếm ngược === */
.countdown-bar {
  position: sticky;
  top: 70px; /* Dính ngay dưới Header */
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

/* === Bố cục chính === */
.history-layout {
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
  min-width: 280px;
  flex-shrink: 0;
  position: sticky;
  top: 140px; /* Vị trí dính sau header và countdown bar */
}

/* === Tiêu đề & Thẻ chung === */
.header-container {
  margin-bottom: 24px;
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
.card-style {
  background-color: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 90, 170, 0.08);
  border: 1px solid #D9E2EC;
  padding: 24px;
}
.table-container {
  overflow-x: auto; /* Luôn cho phép cuộn ngang */
}
.table-link {
    color: #007ACC;
    font-weight: 500;
}
.table-link:hover {
    color: #005C9E;
    text-decoration: underline;
}

/* === Sidebar Card === */
.legend-card h4 {
  font-size: 1.2rem;
  font-weight: 600;
  color: #007ACC;
  margin-bottom: 16px;
  border-bottom: 2px solid #E8EFF5;
  padding-bottom: 8px;
}
.legend-card ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.legend-card li {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.95rem;
}
.legend-card .ant-tag {
    min-width: 40px;
    text-align: center;
}

/* === Modal xem Code === */
.modal-title {
    font-size: 1.2rem;
    color: #007ACC;
    font-weight: 600;
}
.submission-details {
    display: flex;
    gap: 24px;
    flex-wrap: wrap;
    margin-bottom: 16px;
    padding: 12px;
    background-color: #f8f9fc;
    border-radius: 8px;
}
.submission-details p { margin: 0; }
.editor-container {
  border: 1px solid #d9e2ec;
  border-radius: 8px;
  overflow: hidden;
}
.modal-footer {
    display: flex;
    justify-content: flex-end;
    margin-top: 24px;
}
.modal-footer .ant-btn-primary {
    background: #007ACC;
}
.code-modal :deep(.ant-modal-body) {
    padding-top: 16px;
}

/* === RESPONSIVE === */
@media (max-width: 1200px) {
  .history-layout { flex-direction: column; }
  .main-content, .sidebar {
    width: 100%;
    min-width: unset;
  }
  .sidebar { position: static; }
}
@media (max-width: 576px) {
  .page-wrapper { padding: 15px; }
  h2 { font-size: 1.5rem; }
  .card-style { padding: 15px; }
  .countdown-bar { flex-direction: column; gap: 8px; font-size: 0.9rem; }
  .timer { font-size: 1.1rem; }
}
</style>
