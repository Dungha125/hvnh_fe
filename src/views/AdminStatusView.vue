<script setup>

import {computed, onBeforeMount, onBeforeUnmount, reactive, ref} from 'vue';
import axios from "@/configs/axios.js";
import {LoadingOutlined} from "@ant-design/icons-vue";
import AdminHeader from "@/components/AdminHeader.vue";
import {useRouter} from "vue-router";

const isLoading = ref(true);

const status = reactive([]);
let intervalId = null;

const router = useRouter();

const pagination = reactive({
  current: 1,
  pageSize: 50,
  total: 0,
  showSizeChanger: true,
  pageSizeOptions: ['10', '20', '50', '100'],
});

onBeforeMount(async () =>
{
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    if ((currentUser && currentUser.member_group === 1) || !currentUser)
    {
        router.push('/not-found');
    }

    await fetchSolution();

    intervalId = setInterval(() =>
    {
        fetchSolution();
    }, 3000);
});

onBeforeUnmount(() =>
{
    if (intervalId)
    {
        clearInterval(intervalId);
    }
});

const fetchSolution = async () =>
{
    try {
        const response = await axios.get('solutions', {
            params: {
                page: pagination.current,
                per_page: pagination.pageSize
            }
        });
        
        if (response.status === 200) {
            isLoading.value = false;
            const statusResponse = response.data.data;
            const tempStatus = [];
            
            statusResponse.forEach(sts =>
            {
                let runTime = sts.run_time;
                if (runTime)
                    runTime = runTime?.toFixed(2);

                let createdDate = new Date(sts.created_at);

                const month = createdDate.getMonth() + 1;

                sts.created_at = (createdDate.getDate() > 9 ? createdDate.getDate() : '0' + createdDate.getDate()) + '/' + (month > 9 ? month : '0' + month) + '/' + createdDate.getFullYear();

                let username = sts.user.username + ' - ' + sts.user.last_name + ' ' + sts.user.first_name;

                tempStatus.push({
                    id: sts.id,
                    date: sts.created_at,
                    account: username,
                    result: sts.result,
                    problem: sts.question.code + ' - ' + sts.question.name,
                    time: runTime ? runTime + 's' : '',
                    memory: sts.memory ? sts.memory + 'Kb' : '',
                    compiler: sts.compiler.code,
                });
            });

            status.splice(0, status.length, ...tempStatus);
            
            pagination.current = response.data.current_page;
            pagination.total = response.data.total;
        }
    } catch (error) {
        console.log(error);
    }
}

const genUuid = () =>
{
    return Math.random().toString(36).substring(7);
};

const handleTableChange = (pag, filters, sorter) =>
{
    pagination.current = pag.current;
    pagination.pageSize = pag.pageSize;
    fetchSolution();
};

const activeKey = ref([1]);

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
          <div class="countdown-bar" v-if="countdown">
            <div class="user-info">
              <UserOutlined />
              <span>{{ User.last_name }} {{ User.first_name }} ({{ User.username }})</span>
            </div>
            <div class="timer">
              <FieldTimeOutlined />
              <span>{{ countdown }}</span>
            </div>
          </div>

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
                      <template #default="{ text }">
                        <a-tag v-if="text === 'AC'" color="green">AC</a-tag>
                        <a-tag v-else-if="text === 'WA'" color="red">WA</a-tag>
                        <a-tag v-else-if="text === 'TLE'" color="orange">TLE</a-tag>
                        <a-tag v-else-if="text === 'RTE'" color="red">RTE</a-tag>
                        <a-tag v-else-if="text === 'CE'" color="purple">CE</a-tag>
                        <a-tag v-else-if="text === 'MLE'" color="red">MLE</a-tag>
                        <a-tag v-else-if="text === 'OLE'" color="red">OLE</a-tag>
                        <a-tag v-else-if="text === 'IR'" color="red">IR</a-tag>
                        <LoadingOutlined v-else-if="text === null" />
                      </template>
                    </a-table-column>
                    <a-table-column title="Bài tập" data-index="problem" :min-width="200">
                       <template #default="{ record }">
                         <a class="table-link" @click="navigateToProblem(record.code)">
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
            <p><b>Thời gian nộp bài:</b> {{ dayjs(currentSubmission?.created_at_raw).format('DD/MM/YYYY HH:mm:ss') }}</p>
            <p><b>Ngôn ngữ:</b> {{ currentSubmission?.compiler_full.name }}</p>
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

/* === Bố cục chính === */
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
  top: 140px;
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
  .countdown-bar { flex-direction: column; gap: 8px; font-size: 0.9rem; }
  .timer { font-size: 1.1rem; }
}
</style>