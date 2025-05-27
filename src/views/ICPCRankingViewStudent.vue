<template>
  <HeaderContest />
  <div class="container">
    <h1>Ranking - {{ contest?.name || contest?.contest.name || 'Loading...' }}</h1>
    <div class="table-wrapper">
      <table v-if="contest && contestType === 'icpc'" id="ranking-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Team Name</th>
            <th>Total</th>
            <th>Time</th>
            <th v-for="p in contest.problems" :key="p.short_name">{{ p.short_name }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(team, index) in sortedTeams" :key="team.id">
            <td>{{ index + 1 }}</td>
            <td>
              <div class="team-info">
                <div class="team-name">{{ team.name }}</div>
                <div class="team-class">{{ team.description }}</div>
              </div>
            </td>
            <td>{{ team.score }}</td>
            <td>{{ team.time }}</td>
            <td
              v-for="p in contest.problems"
              :key="p.short_name"
              :class="getCellClass(team.detail[p.short_name], p.short_name, team.id)"
            >
              <div>
                <div v-if="hasSolved(team.detail[p.short_name])">
                  {{ team.detail[p.short_name].time }}
                </div>
                <div
                  v-if="(team.detail[p.short_name].tries + team.detail[p.short_name].pending_count) > 0"
                >
                  <template v-if="(team.detail[p.short_name].tries + team.detail[p.short_name].pending_count) >= 2">
                    {{ team.detail[p.short_name].tries + team.detail[p.short_name].pending_count }} tries
                  </template>
                  <template v-else>
                    {{ team.detail[p.short_name].tries }} try
                    <span v-if="team.detail[p.short_name].pending_count > 0">
                      + {{ team.detail[p.short_name].pending_count }} pending
                    </span>
                    
                  </template>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
            <!-- IOI Table -->
            <table
  v-if="contest && contestType === 'ioi'"
  id="ranking-table-ioi"
  class="ioi-ranking-table"
>
  <thead>
    <tr>
      <th>Hạng</th>
      <th>Họ tên</th>
      <th>MSSV</th>
      <th>Lớp</th>
      <th>Tổng điểm</th>
      <th
        v-for="problemId in problemIds"
        :key="problemId"
      >
        {{ problemId }}
      </th>
    </tr>
  </thead>
  <tbody>
    <tr
      v-for="(user, index) in contest.users?.data || []"
      :key="user.username"
    >
      <td>{{ index + 1 }}</td>
      <td>{{ user.last_name }} {{ user.first_name }}</td>
      <td>{{ user.username }}</td>
      <td>{{ user.class }}</td>
      <td>
        {{ problemIds.reduce((total, problemId) => {
          const score = contest.scores?.[user.username]?.[problemId] ?? 0;
          return total + score;
        }, 0) }}
      </td>
      <td
        v-for="problemId in problemIds"
        :key="`${user.username}-${problemId}`"
        :class="{
          'bg-green-500': contest.scores?.[user.username]?.[problemId] !== 0,
          'bg-transparent': contest.scores?.[user.username]?.[problemId] === 0
        }"
      >
        {{ contest.scores?.[user.username]?.[problemId] ?? '-' }}
      </td>
    </tr>
  </tbody>
</table>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import axiosInstance from '@/configs/axios'
import { useRoute } from 'vue-router'
import isEqual from 'lodash/isEqual'
import HeaderContest from '@/components/HeaderContest.vue'

const contest = ref(null)
const route = useRoute()
const contestId = sessionStorage.getItem('contest_id')


const fetchRanking = async () => {
  try {
    // Lấy dữ liệu xếp hạng
    const res = await axiosInstance.get(`contests/${contestId}/ranking`)
    const newRankingData = res.data.data

    if (!contest.value) {
      contest.value = newRankingData
    } else {
      // So sánh từng phần trước khi cập nhật để tránh re-render không cần thiết
      if (!isEqual(newRankingData.users, contest.value.users)) {
        contest.value.users = newRankingData.users
      }

      if (newRankingData.name !== contest.value.name) {
        contest.value.name = newRankingData.name
      }

      if (newRankingData.problemCount !== contest.value.problemCount) {
        contest.value.problemCount = newRankingData.problemCount
      }

      if (!isEqual(newRankingData.problems, contest.value.problems)) {
        contest.value.problems = newRankingData.problems
      }

      if (!isEqual(newRankingData.settings, contest.value.settings)) {
        contest.value.settings = newRankingData.settings
      }
    }

    // Lấy điểm từng bài nếu là chế độ IOI
    if (contestType.value === 'ioi') {
      const scoreRes = await axiosInstance.get(`contests/${contestId}/scores`)
      const newScores = scoreRes.data

      if (!isEqual(newScores, contest.value.scores)) {
        contest.value.scores = newScores
      }
    }
  } catch (error) {
    console.error('Error fetching ranking or scores:', error)
  }
}


const icpc = sessionStorage.getItem("contest_icpc");
const ioi = sessionStorage.getItem("contest_ioi");

const contestType = ref('')
if (icpc === "1" || icpc === "true") {
  contestType.value = "icpc";
} else if (ioi === "1" || ioi === "true") {
  contestType.value = "ioi";
}

let intervalId

onMounted(() => {
  fetchRanking()
  intervalId = setInterval(fetchRanking, 5000)
})

onUnmounted(() => {
  clearInterval(intervalId)
})

