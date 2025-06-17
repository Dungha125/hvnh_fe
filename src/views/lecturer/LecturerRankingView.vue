<script setup>
import {computed, onBeforeMount, reactive, ref, watch} from "vue";
import {UserOutlined} from '@ant-design/icons-vue';
import axios from "@/configs/axios.js";
import {usePagination} from "vue-request";
import {useRouter} from "vue-router";
import {message} from "ant-design-vue";
import LecturerHeader from "@/components/LecturerHeader.vue";

const isLoading = ref(true);
const router = useRouter();
const currentCourse = ref(JSON.parse(localStorage.getItem('currentCourse') || '{}'));
const top3 = reactive([]);
const leaderboard = reactive([]);
const listStudyingCourses = ref([]);
const groupList = reactive([]);

onBeforeMount(async () => {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  if ((currentUser && currentUser.member_group !== 2) || !currentCourse) {
    router.push('/not-found');
  }

  await axios.get('courses/studying').then(async (response) => {
    listStudyingCourses.value = response.data.data;

    if (listStudyingCourses.value.length > 0) {
      if (localStorage.getItem('currentCourse')) {
        currentCourse.value = JSON.parse(localStorage.getItem('currentCourse'));
      } else {
        currentCourse.value = listStudyingCourses.value[0];
        localStorage.setItem('currentCourse', JSON.stringify(currentCourse.value));
      }

      listStudyingCourses.value.forEach(course => {
        groupList.push({
          id: course.id,
          name: course?.subject.name + '- Nhóm ' + course.name
        });
      });
    } else {
      message.error('Bạn chưa tham gia vào nhóm học nào!');
    }
  }).catch(error => {
    console.log(error);
  });

  isLoading.value = false;
});

const fetchRanking = async () => {
  if (listStudyingCourses.value.length === 0)
    return;

  isLoading.value = true;

  top3.splice(0, top3.length);
  leaderboard.splice(0, leaderboard.length);

  await axios.get(`ranking?course_id=${currentCourse.value.id}&subject_id=${currentCourse.value.subject.id}&semester_id=${currentCourse.value.semester.id}`).then(response => {
    isLoading.value = false;
    const users = response.data.data.users.data;

    for (let i = 0; i < Math.min(3, users.length); i++) {
      top3.push({
        id: users[i].id,
        username: users[i].username,
        name: users[i].last_name + ' ' + users[i].first_name,
        avatar: users[i].profile_picture,
        solved: users[i].solved,
        tried: users[i].tried,
        subjectClass: users[i].subject_name + ' - ' + users[i].course_name,
      });
    }

    for (let i = 0; i < users.length; i++) {
      leaderboard.push({
        stt: i + 1,
        id: users[i].id,
        username: users[i].username,
        name: users[i].last_name + ' ' + users[i].first_name,
        avatar: users[i].profile_picture,
        solved: users[i].solved,
        tried: users[i].tried,
        subjectClass: users[i].subject_name + ' - ' + users[i].course_name,
        class: users[i].class,
      });
    }
  }).catch(error => {
    console.log(error);
  }).finally(() => {
    isLoading.value = false;
  });
}

const onClick = ({key}) => {
  currentCourse.value = listStudyingCourses.value.find(course => course.id === key);
  localStorage.setItem('currentCourse', JSON.stringify(currentCourse.value));
  run();
};

watch(currentCourse, async () => {
  await fetchRanking();
  run();
});

const queryData = async params => {
  return leaderboard;
};

