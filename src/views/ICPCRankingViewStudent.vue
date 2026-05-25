<script setup>
import { ref, onMounted, onUnmounted, computed, h } from 'vue';
import axios from '@/configs/axios.js';
import { useRoute } from 'vue-router';
import isEqual from 'lodash/isEqual';
import HeaderContest from '@/components/HeaderContest.vue';
import { message } from 'ant-design-vue';

// --- STATE MANAGEMENT ---
const contest = ref(null);
const route = useRoute();
const contestId = sessionStorage.getItem('contest_id');
const contestType = ref('normal'); // Default to 'normal'
let intervalId = null;

// --- LOGIC TO DETERMINE CONTEST TYPE ---
const icpc = sessionStorage.getItem("contest_icpc");
const ioi = sessionStorage.getItem("contest_ioi");

if (icpc === "1" || icpc === true || icpc === "true") {
  contestType.value = "icpc";
} else if (ioi === "1" || ioi === true || ioi === "true") {
  contestType.value = "ioi";
}

// --- API & DATA FETCHING ---
const fetchRanking = async () => {
  try {
    const res = await axios.get(`contests/${contestId}/ranking`);
    const newRankingData = res.data.data;

    // Tối ưu việc cập nhật để tránh re-render không cần thiết
    if (!contest.value) {
      // Lần tải đầu tiên, gán toàn bộ dữ liệu
      contest.value = newRankingData;
    } else {
      // Các lần cập nhật sau, chỉ cập nhật các thuộc tính cần thiết
      contest.value.name = newRankingData.name;
      
      if (!isEqual(contest.value.teams, newRankingData.teams)) {
        contest.value.teams = newRankingData.teams;
      }
      if (!isEqual(contest.value.users, newRankingData.users)) {
        contest.value.users = newRankingData.users;
      }
      if (!isEqual(contest.value.problems, newRankingData.problems)) {
        contest.value.problems = newRankingData.problems;
      }
    }

    if (contest.value && (contestType.value === 'ioi' || contestType.value === 'normal')) {
      const scoreRes = await axios.get(`contests/${contestId}/scores`);
      const newScores = scoreRes.data;
      if (!isEqual(newScores, contest.value.scores)) {
        contest.value.scores = newScores;
      }
    }
  } catch (error) {
    console.error('Error fetching ranking data:', error);
    message.error('Không thể tải dữ liệu bảng xếp hạng.');
    clearInterval(intervalId);
  }
};

onMounted(() => {
  fetchRanking();
  intervalId = setInterval(fetchRanking, 5000);
});

onUnmounted(() => {
  clearInterval(intervalId);
});

// --- COMPUTED PROPERTIES FOR RANKING DATA ---

// For ICPC
const sortedTeamsICPC = computed(() => {
  if (!contest.value?.teams) return [];
  return [...contest.value.teams].sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score;
    return a.time - b.time;
  });
});

const firstSolveMap = computed(() => {
  if (contestType.value !== 'icpc' || !contest.value?.teams) return {};
  const map = {};
  for (const problem of contest.value.problems) {
    let minTime = Infinity;
    let firstSolverId = null;
    for (const team of contest.value.teams) {
      const detail = team.detail[problem.short_name];
      if (detail && detail.time && typeof detail.time === 'number' && detail.time < minTime) {
        minTime = detail.time;
        firstSolverId = team.id;
      }
    }
    if (firstSolverId !== null) {
      map[problem.short_name] = {
        teamId: firstSolverId,
        time: minTime
      };
    }
  }
  return map;
});

// For IOI and Normal
const rankedUsers = computed(() => {
    if (!contest.value?.users?.data || !contest.value?.scores) return [];
    
    const usersWithScores = contest.value.users.data.map(user => {
        const userScores = contest.value.scores[user.username] || {};
        const totalScore = Object.values(userScores).reduce((sum, score) => sum + (score || 0), 0);
        return { ...user, totalScore, scores: userScores };
    });

    return usersWithScores.sort((a, b) => b.totalScore - a.totalScore);
});

// Lấy danh sách cột câu hỏi từ nguồn đáng tin cậy nhất là `contest.problems`
const problemIds = computed(() => {
  if (!contest.value?.problems) return [];
  return contest.value.problems.map(p => p.short_name);
});