const firstSolveMap = computed(() => {
  if (!contest.value) return {}

  const map = {}

  for (const problem of contest.value.problems) {
    let minTime = Infinity
    let firstSolverId = null

    for (const team of contest.value.teams) {
      const detail = team.detail[problem.short_name]
      if (detail && detail.time && typeof detail.time === 'number') {
        if (detail.time < minTime) {
          minTime = detail.time
          firstSolverId = team.id
        }
      }
    }

    if (firstSolverId !== null) {
      map[problem.short_name] = {
        teamId: firstSolverId,
        time: minTime
      }
    }
  }

  return map
})


const hasSolved = (detail) => {
  return detail.time !== '' && detail.time !== null && detail.time !== undefined
}

const getCellClass = (detail, problemShortName, teamId) => {
  if (!detail || (detail.tries === 0 && detail.pending_count === 0)) return 'neutral'

  if (firstSolveMap.value[problemShortName]?.teamId === teamId) return 'score-first'
  if (hasSolved(detail)) return 'score-correct'
  if (detail.pending_count > 0 && (detail.tries + detail.pending_count) < 2) return 'pending'
  return 'wrong'
}

const sortedTeams = computed(() => {
  if (!contest.value) return []
  return [...contest.value.teams].sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score
    return a.time - b.time
  })
})

const problemIds = computed(() => {
  if (!contest.value?.scores) return []

  const allScores = Object.values(contest.value.scores)
  const firstScore = allScores[0]
  return firstScore ? Object.keys(firstScore) : []
})


</script>

<style scoped>
.container {
  background: white;
  padding: 20px;
  margin: 110px auto auto auto;
  border-radius: 8px;
  max-width: 1200px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

h1 {
  text-align: center;
  margin-bottom: 20px;
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;
}

table {
  width: 100%;
  min-width: 800px;
  border-collapse: collapse;
  border: 1px solid #ccc;
}

thead {
  background: #d13838;
  color: white;
}


td.correct,
td.wrong,
td.neutral {
  color: black;
  font-weight: medium;
  padding: 0;
}

.score-first {
  background: #2e7d32; /* dark green */
  color: white;
}

.score-correct {
  background: #a5d6a7; /* light green */
  color: black;
}

.wrong {
  background: #ef9a9a; /* red */
}

.pending {
  background: #7986cb; /* blue */
  color: white;
}

.neutral {
  background: #eeeeee; /* gray */
}

td > div {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 8px;
}

td > div div:first-child {
  font-size: 16px;
}

td > div div:last-child {
  font-size: 12px;
  font-weight: normal;
}

.team-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.2;
}

.team-name {
  font-weight: bold;
  font-size: 14px;
}

.team-class {
  font-size: 12px;
  color: #555;
}
th,
td {
  padding: 10px;
  border: 1px solid #ccc;
  text-align: center;
  min-width: 100px;
  border: 1px solid #ccc;
}

/* Cố định chiều rộng và vị trí */
th:nth-child(1),
td:nth-child(1) {
  width: 60px;
  min-width: 60px;
  max-width: 60px;
  position: sticky;
  left: 0;
  z-index: 3;
}

/* Team Name */
th:nth-child(2),
td:nth-child(2) {
  width: 200px;
  min-width: 200px;
  max-width: 200px;
  position: sticky;
  left: 60px;
  z-index: 2;
}

/* Total */
th:nth-child(3),
td:nth-child(3) {
  width: 80px;
  min-width: 80px;
  max-width: 80px;
  position: sticky;
  left: 260px;
  z-index: 2;
}

/* Time */
th:nth-child(4),
td:nth-child(4) {
  width: 80px;
  min-width: 80px;
  max-width: 80px;
  position: sticky;
  left: 340px;
  z-index: 2;
}

/* Giữ màu nền đỏ cho TH */
thead th:nth-child(1),
thead th:nth-child(2),
thead th:nth-child(3),
thead th:nth-child(4) {
  background: #bababa;
  color: rgb(46, 46, 46);
  font-weight: bold;
}

/* Đặt màu nền trắng cho TD */
tbody td:nth-child(1),
tbody td:nth-child(2),
tbody td:nth-child(3),
tbody td:nth-child(4) {
  background: white;
  color: black;
  font-weight: normal;
  border: 1px solid #ccc;
}

.ioi-ranking-table {
  width: 100%;
  border-collapse: collapse;
  font-family: Arial, sans-serif;
  color: #000;
}

.ioi-ranking-table thead tr {
  background-color: #bababa; /* giống bg-gray-200 */
}

.ioi-ranking-table th,
.ioi-ranking-table td {
  color: rgb(46, 46, 46);
  font-weight: bold;
  padding: 6px 8px;
  word-break: break-word;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border: 1px solid #ccc;
}

.ioi-ranking-table th:nth-child(2),
.ioi-ranking-table td:nth-child(2),
.ioi-ranking-table th:nth-child(3),
.ioi-ranking-table td:nth-child(3),
.ioi-ranking-table th:nth-child(4),
.ioi-ranking-table td:nth-child(4) {
  text-align: center;
  
}

.ioi-ranking-table td:nth-child(2),
.ioi-ranking-table td:nth-child(3),
.ioi-ranking-table td:nth-child(4) {
  max-width: 160px;
  font-weight: normal;
 }

.bg-green-500 {
  background-color: #48bb78; /* Màu xanh */
}

.bg-transparent {
  background-color: transparent; /* Màu trong suốt */
}

</style>
