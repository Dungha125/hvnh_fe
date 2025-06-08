<script setup>
import Header from '../components/Header.vue';
import {ref, reactive, onBeforeMount, computed} from 'vue';
import axios from "@/configs/axios.js";
import {
  RiseOutlined,
  UploadOutlined,
  LoadingOutlined,
  CheckCircleTwoTone,
  CloseCircleTwoTone
} from '@ant-design/icons-vue';
import {useRoute, useRouter} from 'vue-router';
import {message} from "ant-design-vue";
import {usePagination} from "vue-request";
import MonacoEditor from 'monaco-editor-vue3';

const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
const route = useRoute();
const isLoading = ref(true);
const questionDetail = ref(null);
const questionContent = ref(null);
const fileList = ref([]);
const uploading = ref(false);
const chosenCompiler = ref();
const result = ref('Pending');
const comments = ref([]);
const commentValue = ref('');
const isSubmittingComment = ref(false);
const currentUserSubmissions = ref([]);
const compilers = ref([]);
const openTopSubmissions = ref(false);
const status = reactive([]);
const isLoadingTopSubmissions = ref(true);
const currentCourse = ref(null);
const isOpenCodeEditor = ref(false);
const submittedCode = ref('');
const selectedSubmission = ref(null);

const id = route.params.id;
const router = useRouter();

const editorOptions = {
  fontSize: 14,
  minimap: {enabled: false},
  automaticLayout: true,
};

onBeforeMount(async () => {
  if (!localStorage.getItem('currentCourse')) {
    router.push('/not-found');
  }

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  currentCourse.value = JSON.parse(localStorage.getItem('currentCourse') || '{}');

  if ((currentUser && currentUser.member_group !== 1) || !currentCourse.value) {
    router.push('/not-found');
  }

  try {
    const response = await axios.get(`questions/${id}?course_id=${currentCourse.value.id}`);
    if (response.status === 200) {
      isLoading.value = false;
      questionDetail.value = response.data.data;
      comments.value = response.data.data.comments;
      comments.value.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      //questionContent.value = marked(response.data.data.content.replace(/^#\s*/, ''));
      questionContent.value = response.data.data.content;
    }

    const getSubmissionsResponse = await axios.get(`solutions?question_code=${id}&username=${currentUser.username}`);
    if (getSubmissionsResponse.status === 200) {
      currentUserSubmissions.value = getSubmissionsResponse.data.data;
    }

    compilers.value = questionDetail.value.allow_compilers.map((compiler) => ({
      label: compiler.code,
      value: compiler.id + ""
    }));

    if (compilers.value.length > 0) {
      chosenCompiler.value = compilers.value[0].value;
    }

    // await axios.get(`questions/${id}/top`).then(response => {
    //   if (response.status === 200) {
    //     isLoading.value = false;
    //     const statusResponse = response.data.data;
    //     statusResponse.forEach(sts => {
    //       let runTime = sts.run_time;
    //       if (runTime)
    //         runTime = runTime.toFixed(2);

    //       let createdDate = new Date(sts.created_at);
    //       sts.created_at = (createdDate.getDate() > 9 ? createdDate.getDate() : '0' + createdDate.getDate()) + '/' + (createdDate.getMonth() > 9 ? createdDate.getMonth() : '0' + createdDate.getMonth()) + '/' + createdDate.getFullYear();


    //       let username = sts.user.username + ' - ' + sts.user.last_name + ' ' + sts.user.first_name;

    //       status.push({
    //         id: sts.id,
    //         date: sts.created_at,
    //         account: username,
    //         result: sts.result,
    //         problem: sts.question.code + ' - ' + sts.question.name,
    //         time: runTime + 's',
    //         memory: sts.memory + 'Kb',
    //         compiler: sts.compiler.code,
    //       });
    //     });

    //     const uniqueSubmissions = [];
    //     const map = new Map();
    //     for (const item of status) {
    //       if (!map.has(item.account)) {
    //         map.set(item.account, true);
    //         uniqueSubmissions.push(item);
    //       }
    //     }

    //     status.length = 0;

    //     status.push(...uniqueSubmissions);
    //     isLoadingTopSubmissions.value = false;
    //   }
    // }).catch(error => {
    //   router.push('/not-found');
    // });
   } catch (error) {
    router.push('/not-found');
  }
});


