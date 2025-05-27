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
  <a-spin :spinning="isLoading">
    <div class="body">
      <div class="part-left">
        <div class="body-header">
          <h2>Hồ sơ người dùng</h2>
          <div class="underline"></div>

          <div style="display: flex">
            <div class="info-container" ref="infoContainerRef">
              <div
                  style="display: flex; justify-content: center; flex-direction: column; align-items: center">
                <a-avatar
                    :size="avatarSize"
                    style="border: 1px solid #A7453C; box-shadow: 0 2px 5px #A7453C"
                    :src="currentUser.profile_picture ??
                            `https://ui-avatars.com/api/?name=${getAvatarName(currentUser.last_name + ' ' + currentUser.first_name)}`"
                    alt="Avatar"
                />

                <p style="margin-top: 10px; font-weight: bold; font-size: 130%">
                  {{ currentUser.last_name + ' ' + currentUser.first_name }}</p>
              </div>

              <a-button type="primary" style="margin-top: 5px; margin-bottom: 5px"
                        @click="router.push('profile/edit')">
                Chỉnh sửa hồ sơ
              </a-button>

              <div class="detail-container">
                <p>
                                <span style="font-weight: bold">
                                    <SolutionOutlined/>
                                    Tài khoản:
                                </span>
                  {{ currentUser.username }}
                </p>

                <p>
                                <span style="font-weight: bold">
                                    <ReadOutlined/>
                                    Lớp:
                                </span>
                  {{ currentUser.class }}
                </p>

                <p>
                                <span style="font-weight: bold">
                                    <MailOutlined/>
                                    Email:
                                </span>
                  {{ currentUser.email }}
                </p>

                <p>
                                <span style="font-weight: bold">
                                    <CalendarOutlined/>
                                    Ngày sinh:
                                </span>
                  {{ currentUser.birthday }}
                </p>

                <p>
                                <span style="font-weight: bold">
                                    <WomanOutlined v-if="currentUser.gender === 1"/>
                                    <ManOutlined v-else/>
                                    Giới tính:
                                </span>
                  {{ currentUser.gender === 0 ? 'Nam' : currentUser.gender === 0 ? 'Nữ' : '' }}
                </p>

                <p>
                                <span style="font-weight: bold">
                                    <HomeOutlined/>
                                    Địa chỉ:
                                </span>
                  {{ currentUser.address }}
                </p>

                <p>
                                <span style="font-weight: bold">
                                    <MessageOutlined/>
                                    Giới thiệu:
                                </span>
                  {{ currentUser.about }}
                </p>
              </div>
            </div>

            <div class="part-right">
              <div class="content-container">
                <a-menu style="font-size: 110%" v-model:selectedKeys="currentTab" mode="horizontal"
                        :items="items"/>

                <div class="general-container" v-if="currentTab[0] === 'general'">
                  <p style="margin-top: 10px; font-size: 110%; font-weight: bold; margin-bottom: 10px">
                    Danh sách lớp học đã tham gia:</p>
                  <a-table
                      :row-key="genUuid()"
                      :data-source="dataSource"
                      :pagination="pagination"
                      :loading="loading"
                      @change="handleTableChange"
                  >
                    <a-table-column data-index="stt" width="8%">
                      <template #title>
                        <span style="font-weight: bold;">STT</span>
                      </template>
                    </a-table-column>

                    <a-table-column data-index="subject">
                      <template #title>
                        <span style="font-weight: bold">Môn học</span>
                      </template>
                    </a-table-column>

                    <a-table-column width="20%" data-index="group">
                      <template #title>
                        <span style="font-weight: bold">Nhóm</span>
                      </template>
                    </a-table-column>

                    <a-table-column data-index="semester">
                      <template #title>
                        <span style="font-weight: bold">Học kỳ</span>
                      </template>
                    </a-table-column>

                    <a-table-column width="15%" data-index="status">
                      <template #title>
                        <span style="font-weight: bold">Trạng thái</span>
                      </template>

                      <template #default="{ text }">
                        <a-tag color="green" v-if="text === 1">Hoạt động</a-tag>
                        <a-tag color="red" v-else>Không hoạt động</a-tag>
                      </template>
                    </a-table-column>
                  </a-table>
                </div>

                <div class="history-container" v-if="currentTab[0] === 'history'">
                  <p style="font-size: 110%; font-weight: bold; margin-bottom: 10px">Danh sách bài
                    nộp:</p>
                  <a-table
                      :row-key="genUuid()"
                      :data-source="dataSourceHistory"
                      :pagination="pagination"
                      :loading="loading"
                      @change="handleTableChange"
                  >
                    <a-table-column data-index="id" width="12%">
                      <template #title>
                        <span style="font-weight: bold;">ID</span>
                      </template>

                      <template #default="{ text }">
                        <a style="color: #A7453C" @click="showEditor(text)">{{ text }}</a>
                      </template>
                    </a-table-column>

                    <a-table-column data-index="date" width="12%">
                      <template #title>
                        <span style="font-weight: bold">Thời gian</span>
                      </template>
                    </a-table-column>

                    <a-table-column width="8%" data-index="result">
                      <template #title>
                        <span style="font-weight: bold">Kết quả</span>
                      </template>

                      <template #default="{ record }">
                        <a @click="showEditor(record.id)">
                          <a-tag style="width: 70%; text-align: center" v-if="record.result === 'AC'"
                                 color="green">AC
                          </a-tag>
                          <a-tag style="width: 70%; text-align: center"
                                 v-else-if="record.result === 'WA'"
                                 color="red">WA
                          </a-tag>
                          <a-tag style="width: 70%; text-align: center"
                                 v-else-if="record.result === 'TLE'"
                                 color="orange">TLE
                          </a-tag>
                          <a-tag style="width: 70%; text-align: center"
                                 v-else-if="record.result === 'RTE'"
                                 color="red">RTE
                          </a-tag>
                          <a-tag style="width: 70%; text-align: center"
                                 v-else-if="record.result === 'CE'"
                                 color="purple">CE
                          </a-tag>
                          <a-tag style="width: 70%; text-align: center"
                                 v-else-if="record.result === 'MLE'"
                                 color="red">MLE
                          </a-tag>
                          <a-tag style="width: 70%; text-align: center"
                                 v-else-if="record.result === 'OLE'"
                                 color="red">OLE
                          </a-tag>
                          <a-tag style="width: 70%; text-align: center"
                                 v-else-if="record.result === 'IR'"
                                 color="red">IR
                          </a-tag>
                          <p v-else-if="record.result === null">
                            <LoadingOutlined/>
                          </p>
                        </a>
                      </template>
                    </a-table-column>

                    <a-table-column width="20%" data-index="problem">
                      <template #title>
                        <span style="font-weight: bold">Bài tập</span>
                      </template>

                      <template #default="{ record }">
                        <a style="color: #A7453C" @click="navigateToProblem(record.code)">
                          {{ record.problem }}
                        </a>
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <a-modal style="top: 20px" v-model:open="isOpenCodeEditor" width="1000px"
             :title="currentSubmission?.question?.code + ' - ' + currentSubmission?.question?.name.toUpperCase()">
      <div v-if="currentSubmission">
        <p style="margin-bottom: 5px; font-weight: bold">Thời gian nộp bài:
          {{ currentSubmission?.created_at }}</p>
        <p style="margin-bottom: 5px; font-weight: bold">Ngôn ngữ: {{ currentSubmission?.compiler.name }}</p>
        <p style="margin-bottom: 5px; font-weight: bold">Kết quả:
          <span v-if="currentSubmission?.result === 'AC'" style="color: #2AAA2F">AC</span>
          <span v-else-if="currentSubmission?.result === 'WA'" style="color: #FF0000">WA</span>
          <span v-else-if="currentSubmission?.result === 'TLE'" style="color: #FF0000">TLE</span>
          <span v-else-if="currentSubmission?.result === 'MLE'" style="color: #FF0000">MLE</span>
          <span v-else-if="currentSubmission?.result === 'OLE'" style="color: #FF0000">OLE</span>
          <span v-else-if="currentSubmission?.result === 'RTE'" style="color: #FF0000">RTE</span>
          <span v-else-if="currentSubmission?.result === 'IR'" style="color: #FF0000">IR</span>
          <span v-else-if="currentSubmission?.result === 'CE'" style="color: #FF0000">CE</span>
          <span v-else-if="currentSubmission?.result === null"><LoadingOutlined/></span>
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
  </a-spin>