// --- HELPER FUNCTIONS ---
const hasSolved = (detail) => detail && detail.time !== '' && detail.time !== null && detail.time !== undefined;

const getCellClass = (detail, problemShortName, teamId) => {
  if (!detail || (detail.tries === 0 && detail.pending_count === 0)) return 'neutral';
  if (firstSolveMap.value[problemShortName]?.teamId === teamId) return 'score-first';
  if (hasSolved(detail)) return 'score-correct';
  if (detail.pending_count > 0) return 'pending';
  return 'wrong';
};
</script>

<template>
  <div class="page-container">
    <HeaderContest />
    <div class="page-wrapper">
      <div class="content-card">
        <div class="header-container">
            <h1>Bảng xếp hạng - {{ contest?.name || contest?.contest.name || 'Đang tải...' }}</h1>
            <div class="underline"></div>
        </div>
        <div class="table-wrapper">
            <!-- ICPC Ranking Table -->
            <a-table
                v-if="contest && contestType === 'icpc'"
                class="ranking-table"
                :dataSource="sortedTeamsICPC"
                :rowKey="record => record.id"
                :pagination="false"
                :scroll="{ x: 'max-content' }"
                bordered
            >
                <a-table-column title="Hạng" key="rank" :width="80" fixed="left" align="center">
                    <template #default="{ index }">{{ index + 1 }}</template>
                </a-table-column>
                <a-table-column title="Tên đội" dataIndex="name" key="name" :width="250" fixed="left">
                     <template #default="{ record }">
                        <div class="team-info">
                            <div class="team-name">{{ record.name }}</div>
                            <div class="team-class">{{ record.description }}</div>
                        </div>
                     </template>
                </a-table-column>
                <a-table-column title="Tổng" dataIndex="score" key="score" :width="80" align="center" />
                <a-table-column title="Thời gian" dataIndex="time" key="time" :width="100" align="center" />
                <a-table-column
                    v-for="p in contest.problems"
                    :key="p.short_name"
                    :title="p.short_name"
                    align="center"
                >
                    <template #default="{ record }">
                        <div class="cell-content" :class="getCellClass(record.detail[p.short_name], p.short_name, record.id)">
                           <div v-if="hasSolved(record.detail[p.short_name])" class="solve-time">
                                {{ record.detail[p.short_name].time }}
                           </div>
                           <div class="try-count">
                                <template v-if="hasSolved(record.detail[p.short_name])">
                                    <span v-if="record.detail[p.short_name]?.tries > 0">
                                        {{ record.detail[p.short_name].tries }} {{ record.detail[p.short_name].tries > 1 ? 'tries' : 'try' }}
                                    </span>
                                </template>
                                <template v-else>
                                    <span v-if="record.detail[p.short_name]?.tries > 0">
                                        {{ record.detail[p.short_name].tries }} {{ record.detail[p.short_name].tries > 1 ? 'tries' : 'try' }}
                                    </span>
                                    <span v-if="record.detail[p.short_name]?.tries > 0 && record.detail[p.short_name]?.pending_count > 0">
                                        +
                                    </span>
                                    <span v-if="record.detail[p.short_name]?.pending_count > 0">
                                        {{ record.detail[p.short_name].pending_count }} pending
                                    </span>
                                </template>
                           </div>
                        </div>
                    </template>
                </a-table-column>
            </a-table>

            <!-- IOI Ranking Table -->
            <a-table
                v-else-if="contest && contestType === 'ioi'"
                class="ranking-table"
                :dataSource="rankedUsers"
                :rowKey="record => record.username"
                :pagination="false"
                :scroll="{ x: 'max-content' }"
                bordered
            >
                <a-table-column title="Hạng" key="rank" :width="80" align="center">
                    <template #default="{ index }">{{ index + 1 }}</template>
                </a-table-column>
                <a-table-column title="Họ tên" key="name" :width="200">
                    <template #default="{ record }">{{ record.last_name }} {{ record.first_name }}</template>
                </a-table-column>
                <a-table-column title="MSSV" dataIndex="username" key="username" :width="120" />
                <a-table-column title="Lớp" dataIndex="class" key="class" :width="120" />
                <a-table-column title="Tổng điểm" dataIndex="totalScore" key="totalScore" :width="120" align="center" />
                <a-table-column
                    v-for="problemId in problemIds"
                    :key="problemId"
                    :title="problemId"
                    align="center"
                >
                    <template #default="{ record }">
                        <span :class="{'score-positive': record.scores[problemId] > 0}">{{ record.scores[problemId] ?? '-' }}</span>
                    </template>
                </a-table-column>
            </a-table>

            <!-- Normal Ranking Table -->
            <a-table
                v-else-if="contest"
                class="ranking-table"
                :dataSource="rankedUsers"
                :rowKey="record => record.username"
                :pagination="false"
                :scroll="{ x: 'max-content' }"
                bordered
            >
                <a-table-column title="Hạng" key="rank" :width="80" align="center">
                    <template #default="{ index }">{{ index + 1 }}</template>
                </a-table-column>
                <a-table-column title="Họ tên" key="name" :width="250">
                     <template #default="{ record }">{{ record.last_name }} {{ record.first_name }}</template>
                </a-table-column>
                <a-table-column title="MSSV" dataIndex="username" key="username" :width="150" />
                <a-table-column title="Lớp" dataIndex="class" key="class" :width="150" />
                <a-table-column title="Tổng điểm" dataIndex="totalScore" key="totalScore" align="center" />
            </a-table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/*
  CSS cho trang Bảng xếp hạng - Chủ đề Neo-Futuristic Sáng
*/
.page-container {
  background-color: #F5F7FA;
  min-height: 100vh;
}
.page-wrapper {
  margin-top: 70px;
  padding: 24px;
}
.content-card {
  background-color: #FFFFFF;
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0, 90, 170, 0.1);
  border: 1px solid #D9E2EC;
  padding: 30px 40px;
  max-width: 1400px;
  margin: 0 auto;
}
.header-container {
  text-align: center;
  margin-bottom: 30px;
}
h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #007ACC;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.underline {
  width: 150px;
  height: 4px;
  margin: 8px auto 0 auto;
  background: linear-gradient(90deg, #00AFFF, #B3E5FC);
  border-radius: 2px;
}
.table-wrapper {
  width: 100%;
  overflow-x: auto;
}

