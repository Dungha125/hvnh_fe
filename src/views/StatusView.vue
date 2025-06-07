<script setup>
import Header from '../components/Header.vue';

import {computed, onBeforeMount, onBeforeUnmount, reactive, ref} from 'vue';
import {usePagination} from 'vue-request';
import axios from "@/configs/axios.js";
import {LoadingOutlined} from "@ant-design/icons-vue";

const isLoading = ref(true);

const status = reactive([]);
const statisticsData = ref({})
let solutionIntervalId = null;
let statisticsIntervalId = null;

onBeforeMount(async () => {
  await fetchSolution();
  await fetchStatistics();

  solutionIntervalId = setInterval(fetchSolution, 3000);
  statisticsIntervalId = setInterval(fetchStatistics, 5000);
});

onBeforeUnmount(() => {
  if (solutionIntervalId) clearInterval(solutionIntervalId);
  if (statisticsIntervalId) clearInterval(statisticsIntervalId);
});

const fetchStatistics = async () => {
  isLoading.value = true
  try {
    const response = await axios.get('statistics') 
    const data = response.data.data
    delete data.online_data
    delete data.semester_lecturer_count
    delete data.semester_submission_count
    delete data.semester_student_count
    delete data.semester_subject_count
    delete data.semester_course_count
    delete data.student_in_semester_course_count
    delete data.student_count

    statisticsData.value = data
  } catch (error) {
    console.error('Lỗi khi lấy thống kê:', error)
  } finally {
    isLoading.value = false
  }
}

const getLabel = (key) => {
  const labels = {
    submission_count: 'Số lượng bài nộp',
    question_count: 'Số lượng câu hỏi',
    subject_count: 'Số môn học',
    course_count: 'Số lớp tín chỉ',
    student_in_course_count: 'Số lượt sinh viên trong lớp tín chỉ',
    lecturer_count: 'Số giảng viên',
  };
  return labels[key] || key;
};


const fetchSolution = async (page = 1, perPage = 100) =>
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

const formatNumber = (num) => {
    return num.toLocaleString('vi-VN');
  };

const activeKey = ref([1]);
</script>


<template>
  <div class="status-page">
    <Header />
    <a-spin :spinning="isLoading">
      <div class="page-wrapper">
        <!-- Layout chính của trang -->
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
                  <a-table-column title="ID" data-index="id" />
                  <a-table-column title="Thời gian" data-index="date" width="12%" />
                  <a-table-column title="Tài khoản" data-index="account" width="15%" />
                  <a-table-column title="Kết quả" data-index="result" width="10%">
                    <template #default="{ text }">
                      <a-tag v-if="text === 'AC'" color="green">AC</a-tag>
                      <a-tag v-else-if="text === 'WA'" color="red">WA</a-tag>
                      <a-tag v-else-if="text === 'TLE'" color="orange">TLE</a-tag>
                      <a-tag v-else-if="text === 'RTE'" color="red">RTE</a-tag>
                      <a-tag v-else-if="text === 'CE'" color="purple">CE</a-tag>
                      <a-tag v-else-if="text === 'MLE'" color="red">MLE</a-tag>
                      <a-tag v-else-if="text === 'OLE'" color="red">OLE</a-tag>
                      <a-tag v-else-if="text === 'IR'" color="red">IR</a-tag>
                      <p v-else-if="text === null"><LoadingOutlined/></p>
                    </template>
                  </a-table-column>
                  <a-table-column title="Bài tập" data-index="problem" width="20%" />
                  <a-table-column title="Thời gian" data-index="time" width="10%" />
                  <a-table-column title="Bộ nhớ" data-index="memory" width="10%" />
                  <a-table-column title="Trình biên dịch" data-index="compiler" />
                </a-table>
              </div>
            </div>
          </main>

          <!-- Cột bên phải (thống kê và chú giải) -->
          <aside class="sidebar">
            <div class="card-style stats-card">
               <h4>Thống kê</h4>
               <div class="stats-grid">
                  <div v-for="(value, key) in statisticsData" :key="key" class="stat-block" :class="key">
                    <span class="stat-label">{{ getLabel(key) }}</span>
                    <span class="stat-value">
                      <div class="roll-up">
                        <span class="roll-up-digit" :style="{ animationDelay: (key * 0.2) + 's' }">
                          {{ formatNumber(value) }}
                        </span>
                      </div>
                    </span>
                  </div>
               </div>
            </div>
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
  </div>
</template>

<style scoped>
/*
  CSS cho trang Trạng thái - Chủ đề Neo-Futuristic Sáng
  Đã được thiết kế lại để đẹp hơn và responsive trên di động.
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
}

.main-content {
  width: 75%;
  flex-grow: 1;
}

.sidebar {
  width: 25%;
  min-width: 300px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
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
}

/* === Sidebar Cards === */
.stats-card h4, .legend-card h4 {
  font-size: 1.2rem;
  font-weight: 600;
  color: #007ACC;
  margin-bottom: 16px;
  border-bottom: 2px solid #E8EFF5;
  padding-bottom: 8px;
}

.stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
}
.stat-block {
    background-color: #f8f9fc;
    padding: 16px;
    border-radius: 8px;
    border: 1px solid #e8eff5;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 4px;
}
.stat-label {
  color: #5a738e;
  font-weight: 500;
  font-size: 0.9rem;
}
.stat-value {
  font-weight: 700;
  font-size: 2rem;
  color: #007ACC;
  line-height: 1;
}
.stat-block.submission_count .stat-value {
  color: #d9363e;
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


/* Animation cho số đếm */
@keyframes roll-up {
  0% { transform: translateY(100%); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}
.roll-up {
  display: inline-block;
  line-height: 1;
  overflow: hidden;
}
.roll-up-digit {
  display: inline-block;
  animation: roll-up 0.8s ease-out forwards;
}

/* === RESPONSIVE === */
@media (max-width: 1200px) {
  .status-layout {
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
  .card-style, .problem-container { padding: 15px; }
  .stats-grid {
    grid-template-columns: 1fr; /* 1 cột trên điện thoại */
  }
}
</style>