</template>

<style scoped>
.body {
  color: #A7453C;
  display: flex;
  margin-top: 90px;
}

.part-left {
  width: 96%;
  margin-bottom: 5%;

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
  color: black;
}

.info-container {
  display: flex;
  flex-direction: column;
  background-color: rgba(255, 255, 255, 0.35);
  border-radius: 10px;
  box-shadow: 2px 10px 20px rgba(0, 0, 0, 0.2);
  padding: 2%;
  width: 25%;
  margin-top: 20px;
  min-height: 468px;
}

.underline {
  width: 100%;
  height: 1px;
  margin-top: 5px;
  background-color: #cacaca;
}

.part-right {
  width: 100%;
  margin-left: 20px;
}

.group-icon:hover img {
  filter: invert(32%) sepia(64%) saturate(506%) hue-rotate(330deg) brightness(70%) contrast(95%);
}

.group-icon-container p {
  margin-top: 12px;
}

.detail-container {
  margin-top: 20px;
  font-size: 110%;
}

.detail-container p {
  margin-bottom: 5px;
}

.content-container {
  display: flex;
  flex-direction: column;
  background-color: rgba(255, 255, 255, 0.35);
  border-radius: 10px;
  box-shadow: 2px 10px 20px rgba(0, 0, 0, 0.2);
  padding: 2%;
  width: 100%;
  margin-top: 20px;
  min-height: 768px;
}

.history-container {
  margin-top: 10px;
}
</style>
