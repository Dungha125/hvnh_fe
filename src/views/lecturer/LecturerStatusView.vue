<script setup>
import Header from '@/components/LecturerHeader.vue';

import {computed, onBeforeMount, onBeforeUnmount, reactive, ref} from 'vue';
import {usePagination} from 'vue-request';
import axios from "@/configs/axios.js";
import {LoadingOutlined} from "@ant-design/icons-vue";
import LecturerHeader from '@/components/LecturerHeader.vue';

const isLoading = ref(true);

const status = reactive([]);
let intervalId = null;

onBeforeMount(async () =>
{
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
    await axios.get('solutions').then(response =>
    {
        const tempStatus = [];
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
        }
    }).catch(error =>
    {
        console.log(error);
    });
}


const queryData = async params =>
{
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
</script>


<template>
  <div class="status-page">
    <LecturerHeader />
    <a-config-provider>
      <a-spin :spinning="isLoading">
        <div class="page-wrapper">
          <div class="status-layout">
            
            <!-- Cột nội dung chính (bảng trạng thái) -->
            <main class="main-content">
              <div class="header-container">
                <h2>Trạng thái giải bài</h2>
                <div class="underline"></div>
              </div>
              <div class="card-style problem-container">

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
                    <a-table-column title="ID" data-index="id" :width="80" />
                    <a-table-column title="Thời gian" data-index="date" :width="60" />
                    <a-table-column title="Tài khoản" data-index="account" :width="100" />
                    <a-table-column title="Kết quả" data-index="result" :width="100">
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
                    <a-table-column title="Bài tập" data-index="problem" :min-width="200" />
                    <a-table-column title="Thời gian chạy" data-index="time" :width="120" />
                    <a-table-column title="Bộ nhớ" data-index="memory" :width="100" />
                    <a-table-column title="Trình biên dịch" data-index="compiler" :width="150" />
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
    </a-config-provider>
  </div>
</template>

<style scoped>
/*
  CSS cho trang Trạng thái - Chủ đề Neo-Futuristic Sáng
  Đã được thiết kế lại và responsive.
*/

.status-page {
  background-color: #F5F7FA;
  min-height: 100vh;
}

.page-wrapper {
  margin-top: 90px;
  padding: 24px;
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
  min-width: 300px;
  flex-shrink: 0;
  position: sticky; /* Dính lại khi cuộn */
  top: 90px;
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

.problem-container {
  padding: 24px;
}

.table-container {
  flex: 1;
  overflow-x: auto; /* Luôn cho phép cuộn ngang khi cần */
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
}
.filter-container .ant-btn-primary {
  background: linear-gradient(90deg, #007ACC, #00AFFF);
  border: none;
  color: white;
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
    position: static; /* Gỡ bỏ sticky trên mobile */
  }
  .ant-table-thead > tr > th
  {
    display: block;
  }
}


@media (max-width: 576px) {
  .page-wrapper { padding: 15px; }
  h2 { font-size: 1.5rem; }
  .card-style, .problem-container { padding: 15px; }
}
</style>
