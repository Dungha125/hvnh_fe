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

// --- TABS STATE ---
const testCases = ref([]);
const submissions = ref([]);
const editForm = reactive({});
const showCustomMain = ref(false);

// Form options
const subjects = ref([]);
const groups = ref([]);
const subGroups = ref([]);
const difficulties = ref([]);
const typeProblems = ref([]);
const listCompilers = ref([]);
const selectedGroups = ref({});
const selectedSubGroups = ref({});

const listComment = ref([]);
const isEditCommentModalVisible = ref(false);
const editingComment = ref(null);

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
    message.error("Không thể tải chi tiết câu hỏi.");
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

//-----------COMMENT--------------//
const handleToggleCommentStatus = async (comment) => {
    const newStatus = comment.status === 1 ? 0 : 1;
    try {
        await axios.patch(`/comments/${comment.id}`, { status: newStatus });
        message.success("Cập nhật trạng thái bình luận thành công!");
        comment.status = newStatus; // Update UI immediately
    } catch (error) {
        message.error("Lỗi khi cập nhật trạng thái.");
    }
};

const showEditCommentModal = (comment) => {
    editingComment.value = { ...comment };
    isEditCommentModalVisible.value = true;
};

const handleUpdateComment = async () => {
    if (!editingComment.value || !editingComment.value.content.trim()) {
        message.warning("Nội dung bình luận không được để trống.");
        return;
    }
    try {
        await axios.put(`/comments/${editingComment.value.id}`, { content: editingComment.value.content });
        message.success("Cập nhật bình luận thành công!");
        isEditCommentModalVisible.value = false;
        fetchComments(); // Refresh comment list
    } catch (error) {
        message.error("Lỗi khi cập nhật bình luận.");
    }
};

const confirmDeleteComment = (commentId) => {
    Modal.confirm({
        title: "Bạn có chắc muốn xóa bình luận này?",
        icon: createVNode(ExclamationCircleOutlined),
        content: "Hành động này không thể hoàn tác.",
        okText: "Xóa",
        okType: 'danger',
        cancelText: "Hủy",
        onOk: () => handleDeleteComment(commentId),
    });
};

const handleDeleteComment = async (commentId) => {
    try {
        await axios.delete(`/comments/${commentId}`);
        message.success("Xóa bình luận thành công!");
        fetchComments(); // Refresh comment list
    } catch (error) {
        message.error("Lỗi khi xóa bình luận.");
    }
};

</script>