const {data: dataSource, run, loading, current, pageSize} = usePagination(queryData, {
  formatResult: res => {
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
</script>

<template>
  <LecturerHeader/>

  <a-spin :spinning="isLoading">
    <div style="display: flex; justify-content: center; margin-top: 110px; flex-direction: column; align-items: center">
      <div style="width: 93%; margin-bottom: 20px; color: black">
        <h2>Bảng xếp hạng</h2>
        <div class="underline"></div>
      </div>
      <div class="ranking-content">

          <!-- Phần bộ lọc -->
          <div class="filter-container">
            <div v-if="currentCourse" class="course-info">
              <h3>{{currentCourse?.subject?.name}} - Nhóm {{currentCourse?.name}}</h3>
            </div>
            <div class="group-icon-container">
              <a-dropdown :arrow="{ pointAtCenter: true }" placement="bottom">
                <a class="ant-dropdown-link" @click.prevent>
                  <div class="group-icon">
                    <img src="../../static/img/group_icon.svg" alt="Group Icon">
                    <p>Nhóm</p>
                    <img src="../../static/img/dropdown_icon.svg" alt="Dropdown Icon">
                  </div>
                </a>
                <template #overlay>
                  <a-menu @click="onClick">
                    <a-menu-item v-for="group in groupList" :key="group.id">{{ group.name }}</a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </div>
          </div>

          <!-- Phần Top 3 -->
          <div class="top-3">
            <!-- Hạng 2 -->
            <div class="card-top-3 rank-2" v-if="top3[1]">
              <div class="rank-badge">#2</div>
              <a-avatar :src="top3[1]?.avatar" :size="80">
                <template #icon><UserOutlined/></template>
              </a-avatar>
              <p class="username">{{ top3[1]?.name }}</p>
              <p class="user-id">{{ top3[1]?.username }}</p>
              <div class="stats">
                <div class="stat-item">
                  <p class="stat-value solved">{{ top3[1]?.solved }}</p>
                  <p class="stat-label">Làm đúng</p>
                </div>
                <div class="stat-divider"></div>
                <div class="stat-item">
                  <p class="stat-value tried">{{ top3[1]?.tried }}</p>
                  <p class="stat-label">Đã nộp</p>
                </div>
              </div>
            </div>
            <!-- Hạng 1 -->
            <div class="card-top-3 rank-1" v-if="top3[0]">
              <img class="crown-icon" src="../../static/img/top1.svg" alt="Top 1 Crown"/>
              <div class="rank-badge">#1</div>
              <a-avatar :src="top3[0]?.avatar" :size="100">
                 <template #icon><UserOutlined/></template>
              </a-avatar>
              <p class="username">{{ top3[0]?.name }}</p>
              <p class="user-id">{{ top3[0]?.username }}</p>
              <div class="stats">
                <div class="stat-item">
                  <p class="stat-value solved">{{ top3[0]?.solved }}</p>
                  <p class="stat-label">Làm đúng</p>
                </div>
                <div class="stat-divider"></div>
                <div class="stat-item">
                  <p class="stat-value tried">{{ top3[0]?.tried }}</p>
                  <p class="stat-label">Đã nộp</p>
                </div>
              </div>
            </div>
            <!-- Hạng 3 -->
            <div class="card-top-3 rank-3" v-if="top3[2]">
              <div class="rank-badge">#3</div>
              <a-avatar :src="top3[2]?.avatar" :size="80">
                 <template #icon><UserOutlined/></template>
              </a-avatar>
              <p class="username">{{ top3[2]?.name }}</p>
              <p class="user-id">{{ top3[2]?.username }}</p>
              <div class="stats">
                <div class="stat-item">
                  <p class="stat-value solved">{{ top3[2]?.solved }}</p>
                  <p class="stat-label">Làm đúng</p>
                </div>
                <div class="stat-divider"></div>
                <div class="stat-item">
                  <p class="stat-value tried">{{ top3[2]?.tried }}</p>
                  <p class="stat-label">Đã nộp</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Bảng xếp hạng chi tiết -->
          <div class="table-container">
            <a-table
                :row-key="genUuid()"
                :data-source="dataSource"
                :pagination="pagination"
                :loading="isLoading"
                @change="handleTableChange"
                :scroll="{ x: 'max-content' }"
            >
              <a-table-column title="STT" data-index="stt" width="8%" />
              <a-table-column title="Tài khoản" data-index="username" width="20%" />
              <a-table-column title="Họ và tên" data-index="name" width="20%" />
              <a-table-column title="Lớp học" data-index="subjectClass" />
              <a-table-column title="Lớp" data-index="class" width="15%" />
              <a-table-column title="Làm đúng" data-index="solved" width="10%" />
              <a-table-column title="Đã thử" data-index="tried" width="10%" />
            </a-table>
          </div>
        </div>
      </div>
    </a-spin>
</template>

<style scoped>
/*
  CSS cho trang Xếp hạng - Chủ đề Neo-Futuristic Sáng
  Đã bao gồm các điều chỉnh để responsive trên di động.
*/
.ranking-page {
  background-color: #F5F7FA;
  min-height: 100vh;
}

.page-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 90px;
  padding: 24px;
}

/* === Phần Tiêu đề === */
.title-container {
  width: 100%;
  max-width: 1200px;
  margin-bottom: 20px;
}

h2 {
  font-size: 1.8rem;
  font-weight: 700;
  color: #007ACC;
  text-align: left; /* Căn trái tiêu đề */
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

/* === Khung nội dung chính === */
.ranking-content {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1200px;
  background-color: #FFFFFF;
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0, 90, 170, 0.1);
  border: 1px solid #D9E2EC;
  padding: 30px 40px;
}

/* === Phần bộ lọc === */
.filter-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap; /* Cho phép xuống dòng trên màn hình nhỏ */
  gap: 16px;
  margin-bottom: 30px;
}
.course-info h3 {
  font-size: 1.2rem;
  color: #006BB3;
  margin: 0;
}
.group-icon-container {
  display: flex;
  align-items: center;
}
.group-icon {
  color: #5A738E;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.group-icon:hover, .group-icon:hover p {
  color: #00AFFF;
}
.group-icon img {
  filter: opacity(0.7);
}
.group-icon:hover img {
  filter: brightness(0) saturate(100%) invert(72%) sepia(99%) saturate(4463%) hue-rotate(165deg) brightness(102%) contrast(104%);
}
.group-icon p {
  margin: 0;
  font-weight: 600;
}

/* === Thẻ xếp hạng Top 3 === */
.top-3 {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 20px;
  margin-bottom: 40px;
  flex-wrap: wrap;
}

.card-top-3 {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 280px;
  padding: 20px;
  border-radius: 12px;
  background-color: #F8F9FB;
  border: 2px solid transparent;
  box-shadow: 0 4px 10px rgba(0, 90, 170, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  position: relative;
  text-align: center;
}
.card-top-3:hover {
  transform: translateY(-10px);
  box-shadow: 0 10px 25px rgba(0, 90, 170, 0.15);
}

.card-top-3.rank-1 {
  width: 300px;
  padding-top: 25px;
  padding-bottom: 25px;
  border-color: #FFD700;
  box-shadow: 0 0 25px rgba(255, 215, 0, 0.4);
}
.card-top-3.rank-2 { border-color: #C0C0C0; }
.card-top-3.rank-3 { border-color: #CD7F32; }

.crown-icon {
    position: absolute;
    top: -25px;
    width: 50px;
    height: 50px;
}
.card-top-3 .rank-badge {
  position: absolute;
  top: 10px;
  right: 15px;
  font-size: 24px;
  font-weight: bold;
  opacity: 0.2;
}
.card-top-3.rank-1 .rank-badge { color: #FFD700; }
.card-top-3.rank-2 .rank-badge { color: #C0C0C0; }
.card-top-3.rank-3 .rank-badge { color: #CD7F32; }

.card-top-3 .username {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
  margin-top: 10px;
}
.card-top-3 .user-id {
  font-size: 0.9rem;
  color: #5a738e;
}
.stats {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 10px;
  gap: 16px;
}
.stat-item { text-align: center; }
.stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0;
}
.stat-value.solved { color: #52c41a; }
.stat-value.tried { color: #1677ff; }
.stat-label {
    margin: 0;
    font-size: 0.85rem;
    color: #5a738e;
}
.stat-divider {
    width: 1px;
    height: 35px;
    background-color: #d9e2ec;
}

/* === Bảng xếp hạng chi tiết === */
.table-container {
  margin-top: 30px;
}

/* === RESPONSIVE CHO THIẾT BỊ DI ĐỘNG === */
@media (max-width: 768px) {
  .page-wrapper {
    padding: 15px;
  }
  .ranking-content {
    padding: 20px 15px;
  }
  h2 { font-size: 1.5rem; }
  .underline { margin-bottom: 20px; }
  .top-3 {
    flex-direction: column;
    align-items: center;
    gap: 15px;
    margin-bottom: 30px;
  }
  .card-top-3.rank-1 { order: 1; }
  .card-top-3.rank-2 { order: 2; }
  .card-top-3.rank-3 { order: 3; }
  .card-top-3, .card-top-3.rank-1 {
    width: 100%;
    max-width: 320px;
    padding: 20px;
  }
  .card-top-3:hover { transform: translateY(-5px); }
  .filter-container { justify-content: center; }
}
</style>
