<script setup>
import { ref, onBeforeMount, watch } from "vue";
import { useRoute } from "vue-router";
import axiosInstance from "@/configs/axios.js";
import LecturerHeader from "@/components/LecturerHeader.vue";
import { message } from "ant-design-vue";
import dayjs from "dayjs";

const route = useRoute();

/** Đổi path nếu backend dùng tên khác, ví dụ: `/contests/${id}/activities` */
const activityListUrl = (contestId) =>
  `/contests/${contestId}/activity_logs`;

const loading = ref(false);
const searchText = ref("");
const rows = ref([]);
const pagination = ref({
  current: 1,
  pageSize: 50,
  total: 0,
});

const columns = [
  { title: "STT", dataIndex: "stt", key: "stt", width: 72 },
  { title: "Thông tin", dataIndex: "info", key: "info", ellipsis: true },
  { title: "Tài khoản", dataIndex: "account", key: "account", width: 140 },
  { title: "Địa chỉ IP", dataIndex: "ip", key: "ip", width: 140 },
  { title: "Trình duyệt", dataIndex: "browser", key: "browser", ellipsis: true },
  { title: "Thời gian", dataIndex: "time", key: "time", width: 180 },
];

const mapActivityRow = (raw, index, page, pageSize) => {
  const t =
    raw.created_at ??
    raw.time ??
    raw.logged_at ??
    raw.timestamp ??
    "";
  return {
    key: raw.id ?? `${page}-${index}`,
    stt: (page - 1) * pageSize + index + 1,
    info:
      raw.message ??
      raw.info ??
      raw.action ??
      raw.description ??
      raw.content ??
      raw.detail ??
      "",
    account:
      raw.username ??
      raw.account ??
      raw.user?.username ??
      raw.user_account ??
      "",
    ip: raw.ip ?? raw.ip_address ?? raw.remote_addr ?? "",
    browser: raw.user_agent ?? raw.browser ?? raw.agent ?? "",
    time: t ? dayjs(t).format("YYYY-MM-DD HH:mm:ss") : "",
  };
};

const parseList = (root) => {
  if (Array.isArray(root?.data)) return root.data;
  if (root?.data?.data && Array.isArray(root.data.data)) return root.data.data;
  return [];
};

const fetchActivities = async (page = 1) => {
  const id = route.params.id;
  if (!id) return;
  loading.value = true;
  try {
    const response = await axiosInstance.get(activityListUrl(id), {
      params: {
        page,
        per_page: pagination.value.pageSize,
        s: searchText.value?.trim() || undefined,
      },
    });
    const root = response.data || {};
    const list = parseList(root);
    const currentPage = Number(root.current_page) || page;
    const perPage = Number(root.per_page) || pagination.value.pageSize;
    const total = Number(root.total);
    const pageForStt = Number.isFinite(currentPage) ? currentPage : page;
    const sizeForStt = Number.isFinite(perPage) && perPage > 0 ? perPage : pagination.value.pageSize;

    rows.value = list.map((item, index) =>
      mapActivityRow(item, index, pageForStt, sizeForStt)
    );
    pagination.value.current = pageForStt;
    pagination.value.pageSize = sizeForStt;
    pagination.value.total = Number.isFinite(total) ? total : list.length;
  } catch (error) {
    console.error(error);
    message.error(
      error.response?.data?.message ||
        "Không tải được nhật ký hoạt động. Kiểm tra endpoint API."
    );
    rows.value = [];
    pagination.value.total = 0;
  } finally {
    loading.value = false;
  }
};

const handleTableChange = (pag) => {
  const p = pag && typeof pag === "object" ? pag : {};
  const next =
    typeof p.current === "number" ? p.current : pagination.value.current;
  const nextSize =
    typeof p.pageSize === "number"
      ? p.pageSize
      : pagination.value.pageSize;
  const sizeChanged = nextSize !== pagination.value.pageSize;
  pagination.value.pageSize = nextSize;
  pagination.value.current = sizeChanged ? 1 : next;
  fetchActivities(pagination.value.current);
};

const onSearch = () => {
  pagination.value.current = 1;
  fetchActivities(1);
};

onBeforeMount(() => {
  fetchActivities(1);
});

watch(
  () => route.params.id,
  () => {
    pagination.value.current = 1;
    fetchActivities(1);
  }
);
</script>

<template>
  <LecturerHeader />
  <a-card
    title="Hoạt động"
    style="width: 100%; max-width: 1400px; margin: 70px auto 0; padding-top: 8px"
  >
    <template #extra>
      <a-input-search
        v-model:value="searchText"
        allow-clear
        placeholder="Tìm theo hoạt động, ..."
        style="width: 280px"
        enter-button
        @search="onSearch"
      />
    </template>
    <a-table
      :columns="columns"
      :data-source="rows"
      :row-key="(r) => r.key"
      :pagination="pagination"
      :loading="loading"
      :scroll="{ x: 960 }"
      @change="handleTableChange"
    />
  </a-card>
</template>

<style scoped>
:deep(.ant-card-head-title) {
  font-weight: 600;
  font-size: 18px;
}
</style>
