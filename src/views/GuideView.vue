<script setup>
import AdminHeader from "@/components/AdminHeader.vue";
import Header from "@/components/Header.vue";
</script>

<template>
  <AdminHeader />
  <div class="container">
    <div class="header-section">
      <h2>Hướng dẫn nộp bài trực tuyến</h2>
      <div class="underline"></div>
    </div>

    <div class="content">
      <div class="section">
        <h3>Hướng dẫn nộp bài</h3>
        <p>Sinh viên chọn bài trong danh sách đề bài, nhấn vào tên hoặc mã bài để xem chi tiết đề bài.</p>
        <img src="../static/img/problems.png" alt="problems" class="image">
        <p class="caption">Hình 1. Danh sách các bài tập theo môn học.</p>
      </div>

      <div class="section">
        <p>Các bài nền màu xanh là đã giải bài đúng, các bài tập còn lại chưa làm hoặc giải sai...</p>
        <img src="../static/img/problem-detail.png" alt="problem-detail" class="image">
        <p class="caption">Hình 2. Chi tiết đề bài.</p>
      </div>

      <div class="section">
        <p>Đối với các bài tập có yêu cầu sử dụng hàm main có sẵn để giải bài...</p>
        <img src="../static/img/main-function.png" alt="main-function" class="image">
        <p class="caption">Hình 3. Bài tập yêu cầu giải với hàm main có sẵn.</p>
      </div>

      <div class="section">
        <p>Sau khi nộp bài, hệ thống chuyển hướng đến trang lịch sử nộp bài...</p>
        <img src="../static/img/submission-history.png" alt="history" class="image">
        <p class="caption">Hình 4. Lịch sử nộp bài.</p>
      </div>

      <div class="section">
        <p>Nếu gặp lỗi biên dịch (CE), nhấn vào trạng thái này để xem chi tiết.</p>
        <img src="../static/img/ce.png" alt="ce" class="image">
        <p class="caption">Hình 5. Chi tiết lỗi biên dịch.</p>
      </div>

      <div class="status-section">
        <h3>Các trạng thái kết quả</h3>
        <ul>
          <li class="status ac"><strong>AC:</strong> Accepted (Kết quả đúng)</li>
          <li class="status wa"><strong>WA:</strong> Wrong Answer (Kết quả sai)</li>
          <li class="status tle"><strong>TLE:</strong> Time Limit Exceeded (Quá giới hạn thời gian)</li>
          <li class="status mle"><strong>MLE:</strong> Memory Limit Exceeded (Quá giới hạn bộ nhớ)</li>
          <li class="status ole"><strong>OLE:</strong> Output Limit Exceeded (Quá giới hạn đầu ra)</li>
          <li class="status ir"><strong>IR:</strong> Invalid Return (Trả về không hợp lệ)</li>
          <li class="status rte"><strong>RTE:</strong> Runtime Error (Lỗi thực thi)</li>
          <li class="status ce"><strong>CE:</strong> Compile Error (Lỗi biên dịch)</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
  color: #333;
  font-family: Arial, sans-serif;
}

.header-section {
  text-align: center;
  margin-bottom: 30px;
}

.underline {
  width: 60px;
  height: 4px;
  background-color: #007BFF;
  margin: 10px auto;
  border-radius: 2px;
}

.content {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.section {
  margin-bottom: 30px;
}

h3 {
  color: #007BFF;
  font-size: 22px;
  margin-bottom: 10px;
}

p {
  font-size: 16px;
  line-height: 1.6;
}

.image {
  width: 100%;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-top: 10px;
}

.caption {
  text-align: center;
  font-style: italic;
  color: #666;
  margin-top: 5px;
}

.status-section {
  background: #e3f2fd;
  padding: 15px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.status-section ul {
  list-style-type: none;
  padding: 0;
}

.status-section li {
  font-size: 16px;
  margin: 5px 0;
  padding: 5px 10px;
  border-radius: 5px;
  font-weight: bold;
}

.status.ac { color: green; }
.status.wa, .status.tle, .status.mle, .status.ole, .status.ir, .status.rte { color: red; }
.status.ce { color: black; }
</style>
