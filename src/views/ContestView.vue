<script setup>
import { ref, onMounted, onUnmounted, h, computed } from 'vue';
import axios from '@/configs/axios.js';
import { useRouter } from 'vue-router';
import { persistContestCourseFromRecord } from '@/utils/contestCourseContext.js';
import { message, Button } from 'ant-design-vue';
import HeaderContest from '../components/HeaderContest.vue';

const isLoading = ref(true);
const router = useRouter();
const contestList = ref([]);
const currentTime = ref(new Date());
let countdownTimer = null;

// --- API & DATA FETCHING ---
const fetchContests = async () => {
  try {
    const response = await axios.get('contests/available');
    if (response.data.code === 200) {
      contestList.value = response.data.data.data;
    }
  } catch (error) {
    message.error('Lỗi khi lấy danh sách thực hành!');
  } finally {
    isLoading.value = false;
  }
};

// --- REAL-TIME COUNTDOWN LOGIC ---
onMounted(() => {
  fetchContests();
  // Cập nhật thời gian mỗi giây
  countdownTimer = setInterval(() => {
    currentTime.value = new Date();
  }, 1000);
});

onUnmounted(() => {
  // Hủy bộ đếm khi component bị hủy để tránh memory leak
  if (countdownTimer) {
    clearInterval(countdownTimer);
  }
});

// --- HELPER FUNCTIONS ---
const getCountdown = (startTime) => {
  const now = currentTime.value;
  const start = new Date(startTime);

  if (now >= start) {
    return { text: 'Vào', isCounting: false };
  }

  const diff = Math.floor((start - now) / 1000);
  if (diff < 0) return { text: 'Vào', isCounting: false };

  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;

  return {
    text: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
    isCounting: true,
  };
};

const goToContest = (record) => {
  if (!record?.id) return;
  persistContestCourseFromRecord(record);
  sessionStorage.setItem('contest_id', record.id);
  sessionStorage.setItem('start_time', record.start_time);
  sessionStorage.setItem('finish_time', record.end_time);
  sessionStorage.setItem('contest_icpc', record.icpc);
  sessionStorage.setItem('contest_ioi', record.ioi);
  sessionStorage.setItem('submit_type', record.submit_type);
  router.push('/contest/problems');
};

// --- TABLE COLUMNS ---
const columns = computed(() => [
  { title: 'STT', dataIndex: 'index', key: 'index', width: '80px', align: 'center' },
  { title: 'Bài thi', dataIndex: 'name', key: 'name' },
  { title: 'Bắt đầu', dataIndex: 'start_time', key: 'start_time', width: '200px', align: 'center' },
  { title: 'Kết thúc', dataIndex: 'end_time', key: 'end_time', width: '200px', align: 'center' },
  {
    title: 'Thao tác',
    key: 'action',
    width: '180px',
    align: 'center',
    customRender: ({ record }) => {
      const countdown = getCountdown(record.start_time);
      if (countdown.isCounting) {
        return h('span', { class: 'countdown-timer' }, `Xin chờ: ${countdown.text}`);
      } else {
        return h(Button, {
          type: 'primary',
          onClick: () => goToContest(record)
        }, () => 'Tiếp tục');
      }
    },
  },
]);
</script>


