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
  <a-spin :spinning="isLoading">
    <div class="body">
      <div class="part-left">
        <div class="body-header">
          <h2>{{ questionDetail?.name.toUpperCase() }}</h2>
          <div class="underline"></div>
          <!--copy--> 
          <div class="problem-container" v-if="questionDetail">
            <div v-if="questionContent" v-html="questionContent"></div>
            <br>
            <p>Giới hạn thời gian: {{ questionDetail?.time_limit }}s</p>
            <p>Giới hạn bộ nhớ: {{ questionDetail?.memory_limit }}Kb</p>
          </div>

          <div class="tools-container">
            <div class="compiler-container">
              <h3 style="margin-right: 7px">Trình biên dịch:</h3>
              <a-select
                  ref="select"
                  v-model:value="chosenCompiler"
                  style="width: 120px; margin-bottom: 5px"
                  :options="compilers"
              ></a-select>
            </div>

            <div class="submit-container">
              <a-upload :file-list="fileList" :before-upload="beforeUpload" @remove="handleRemove">
                <a-button style="width: 100%" :disabled="fileList.length === 1">
                  <UploadOutlined/>
                  Tải file lên
                </a-button>
              </a-upload>

              <div class="submit-status-container">
                <p>Trạng thái:
                  <span v-if="result === 'AC'" style="color: #2AAA2F">AC</span>
                  <span v-else-if="result === 'WA'" style="color: #FF0000">WA</span>
                  <span v-else-if="result === 'TLE'" style="color: #FF0000">TLE</span>
                  <span v-else-if="result === 'MLE'" style="color: #FF0000">MLE</span>
                  <span v-else-if="result === 'OLE'" style="color: #FF0000">OLE</span>
                  <span v-else-if="result === 'RTE'" style="color: #FF0000">RTE</span>
                  <span v-else-if="result === 'IR'" style="color: #FF0000">IR</span>
                  <span v-else-if="result === 'CE'" style="color: #FF0000">CE</span>
                  <span v-else-if="result === null"><LoadingOutlined/></span>
                </p>

                <a-button
                    type="primary"
                    style="width: 30%; margin-top: 10px"
                    :loading="uploading"
                    @click="handleUpload"
                    :disabled="fileList.length === 0">Nộp bài
                </a-button>
              </div>
            </div>
          </div>

          <h3 style="margin-top: 2%">Bình luận</h3>
          <div class="comment-container">
            <a-comment>
              <template #avatar>
                <a-avatar
                    :src="currentUser.profile_picture ??
                                    `https://ui-avatars.com/api/?name=${getAvatarName(currentUser.last_name + ' ' + currentUser.first_name)}`"
                    alt="Avatar"
                />

              </template>
              <template #content>
                <a-form-item>
                  <a-textarea
                      placeholder="Sinh viên có thể đặt câu hỏi về bài tập, chia sẻ cách giải bài tập, nhưng không nên chia sẻ mã nguồn..."
                      v-model:value="commentValue" :rows="4"/>
                </a-form-item>
                <a-form-item>
                  <a-button html-type="submit" :loading="isSubmittingComment" type="primary"
                            @click="handleComment">
                    Thêm bình luận
                  </a-button>
                </a-form-item>
              </template>
            </a-comment>

            <a-list
                v-if="comments.length"
                :data-source="comments"
                :header="`${comments.length} bình luận`"
                item-layout="horizontal"
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
        </div>
      </div>
      <div class="part-right">
        <a-config-provider
            :theme="{
                          token: {
                            colorPrimary: '#A7453C',
                            colorTextHeading: '#000000',
                            colorText: '#A7453C',
                            colorBorderSecondary: 'rgba(186,151,147,0.45)'
                          }
                        }"
        />
        <!-- <div class="group-icon-container">
          <div class="group-icon">
            <RiseOutlined style="margin-right: 2%;"/>
            <p style="font-size: 100%;" @click="openTopSubmissions = true">Bài làm tốt nhất</p>
          </div>
        </div> -->

        <div class="card-content">
          <p style="font-weight: bold">Lịch sử nộp bài:</p>
          <div v-for="submission in currentUserSubmissions">
            <div style="display: flex; justify-content: space-between; align-items: center">
              <div>
                <p style="margin-bottom: 0">{{ submission?.question?.name }}</p>
                <p style="font-size: 80%; color: #9e9e9e">{{ submission?.created_at }}</p>
              </div>

              <a @click="showEditor(submission?.id)">
                <span v-if="submission?.result === 'AC'" style="color: #2AAA2F">AC</span>
                <span v-else-if="submission?.result === 'WA'" style="color: #FF0000">WA</span>
                <span v-else-if="submission?.result === 'TLE'" style="color: #FF0000">TLE</span>
                <span v-else-if="submission?.result === 'MLE'" style="color: #FF0000">MLE</span>
                <span v-else-if="submission?.result === 'OLE'" style="color: #FF0000">OLE</span>
                <span v-else-if="submission?.result === 'RTE'" style="color: #FF0000">RTE</span>
                <span v-else-if="submission?.result === 'IR'" style="color: #FF0000">IR</span>
                <span v-else-if="submission?.result === 'CE'" style="color: #FF0000">CE</span>
                <span v-else-if="submission?.result === null"><LoadingOutlined/></span>
              </a>
            </div>
            <div class="underline" style="opacity: 40%; margin-bottom: 3%"></div>
          </div>
        </div>
      </div>
    </div>

    <div>
      <a-modal v-model:open="openTopSubmissions" width="100%" wrap-class-name="full-modal" style="top: 3%;"
               :title="'Bài làm tốt nhất cho ' + questionDetail?.name.toUpperCase()">
        <div class="table-container">
          <a-table
              :row-key="genUuid()"
              :data-source="dataSource"
              :pagination="pagination"
              :loading="isLoadingTopSubmissions"
              @change="handleTableChange"
          >
            <a-table-column data-index="id">
              <template #title>
                <span style="font-weight: bold;">ID</span>
              </template>
            </a-table-column>

            <a-table-column data-index="date" width="12%">
              <template #title>
                <span style="font-weight: bold">Thời gian</span>
              </template>
            </a-table-column>

            <a-table-column width="15%" data-index="account">
              <template #title>
                <span style="font-weight: bold">Tài khoản</span>
              </template>
            </a-table-column>

            <a-table-column width="10%" data-index="result">
              <template #title>
                <span style="font-weight: bold">Kết quả</span>
              </template>

              <template #default="{ text }">
                <a-tag style="width: 70%; text-align: center" v-if="text === 'AC'"
                       color="green">AC
                </a-tag>
                <a-tag style="width: 70%; text-align: center" v-else-if="text === 'WA'"
                       color="red">WA
                </a-tag>
                <a-tag style="width: 70%; text-align: center" v-else-if="text === 'TLE'"
                       color="orange">TLE
                </a-tag>
                <a-tag style="width: 70%; text-align: center" v-else-if="text === 'RTE'"
                       color="red">RTE
                </a-tag>
                <a-tag style="width: 70%; text-align: center" v-else-if="text === 'CE'"
                       color="purple">CE
                </a-tag>
                <a-tag style="width: 70%; text-align: center" v-else-if="text === 'MLE'"
                       color="red">MLE
                </a-tag>
                <a-tag style="width: 70%; text-align: center" v-else-if="text === 'OLE'"
                       color="red">OLE
                </a-tag>
                <a-tag style="width: 70%; text-align: center" v-else-if="text === 'OLE'"
                       color="red">IR
                </a-tag>
              </template>
            </a-table-column>

            <a-table-column width="20%" data-index="problem">
              <template #title>
                <span style="font-weight: bold">Bài tập</span>
              </template>
            </a-table-column>

            <a-table-column width="10%" data-index="time">
              <template #title>
                <span style="font-weight: bold">Thời gian</span>
              </template>
            </a-table-column>

            <a-table-column width="10%" data-index="memory">
              <template #title>
                <span style="font-weight: bold">Bộ nhớ</span>
              </template>
            </a-table-column>

            <a-table-column width="10%" data-index="compiler">
              <template #title>
                <span style="font-weight: bold">Trình biên dịch</span>
              </template>
            </a-table-column>
          </a-table>
        </div>
        <a-config-provider
            :theme="{
                          token: {
                            colorPrimary: '#A7453C',
                            colorTextHeading: '#000000',
                            colorText: '#A7453C',
                            colorBorderSecondary: 'rgba(186,151,147,0.45)'
                          },
                        }"
        />

        <template #footer>
        </template>
      </a-modal>
    </div>

    <div>
      <a-modal style="top: 20px" v-model:open="isOpenCodeEditor" width="1000px"
               :title="questionDetail?.code + ' - ' + questionDetail?.name.toUpperCase()">
        <div v-if="selectedSubmission">
          <p style="margin-bottom: 5px; font-weight: bold">Thời gian nộp bài: {{ selectedSubmission?.created_at }}</p>
          <p style="margin-bottom: 5px; font-weight: bold">Ngôn ngữ: {{ selectedSubmission?.compiler.name }}</p>
          <p style="margin-bottom: 5px; font-weight: bold">Kết quả:
            <span v-if="selectedSubmission?.result === 'AC'" style="color: #2AAA2F">AC</span>
            <span v-else-if="selectedSubmission?.result === 'WA'" style="color: #FF0000">WA</span>
            <span v-else-if="selectedSubmission?.result === 'TLE'" style="color: #FF0000">TLE</span>
            <span v-else-if="selectedSubmission?.result === 'MLE'" style="color: #FF0000">MLE</span>
            <span v-else-if="selectedSubmission?.result === 'OLE'" style="color: #FF0000">OLE</span>
            <span v-else-if="selectedSubmission?.result === 'RTE'" style="color: #FF0000">RTE</span>
            <span v-else-if="selectedSubmission?.result === 'IR'" style="color: #FF0000">IR</span>
            <span v-else-if="selectedSubmission?.result === 'CE'" style="color: #FF0000">CE</span>
            <span v-else-if="selectedSubmission?.result === null"><LoadingOutlined/></span>
          </p>
        </div>

        <div class="editor-container">
          <MonacoEditor
              theme="vs-light"
              language="python"
              :width="900"
              :height="700"
              :options="editorOptions"
              v-model:value="submittedCode"
          />
        </div>

        <template #footer>
          <a-button type="primary" @click="isOpenCodeEditor = false">Đóng</a-button>
        </template>
      </a-modal>
    </div>
  </a-spin>
