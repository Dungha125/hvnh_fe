<script setup>
import { computed, onBeforeMount, onBeforeUnmount, reactive, ref } from 'vue';
import axios from "@/configs/axios.js";
import { LoadingOutlined } from "@ant-design/icons-vue";
import AdminHeader from "@/components/AdminHeader.vue";
import { useRouter } from "vue-router";
import { message } from "ant-design-vue";
import dayjs from "dayjs";
import MonacoEditor from 'monaco-editor-vue3';

// --- STATE MANAGEMENT ---
const isLoading = ref(true);
const status = reactive([]);
let intervalId = null;
const router = useRouter();

// --- MODAL & EDITOR STATE ---
const isOpenCodeEditor = ref(false);
const currentSubmission = ref(null);
const submittedCode = ref('');
const editorOptions = {
  fontSize: 14,
  minimap: { enabled: false },
  automaticLayout: true,
  readOnly: true,
};

const pagination = reactive({
  current: 1,
  pageSize: 50,
  total: 0,
  showSizeChanger: true,
  pageSizeOptions: ['10', '20', '50', '100'],
});

// --- DATA FETCHING & LIFECYCLE ---
onBeforeMount(async () => {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  if ((currentUser && currentUser.member_group === 1) || !currentUser.id) {
    router.push('/not-found');
    return;
  }
  await fetchSolution();
  intervalId = setInterval(fetchSolution, 3000);
});

onBeforeUnmount(() => {
  if (intervalId) {
    clearInterval(intervalId);
  }
});

const fetchSolution = async () => {
  try {
    const response = await axios.get('solutions', {
      params: {
        page: pagination.current,
        per_page: pagination.pageSize
      }
    });
    
    if (response.status === 200) {
      const statusResponse = response.data.data; // Adjusted to get the array
      const tempStatus = [];
      
      statusResponse.forEach(sts => {
        let runTime = sts.run_time ? `${sts.run_time.toFixed(2)}s` : '';
        let createdDate = dayjs(sts.created_at).format('DD/MM/YYYY HH:mm:ss');
        let username = `${sts.user.last_name} ${sts.user.first_name} (${sts.user.username})`;

        tempStatus.push({
          id: sts.id,
          date: createdDate,
          account: username,
          result: sts.result,
          problem: `${sts.question.code} - ${sts.question.name}`,
          question_id: sts.question.id,
          code: sts.question.code,
          // Store extra data needed for the modal
          question: sts.question,
          compiler_full: sts.compiler,
          user_full: sts.user,
          created_at_raw: sts.created_at,
          compiler: sts.compiler.code,
        });
      });

      status.splice(0, status.length, ...tempStatus);
      pagination.total = response.data.data.total;
    }
  } catch (error) {
    console.log(error);
  } finally {
    isLoading.value = false;
  }
};

// --- EVENT HANDLERS ---
const handleTableChange = (pag) => {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchSolution();
};

const navigateToProblem = (questionId) => {
  if (!questionId) {
    message.error("Không có ID bài tập.");
    return;
  }
  router.push(`/admin/problems/${questionId}`);
};