<template>
  <HeaderContest />
  <div class="container">
    <div class="body">
      <div class="part-left">
        <div class="body-header">
          <h2>Bài thi</h2>
          <a-spin :spinning="isLoading">
            <a-table
              :columns="columns"
              :dataSource="contestList.map((contest, index) => ({ ...contest, index: index + 1 }))"
              :pagination="false"
              bordered></a-table>
          </a-spin>

          <div class="rules">
            <h3>LƯU Ý:</h3>
            <ul>
              <li>Trên Desktop có folder Mã SV_XXXX. Sinh viên lưu mã nguồn tại thư mục này.</li>
              <li>Thoát tất cả các phần mềm không hợp lệ như Trình duyệt, Zalo, Facebook, Messenger, Discord,... ở cả chế độ chạy ngầm.</li>
              <li>Quá trình thi sẽ được ghi hình toàn bộ để hậu kiểm. Không tự ý khởi động lại thiết bị khi chưa được sự đồng ý của giám thị.</li>
            </ul>

            <h3>CÁC TRƯỜNG HỢP VI PHẠM QUY CHẾ:</h3>
            <ul>
              <li>Đóng phần mềm thi trong thời gian làm bài không rõ lý do.</li>
              <li>Đăng nhập một tài khoản trên 2 máy tính khác nhau hoặc đăng nhập 2 tài khoản từ cùng 1 máy.</li>
              <li>Cài đặt thêm bất cứ phần mềm, tiện ích nào mà chưa được sự đồng ý của giám thị.</li>
              <li>Kết nối thiết bị cắm ngoài (như USB, thẻ nhớ, điện thoại, ...).</li>
              <li>Mở trình duyệt web, ứng dụng nhắn tin vì bất cứ lý do gì.</li>
              <li>Sử dụng code có sẵn, mở folder code có sẵn.</li>
              <li>Sử dụng tài liệu giấy hoặc nhìn code trên điện thoại, code theo bài của người khác.</li>
              <li>Di chuyển ra khỏi chỗ ngồi của mình không xin phép.</li>
              <li>Trao đổi với người khác trong lúc làm bài.</li>
              <li>Bài làm 2 sinh viên giống nhau sẽ xử lý vi phạm cả 2.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  /* THEMED: Updated font stack and default text color */
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  color: #2c3e50;
}

.body {
  display: flex;
  margin-top: 90px;
  /* THEMED: Set base page background */
  background-color: #F5F7FA;
}

.part-left {
  width: 100%;
}

/* === Card & Header Section === */
/* Using a consistent card style for this element */
.body-header {
  padding: 24px; /* Adjusted for better spacing */
  background: #fff;
  border-radius: 12px;
  /* THEMED: Subtle, cool shadow and light border */
  box-shadow: 0 4px 15px rgba(0, 90, 170, 0.08);
  border: 1px solid #D9E2EC;
}

.body-header h2 {
  font-size: 1.6rem;
  font-weight: 700;
  margin-bottom: 20px;
  /* THEMED: Darker accent blue for titles */
  color: #007ACC;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* === Rules & Lists Section === */
.rules h3 {
  /* THEMED: Updated to a modern, clear red for warnings/rules */
  color: #d9363e;
  font-size: 18px;
  font-weight: 600; /* Slightly bolder */
  margin-top: 20px;
  margin-bottom: 10px; /* Added for spacing below heading */
}

.rules ul {
  padding-left: 20px;
  list-style: disc;
  color: #5A738E; /* THEMED: Softer color for list text */
}

/* THEMED: Style the bullet points with the accent color */
.rules ul li::marker {
  color: #00AFFF;
}


/* === Ant Design Table Theming === */

::v-deep(.ant-table) {
  margin-top: 20px; /* Adjusted margin */
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #E8EFF5; /* Add a subtle outer border */
}

::v-deep(.ant-table-thead > tr > th) {
  /* THEMED: Light header background and accent text */
  background-color: #F0F5FA !important;
  color: #007ACC !important;
  text-align: center;
  font-weight: 600; /* Adjusted for a cleaner look */
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

::v-deep(.ant-table-tbody > tr > td) {
  text-align: center;
  padding: 12px 10px; /* Adjusted padding */
  color: #33475B;
  border-bottom: 1px solid #E8EFF5; /* Ensure consistent bottom border */
}

/* Removing explicit odd/even striping for a cleaner look, relying on hover */
::v-deep(.ant-table-tbody > tr:nth-child(odd)) {
  background-color: #ffffff;
}
::v-deep(.ant-table-tbody > tr:nth-child(even)) {
  background-color: #F8F9FB; /* Adding subtle striping */
}

::v-deep(.ant-table-tbody > tr:hover > td) {
  /* THEMED: Light accent hover for all rows */
  background: rgba(0, 175, 255, 0.08) !important;
}


/* === Ant Design Button Theming === */

::v-deep(.ant-btn-primary) {
  /* THEMED: Applying blue gradient for primary actions */
  background: linear-gradient(90deg, #007ACC, #00AFFF);
  border: none;
  font-weight: bold;
  color: #fff !important; /* Ensure text is white */
  box-shadow: 0 2px 8px rgba(0, 122, 204, 0.3);
  transition: all 0.3s ease;
}

::v-deep(.ant-btn-primary:hover) {
  /* THEMED: Brighter gradient and lift effect on hover */
  background: linear-gradient(90deg, #0088DD, #33CFFF);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 136, 221, 0.4);
}
</style>