</template>


<style scoped>
/* Assuming 'template' is a class name for a general wrapper */
.template {
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.body {
  display: flex;
  margin-top: 90px;
  color: #2c3e50;          /* THEMED: Default text color */
}

.part-left {
  width: 80%;
  height: 100%;
}

.body-header {
  margin-left: 50px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.body-header h2 {
  font-size: 1.3rem;
  font-weight: 600;
  color: #007ACC; /* THEMED: Darker accent blue for section titles */
}

.problem-container,
.card-content, /* Grouping similar card-like elements */
.comment-container,
.editor-container {
  margin-top: 20px; /* Retained from problem-container */
  background-color: #FFFFFF; /* THEMED: Solid white background */
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 90, 170, 0.08); /* THEMED: Subtle, cool shadow */
  border: 1px solid #D9E2EC; /* THEMED: Light grey border for definition */
  padding: 2%; /* Retained from problem-container, card-content had 10px, editor 10px */
  display: flex;
  flex-direction: column;
  height: 100%; /* May need adjustment based on content if not truly 100% */
  margin-bottom: 3%; /* Retained from problem-container & comment-container */
}
.search-container input {
  margin-left: 3px;
  border: none;
  width: 100%;
  height: 100%;
  color: #2c3e50; /* THEMED: Dark text for input */
  background-color: transparent; /* Assuming container provides background */
}
/* THEMED: Added placeholder color for consistency */
.search-container input::placeholder {
  color: #90A4AE;
}


.underline {
  width: 100%;
  height: 1px;
  margin-top: 5px;
  background-color: #D9E2EC; /* THEMED: Light grey, matching themed borders (was #cacaca) */
}

.part-right {
  width: 20%;
  height: 100%;
  margin-top: 20px;
  display: flex;
  flex-direction: column;
}

.group-icon:hover img {
  /* THEMED: Filter for #00AFFF (Vibrant Accent Blue) - assuming original icon is black */
  filter: brightness(0) saturate(100%) invert(72%) sepia(99%) saturate(4463%) hue-rotate(165deg) brightness(102%) contrast(104%);
}

.group-icon-container {
  display: flex;
  align-items: center;
  margin-left: 20px;
  width: 100%;
}

.group-icon {
  display: flex;
  align-items: center;
  width: 100%;
  margin-top: 5px;
  margin-bottom: 13px;
  color: #5A738E; /* THEMED: Default icon text color (was not specified, adding for theme) */
  transition: color 0.3s ease; /* THEMED: Added transition for text color */
}
.group-icon img {
  filter: opacity(0.7); /* THEMED: Default subdued icon appearance (was not specified, adding for theme) */
  transition: filter 0.3s ease; /* THEMED: Added transition for filter */
}

.group-icon:hover {
  cursor: pointer;
  color: #00AFFF; /* THEMED: Vibrant Accent Blue for text on hover (was #A7453C) */
}

.card-content {
  margin-left: 20px;
  margin-right: 20px;
  background-color: #FFFFFF; /* THEMED: Solid white background (was rgba(255, 255, 255, 0.35)) */
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 90, 170, 0.08); /* THEMED: Subtle, cool shadow (was 2px 10px 20px rgba(0, 0, 0, 0.2)) */
  padding: 10px; /* Original padding: 10px */
  display: flex;
  flex-direction: column;
  margin-bottom: 10%;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
  font-size: 16px;
  text-align: left;
}