const handleRemove = file => {
  const index = fileList.value.indexOf(file);
  const newFileList = fileList.value.slice();
  newFileList.splice(index, 1);
  fileList.value = newFileList;
};

const beforeUpload = file => {
  fileList.value = [...(fileList.value || []), file];
  return false;
};

const handleUpload = async () => {
  const file = fileList.value[0];

  const allowedExtensions = ['py', 'c', 'cpp', 'java', 'zip', 'rar', 'cs'];
  const fileExtension = file.name.split('.').pop().toLowerCase();

  if (!allowedExtensions.includes(fileExtension)) {
    message.error('File không hợp lệ!');
    return;
  }

  if (!file) {
    message.error('Vui lòng chọn file!');
    return;
  }

  const formData = new FormData();
  formData.append('course_id', currentCourse.value.id);
  formData.append('question', id);
  formData.append('compiler', chosenCompiler.value);
  formData.append('code_file', file);

  uploading.value = true;

  try {
    const response = await axios.post('solutions', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.status === 200) {
      result.value = null;
      const submissionId = response.data.solution_id;
      message.success('Nộp bài thành công');
      const intervalId = setInterval(async () => {
        const getSubmissionResponse = await axios.get(`solutions/${submissionId}`);
        if (getSubmissionResponse.status === 200) {
          result.value = getSubmissionResponse.data.data.result;
          if (result.value) {
            clearInterval(intervalId);
            uploading.value = false;
            if (result.value === 'AC') {
              message.success('Chúc mừng bạn đã hoàn thành bài tập này!');
            } else {
              message.error('Rất tiếc, bài làm của bạn không đúng!');
            }
            const getSubmissionsResponse = await axios.get(`solutions?question_code=${id}&username=${currentUser.username}`);
            if (getSubmissionsResponse.status === 200) {
              currentUserSubmissions.value = getSubmissionsResponse.data.data;
            }
          }
        }
      }, 3000);
    }
  } catch (error) {
    uploading.value = false;
    message.error('Nộp bài thất bại');
  }
};


const getAvatarName = (name) => {
  if (!name) return "User";
  return name.split(' ').join('+');
};

const handleComment = async () => {
  isSubmittingComment.value = true;
  try {
    const response = await axios.post(`questions/${id}/comment`, {comment: commentValue.value});
    if (response.status === 200) {
      comments.value.push({
        name: response.data.data.name,
        content: response.data.data.content,
        created_at: response.data.data.created_at,
        user: {
          photo: currentUser.profile_picture ?? null
        }
      });

      commentValue.value = '';
      comments.value.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      message.success('Bình luận thành công');
    }
  } catch (error) {
    message.error('Bình luận thất bại');
    console.log(error);
  }
  isSubmittingComment.value = false;
}

const queryData = async params => {
  return status;
};

const {data: dataSource, run, loading, current, pageSize} = usePagination(queryData, {
  formatResult: res => {
    return Array.isArray(res) ? res : [];
  },
  pagination: {
    currentKey: 'page',
    pageSizeKey: 'pageSize',
  },
});

const pagination = computed(() => ({
  total: status.length,
  current: current.value,
  pageSize: pageSize.value,
}));

const genUuid = () => {
  return Math.random().toString(36).substring(7);
};

const handleTableChange = (pag, filters, sorter) => {
  run({
    pageSize: pag.pageSize,
    page: pag?.current,
    sortField: sorter.field,
    sortOrder: sorter.order,
    ...filters,
  });
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
      selectedSubmission.value = response.data.data;
      isOpenCodeEditor.value = true;
    } else {
      message.error('Không thể mở bài làm này!');
    }
  } else {
    message.error('Không thể mở bài làm này!');
  }
  isLoading.value = false;
}
</script>


