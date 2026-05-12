<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, computed, watch, h } from 'vue';
import { usePagination } from 'vue-request';
import axios from "@/configs/axios.js";
import { message } from "ant-design-vue";
import { SearchOutlined, EyeOutlined, SendOutlined } from "@ant-design/icons-vue";
import AdminHeader from "@/components/AdminHeader.vue";
import dayjs from "dayjs";
import { useRouter } from 'vue-router';

const router = useRouter();
const isModalVisible = ref(false);
const selectedSupport = ref(null);
const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
let intervalId = null;

const replyContent = ref('');
const isReplying = ref(false);

const searchQuery = ref('');
const statusFilter = ref(null);

const statusOptions = [
    { value: 0, label: 'Mới' },
    { value: 1, label: 'Đang xử lý' },
    { value: 2, label: 'Đã đóng' }
];

const fetchSupports = async (params = {}) => {
    try {
        const response = await axios.get('/supports', { params });
        if (response.data && response.data.code === 200 && Array.isArray(response.data.data)) {
            const resultData = response.data;
            return {
                list: resultData.data.map((item, index) => ({
                    ...item,
                    stt: (resultData.current_page - 1) * parseInt(resultData.per_page) + index + 1,
                    created_at_formatted: dayjs(item.created_at).format('DD/MM/YYYY HH:mm'),
                    name: item.user ? `${item.user.last_name} ${item.user.first_name}` : 'N/A',
                    email: item.user ? item.user.username : 'N/A'
                })),
                total: resultData.total,
            };
        } else {
            message.error("Dữ liệu API trả về không hợp lệ.");
            return { list: [], total: 0 };
        }
    } catch (error) {
        if (error.response) {
            message.error(`Lỗi từ máy chủ: ${error.response.status} - ${error.response.data.message || 'Vui lòng thử lại.'}`);
        } else if (error.request) {
        } else {
            message.error("Đã có lỗi xảy ra khi gửi yêu cầu.");
        }
        return { list: [], total: 0 };
    }
};

const { data: dataSource, run, loading, current, pageSize, total } = usePagination(fetchSupports, {
    pagination: {
        currentKey: 'page',
        pageSizeKey: 'per_page',
    },
     manual: true,
});
const initialLoading = ref(true);
const pagination = computed(() => ({
  total: total.value,
  current: current.value,
  pageSize: pageSize.value,
  showSizeChanger: true,
  pageSizeOptions: ['10', '20', '50', '100'],
  size: 'small',
}));

// --- LIFECYCLE HOOKS ---
onMounted(async () => {
    if (!currentUser.id || currentUser.member_group === 1) {
        router.push('/not-found');
    }

    await run({
        per_page: pagination.value.pageSize,
        page: pagination.value.current,
        s: searchQuery.value,
        status: statusFilter.value,
    });

    initialLoading.value = false;

    // Polling nhưng không kích hoạt loading
    intervalId = setInterval(() => {
        run({
            per_page: pagination.value.pageSize,
            page: pagination.value.current,
            s: searchQuery.value,
            status: statusFilter.value,
        });
    }, 5000);
});

onBeforeUnmount(() => {
    if (intervalId) {
        clearInterval(intervalId);
    }
});

// --- EVENT HANDLERS ---
const handleTableChange = (pag) => {
  run({
    per_page: pag.pageSize,
    page: pag.current,
    s: searchQuery.value,
    status: statusFilter.value,
  });
};

watch([searchQuery, statusFilter], () => {
    run({
        per_page: pagination.value.pageSize,
        page: 1,
        s: searchQuery.value,
        status: statusFilter.value,
    });
});

// --- MODAL & DETAIL VIEW ---
const showSupportDetails = async (support) => {
    try {
        const response = await axios.get(`/supports/${support.id}`);
        if (response.data.code === 200 && response.data.data) {
            const supportData = response.data.data;
            selectedSupport.value = {
                ...supportData.message,
                replies: supportData.children || []
            };
            isModalVisible.value = true;
        } else {
            message.error("Không thể tải chi tiết yêu cầu.");
        }
    } catch (error) {
        message.error("Lỗi khi lấy chi tiết yêu cầu.");
    }
};

const handleModalClose = () => {
    isModalVisible.value = false;
    replyContent.value = '';
};