const showEditor = async (submission) => {
    if (!submission || !submission.id) {
        message.error('Không thể mở bài làm này!');
        return;
    }
    isLoading.value = true;
    try {
        const response = await axios.get(`solutions/${submission.id}`);
        if (response.status === 200 && response.data?.code === 200) {
            submittedCode.value = response.data.data.source_code;
            // Use the full submission object passed from the table row
            currentSubmission.value = submission; 
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

const antDesignTheme = {
  token: {
    colorPrimary: '#00AFFF',
    colorLink: '#007ACC',
  }
};
</script>


<template>
  <div class="page-container">
    <AdminHeader/>
    <a-config-provider :theme="antDesignTheme">
      <a-spin :spinning="isLoading">
        <div class="page-wrapper">
          <div class="status-layout">
            <main class="main-content">
              <div class="header-container">
                <h2>Trạng thái giải bài</h2>
                <div class="underline"></div>
              </div>
              <div class="card-style problem-container">
                <div class="table-container">
                  <a-table
                    :row-key="record => record.id"
                    :data-source="status"
                    :pagination="pagination"
                    :loading="isLoading"
                    @change="handleTableChange"
                    :scroll="{ x: 'max-content' }"
                  >
                    <a-table-column title="ID" data-index="id" :width="80" fixed="left">
                      <template #default="{ text, record }">
                        <a class="table-link" @click="showEditor(record)">{{ text }}</a>
                      </template>
                    </a-table-column>
                    <a-table-column title="Thời gian" data-index="date" :width="180" />
                    <a-table-column title="Tài khoản" data-index="account" :width="200" />
                    <a-table-column title="Kết quả" data-index="result" :width="100" align="center">
                      <template #default="{ text, record }">
                        <a @click="showEditor(record)" style="cursor:pointer">
                          <a-tag v-if="text === 'AC'" color="green">AC</a-tag>
                          <a-tag v-else-if="text === 'WA'" color="red">WA</a-tag>
                          <a-tag v-else-if="text === 'TLE'" color="orange">TLE</a-tag>
                          <a-tag v-else-if="text === 'RTE'" color="red">RTE</a-tag>
                          <a-tag v-else-if="text === 'CE'" color="purple">CE</a-tag>
                          <a-tag v-else-if="text === 'MLE'" color="red">MLE</a-tag>
                          <a-tag v-else-if="text === 'OLE'" color="red">OLE</a-tag>
                          <a-tag v-else-if="text === 'IR'" color="red">IR</a-tag>
                          <LoadingOutlined v-else-if="text === null" />
                        </a>
                      </template>
                    </a-table-column>
                    <a-table-column title="Bài tập" data-index="problem" :min-width="200">
                       <template #default="{ record }">
                         <a class="table-link" @click="navigateToProblem(record.question_id)">
                           {{ record.problem }}
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
            <p><b>ID: </b> {{ currentSubmission?.id }} </p>
            <p><b>Người nộp bài: </b>{{ currentSubmission?.user_full.last_name }} {{ currentSubmission?.user_full.first_name }}</p>
            <p><b>Thời gian nộp bài:</b> {{ dayjs(currentSubmission?.created_at_raw).format('DD/MM/YYYY HH:mm:ss') }}</p>
            <p><b>Ngôn ngữ:</b> {{ currentSubmission?.compiler_full.name }}</p>
            <p><b>Kết quả: </b>
                <span v-if="currentSubmission?.result === 'AC'" style="color: #52c41a; font-weight: bold;">{{ currentSubmission?.result }}</span>
                <span v-else-if="['WA', 'TLE', 'MLE', 'OLE', 'RTE', 'IR', 'CE'].includes(currentSubmission?.result)" style="color: #d9363e; font-weight: bold;">{{ currentSubmission?.result }}</span>
                <span v-else-if="currentSubmission?.result === null"><LoadingOutlined/></span>
            </p>
        </div>
        <div class="editor-container">
            <MonacoEditor theme="vs-light" language="python" width="100%" height="100%" :options="editorOptions" v-model:value="submittedCode" />
        </div>
        <div class="modal-footer">
            <a-button type="primary" @click="isOpenCodeEditor = false">Đóng</a-button>
        </div>
    </a-modal>
    </a-config-provider>
  </div>
</template>

<style scoped>
/*
  CSS cho trang Trạng thái của Admin - Chủ đề Neo-Futuristic Sáng
*/
.page-container {
  background-color: #F5F7FA;
  min-height: 100vh;
}
.page-wrapper {
  margin-top: 70px;
  padding: 24px;
}
.status-layout {
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
  top: 94px;
}
.header-container {
  margin-bottom: 24px;
}
h2 {
  font-size: 1.8rem;
  font-weight: 700;
  color: #007ACC;
  text-transform: uppercase;
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
    overflow-x: auto;
}
.table-link {
    color: #007ACC;
    font-weight: 500;
    cursor: pointer;
}
.table-link:hover {
    color: #00AFFF;
    text-decoration: underline;
}
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
  height: 60vh;
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
@media (max-width: 1200px) {
  .status-layout {
    flex-direction: column;
  }
  .main-content, .sidebar {
    width: 100%;
    min-width: unset;
  }
  .sidebar {
    position: static;
  }
}
@media (max-width: 576px) {
  .page-wrapper { padding: 15px; }
  h2 { font-size: 1.5rem; }
  .card-style { padding: 15px; }
}
</style>
