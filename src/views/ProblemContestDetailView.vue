<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from "@/configs/axios.js";
import { message } from "ant-design-vue";
import {
  UploadOutlined,
  LoadingOutlined,
  FieldTimeOutlined, UserOutlined,
} from '@ant-design/icons-vue';
import HeaderContest from '@/components/HeaderContest.vue';
import MonacoEditor from 'monaco-editor-vue3';

//--- Core Setup ---//
const route = useRoute();
const router = useRouter();
const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

//--- Component State ---//
const isLoading = ref(true);
const countdown = ref('');
const questionDetail = ref(null);
const compilers = ref([]);

//--- Submission & Polling State ---//
const fileList = ref([]);
const uploading = ref(false);
const chosenCompiler = ref();
const result = ref(null); // Trạng thái bài nộp gần nhất
const currentUserSubmissions = ref([]);
const isHistoryLoading = ref(false);

//--- Modal & Editor State ---//
const isOpenCodeEditor = ref(false);
const submittedCode = ref('');
const selectedSubmission = ref(null);

//--- Timer IDs for Cleanup ---//
let pollTimeoutId = null;
let countdownIntervalId = null;

const editorOptions = {
  fontSize: 14,
  minimap: { enabled: false },
  automaticLayout: true,
  readOnly: true,
};

//--- Lifecycle Hooks ---//
onMounted(async () => {
  const contestId = sessionStorage.getItem('contest_id');
  if (!contestId) {
    message.error('Không tìm thấy thông tin cuộc thi!');
    router.push('/');
    return;
  }

  // Bắt đầu đồng hồ đếm ngược
  countdownIntervalId = setInterval(() => {
    countdown.value = getCountdown();
  }, 1000);

  await fetchQuestionDetails(route.params.id, contestId);
});

onUnmounted(() => {
  // Dọn dẹp tất cả các tiến trình chạy ngầm khi rời khỏi trang
  if (countdownIntervalId) clearInterval(countdownIntervalId);
  if (pollTimeoutId) clearTimeout(pollTimeoutId);
});

//--- API & Data Fetching ---//
const fetchQuestionDetails = async (questionId, contestId) => {
  isLoading.value = true;
  try {
    const response = await axios.get(`questions/${questionId}?contest_id=${contestId}`);
    if (response.data.code !== 200) throw new Error("Không tìm thấy câu hỏi");

    questionDetail.value = response.data.data;
    compilers.value = questionDetail.value.allow_compilers.map(c => ({
      label: c.code,
      value: c.id.toString()
    }));
    if (compilers.value.length > 0) {
      chosenCompiler.value = compilers.value[0].value;
    }
    
    // Tải lịch sử nộp bài sau khi có thông tin câu hỏi
    await fetchUserSubmissions(contestId);

  } catch (error) {
    message.error("Không thể tải chi tiết bài tập.");
    router.push('/not-found');
  } finally {
    isLoading.value = false;
  }
};

const fetchUserSubmissions = async (contestId) => {
  if (!questionDetail.value || !currentUser.username) return;
  isHistoryLoading.value = true;
  try {
    const contest_start_time = sessionStorage.getItem('start_time');
    const response = await axios.get(`solutions?question_code=${questionDetail.value.code}&username=${currentUser.username}&contest_id=${contestId}`);
    if (response.data.code === 200) {
      currentUserSubmissions.value = response.data.data.filter(submission =>
        new Date(submission.created_at) >= new Date(contest_start_time)
      );
    }
  } catch (error) {
    message.error("Không thể tải lịch sử nộp bài.");
  } finally {
    isHistoryLoading.value = false;
  }
};