const handleReplySubmit = async () => {
    if (!replyContent.value.trim()) {
        message.warning("Vui lòng nhập nội dung trả lời.");
        return;
    }
    isReplying.value = true;
    try {
        // FIX: Sử dụng phương thức PATCH và đường dẫn API đúng
        const response = await axios.patch(`/supports/${selectedSupport.value.id}`, {
            content: replyContent.value
        });
        if (response.data.code === 200) {
            message.success("Gửi trả lời thành công!");
            replyContent.value = '';
            await showSupportDetails(selectedSupport.value); // Refresh details
            run(); // Refresh the table list
        } else {
            message.error(response.data.message || "Gửi trả lời thất bại.");
        }
    } catch (error) {
        message.error("Lỗi khi gửi trả lời. Vui lòng kiểm tra lại đường dẫn API.");
    } finally {
        isReplying.value = false;
    }
};

// --- HELPER FUNCTIONS ---
const getStatusTag = (status) => {
    switch (parseInt(status)) {
        case 0: return { color: 'blue', text: 'Mới' };
        case 1: return { color: 'orange', text: 'Đang xử lý' };
        case 2: return { color: 'default', text: 'Đã đóng' };
        default: return { color: 'default', text: 'Không xác định' };
    }
};

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
      <div class="page-wrapper">
        <div class="header-container">
          <h2>Quản lý Hỗ trợ</h2>
          <div class="underline"></div>
        </div>

        <div class="content-card">
          <div class="action-bar">
            <div class="filter-controls">
              <a-input v-model:value="searchQuery" placeholder="Tìm theo tiêu đề..." allow-clear>
                <template #prefix><SearchOutlined /></template>
              </a-input>
              <a-select v-model:value="statusFilter" placeholder="Lọc theo trạng thái" :options="statusOptions" allow-clear />
            </div>
          </div>

          <div class="table-container">
            <a-table
              :loading="initialLoading"
              :dataSource="dataSource?.list || []"
              :columns="[
                { title: 'STT', dataIndex: 'stt', key: 'stt', width: 80, align: 'center' },
                { title: 'Từ', dataIndex: 'name', key: 'from', width: 200 },
                { title: 'Tiêu đề', dataIndex: 'title', key: 'title' },
                { title: 'Thời gian', dataIndex: 'created_at_formatted', key: 'time', width: 180, align: 'center' },
                { title: 'Trạng thái', dataIndex: 'status', key: 'status', width: 150, align: 'center' },
                { title: 'Thao tác', key: 'action', width: 100, align: 'center' }
              ]"
              :pagination="pagination"
              @change="handleTableChange"
              :scroll="{ x: 'max-content' }"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'title'">
                  <a class="table-link" @click="showSupportDetails(record)">{{ record.title }}</a>
                </template>
                <template v-if="column.key === 'status'">
                  <a-tag :color="getStatusTag(record.status).color">{{ getStatusTag(record.status).text }}</a-tag>
                </template>
                <template v-if="column.key === 'action'">
                  <a-button type="primary" shape="circle" @click="showSupportDetails(record)">
                    <EyeOutlined />
                  </a-button>
                </template>
              </template>
            </a-table>
          </div>
        </div>
      </div>

      <a-modal v-model:open="isModalVisible" :footer="null" width="800px" centered @cancel="handleModalClose" wrapClassName="support-modal">
        <template #title>
          <div class="modal-title">Chi tiết Yêu cầu Hỗ trợ #{{ selectedSupport?.id }}</div>
        </template>
        <div v-if="selectedSupport" class="modal-content-wrapper">
            <div class="conversation-thread">
                <div class="original-message">
                    <h3>{{ selectedSupport.title }}</h3>
                    <div class="meta-info">
                        <span><strong>Từ:</strong> {{ selectedSupport.user.last_name }} {{ selectedSupport.user.first_name }} ({{ selectedSupport.user.username }})</span>
                        <span><strong>Thời gian:</strong> {{ dayjs(selectedSupport.created_at).format('DD/MM/YYYY HH:mm') }}</span>
                    </div>
                    <div class="content-body" v-html="selectedSupport.content"></div>
                </div>
                <div v-if="selectedSupport.replies && selectedSupport.replies.length > 0" class="replies-list">
                    <div v-for="reply in selectedSupport.replies" :key="reply.id" class="reply-item" :class="{ 'admin-reply': reply.user_id === currentUser.id }">
                        <div class="reply-header">
                            <span class="reply-author">{{ reply.user.name || `${reply.user.last_name} ${reply.user.first_name}` }}</span>
                            <span class="reply-time">{{ dayjs(reply.created_at).format('HH:mm') }}</span>
                        </div>
                        <div class="reply-content" v-html="reply.content"></div>
                    </div>
                </div>
            </div>
            <div class="reply-form-container">
              <a-textarea v-model:value="replyContent" placeholder="Nhập nội dung trả lời..." :rows="3" />
              <a-button type="primary" :loading="isReplying" @click="handleReplySubmit" style="margin-top: 12px;">
                <SendOutlined /> Gửi
              </a-button>
            </div>
        </div>
      </a-modal>
    </a-config-provider>
  </div>
