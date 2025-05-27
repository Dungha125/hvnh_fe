<script setup>
import { ref, onMounted, h } from 'vue';
import axios from '@/configs/axios.js';
import { useRouter } from 'vue-router';
import { message, Button } from 'ant-design-vue';
import HeaderContestLecturer from '@/components/HeaderContestLecturer.vue';

const isLoading = ref(true);
const router = useRouter();
const contestList = ref([]);

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

const goToContest = (contestId, startTime,endTime) => {
  sessionStorage.setItem('contest_id', contestId);
  sessionStorage.setItem('start_time', startTime);
  sessionStorage.setItem('finish_time', endTime);
  router.push('/lecturer/contest/student/problems');
};

const getCountdown = (startTime) => {
  const now = new Date();
  const start = new Date(startTime);
  if (now >= start) return 'Vào';

  const diff = Math.floor((start - now) / 1000);
  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;

  return `Xin chờ: ${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const columns = [
  { title: 'STT', dataIndex: 'index', key: 'index' },
  { title: 'Thực hành', dataIndex: 'name', key: 'name' },
  { title: 'Bắt đầu', dataIndex: 'start_time', key: 'start_time' },
  { title: 'Kết thúc', dataIndex: 'end_time', key: 'end_time' },
  {
    title: 'Thao tác',
    key: 'action',
    customRender: ({ record }) => {
      return getCountdown(record.start_time) === 'Vào'
        ? h(Button, { type: 'primary', onClick: () => goToContest(record.id, record.start_time, record.end_time) }, () => 'Tiếp tục')
        : getCountdown(record.start_time);
    },
  },
];



onMounted(fetchContests);
</script>


<template>
  <HeaderContestLecturer />
  <div class="container">
    <div class="body">
      <div class="part-left">
        <div class="body-header">
          <h2>Thực hành</h2>
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
  color: #333;
  font-family: Arial, sans-serif;
}

.body {
  display: flex;
  margin-top: 90px;
}

.part-left {
  width: 100%;
}

.body-header {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.body-header h2 {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 20px;
}

.rules h3 {
  color: #a20b0b;
  font-size: 18px;
  margin-top: 15px;
}

.rules ul {
  padding-left: 20px;
  list-style: disc;
}

::v-deep(.ant-table) {
  margin-top: 15px;
  border-radius: 8px;
  overflow: hidden;
}

::v-deep(.ant-table-thead > tr > th) {
  background-color: #1890ff;
  color: rgb(56, 56, 56);
  text-align: center;
  font-weight: bold;
}

::v-deep(.ant-table-tbody > tr > td) {
  text-align: center;
  padding: 10px;
}

::v-deep(.ant-table-tbody > tr:nth-child(odd)) {
  background-color: #ffffff;
}

::v-deep(.ant-btn-primary) {
  background-color: #c41a1a;
  border: none;
  font-weight: bold;
}

::v-deep(.ant-btn-primary:hover) {
  background-color: #c62323;
}
</style>
