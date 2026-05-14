<script setup>
import LecturerHeader from "@/components/LecturerHeader.vue";
import { computed, onBeforeMount, reactive, ref, watch } from "vue";
import { UserOutlined, DownloadOutlined } from "@ant-design/icons-vue";
import axios from "@/configs/axios.js";
import axiosCmc from "axios";
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
const exporting = ref(false);
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
  await fetchRankingData(contestId);
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
  size: 'small',
}));

const rowKey = (row) => `${row.id}-${row.stt}`;

const handleTableChange = (pag, filters, sorter) => {
  run({
    results: pag.pageSize,
    page: pag?.current,
    sortField: sorter.field,
    sortOrder: sorter.order,
    ...filters,
  });
};

async function exportContestPractice() {
  const id = route.params.id;
  if (id == null || id === "") {
    message.error("Không xác định được bài thực hành.");
    return;
  }
  exporting.value = true;
  try {
    const token = localStorage.getItem("access_token");
    const res = await axiosCmc.get(
      `https://cmc.tiennv.com/api/contests/${id}/export`,
      {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "Content-Type": "application/json",
          Accept: "*/*",
        },
        responseType: "blob",
      }
    );
    const blob = res.data;
    const ct = (res.headers["content-type"] || "").toLowerCase();
    if (ct.includes("application/json")) {
      const text = await blob.text();
      const j = JSON.parse(text);
      throw new Error(j?.message || "Xuất thất bại");
    }
    let filename = `contest_${id}_export`;
    const cd = res.headers["content-disposition"];
    if (cd) {
      const m = cd.match(/filename\*=UTF-8''([^;\s]+)|filename="?([^";\n]+)"?/i);
      const raw = m?.[1] || m?.[2];
      if (raw) {
        try {
          filename = decodeURIComponent(raw.replace(/\+/g, " "));
        } catch {
          filename = raw;
        }
      }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    message.success("Đã tải xuống bài thực hành.");
  } catch (e) {
    let msg = e?.message || "Xuất bài thực hành thất bại.";
    const data = e?.response?.data;
    if (data instanceof Blob) {
      try {
        const t = await data.text();
        const j = JSON.parse(t);
        msg = j?.message || msg;
      } catch {
        /* ignore */
      }
    } else if (e?.response?.data?.message) {
      msg = e.response.data.message;
    }
    message.error(msg);
  } finally {
    exporting.value = false;
  }
}
</script>

<template>
  <div class="ranking-page">
    <LecturerHeader />
    <a-config-provider
      :theme="{
        token: {
          colorPrimary: '#007ACC',
          colorLink: '#007ACC',
        },
      }"
    >
      <a-spin :spinning="isLoading" class="content-spin">
        <div class="page-wrapper">
          <div class="ranking-page-header">
            <div class="header-titles">
              <h1 class="page-title">Bảng xếp hạng</h1>
              <div class="title-underline" />
            </div>
            <a-button
              type="primary"
              class="export-btn"
              :loading="exporting"
              @click="exportContestPractice"
            >
              <template #icon><DownloadOutlined /></template>
              Xuất bài thực hành
            </a-button>
          </div>

          <div class="ranking content-card">
            <div v-if="currentCourse?.subject" class="course-title-row">
              <h2 class="course-title">
                {{ currentCourse.subject.name }} — Nhóm {{ currentCourse.name }}
              </h2>
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
            :row-key="rowKey"
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
        </div>
          </div>
        </div>
      </a-spin>
    </a-config-provider>
  </div>
</template>

<style scoped>
.ranking-page {
  min-height: 100vh;
  background-color: #f5f7fa;
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
}

.content-spin {
  display: block;
  min-height: calc(100vh - 70px);
}

.page-wrapper {
  max-width: 1600px;
  margin: 0 auto;
  padding: 24px;
  padding-top: 90px;
}

.ranking-page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
}

.header-titles {
  flex: 1;
  min-width: 200px;
}

.page-title {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: #007acc;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.title-underline {
  width: 100%;
  max-width: 320px;
  height: 3px;
  margin-top: 8px;
  border-radius: 2px;
  background: linear-gradient(90deg, #00afff, #b3e5fc);
}

.export-btn {
  font-weight: 600;
}

.content-card.ranking {
  width: 100%;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #d9e2ec;
  box-shadow: 0 4px 15px rgba(0, 90, 170, 0.08);
  padding: 28px 24px 32px;
  margin-bottom: 48px;
}

.course-title-row {
  margin-bottom: 20px;
}

.course-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 600;
  color: #33475b;
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

.table-container {
  margin-top: 28px;
}

.table-container :deep(.ant-table) {
  border: 1px solid #e8eff5;
  border-radius: 8px;
  overflow: hidden;
}

.table-container :deep(.ant-table-thead > tr > th) {
  background-color: #f0f5fa !important;
  color: #007acc !important;
  font-weight: 600;
  text-align: center;
}

.table-container :deep(.ant-table-tbody > tr > td) {
  color: #33475b;
}

.table-container :deep(.ant-table-tbody > tr:hover > td) {
  background: rgba(0, 175, 255, 0.06) !important;
}

.group-icon-container {
  display: flex;
  align-items: center;
}

.group-icon {
  color: #5a738e;
  display: flex;
  align-items: center;
}

.group-icon:hover {
  cursor: pointer;
  color: #007acc;
}

.group-icon:hover p {
  cursor: pointer;
  color: #007acc;
}

.group-icon:hover img {
  filter: invert(33%) sepia(83%) saturate(612%) hue-rotate(190deg) brightness(60%)
    contrast(95%);
}

.group-icon-container p {
  margin-top: 12px;
}

@media (max-width: 992px) {
  .page-wrapper {
    padding: 16px;
    padding-top: 80px;
  }
}
</style>
