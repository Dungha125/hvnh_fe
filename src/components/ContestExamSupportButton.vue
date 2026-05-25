<script setup>
import { ref, computed, watch, onBeforeUnmount } from "vue";
import { message, Modal } from "ant-design-vue";
import {
  CustomerServiceOutlined,
  LockOutlined,
  MessageOutlined,
  ReloadOutlined,
} from "@ant-design/icons-vue";
import dayjs from "dayjs";
import {
  createContestSupportRequest,
  temporaryLockAccountDuringExam,
  setSessionExamLocked,
  fetchMySupportRequests,
  fetchSupportDetail,
  supportStatusLabel,
} from "@/api/contestExamSupport.js";

const props = defineProps({
  contestId: { type: [String, Number], required: true },
  questionId: { type: [String, Number], default: null },
  questionCode: { type: String, default: "" },
  block: { type: Boolean, default: false },
});

const emit = defineEmits(["locked", "submitted"]);

const sendOpen = ref(false);
const inboxOpen = ref(false);
const submitting = ref(false);
const inboxLoading = ref(false);
const detailLoading = ref(false);
const supportTitle = ref("");
const supportContent = ref("");
const requestTemporaryLock = ref(true);
const supportList = ref([]);
const selectedId = ref(null);
const selectedDetail = ref(null);
let pollTimer = null;

const defaultTitle = computed(() => {
  const q = props.questionCode ? ` — ${props.questionCode}` : "";
  return `Hỗ trợ khi kiểm tra #${props.contestId}${q}`;
});

const hasUnreadReply = computed(() =>
  supportList.value.some((item) => (item.replyCount ?? 0) > 0)
);

const showSendModal = () => {
  supportTitle.value = defaultTitle.value;
  supportContent.value = "";
  requestTemporaryLock.value = true;
  sendOpen.value = true;
};

const loadInbox = async (silent = false) => {
  if (!props.contestId) return;
  if (!silent) inboxLoading.value = true;
  try {
    const { list } = await fetchMySupportRequests(props.contestId);
    supportList.value = await Promise.all(
      list.map(async (item) => {
        try {
          const d = await fetchSupportDetail(item.id);
          return { ...item, replyCount: d.replies.length };
        } catch {
          return { ...item, replyCount: 0 };
        }
      })
    );
    if (selectedId.value) {
      const still = list.find((x) => x.id === selectedId.value);
      if (still) await loadDetail(selectedId.value, true);
      else {
        selectedId.value = null;
        selectedDetail.value = null;
      }
    }
  } catch (e) {
    if (!silent) {
      message.error(e?.message || "Không tải được danh sách hỗ trợ.");
    }
  } finally {
    if (!silent) inboxLoading.value = false;
  }
};

const loadDetail = async (id, silent = false) => {
  if (!id) return;
  selectedId.value = id;
  if (!silent) detailLoading.value = true;
  try {
    selectedDetail.value = await fetchSupportDetail(id);
  } catch (e) {
    if (!silent) message.error(e?.message || "Không tải được phản hồi.");
  } finally {
    if (!silent) detailLoading.value = false;
  }
};

const openInbox = async () => {
  inboxOpen.value = true;
  await loadInbox();
  if (supportList.value.length > 0 && !selectedId.value) {
    await loadDetail(supportList.value[0].id);
  }
};

const closeInbox = () => {
  inboxOpen.value = false;
  stopPoll();
};

const startPoll = () => {
  stopPoll();
  pollTimer = setInterval(() => {
    if (inboxOpen.value) loadInbox(true);
  }, 8000);
};

const stopPoll = () => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
};

watch(inboxOpen, (open) => {
  if (open) startPoll();
  else stopPoll();
});

onBeforeUnmount(stopPoll);