<template>
  <Header/>
  <div class="problem-page">
       <a-spin :spinning="isLoading">
        <div class="page-wrapper">
          <div class="problem-layout">

            <!-- Cột nội dung chính -->
            <main class="main-content">
              <div class="header-container">
                <h2>{{ questionDetail?.name.toUpperCase() }}</h2>
                <div class="underline"></div>
              </div>

              <!-- Thẻ nội dung bài tập -->
              <div class="card-style problem-description">
                <div v-if="questionContent" v-html="questionContent"></div>
                <div class="problem-meta">
                  <span>Giới hạn thời gian: <b>{{ questionDetail?.time_limit }}s</b></span>
                  <span>Giới hạn bộ nhớ: <b>{{ questionDetail?.memory_limit }}Kb</b></span>
                </div>
              </div>

              <!-- Thẻ công cụ và nộp bài -->
              <div class="card-style submission-tools">
                <div class="tools-grid">
                  <div class="compiler-container">
                    <h3>Trình biên dịch:</h3>
                    <a-select v-model:value="chosenCompiler" :options="compilers" style="width: 100%;" />
                  </div>
                  <div class="upload-container">
                    <h3>Tải file lên:</h3>
                    <a-upload :file-list="fileList" :before-upload="beforeUpload" @remove="handleRemove">
                      <a-button block :disabled="fileList.length === 1">
                        <UploadOutlined/> Chọn File
                      </a-button>
                    </a-upload>
                  </div>
                </div>
                <div class="submit-action-bar">
                  <div class="submit-status">
                    Trạng thái:
                    <span v-if="result === 'AC'" class="status-ac">AC</span>
                    <span v-else-if="result" class="status-wa">{{ result }}</span>
                    <LoadingOutlined v-else-if="uploading"/>
                  </div>
                  <a-button type="primary" :loading="uploading" @click="handleUpload" :disabled="fileList.length === 0">
                    Nộp bài
                  </a-button>
                </div>
              </div>
              
              <!-- Khu vực bình luận -->
              <div class="card-style comment-section">
                 <h3>Bình luận</h3>
                 <a-comment>
                   <template #avatar>
                     <a-avatar :src="currentUser.profile_picture ?? `https://ui-avatars.com/api/?name=${getAvatarName(currentUser.last_name + ' ' + currentUser.first_name)}&background=007ACC&color=FFFFFF`" alt="Avatar"/>
                   </template>
                   <template #content>
                     <a-textarea v-model:value="commentValue" placeholder="Đặt câu hỏi, chia sẻ cách giải, nhưng không chia sẻ mã nguồn..." :rows="4"/>
                     <a-button html-type="submit" :loading="isSubmittingComment" type="primary" @click="handleComment" style="margin-top: 10px;">
                       Thêm bình luận
                     </a-button>
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
                           :datetime="item.created_at"
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
                 <div v-if="currentUserSubmissions && currentUserSubmissions.length > 0">
                    <div v-for="submission in currentUserSubmissions" :key="submission.id" class="history-item">
                        <div class="history-info">
                            <p class="problem-name">{{ submission?.question?.name }}</p>
                            <p class="timestamp">{{ submission?.created_at }}</p>
                        </div>
                        <a @click="showEditor(submission?.id)" class="history-status" :class="submission?.result">
                            <span v-if="submission?.result">{{ submission?.result }}</span>
                            <LoadingOutlined v-else />
                        </a>
                    </div>
                 </div>
                 <a-empty v-else description="Chưa có lịch sử nộp bài." />
              </div>
            </aside>

          </div>
        </div>
      </a-spin>
  </div>