th, td {
  border: 1px solid #E8EFF5; /* THEMED: Very light grey cell borders (was #ddd) */
  padding: 8px; /* Original padding: 8px */
}
/* THEMED: Added default text color for table data cells */
td {
  color: #33475B;
}

th {
  background-color: #F0F5FA; /* THEMED: Very light blue/grey background (was #f4f4f4) */
  font-weight: bold; /* Original font-weight: bold */
  color: #007ACC; /* THEMED: Darker accent blue for header text (was not specified) */
}

tr:nth-child(even) {
  background-color: #F8F9FB; /* THEMED: Themed subtle striping (was #f9f9f9) */
}

tr:hover {
  background-color: rgba(0, 175, 255, 0.05); /* THEMED: Light accent blue hover (was #f1f1f1) */
}

.compiler-container {
  display: flex;
  align-items: center;
}

.tools-container {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.submit-container {
  width: 50%;
  display: flex;
  align-items: flex-end;
  flex-direction: column;
}

.submit-status-container {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.submit-status-container p {
  margin: 0;
  color: #5A738E; /* THEMED: Secondary text color (was not specified) */
}

.comment-container {
  background-color: #FFFFFF; /* THEMED: Solid white background (was rgba(255, 255, 255, 0.35)) */
  border-radius: 10px;
  box-shadow: 0 3px 10px rgba(0, 90, 170, 0.07); /* THEMED: Slightly lighter cool shadow (was 2px 10px 20px rgba(0, 0, 0, 0.1)) */
  padding: 2%; /* Original padding: 2% */
  display: flex;
  flex-direction: column;
  height: 100%;
  margin-bottom: 3%;
}

.editor-container {
  width: 100%;
  background-color: #FFFFFF; /* THEMED: Solid white background (was rgba(255, 255, 255, 0.35)) */
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 90, 170, 0.08); /* THEMED: Subtle, cool shadow (was 2px 10px 20px rgba(0, 0, 0, 0.2)) */
  padding: 10px; /* Original padding: 10px */
  margin-bottom: 40px;
  margin-top: 20px;
}
</style>