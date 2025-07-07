<script setup>
import { ref, reactive, onUnmounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from "@/configs/axios.js";
import { message } from "ant-design-vue";
import {
  UploadOutlined,
  LoadingOutlined,
  FieldTimeOutlined,
  UserOutlined,
} from '@ant-design/icons-vue';
import AdminHeader from '@/components/AdminHeader.vue';
import MonacoEditor from 'monaco-editor-vue3';
import dayjs from "dayjs";
import { marked } from 'marked'; // Thư viện để phân tích Markdown

//--- Core Setup ---//
const route = useRoute();
const router = useRouter();
const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

//--- Component State ---//
const isLoading = ref(true);
const questionDetail = ref(null);
const compilers = ref([]);
const comments = ref([]);
const commentValue = ref('');
const isSubmittingComment = ref(false);

//--- Submission State ---//
const fileList = ref([]);
const uploading = ref(false);
const chosenCompiler = ref();
const result = ref(null);
const currentUserSubmissions = ref([]);
const isHistoryLoading = ref(false);

//--- Modal & Editor State ---//
const isOpenCodeEditor = ref(false);
const submittedCode = ref('');
const selectedSubmission = ref(null);

//--- Timer ID for Cleanup ---//
let pollTimeoutId = null;

const editorOptions = {
  fontSize: 14,
  minimap: { enabled: false },
  automaticLayout: true,
  readOnly: true,
};

//--- Computed Property for Markdown Rendering ---//
const formattedContent = computed(() => {
  if (questionDetail.value && questionDetail.value.content) {
    const content = questionDetail.value.content.trim();
    // FIX: Kiểm tra và loại bỏ toàn bộ dòng tiêu đề đầu tiên nếu nó bắt đầu bằng #
    if (content.startsWith('#')) {
      const firstLineEndIndex = content.indexOf('\n');
      // Lấy nội dung từ sau dòng đầu tiên
      const contentWithoutTitle = firstLineEndIndex !== -1 ? content.substring(firstLineEndIndex + 1) : '';
      return marked(contentWithoutTitle);
    }
    // Nếu không có, hiển thị nội dung gốc
    return marked(questionDetail.value.content);
  }
  return '';
});


//--- API & Data Fetching ---//
const fetchQuestionDetails = async (questionId) => {
  isLoading.value = true;
  try {
    const response = await axios.get(`questions/${questionId}`);
    if (response.data.code !== 200) throw new Error("Không tìm thấy câu hỏi");

    questionDetail.value = response.data.data;
    comments.value = response.data.data.comments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    compilers.value = questionDetail.value.allow_compilers.map(c => ({
      label: c.code,
      value: c.id.toString()
    }));

    if (compilers.value.length > 0) {
      chosenCompiler.value = compilers.value[0].value;
    }
    
    await fetchUserSubmissions();

  } catch (error) {
    message.error("Không thể tải chi tiết bài tập.");
    router.push('/not-found');
  } finally {
    isLoading.value = false;
  }
};

const fetchUserSubmissions = async () => {
  if (!questionDetail.value || !currentUser.username) return;
  isHistoryLoading.value = true;
  try {
    const response = await axios.get(`solutions?question_code=${questionDetail.value.code}&username=${currentUser.username}`);
    if (response.data.code === 200) {
      currentUserSubmissions.value = response.data.data;
    }
  } catch (error) {
    message.error("Không thể tải lịch sử nộp bài.");
  } finally {
    isHistoryLoading.value = false;
  }
};

//--- Lifecycle Hooks ---//
watch(
  () => route.params.id,
  (newId) => {
    if (newId) {
      if (!currentUser.id || currentUser.member_group === 1) {
        router.push('/not-found');
        return;
      }
      fetchQuestionDetails(newId);
    }
  },
  { immediate: true }
);

onUnmounted(() => {
  if (pollTimeoutId) clearTimeout(pollTimeoutId);
});


const handleUpload = async () => {
  const file = fileList.value[0]?.originFileObj;
  if (!file) return message.error('Vui lòng chọn file!');
  
  const problemId = route.params.id;
  const formData = new FormData();
  formData.append('question', problemId);
  formData.append('compiler', chosenCompiler.value);
  formData.append('code_file', file);

  uploading.value = true;
  result.value = null;

  try {
    const response = await axios.post('solutions', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
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
      await fetchUserSubmissions();
    } else {
      pollTimeoutId = setTimeout(() => pollForResult(submissionId), 3000);
    }
  } catch (error) {
    uploading.value = false;
    message.error("Lỗi khi lấy kết quả chấm bài.");
    clearTimeout(pollTimeoutId);
  }
};

const handleComment = async () => {
  isSubmittingComment.value = true;
  try {
    const problemId = route.params.id;
    const response = await axios.post(`questions/${problemId}/comment`, { comment: commentValue.value });
    if (response.status === 200) {
      comments.value.unshift(response.data.data); // Add to the top
      commentValue.value = '';
      message.success('Bình luận thành công');
    }
  } catch (error) {
    message.error('Bình luận thất bại');
  } finally {
    isSubmittingComment.value = false;
  }
};

//--- UI Handlers & Helpers ---//
const beforeUpload = file => { fileList.value = [file]; return false; };
const handleRemove = () => { fileList.value = []; };
const getAvatarName = (name) => name ? name.split(' ').join('+') : "User";

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
  <AdminHeader/>
  <div class="problem-page">
    
    <div class="page-wrapper">
      <a-spin :spinning="isLoading">
        <div v-if="questionDetail" class="problem-layout">
          <!-- Cột nội dung chính -->
          <main class="main-content">
            <div class="header-container">
              <h2>{{ questionDetail.name.toUpperCase() }}</h2>
              <div class="underline"></div>
            </div>
            <div class="card-style problem-description">
              <div class="markdown-content" v-html="formattedContent"></div>
              <div class="problem-meta">
                <span>Giới hạn thời gian: <b>{{ questionDetail.time_limit }}s</b></span>
                <span>Giới hạn bộ nhớ: <b>{{ questionDetail.memory_limit }}Kb</b></span>
              </div>
            </div>
            <div class="card-style submission-tools">
              <h3>Nộp bài</h3>
              <div class="tools-grid">
                <div class="compiler-container">
                  <span>Ngôn ngữ:</span>
                  <a-select v-model:value="chosenCompiler" :options="compilers" style="width: 100%;" />
                </div>
                <div class="upload-container">
                  <span>Tải file lên:</span>
                  <a-upload :file-list="fileList" :before-upload="beforeUpload" @remove="handleRemove" :max-count="1">
                    <a-button block><UploadOutlined/> Chọn File</a-button>
                  </a-upload>
                </div>
              </div>
              <div class="submit-action-bar">
                <div class="submit-status">
                  <strong>Trạng thái:</strong>
                  <a-tag v-if="result" :color="getResultTag(result).color">{{ getResultTag(result).text.split(' (')[0] }}</a-tag>
                  <span v-else>Chưa nộp</span>
                </div>
                <a-button type="primary" :loading="uploading" @click="handleUpload" :disabled="fileList.length === 0">Nộp bài</a-button>
              </div>
            </div>
            <div class="card-style comment-section">
              <h3>Bình luận</h3>
              <a-comment>
                <template #avatar>
                  <a-avatar :src="currentUser.profile_picture ?? `https://ui-avatars.com/api/?name=${getAvatarName(currentUser.last_name + ' ' + currentUser.first_name)}&background=007ACC&color=FFFFFF`" alt="Avatar"/>
                </template>
                <template #content>
                  <a-textarea v-model:value="commentValue" placeholder="Đặt câu hỏi, chia sẻ cách giải, nhưng không chia sẻ mã nguồn..." :rows="4"/>
                  <a-button html-type="submit" :loading="isSubmittingComment" type="primary" @click="handleComment" style="margin-top: 10px;">Thêm bình luận</a-button>
                </template>
              </a-comment>
              <a-list
                v-if="comments.length"
                :data-source="comments"
                :header="`${comments.length} bình luận`"
                item-layout="horizontal"
                class="comment-list"
              >
                <template #renderItem="{ item }">
                  <a-list-item>
                    <a-comment
                      :author="item.name"
                      :avatar="item.user.photo && item.user.photo?.length > 0 ? item.user.photo : `https://ui-avatars.com/api/?name=${getAvatarName(item.name)}`"
                      :content="item.content"
                      :datetime="dayjs(item.created_at).format('DD/MM/YYYY HH:mm')"
                    />
                  </a-list-item>
                </template>
              </a-list>
            </div>
          </main>
          <!-- Cột bên phải -->
          <aside class="sidebar">
            <div class="card-style submission-history">
              <h3>Lịch sử nộp bài</h3>
              <a-spin :spinning="isHistoryLoading">
                <div v-if="currentUserSubmissions.length > 0" class="history-list">
                  <div v-for="submission in currentUserSubmissions" :key="submission.id" class="history-item">
                    <div class="history-info">
                      <p class="submission-time">{{ new Date(submission.created_at).toLocaleString('vi-VN') }}</p>
                    </div>
                    <a @click="showEditor(submission.id)" class="history-status">
                      <a-tag :color="getResultTag(submission.result).color">{{ submission.result || '...' }}</a-tag>
                    </a>
                  </div>
                </div>
                <a-empty v-else description="Chưa có bài nộp nào." />
              </a-spin>
            </div>
          </aside>
        </div>
        <div v-else class="loading-container">
          <a-spin size="large" />
        </div>
      </a-spin>
    </div>
  </div>
</template>

<style scoped>
.problem-page { background-color: #F5F7FA; min-height: 100vh; }
.page-wrapper { margin-top: 70px; padding: 24px; }
.problem-layout { display: flex; gap: 24px; max-width: 1600px; margin: 0 auto; align-items: flex-start; }
.main-content { width: 75%; flex-grow: 1; display: flex; flex-direction: column; gap: 24px; }
.sidebar { width: 25%; min-width: 300px; flex-shrink: 0; position: sticky; top: 94px; }
h2 { font-size: 1.8rem; font-weight: 700; color: #007ACC; text-transform: uppercase; }
.underline { width: 100%; height: 3px; margin-top: 8px; background: linear-gradient(90deg, #00AFFF, #B3E5FC); border-radius: 2px; }
.card-style { background-color: #FFFFFF; border-radius: 12px; box-shadow: 0 4px 15px rgba(0, 90, 170, 0.08); border: 1px solid #D9E2EC; padding: 24px; }
.card-style h3 { font-size: 1.2rem; font-weight: 600; color: #007ACC; margin-bottom: 16px; padding-bottom: 10px; border-bottom: 1px solid #E8EFF5; }

/* === Markdown Content Styling === */
.problem-description .markdown-content {
  line-height: 1.7;
  color: #33475B;
}
.problem-description :deep(.markdown-content h1),
.problem-description :deep(.markdown-content h2),
.problem-description :deep(.markdown-content h3) {
  color: #007ACC;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  border-bottom: 1px solid #E8EFF5;
  padding-bottom: 0.3em;
}
.problem-description :deep(.markdown-content p) { margin-bottom: 1em; }
.problem-description :deep(.markdown-content strong) { font-weight: 600; color: #1A2B3C; }
.problem-description :deep(.markdown-content table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5em 0;
  border: 1px solid #D9E2EC;
}
.problem-description :deep(.markdown-content th),
.problem-description :deep(.markdown-content td) {
  border: 1px solid #D9E2EC;
  padding: 10px 12px;
  text-align: left;
}
.problem-description :deep(.markdown-content th) {
  background-color: #F0F5FA;
  font-weight: 600;
}
.problem-description :deep(.markdown-content tr:nth-child(even)) {
  background-color: #f8f9fc;
}
/* === End Markdown Styling === */

.problem-meta { margin-top: 24px; padding-top: 16px; border-top: 1px solid #E8EFF5; display: flex; gap: 24px; font-size: 0.9rem; color: #5a738e; }
.tools-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.compiler-container span, .upload-container span { display: block; margin-bottom: 8px; font-weight: 500; color: #33475B; }
.submit-action-bar { display: flex; justify-content: space-between; align-items: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #E8EFF5; }
.submit-status { font-weight: 600; color: #5a738e; }
.submit-status .ant-tag { margin-left: 8px; }
.submit-action-bar .ant-btn-primary { background: linear-gradient(90deg, #007ACC, #00AFFF); border: none; font-weight: 600; }
.comment-list { margin-top: 24px; }
.submission-history .history-list { max-height: 60vh; overflow-y: auto; padding-right: 5px; }
.history-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #E8EFF5; }
.history-item:last-child { border-bottom: none; }
.history-info .submission-time { font-size: 0.85rem; color: #888; }
.history-status { cursor: pointer; }
.modal-title { font-weight: 600; font-size: 1.2rem; color: #007ACC; }
.submission-details { display: flex; gap: 24px; flex-wrap: wrap; margin-bottom: 16px; padding: 12px; background-color: #f8f9fc; border-radius: 8px; }
.submission-details p { margin: 0; }
.editor-container { border: 1px solid #d9e2ec; border-radius: 8px; overflow: hidden; }
.modal-footer { display: flex; justify-content: flex-end; margin-top: 24px; }
.code-modal :deep(.ant-modal-body) { padding-top: 16px; }
@media (max-width: 992px) {
  .problem-layout { flex-direction: column; }
  .main-content, .sidebar { width: 100%; min-width: unset; }
  .sidebar { order: 1; margin-top: 24px; }
  .submission-history { position: static; }
}
@media (max-width: 576px) {
  .page-wrapper { padding: 15px; }
  h2 { font-size: 1.5rem; }
  .card-style { padding: 15px; }
  .tools-grid { grid-template-columns: 1fr; gap: 16px; }
  .submit-action-bar { flex-direction: column; align-items: stretch; gap: 12px; }
}
</style>