<template>
  <div class="page-container">
    <AdminHeader/>
   <div class="page-wrapper">
      <a-spin :spinning="isLoading">
        <div v-if="questionDetail" class="problem-layout">
          <div class="header-container">
            <h2>{{ questionDetail.name.toUpperCase() }}</h2>
            <div class="underline"></div>
          </div>

          <div class="content-card">
            <a-tabs v-model:activeKey="activeTabKey" class="main-tabs">
              
              <a-tab-pane key="details">
                <template #tab><FileTextOutlined /> Chi tiết</template>
                <div class="tab-content">
                  <div class="markdown-content" v-html="formattedContent"></div>
                  <div class="problem-meta">
                    <span>Giới hạn thời gian: <b>{{ questionDetail.time_limit }}s</b></span>
                    <span>Giới hạn bộ nhớ: <b>{{ questionDetail.memory_limit }}Kb</b></span>
                  </div>
                </div>
                <template><HistoryOutlined /> Quản lý bình luận</template>
                 <div class="tab-content">
                    <h4>Toàn bộ bình luận cho {{ questionDetail.code }}</h4>
                    <a-table :dataSource="listComment" :columns="[
                        { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
                        { title: 'Người gửi', dataIndex: ['user', 'name'], key: 'user' },
                        { title: 'Nội dung', dataIndex: 'content', key: 'content' },
                        { title: 'Trạng thái', dataIndex: 'status', key: 'status', align: 'center', width: 120 },
                        { title: 'Thời gian', dataIndex: 'created_at', key: 'time', align: 'center', width: 180 },
                        { title: 'Thao tác', key: 'action', align: 'center', width: 120 }
                    ]">
                        <template #bodyCell="{ column, record }">
                            <template v-if="column.key === 'status'">
                                <a-tag :color="record.status === 1 ? 'green' : 'red'">
                                    {{ record.status === 1 ? 'Hiển thị' : 'Đã ẩn' }}
                                </a-tag>
                            </template>
                            <template v-if="column.key === 'action'">
                                <a-dropdown :trigger="['click']">
                                    <a-button type="text" shape="circle" class="action-button"><EllipsisOutlined /></a-button>
                                    <template #overlay>
                                        <a-menu>
                                            <a-menu-item @click="handleToggleCommentStatus(record)">
                                                {{ record.status === 1 ? 'Ẩn' : 'Hiện' }}
                                            </a-menu-item>
                                            <a-menu-item @click="showEditCommentModal(record)">Sửa</a-menu-item>
                                            <a-menu-item @click="confirmDeleteComment(record.id)" danger>Xóa</a-menu-item>
                                        </a-menu>
                                    </template>
                                </a-dropdown>
                            </template>
                        </template>
                    </a-table>
                 </div>
              </a-tab-pane>

              <a-tab-pane key="testcases">
                 <template #tab><ExperimentOutlined /> Quản lý Testcase</template>
                 <div class="tab-content">
                    <h4>Danh sách Testcase</h4>
                    <a-table :dataSource="testCases" :columns="[{title: 'Tên file', dataIndex: 'name'}, {title: 'Kích thước', dataIndex: 'size'}, {title: 'Thao tác'}]" />
                    <a-upload-dragger style="margin-top: 20px;">
                        <p class="ant-upload-drag-icon"><UploadOutlined /></p>
                        <p class="ant-upload-text">Nhấn hoặc kéo file .zip chứa testcase vào đây</p>
                    </a-upload-dragger>
                 </div>
              </a-tab-pane>

              <a-tab-pane key="submissions">
                 <template #tab><HistoryOutlined /> Các bài đã nộp</template>
                 <div class="tab-content">
                    <h4>Toàn bộ bài nộp cho {{ questionDetail.code }}</h4>
                    <a-table :dataSource="submissions" :columns="[{title: 'ID'}, {title: 'Người nộp'}, {title: 'Kết quả'}, {title: 'Thời gian'}]" />
                 </div>
              </a-tab-pane>

              <a-tab-pane key="comments">
                 <template #tab><HistoryOutlined /> Quản lý bình luận</template>
                 <div class="tab-content">
                    <h4>Toàn bộ bình luận cho {{ questionDetail.code }}</h4>
                    <a-table :dataSource="listComment" :columns="[
                        { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
                        { title: 'Người gửi', dataIndex: ['user', 'name'], key: 'user' },
                        { title: 'Nội dung', dataIndex: 'content', key: 'content' },
                        { title: 'Trạng thái', dataIndex: 'status', key: 'status', align: 'center', width: 120 },
                        { title: 'Thời gian', dataIndex: 'created_at', key: 'time', align: 'center', width: 180 },
                        { title: 'Thao tác', key: 'action', align: 'center', width: 120 }
                    ]">
                        <template #bodyCell="{ column, record }">
                            <template v-if="column.key === 'status'">
                                <a-tag :color="record.status === 1 ? 'green' : 'red'">
                                    {{ record.status === 1 ? 'Hiển thị' : 'Đã ẩn' }}
                                </a-tag>
                            </template>
                            <template v-if="column.key === 'action'">
                                <a-dropdown :trigger="['click']">
                                    <a-button type="text" shape="circle" class="action-button"><EllipsisOutlined /></a-button>
                                    <template #overlay>
                                        <a-menu>
                                            <a-menu-item @click="handleToggleCommentStatus(record)">
                                                {{ record.status === 1 ? 'Ẩn' : 'Hiện' }}
                                            </a-menu-item>
                                            <a-menu-item @click="showEditCommentModal(record)">Sửa</a-menu-item>
                                            <a-menu-item @click="confirmDeleteComment(record.id)" danger>Xóa</a-menu-item>
                                        </a-menu>
                                    </template>
                                </a-dropdown>
                            </template>
                        </template>
                    </a-table>
                 </div>
              </a-tab-pane>

              <a-tab-pane key="edit">
                 <template #tab><EditOutlined /> Sửa câu hỏi</template>
                 <div class="tab-content">
                    <a-form layout="vertical" :model="editForm" @finish="handleEditSubmit" class="form-layout">
                        <div class="form-grid">
                          <div class="form-column">
                            <a-form-item label="Mã câu hỏi" required><a-input v-model:value="editForm.code" /></a-form-item>
                            <a-form-item label="Tiêu đề" required><a-input v-model:value="editForm.name" /></a-form-item>
                          </div>
                          <div class="form-column">
                            <a-form-item label="Độ khó" required><a-select v-model:value="editForm.level" :options="difficulties" /></a-form-item>
                            <a-form-item label="Loại câu hỏi" required><a-select v-model:value="editForm.type" :options="typeProblems"/></a-form-item>
                          </div>
                        </div>
                         <a-form-item label="Nội dung" required>
                           <ckeditor v-if="editor" :editor="editor" v-model="editForm.content" :config="config" />
                         </a-form-item>
                        <a-button type="primary" html-type="submit">Lưu thay đổi</a-button>
                    </a-form>
                 </div>
              </a-tab-pane>

              <a-tab-pane key="actions">
                 <template #tab><ToolOutlined /> Thao tác khác</template>
                 <div class="tab-content">
                    <h4>Chấm lại bài</h4>
                    <p>Hành động này sẽ đưa tất cả các bài đã nộp cho câu hỏi này vào hàng đợi để chấm lại từ đầu.</p>
                    <a-button type="primary" danger @click="handleRejudge">Chấm lại toàn bộ</a-button>
                 </div>
              </a-tab-pane>
            </a-tabs>
          </div>
        </div>
        <div v-else class="loading-container">
          <a-spin size="large" />
        </div>
      </a-spin>
    </div>
    
    <!-- Edit Comment Modal -->
    <a-modal v-model:open="isEditCommentModalVisible" title="Sửa bình luận" @ok="handleUpdateComment">
        <a-textarea v-if="editingComment" v-model:value="editingComment.content" :rows="4" />
    </a-modal>
  </div>