const handleUpload = async () => {
  const file = fileList.value[0];
  const allowedExtensions = ['py', 'c', 'cpp', 'java', 'zip', 'rar', 'cs'];
  
  if (!file) {
    message.error('Vui lòng chọn file!');
    return;
  }
  
  const fileExtension = file.name.split('.').pop().toLowerCase();
  if (!allowedExtensions.includes(fileExtension)) {
    message.error('Định dạng file không được hỗ trợ!');
    return;
  }

  const formData = new FormData();
  formData.append('contest_id', sessionStorage.getItem('contest_id'));
  formData.append('question', questionDetail.value.code);
  formData.append('compiler', chosenCompiler.value);
  formData.append('code_file', file);

  uploading.value = true;
  result.value = null; // Reset kết quả

  try {
    const response = await axios.post('solutions', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    if (response.data.solution_id) {
      message.success('Nộp bài thành công, đang chờ chấm...');
      pollForResult(response.data.solution_id);
    } else {
      throw new Error(response.data.message || "Nộp bài thất bại");
    }
  } catch (error) {
    uploading.value = false;
    message.error(error.message || 'Nộp bài thất bại');
  }
};

const pollForResult = async (submissionId) => {
  if (pollTimeoutId) clearTimeout(pollTimeoutId);

  try {
    const response = await axios.get(`solutions/${submissionId}`);
    const submissionData = response.data.data;

    if (submissionData && submissionData.result) {
      result.value = submissionData.result;
      uploading.value = false;
      message.success(result.value === 'AC' ? 'Chính xác!' : `Kết quả: ${result.value}`);
      await fetchUserSubmissions(sessionStorage.getItem('contest_id'));
    } else {
      pollTimeoutId = setTimeout(() => pollForResult(submissionId), 3000);
    }
  } catch (error) {
    uploading.value = false;
    message.error("Lỗi khi lấy kết quả chấm bài.");
    clearTimeout(pollTimeoutId);
  }
};

//--- UI Handlers & Helpers ---//
const beforeUpload = file => {
  fileList.value = [file];
  return false;
};

const handleRemove = () => {
  fileList.value = [];
};

const showEditor = async (submissionId) => {
  if (!submissionId) return;
  isLoading.value = true;
  try {
    const response = await axios.get(`solutions/${submissionId}`);
    if (response.data.code === 200) {
      submittedCode.value = response.data.data.source_code;
      selectedSubmission.value = response.data.data;
      isOpenCodeEditor.value = true;
    } else {
      message.error('Không thể mở bài làm này!');
    }
  } catch (error) {
    message.error('Lỗi khi lấy chi tiết bài nộp.');
  } finally {
    isLoading.value = false;
  }
};

const getCountdown = () => {
  const finishTime = sessionStorage.getItem('finish_time');
  if (!finishTime) return '...';

  const end = new Date(finishTime);
  const now = new Date();

  if (now >= end) {
    clearInterval(countdownIntervalId);
    return 'Cuộc thi đã kết thúc';
  }

  const diff = Math.floor((end - now) / 1000);
  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;

  const dayString = days > 0 ? `${days}d:` : '';
  return `${dayString}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const getResultTag = (resultCode) => {
  const statusMap = {
    'AC': { color: 'green', text: 'Accepted (Kết quả đúng)' },
    'WA': { color: 'red', text: 'Wrong Answer (Kết quả sai)' },
    'TLE': { color: 'orange', text: 'Time Limit Exceeded' },
    'MLE': { color: 'red', text: 'Memory Limit Exceeded' },
    'OLE': { color: 'red', text: 'Output Limit Exceeded' },
    'RTE': { color: 'red', text: 'Runtime Error' },
    'IR': { color: 'purple', text: 'Invalid Return' },
    'CE': { color: 'purple', text: 'Compile Error' },
  };
  return statusMap[resultCode] || { color: 'blue', text: 'Đang chấm...' };
};

</script>

<template>
  <HeaderContest />
  <a-spin :spinning="isLoading">
    <div class="body" v-if="questionDetail">
      <div class="part-left">
        <div class="body-header">
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
          <h2 class="question-title">{{ questionDetail.name.toUpperCase() }}</h2>
          <div class="underline"></div>

          <div class="problem-container">
            <div v-html="questionDetail.content"></div>
            <br>
            <p><strong>Giới hạn thời gian:</strong> {{ questionDetail.time_limit }}s</p>
            <p><strong>Giới hạn bộ nhớ:</strong> {{ questionDetail.memory_limit }}Kb</p>
          </div>

          <div class="tools-container">
            <div class="compiler-container">
              <h3>Ngôn ngữ:</h3>
              <a-select v-model:value="chosenCompiler" style="width: 150px" :options="compilers" />
            </div>

            <div class="submit-container">
              <a-upload :file-list="fileList" :before-upload="beforeUpload" @remove="handleRemove" :max-count="1">
                <a-button>
                  <UploadOutlined />
                  Chọn File
                </a-button>
              </a-upload>

              <div class="submit-status-container">
                <p><strong>Trạng thái:</strong>
                  <a-tag v-if="result" :color="getResultTag(result).color">{{ getResultTag(result).text.split(' (')[0] }}</a-tag>
                  <span v-else>Chưa nộp</span>
                </p>
                <a-button type="primary" :loading="uploading" @click="handleUpload" :disabled="fileList.length === 0">
                  Nộp bài
                </a-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="part-right">
        <div class="card-content">
          <p style="font-weight: bold; margin-bottom: 15px;">Lịch sử nộp bài</p>
          <a-spin :spinning="isHistoryLoading">
            <div v-if="currentUserSubmissions.length > 0">
              <div v-for="submission in currentUserSubmissions" :key="submission.id">
                <div class="submission-item">
                  <div>
                    <p class="submission-title">{{ submission.question?.name }}</p>
                    <p class="submission-time">{{ new Date(submission.created_at).toLocaleString('vi-VN') }}</p>
                  </div>
                  <a @click="showEditor(submission.id)">
                    <a-tag :color="getResultTag(submission.result).color">
                      {{ getResultTag(submission.result).text.split(' (')[0] }}
                    </a-tag>
                  </a>
                </div>
                <div class="underline-item"></div>
              </div>
            </div>
            <div v-else class="no-submission">
              Chưa có bài nộp nào.
            </div>
          </a-spin>
        </div>
      </div>
    </div>
    <div v-else class="loading-container">
      <a-spin size="large" />
    </div>
  </a-spin>

  <a-modal v-model:open="isOpenCodeEditor" width="70vw" style="top: 20px" :footer="null" destroyOnClose>
    <template #title>
      <h3 style="font-weight: bold;">Chi tiết bài nộp #{{ selectedSubmission?.id }}</h3>
    </template>
    <div v-if="selectedSubmission" class="submission-details">
      <p><strong>Ngôn ngữ:</strong> {{ selectedSubmission.compiler.name }}</p>
      <p><strong>Kết quả:</strong> <a-tag :color="getResultTag(selectedSubmission.result).color">{{ getResultTag(selectedSubmission.result).text }}</a-tag></p>
    </div>
    <MonacoEditor
      v-model:value="submittedCode"
      theme="vs-light"
      :options="editorOptions"
      language="cpp"
      height="60vh"
    />
  </a-modal>
</template>

<style scoped>
.body {
  display: flex;
  margin-top: 90px;
  padding: 0 50px;
  gap: 30px;
}
.part-left { flex: 3; }
.part-right { flex: 1; }
.body-header {
  display: flex;
  flex-direction: column;
}
.question-title {
  color: #3c63a7;
  font-size: 1.5rem;
  font-weight: 700;
}
.countdown-time-test {
  padding: 10px;
  background-color: #f0ffff;
  border: 1px solid #8fd8ff;
  border-radius: 8px;
  margin-bottom: 20px;
  text-align: center;
}
.countdown-time-test h2 {
  color: #085ad4;
  font-size: 1.2rem;
  margin: 0;
}
.problem-container, .card-content {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.09);
  padding: 24px;
}
.underline {
  width: 100%;
  height: 1px;
  margin: 15px 0;
  background-color: #f0f0f0;
}
.tools-container {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  background: #fafafa;
  padding: 16px;
  border-radius: 8px;
}
.compiler-container {
  display: flex;
  align-items: center;
  gap: 8px;
}
.submit-container {
  width: 40%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.submit-status-container {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.submission-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
}
.submission-title {
  font-weight: 500;
  margin-bottom: 4px;
}
.submission-time {
  font-size: 0.85rem;
  color: #888;
}
.underline-item {
  width: 100%;
  height: 1px;
  background-color: #f0f0f0;
}
.no-submission {
  color: #9e9e9e;
  text-align: center;
  padding: 20px;
}
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 80vh;
}
.submission-details {
    margin-bottom: 16px;
    display: flex;
    gap: 20px;
}
.submission-details p {
    margin: 0;
    font-size: 1rem;
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
</style>