</template>

<style scoped>
.page-container { background-color: #F5F7FA; min-height: 100vh; }
.page-wrapper { margin-top: 70px; padding: 24px; }
.header-container { max-width: 1400px; margin: 0 auto 24px auto; }
h2 { font-size: 1.8rem; font-weight: 700; color: #007ACC; text-transform: uppercase; }
.underline { width: 100%; height: 3px; margin-top: 8px; background: linear-gradient(90deg, #00AFFF, #B3E5FC); border-radius: 2px; }
.content-card { background-color: #FFFFFF; border-radius: 12px; box-shadow: 0 4px 15px rgba(0, 90, 170, 0.08); border: 1px solid #D9E2EC; max-width: 1400px; margin: 0 auto; padding: 24px; }
.action-bar { display: flex; justify-content: flex-end; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
.filter-controls { display: flex; gap: 16px; flex-wrap: wrap; }
.filter-controls .ant-select, .filter-controls .ant-input { width: 250px; }
.table-container { overflow-x: auto; }
.table-link { color: #007ACC; font-weight: 500; cursor: pointer; }
.table-link:hover { text-decoration: underline; color: #00AFFF; }

/* === Modal Styling === */
.modal-title { font-size: 1.3rem; color: #007ACC; font-weight: 600; }
.modal-content-wrapper { display: flex; flex-direction: column; height: 70vh; }
.conversation-thread { flex-grow: 1; overflow-y: auto; padding: 16px; margin: -24px -24px 0 -24px; }
.original-message { padding: 0 24px 24px 24px; border-bottom: 1px solid #f0f0f0; margin-bottom: 16px; }
.original-message h3 { font-size: 1.5rem; font-weight: 600; margin-bottom: 8px; color: #1A2B3C; }
.meta-info { display: flex; gap: 24px; color: #5A738E; font-size: 0.9rem; margin-bottom: 16px; }
.content-body { line-height: 1.7; color: #33475B; }
.replies-list { display: flex; flex-direction: column; gap: 16px; padding: 0 24px; }
.reply-item { padding: 10px 15px; border-radius: 18px; max-width: 80%; word-wrap: break-word; }
.reply-item:not(.admin-reply) { background-color: #f0f2f5; margin-right: auto; }
.admin-reply { background-color: #e6f7ff; margin-left: auto; }
.reply-header { display: flex; align-items: flex-end; margin-bottom: 5px; font-size: 0.85rem; color: #606060; gap:2em; }
.reply-author { font-weight: 700; color: #007ACC; margin-right: 2px;}
.reply-time { font-size: 0.75rem; color: #888; }
.reply-content { line-height: 1.5; font-size: 0.95rem; color: #333; }
.no-replies { color: #90a4ae; text-align: center; padding: 20px; }
.reply-form-container { padding: 16px 24px; border-top: 1px solid #f0f0f0; background: #fff; flex-shrink: 0; margin: 0 -24px -24px -24px; }
.reply-form-container .ant-btn-primary { background: linear-gradient(90deg, #007ACC, #00AFFF); border: none; }

@media (max-width: 768px) {
  .page-wrapper { padding: 15px; }
  .content-card, .action-bar { padding: 15px; }
  .action-bar { flex-direction: column; align-items: stretch; }
  .filter-controls .ant-select, .filter-controls .ant-input { width: 100%; }
}
</style>