const handleSubmit = async () => {
  const content = supportContent.value?.trim();
  if (!content) {
    message.warning("Vui lòng mô tả vấn đề cần hỗ trợ.");
    return;
  }

  submitting.value = true;
  try {
    const title = (supportTitle.value?.trim() || defaultTitle.value).slice(0, 200);
    const supportPayload = {
      title,
      content,
      contest_id: Number(props.contestId) || props.contestId,
    };
    if (props.questionId != null && props.questionId !== "") {
      supportPayload.question_id = Number(props.questionId) || props.questionId;
    }
    if (props.questionCode) {
      supportPayload.question_code = props.questionCode;
    }

    const support = await createContestSupportRequest(supportPayload);
    const supportId = support?.id ?? support?.data?.id;

    if (requestTemporaryLock.value) {
      try {
        await temporaryLockAccountDuringExam(props.contestId, {
          reason: content,
          question_id: supportPayload.question_id,
          question_code: props.questionCode || undefined,
          support_id: supportId,
        });
        setSessionExamLocked(props.contestId, true);
        emit("locked", { contestId: props.contestId, supportId });
        Modal.info({
          title: "Đã gửi yêu cầu và tạm khóa tài khoản",
          content:
            "Tài khoản của bạn đã được khóa tạm thời trong lúc thi. Giám thị sẽ xử lý và mở khóa khi cần. Bạn có thể xem phản hồi tại「Xem phản hồi hỗ trợ」.",
          okText: "Đã hiểu",
        });
      } catch (lockErr) {
        message.warning(
          lockErr?.message ||
            "Đã gửi yêu cầu hỗ trợ nhưng chưa khóa được tài khoản trên máy chủ."
        );
      }
    } else {
      message.success("Đã gửi yêu cầu. Xem phản hồi tại「Xem phản hồi hỗ trợ」.");
    }

    emit("submitted", { supportId });
    sendOpen.value = false;
    if (supportId) {
      selectedId.value = supportId;
      await loadInbox(true);
      inboxOpen.value = true;
      await loadDetail(supportId);
    }
  } catch (e) {
    message.error(
      e?.response?.data?.message || e?.message || "Gửi yêu cầu thất bại."
    );
  } finally {
    submitting.value = false;
  }
};

const formatTime = (t) =>
  t ? dayjs(t).format("DD/MM/YYYY HH:mm") : "";
</script>

<template>
  <div class="contest-support-actions" :class="{ 'contest-support-actions--block': block }">
    <a-button
      :type="block ? 'default' : 'default'"
      :ghost="block"
      class="contest-support-btn"
      @click="showSendModal"
    >
      <CustomerServiceOutlined />
      Gửi yêu cầu
    </a-button>
    <a-badge :dot="hasUnreadReply" :offset="[-2, 2]">
      <a-button
        :type="block ? 'default' : 'default'"
        :ghost="block"
        class="contest-support-btn"
        @click="openInbox"
      >
        <MessageOutlined />
        Phản hồi hỗ trợ
      </a-button>
    </a-badge>
  </div>

  <a-modal
    v-model:open="sendOpen"
    title="Gửi yêu cầu hỗ trợ khi kiểm tra"
    ok-text="Gửi yêu cầu"
    cancel-text="Hủy"
    :confirm-loading="submitting"
    :mask-closable="false"
    @ok="handleSubmit"
  >
    <a-alert
      type="info"
      show-icon
      style="margin-bottom: 16px"
      message="Sau khi gửi, mở「Phản hồi hỗ trợ」để xem trả lời từ giám thị."
    />
    <a-form layout="vertical">
      <a-form-item label="Tiêu đề">
        <a-input v-model:value="supportTitle" :placeholder="defaultTitle" />
      </a-form-item>
      <a-form-item label="Nội dung" required>
        <a-textarea
          v-model:value="supportContent"
          :rows="5"
          placeholder="Mô tả chi tiết vấn đề…"
          show-count
          :maxlength="2000"
        />
      </a-form-item>
      <a-form-item>
        <a-checkbox v-model:checked="requestTemporaryLock">
          <LockOutlined style="margin-right: 6px" />
          Tạm khóa tài khoản trong lúc chờ hỗ trợ (ghi nhật ký hậu kiểm)
        </a-checkbox>
      </a-form-item>
    </a-form>
  </a-modal>

  <a-modal
    v-model:open="inboxOpen"
    title="Phản hồi hỗ trợ từ giám thị"
    :footer="null"
    width="720px"
    centered
    destroy-on-close
    @cancel="closeInbox"
  >
    <div class="inbox-toolbar">
      <a-button size="small" :loading="inboxLoading" @click="loadInbox()">
        <ReloadOutlined /> Làm mới
      </a-button>
      <span class="inbox-hint">Tự động cập nhật mỗi 8 giây khi cửa sổ đang mở</span>
    </div>

    <a-spin :spinning="inboxLoading">
      <a-empty
        v-if="!supportList.length"
        description="Chưa có yêu cầu hỗ trợ trong đợt kiểm tra này"
      />
      <div v-else class="inbox-layout">
        <div class="inbox-list">
          <div
            v-for="item in supportList"
            :key="item.id"
            class="inbox-item"
            :class="{ active: selectedId === item.id }"
            @click="loadDetail(item.id)"
          >
            <div class="inbox-item-title">{{ item.title }}</div>
            <div class="inbox-item-meta">
              <a-tag size="small" :color="supportStatusLabel(item.status).color">
                {{ supportStatusLabel(item.status).text }}
              </a-tag>
              <span>{{ formatTime(item.created_at) }}</span>
            </div>
            <a-tag
              v-if="item.replyCount > 0"
              size="small"
              color="green"
              style="margin-top: 4px"
            >
              {{ item.replyCount }} phản hồi
            </a-tag>
          </div>
        </div>

        <a-spin :spinning="detailLoading" class="inbox-detail">
          <template v-if="selectedDetail">
            <h4 class="detail-title">{{ selectedDetail.title }}</h4>
            <p class="detail-meta">
              Gửi lúc {{ formatTime(selectedDetail.created_at) }}
              <a-tag
                size="small"
                :color="supportStatusLabel(selectedDetail.status).color"
                style="margin-left: 8px"
              >
                {{ supportStatusLabel(selectedDetail.status).text }}
              </a-tag>
            </p>
            <div class="bubble bubble--mine">
              <div class="bubble-label">Yêu cầu của bạn</div>
              <div class="bubble-body" v-html="selectedDetail.content" />
            </div>
            <div v-if="selectedDetail.replies.length" class="replies-block">
              <div
                v-for="reply in selectedDetail.replies"
                :key="reply.id"
                class="bubble bubble--staff"
              >
                <div class="bubble-label">
                  Giám thị
                  <span class="bubble-time">{{ formatTime(reply.created_at) }}</span>
                </div>
                <div class="bubble-body" v-html="reply.content" />
              </div>
            </div>
            <a-empty
              v-else
              description="Chưa có phản hồi — giám thị sẽ trả lời sớm"
            />
          </template>
          <a-empty v-else description="Chọn một yêu cầu bên trái" />
        </a-spin>
      </div>
    </a-spin>
  </a-modal>