</template>

<style scoped>
.page-container { background-color: #F5F7FA; min-height: 100vh; }
.page-wrapper { margin-top: 70px; padding: 24px; }
.header-container { max-width: 1400px; margin: 0 auto 24px auto; }
h2 { font-size: 1.8rem; font-weight: 700; color: #007ACC; text-transform: uppercase; }
.underline { width: 100%; height: 3px; margin-top: 8px; background: linear-gradient(90deg, #00AFFF, #B3E5FC); border-radius: 2px; }
.content-card { background-color: #FFFFFF; border-radius: 12px; box-shadow: 0 4px 15px rgba(0, 90, 170, 0.08); border: 1px solid #D9E2EC; max-width: 1400px; margin: 0 auto; }
.main-tabs :deep(.ant-tabs-nav) { padding: 0 24px; margin-bottom: 0 !important; }
.tab-content { padding: 24px; }
.tab-content h4 { font-size: 1.2rem; font-weight: 600; color: #007ACC; margin-bottom: 16px; }

/* === Markdown Content Styling === */
.markdown-content { line-height: 1.7; color: #33475B; }
.markdown-content :deep(h1), .markdown-content :deep(h2), .markdown-content :deep(h3) { color: #007ACC; margin-top: 1.5em; margin-bottom: 0.5em; border-bottom: 1px solid #E8EFF5; padding-bottom: 0.3em; }
.markdown-content :deep(p) { margin-bottom: 1em; }
.markdown-content :deep(strong) { font-weight: 600; color: #1A2B3C; }
.markdown-content :deep(table) { width: 100%; border-collapse: collapse; margin: 1.5em 0; border: 1px solid #D9E2EC; }
.markdown-content :deep(th), .markdown-content :deep(td) { border: 1px solid #D9E2EC; padding: 10px 12px; text-align: left; }
.markdown-content :deep(th) { background-color: #F0F5FA; font-weight: 600; }
.markdown-content :deep(tr:nth-child(even)) { background-color: #f8f9fc; }

.problem-meta { margin-top: 24px; padding-top: 16px; border-top: 1px solid #E8EFF5; display: flex; gap: 24px; font-size: 0.9rem; color: #5a738e; }
.loading-container { display: flex; justify-content: center; align-items: center; height: 80vh; }

.form-layout { margin-top: 16px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 24px; }

@media (max-width: 992px) {
  .form-grid { grid-template-columns: 1fr; gap: 0; }
}
@media (max-width: 768px) {
  .page-wrapper { padding: 15px; }
  .content-card { padding: 0; }
  .main-tabs { padding: 0; }
  .tab-content { padding: 15px; }
  h2 { font-size: 1.5rem; }
}
</style>
