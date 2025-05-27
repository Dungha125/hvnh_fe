<script setup>
import HeaderContest from "../components/HeaderContest.vue";
import { computed, onBeforeMount, reactive, ref, watch } from "vue";
import { UserOutlined } from "@ant-design/icons-vue";
import axios from "@/configs/axios.js";
import { usePagination } from "vue-request";
import { useRouter, useRoute } from "vue-router";
import { message } from "ant-design-vue";

const isLoading = ref(true);
const router = useRouter();
const currentCourse = ref(
  JSON.parse(localStorage.getItem("currentCourse") || "{}")
);
const route = useRoute();
const contestId = route.params.id;
const top3 = reactive([]);
const leaderboard = reactive([]);
const listStudyingCourses = ref([]);
const typeContest = reactive(null);

onBeforeMount(async () => {
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  if ((currentUser && currentUser.member_group !== 2) || !currentCourse) {
    router.push("/not-found");
  }
  await fetchRankingData(contestId);
});

const fetchRankingData = async (contestID) => {
  isLoading.value = true;

  top3.splice(0, top3.length);
  leaderboard.splice(0, leaderboard.length);

  await axios
    .get(`contests/${contestID}/ranking`)
    .then((response) => {
      isLoading.value = false;
      const users = response.data.data.users.data;
      if (response.data.data.icpc || response.data.data.ioi) {
        typeContest.value = response.data.data.icpc ? "ICPC" : "IOI";
      } 
      for (let i = 0; i < Math.min(3, users.length); i++) {
        top3.push({
          id: users[i].id,
          username: users[i].username,
          name: users[i].last_name + " " + users[i].first_name,
          avatar: users[i].profile_picture,
          solved: users[i].solved,
          tried: users[i].tried,
          subjectClass: users[i].subject_name + " - " + users[i].course_name,
        });
      }

      for (let i = 0; i < users.length; i++) {
        leaderboard.push({
          stt: i + 1,
          id: users[i].id,
          username: users[i].username,
          name: users[i].last_name + " " + users[i].first_name,
          avatar: users[i].profile_picture,
          solved: users[i].solved,
          tried: users[i].tried,
          subjectClass: users[i].subject_name + " - " + users[i].course_name,
          class: users[i].class,
        });
      }
    })
    .catch((error) => {
      console.log(error);
    })
    .finally(() => {
      isLoading.value = false;
    });
};

const onClick = ({ key }) => {
  currentCourse.value = listStudyingCourses.value.find(
    (course) => course.id === key
  );
  localStorage.setItem("currentCourse", JSON.stringify(currentCourse.value));
  run();
};

watch(currentCourse, async () => {
  await fetchRanking();
  run();
});

const queryData = async (params) => {
  return leaderboard;
};