</template>
<style scoped>

  .problem-page {
    background-color: #F5F7FA;
    min-height: 100vh;
  }

  .page-wrapper {
    margin-top: 90px;
    padding: 24px;
  }

  /* === Bố cục chính === */
  .problem-layout {
    display: flex;
    gap: 24px;
    max-width: 1600px;
    margin: 0 auto;
  }

  .main-content {
    width: 75%;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .sidebar {
    width: 25%;
    min-width: 300px;
    flex-shrink: 0;
  }

  /* === Tiêu đề & Thẻ chung === */
  .header-container {
    margin-bottom: 0;
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
  .card-style h3 {
      font-size: 1.2rem;
      font-weight: 600;
      color: #007ACC;
      margin-bottom: 16px;
      padding-bottom: 10px;
      border-bottom: 1px solid #E8EFF5;
  }

  /* === Nội dung bài tập === */
  .problem-description {
    line-height: 1.7;
  }
  .problem-description :deep(p) { margin-bottom: 1em; }
  .problem-description :deep(pre) {
      background-color: #f8f9fc;
      padding: 16px;
      border-radius: 8px;
      white-space: pre-wrap;
      word-break: break-all;
  }
  .problem-meta {
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid #E8EFF5;
    display: flex;
    gap: 24px;
    font-size: 0.9rem;
    color: #5a738e;
  }

  /* === Công cụ và Nộp bài === */
  .tools-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }
  .compiler-container span, .upload-container span {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: #33475B;
  }
  .submit-action-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #E8EFF5;
  }
  .submit-status {
    font-weight: 600;
    color: #5a738e;
  }
  .submit-status .status-ac { color: #52c41a; }
  .submit-status .status-wa { color: #d9363e; }
  .submit-action-bar .ant-btn-primary {
    background: linear-gradient(90deg, #007ACC, #00AFFF);
    border: none;
    font-weight: 600;
  }

  /* === Khu vực bình luận === */
  .comment-section .ant-form-item {
    margin-bottom: 10px;
  }
  .comment-list {
    margin-top: 24px;
  }
  .comment-list .ant-list-header {
      font-weight: 600;
      color: #33475B;
      border-bottom: 1px solid #E8EFF5;
      padding-bottom: 10px;
  }

  /* === Sidebar - Lịch sử nộp bài === */
  .submission-history {
    position: sticky;
    top: 90px; /* Vị trí dính sau header */
  }
  .history-list {
      max-height: 60vh; /* Giới hạn chiều cao và cho phép cuộn */
      overflow-y: auto;
      padding-right: 5px; /* for scrollbar */
  }
  .history-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #E8EFF5;
  }
  .history-item:last-child {
    border-bottom: none;
  }
  .history-info .problem-name {
    font-weight: 600;
    color: #2c3e50;
    margin: 0;
  }
  .history-info .timestamp {
    font-size: 0.85rem;
    color: #5a738e;
    margin: 0;
  }
  .history-status {
    font-weight: bold;
    cursor: pointer;
    padding: 2px 8px;
    border-radius: 4px;
  }
  .history-status.AC { color: #52c41a; background-color: #f6ffed; border: 1px solid #b7eb8f;}
  .history-status.WA, .history-status.TLE, .history-status.MLE { color: #d9363e; background-color: #fff1f0; border: 1px solid #ffccc7;}
  .history-status.CE { color: #722ed1; background-color: #f9f0ff; border: 1px solid #d3adf7;}

  /* === RESPONSIVE === */
  @media (max-width: 992px) {
    .problem-layout {
      flex-direction: column; /* Xếp chồng các cột */
    }
    .main-content, .sidebar {
      width: 100%;
      min-width: unset;
    }
    .sidebar {
        order: 1; /* Đảm bảo sidebar (chứa lịch sử) luôn ở dưới */
    }
    .submission-history {
        position: static; /* Gỡ bỏ sticky trên mobile */
    }
  }

  @media (max-width: 576px) {
    .page-wrapper { padding: 15px; }
    h2 { font-size: 1.5rem; }
    .card-style { padding: 15px; }
    .tools-grid {
        grid-template-columns: 1fr; /* Xếp chồng các công cụ */
        gap: 16px;
    }
    .submit-action-bar {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
    }
  }
</style>