/* === Ant Design Table Theming === */
.ranking-table :deep(.ant-table) {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #E8EFF5;
}
.ranking-table :deep(.ant-table-thead > tr > th) {
  background-color: #F0F5FA !important;
  color: #007ACC !important;
  font-weight: 600;
  text-align: center;
  text-transform: uppercase;
  padding: 12px 10px;
}
.ranking-table :deep(.ant-table-tbody > tr > td) {
  padding: 0; /* Remove padding for custom cell content */
  text-align: center;
  vertical-align: middle;
  border-bottom: 1px solid #E8EFF5;
}
.ranking-table :deep(.ant-table-tbody > tr.ant-table-row:hover > td) {
  background: rgba(0, 175, 255, 0.05) !important;
}
.ranking-table :deep(td.ant-table-cell-fix-left) {
    background: #fff;
}
.ranking-table :deep(.ant-table-tbody > tr.ant-table-row:hover > td.ant-table-cell-fix-left) {
  background: rgba(0, 175, 255, 0.05) !important;
}


/* === ICPC Specific Styles === */
.team-info { 
  text-align: left;
  padding: 10px;
  min-height: 50px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.team-name { font-weight: 600; font-size: 1rem; color: #2c3e50; }
.team-class { font-size: 0.85rem; color: #5a738e; }
.cell-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 50px;
  padding: 8px;
  color: black;
  font-weight: 500;
}
.solve-time { font-size: 1rem; font-weight: 600; }
.try-count { font-size: 0.8rem; }
.score-first { background-color: #2e7d32; color: white; }
.score-correct { background-color: #c8e6c9; }
.wrong { background-color: #ffcdd2; }
.pending { background-color: #bbdefb; }
.neutral { background-color: transparent; }


.score-positive {
    font-weight: 600;
    color: #2e7d32;
}

.ranking-table:not(:has(.cell-content)) :deep(.ant-table-tbody > tr > td) {
    padding: 10px;
}


/* === Responsive === */
@media (max-width: 768px) {
  .page-wrapper { padding: 15px; }
  .content-card { padding: 20px 15px; }
  h1 { font-size: 1.5rem; }
}
</style>
