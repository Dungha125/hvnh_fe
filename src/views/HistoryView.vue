<script setup>
import Header from '../components/Header.vue';

import {computed, onBeforeMount, reactive, ref} from 'vue';
import {usePagination} from 'vue-request';
import axios from "@/configs/axios.js";
import {LoadingOutlined} from "@ant-design/icons-vue";
import {useRouter} from "vue-router";
import {message} from "ant-design-vue";
import MonacoEditor from 'monaco-editor-vue3';

const status = reactive([]);
const isLoading = ref(true);
const router = useRouter();
const isOpenCodeEditor = ref(false);
const currentSubmission = ref(null);
const submittedCode = ref('');

const editorOptions = {
    fontSize: 14,
    minimap: {enabled: false},
    automaticLayout: true,
};

onBeforeMount(async () =>
{
    const currentUser = localStorage.getItem('username');

    await axios.get('solutions?username=' + currentUser).then(response =>
    {
        if (response.status === 200)
        {
            isLoading.value = false;
            const statusResponse = response.data.data;
            statusResponse.forEach(sts =>
            {
                let runTime = sts.run_time;
                if (runTime)
                    runTime = runTime?.toFixed(2);

                let createdDate = new Date(sts.created_at);

                const month = createdDate.getMonth() + 1;

                sts.created_at = (createdDate.getDate() > 9 ? createdDate.getDate() : '0' + createdDate.getDate()) 
                + '/' + (month > 9 ? month : '0' + month) 
                + '/' + createdDate.getFullYear() 
                + ' ' + (createdDate.getHours() > 9 ? createdDate.getHours() : '0' + createdDate.getHours()) 
                + ':' + (createdDate.getMinutes() > 9 ? createdDate.getMinutes() : '0' + createdDate.getMinutes())
                + ':' + (createdDate.getSeconds() > 9 ? createdDate.getSeconds() : '0' + createdDate.getSeconds());

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
    }).catch(error =>
    {
        console.log(error);
    });
});

const queryData = async params =>
{
    // const response = await axios.get('https://randomuser.me/api', {
    //     params: {
    //         ...params,
    //         noinfo: '',
    //     },
    // });
    //
    // console.log(response);
    //
    // if (response.status === 200)
    // {
    //     return response.data.results;
    // }

    return status;
};

const {data: dataSource, run, loading, current, pageSize} = usePagination(queryData, {
    formatResult: res =>
    {
        return Array.isArray(res) ? res : [];
    },
    pagination: {
        currentKey: 'page',
        pageSizeKey: 'results',
    },
});

const pagination = computed(() => ({
    total: queryData().length,
    current: current.value,
    pageSize: pageSize.value,
}));

const genUuid = () =>
{
    return Math.random().toString(36).substring(7);
};

const handleTableChange = (pag, filters, sorter) =>
{
    run({
        results: pag.pageSize,
        page: pag?.current,
        sortField: sorter.field,
        sortOrder: sorter.order,
        ...filters,
    });
};

const activeKey = ref([1]);

const navigateToProblem = code =>
{
    router.push(`/problems/${code}`);
};

const showEditor = async (id) =>
{
    if (id === null)
    {
        message.error('Không thể mở bài làm này!');
        return;
    }

    isLoading.value = true;
    const response = await axios.get(`solutions/${id}`);
    if (response.status === 200)
    {
        if (response.data.code === 200)
        {
            submittedCode.value = response.data.data.source_code;
            currentSubmission.value = response.data.data;
            isOpenCodeEditor.value = true;
        }
        else
        {
            message.error('Không thể mở bài làm này!');
        }
    }
    else
    {
        message.error('Không thể mở bài làm này!');
    }
    isLoading.value = false;
}
</script>


<template>
    <Header />
  <div class="history-page">
    
    <a-spin :spinning="isLoading">
      <div class="page-wrapper">
        <!-- Layout chính của trang -->
        <div class="history-layout">
          
          <!-- Cột nội dung chính (bảng lịch sử) -->
          <main class="main-content">
            <div class="header-container">
              <h2>Lịch sử nộp bài</h2>
              <div class="underline"></div>
            </div>
            <div class="card-style history-container">
                           <!-- Table Section -->
              <div class="table-container">
                <a-table
                    :row-key="genUuid"
                    :data-source="dataSource"
                    :pagination="pagination"
                    :loading="loading"
                    @change="handleTableChange"
                    :scroll="{ x: 'max-content' }"
                >
                  <a-table-column title="ID" data-index="id" width="10%">
                    <template #default="{ text }">
                      <a class="table-link" @click="showEditor(text)">{{ text }}</a>
                    </template>
                  </a-table-column>
                  <a-table-column title="Thời gian" data-index="date" width="15%" />
                  <a-table-column title="Kết quả" data-index="result" width="10%">
                    <template #default="{ record }">
                      <a @click="showEditor(record.id)" style="cursor: pointer;">
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
                  <a-table-column title="Bài tập" data-index="problem" width="25%">
                     <template #default="{ record }">
                       <a class="table-link" @click="navigateToProblem(record.code)">
                         {{ record.problem.toUpperCase() }}
                       </a>
                     </template>
                  </a-table-column>
                  <a-table-column title="Thời gian chạy" data-index="time" width="10%" />
                  <a-table-column title="Bộ nhớ" data-index="memory" width="10%" />
                  <a-table-column title="Ngôn ngữ" data-index="compiler" />
                </a-table>
              </div>
            </div>
          </main>

          <!-- Cột bên phải (chú giải) -->
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
                <CodeOutlined />
                <span>{{ currentSubmission?.question?.code }} - {{ currentSubmission?.question?.name.toUpperCase() }}</span>
            </div>
        </template>
        <div v-if="currentSubmission" class="submission-details">
            <p><b>Thời gian nộp bài:</b> {{ currentSubmission?.created_at }}</p>
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
  CSS cho trang Lịch sử - Chủ đề Neo-Futuristic Sáng
  Đã được thiết kế lại và responsive.
*/

.history-page {
  background-color: #F5F7FA;
  min-height: 100vh;
}

.page-wrapper {
  margin-top: 90px;
  padding: 24px;
}

/* === Bố cục chính === */
.history-layout {
  display: flex;
  gap: 24px;
  max-width: 1600px;
  margin: 0 auto;
}

.main-content {
  width: 78%;
  flex-grow: 1;
}

.sidebar {
  width: 22%;
  min-width: 280px;
  flex-shrink: 0;
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

.history-container {
  padding: 24px;
}

.table-container {
  flex: 1;
}
.table-link {
    color: #007ACC;
    font-weight: 500;
}
.table-link:hover {
    color: #005C9E;
    text-decoration: underline;
}

/* === Filter Bar === */
.filter-container {
    display: flex;
    gap: 16px;
    margin-bottom: 24px;
    align-items: center;
    flex-wrap: wrap;
}
.filter-input, .filter-select {
    flex-grow: 1;
    min-width: 150px;
}
.filter-container .ant-btn-primary {
  background: linear-gradient(90deg, #007ACC, #00AFFF);
  border: none;
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
    display: flex;
    align-items: center;
    gap: 10px;
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
.code-modal :global(.ant-modal-body) {
    padding-top: 16px;
}

/* === RESPONSIVE === */
@media (max-width: 1200px) {
  .history-layout {
    flex-direction: column; /* Xếp chồng các cột */
  }
  .main-content, .sidebar {
    width: 100%;
    min-width: unset;
  }
}

@media (max-width: 768px) {
    .filter-container {
        flex-direction: column;
        align-items: stretch;
    }
}

@media (max-width: 576px) {
  .page-wrapper { padding: 15px; }
  h2 { font-size: 1.5rem; }
  .card-style, .history-container { padding: 15px; }
}
</style>