</template>

<style scoped>
.contest-support-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.contest-support-actions--block .contest-support-btn {
  color: #fff !important;
  border-color: rgba(255, 255, 255, 0.85) !important;
  background: rgba(255, 255, 255, 0.12) !important;
}
.contest-support-actions--block .contest-support-btn:hover {
  color: #fff !important;
  border-color: #fff !important;
  background: rgba(255, 255, 255, 0.22) !important;
}
.inbox-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.inbox-hint {
  font-size: 12px;
  color: #888;
}
.inbox-layout {
  display: flex;
  gap: 16px;
  min-height: 320px;
  max-height: 55vh;
}
.inbox-list {
  width: 38%;
  overflow-y: auto;
  border-right: 1px solid #f0f0f0;
  padding-right: 8px;
}
.inbox-item {
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 8px;
  border: 1px solid #eee;
}
.inbox-item:hover,
.inbox-item.active {
  border-color: #1677ff;
  background: #f0f7ff;
}
.inbox-item-title {
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 4px;
}
.inbox-item-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #666;
}
.inbox-detail {
  flex: 1;
  overflow-y: auto;
  padding-left: 4px;
}
.detail-title {
  margin: 0 0 4px;
  font-size: 16px;
}
.detail-meta {
  color: #666;
  font-size: 13px;
  margin-bottom: 12px;
}
.bubble {
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 12px;
}
.bubble--mine {
  background: #f5f5f5;
}
.bubble--staff {
  background: #e6f4ff;
  border: 1px solid #91caff;
}
.bubble-label {
  font-size: 12px;
  font-weight: 600;
  color: #1677ff;
  margin-bottom: 6px;
}
.bubble-time {
  font-weight: 400;
  color: #888;
  margin-left: 8px;
}
.bubble-body {
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
}
.bubble-body :deep(p) {
  margin: 0 0 0.5em;
}
</style>