const {
  data: dataSource,
  run,
  loading,
  current,
  pageSize,
} = usePagination(queryData, {
  formatResult: (res) => {
    return Array.isArray(res) ? res : [];
  },
  pagination: {
    currentKey: "page",
    pageSizeKey: "results",
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
  <a-spin :spinning="isLoading">
    <div
      style="
        display: flex;
        justify-content: center;
        margin-top: 20px;
        flex-direction: column;
        align-items: center;
      "
    >
      <div style="width: 93%; margin-bottom: 20px; color: black">
        <h2>Bảng xếp hạng</h2>
        <div class="underline"></div>
      </div>
      <div class="ranking">
        <div
          style="
            display: flex;
            justify-content: space-between;
            align-items: center;
          "
        >
          <div v-if="currentCourse">
            <h2 style="color: #a7453c">
              {{ currentCourse?.subject?.name }} - Nhóm
              {{ currentCourse?.name }}
            </h2>
          </div>
        </div>
        <div class="top-3">
          <a-card
            class="card-top-3"
            hoverable
            style="margin-top: 30px; background-color: #ececec"
            :loading="isLoading"
          >
            <div
              style="
                display: flex;
                align-items: center;
                justify-content: center;
              "
            >
              <img src="../static/img/top2.svg" alt="" />
              <a-avatar
                :src="top3[1]?.avatar"
                style="position: absolute; vertical-align: middle"
                :size="56"
              >
                <UserOutlined />
              </a-avatar>
            </div>
            <p style="font-size: 16px">{{ top3[1]?.name }}</p>
            <p style="font-size: 12px; color: #737374">
              {{ top3[1]?.username }}
            </p>
            <p style="font-size: 10px">{{ top3[1]?.subjectClass }}</p>
            <div
              style="
                display: flex;
                justify-content: center;
                margin-top: 10px;
                align-items: center;
              "
            >
              <div style="text-align: center; margin-right: 16px">
                <p style="color: #159714; font-size: 20px; margin: 0">
                  {{ top3[1]?.solved }}
                </p>
                <p style="margin: 0">Làm đúng</p>
              </div>
              <div class="divider"></div>
              <div style="text-align: center; margin-left: 16px">
                <p style="color: #164096; font-size: 20px; margin: 0">
                  {{ top3[1]?.tried }}
                </p>
                <p style="margin: 0">Đã nộp</p>
              </div>
            </div>
          </a-card>

          <a-card
            class="card-top-3"
            hoverable
            style="margin-left: 50px; background-color: #fff471"
            :loading="isLoading"
          >
            <div
              style="
                display: flex;
                align-items: center;
                justify-content: center;
              "
            >
              <img src="../static/img/top1.svg" alt="" />
              <a-avatar
                :src="top3[0]?.avatar"
                style="position: absolute"
                :size="56"
              >
                <UserOutlined />
              </a-avatar>
            </div>
            <p style="font-size: 16px">{{ top3[0]?.name }}</p>
            <p style="font-size: 12px; color: #737374">
              {{ top3[0]?.username }}
            </p>
            <p style="font-size: 10px">{{ top3[0]?.subjectClass }}</p>
            <div
              style="
                display: flex;
                justify-content: center;
                margin-top: 10px;
                align-items: center;
              "
            >
              <div style="text-align: center; margin-right: 16px">
                <p style="color: #159714; font-size: 20px; margin: 0">
                  {{ top3[0]?.solved }}
                </p>
                <p style="margin: 0">Làm đúng</p>
              </div>
              <div class="divider"></div>
              <div style="text-align: center; margin-left: 16px">
                <p style="color: #164096; font-size: 20px; margin: 0">
                  {{ top3[0]?.tried }}
                </p>
                <p style="margin: 0">Đã nộp</p>
              </div>
            </div>
          </a-card>

          <a-card
            class="card-top-3"
            hoverable
            style="
              margin-left: 50px;
              margin-top: 30px;
              background-color: #fbe0b5;
            "
            :loading="isLoading"
          >
            <div
              style="
                display: flex;
                align-items: center;
                justify-content: center;
              "
            >
              <img src="../static/img/top3.svg" alt="" />
              <a-avatar
                :src="top3[2]?.avatar"
                style="position: absolute"
                :size="56"
              >
                <UserOutlined />
              </a-avatar>
            </div>
            <p style="font-size: 16px">{{ top3[2]?.name }}</p>
            <p style="font-size: 12px; color: #737374">
              {{ top3[2]?.username }}
            </p>
            <p style="font-size: 10px">{{ top3[2]?.subjectClass }}</p>
            <div
              style="
                display: flex;
                justify-content: center;
                margin-top: 10px;
                align-items: center;
              "
            >
              <div style="text-align: center; margin-right: 16px">
                <p style="color: #159714; font-size: 20px; margin: 0">
                  {{ top3[2]?.solved }}
                </p>
                <p style="margin: 0">Làm đúng</p>
              </div>
              <div class="divider"></div>
              <div style="text-align: center; margin-left: 16px">
                <p style="color: #164096; font-size: 20px; margin: 0">
                  {{ top3[2]?.tried }}
                </p>
                <p style="margin: 0">Đã nộp</p>
              </div>
            </div>
          </a-card>
        </div>

        <div class="table-container">
          <a-table
            :row-key="genUuid()"
            :data-source="dataSource"
            :pagination="pagination"
            :loading="isLoading"
            @change="handleTableChange"
          >
            <a-table-column data-index="stt" width="8%">
              <template #title>
                <span style="font-weight: bold">STT</span>
              </template>
            </a-table-column>

            <a-table-column width="20%" data-index="username">
              <template #title>
                <span style="font-weight: bold">Tài khoản</span>
              </template>
            </a-table-column>

            <a-table-column width="20%" data-index="name">
              <template #title>
                <span style="font-weight: bold">Họ và tên</span>
              </template>
            </a-table-column>

            <a-table-column data-index="subjectClass">
              <template #title>
                <span style="font-weight: bold">Lớp học</span>
              </template>
            </a-table-column>

            <a-table-column width="15%" data-index="class">
              <template #title>
                <span style="font-weight: bold">Lớp</span>
              </template>
            </a-table-column>

            <a-table-column width="10%" data-index="solved">
              <template #title>
                <span style="font-weight: bold">Làm đúng</span>
              </template>
            </a-table-column>

            <a-table-column width="10%" data-index="tried">
              <template #title>
                <span style="font-weight: bold">Đã thử</span>
              </template>
            </a-table-column>
          </a-table>
          <a-config-provider
            :theme="{
              token: {
                colorPrimary: '#A7453C',
                colorTextHeading: '#000000',
                colorText: '#A7453C',
                colorBorderSecondary: 'rgba(186,151,147,0.45)',
              },
            }"
          />
        </div>
      </div>
    </div>
  </a-spin>
</template>

<style scoped>
template {
  height: 100vh;
}

.ranking {
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 93%;
  background-color: rgba(255, 255, 255, 0.35);
  border-radius: 10px;
  box-shadow: 2px 10px 20px rgba(0, 0, 0, 0.2);
  padding: 30px;
  margin-bottom: 5%;
}

.top-3 {
  display: flex;
  justify-content: center;
}

.card-top-3 {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 260px;
  height: 300px;
  box-shadow: 0 4px 8px rgba(172, 129, 129, 0.25);
}

.card-top-3 p {
  text-align: center;
  margin: 0;
}

.divider {
  width: 1px;
  height: 35px;
  background-color: gray;
  margin: 0 16px;
}

.group-icon-container {
  display: flex;
  align-items: center;
}

.table-container {
  margin-top: 30px;
}

.underline {
  width: 100%;
  height: 1px;
  margin-top: 5px;
  background-color: #cacaca;
}

h2 {
  font-size: 1.3rem;
  font-weight: 600;
  color: black;
}

.table-container {
  margin-top: 20px;
  flex: 1;
}

.group-icon {
  color: rgb(115, 115, 116);
  display: flex;
  align-items: center;
}

.group-icon:hover {
  cursor: pointer;
  color: #a7453c;
}

.group-icon:hover p {
  cursor: pointer;
  color: #a7453c;
}

.group-icon:hover img {
  filter: invert(32%) sepia(64%) saturate(506%) hue-rotate(330deg)
    brightness(70%) contrast(95%);
}

.group-icon-container p {
  margin-top: 12px;
}
</style>
