<template>
  <div class="page-container">
    <Header/>
    <div class="waiting-wrapper">
      <div class="waiting-card">
        <div class="clock-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-clock"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        </div>
        <h2 class="title">Phòng chờ thi</h2>
        <p class="message">Chưa đến thời gian làm bài. Vui lòng chờ hiệu lệnh từ Cán bộ coi thi để bắt đầu.</p>
        <div class="loader-bar">
          <div class="loader-progress"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import Header from '../components/Header.vue';
// Your script setup logic
</script>

<style scoped>
/*
  CSS cho trang Phòng chờ thi - Chủ đề Neo-Futuristic Sáng
*/
.page-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.waiting-wrapper {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  margin-top: -70px; /* Bù lại chiều cao của Header để căn giữa tuyệt đối */
}

.waiting-card {
  width: 100%;
  max-width: 500px;
  background-color: #ffffff;
  border-radius: 16px;
  padding: 40px;
  text-align: center;
  border: 1px solid #d9e2ec;
  box-shadow: 0 8px 30px rgba(0, 90, 170, 0.1);
  transform: translateY(-20px);
  animation: float-in 0.8s ease-out forwards;
  opacity: 0;
}

@keyframes float-in {
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.clock-icon {
  color: #00afff;
  margin-bottom: 24px;
  animation: tick-tock 2s infinite ease-in-out;
}

@keyframes tick-tock {
  0% { transform: rotate(-5deg); }
  50% { transform: rotate(5deg); }
  100% { transform: rotate(-5deg); }
}

.title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #007acc;
  margin-bottom: 12px;
}

.message {
  font-size: 1rem;
  color: #5a738e;
  line-height: 1.6;
  margin-bottom: 32px;
}

.loader-bar {
  width: 100%;
  height: 8px;
  background-color: #e8eff5;
  border-radius: 4px;
  overflow: hidden;
}

.loader-progress {
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, #00afff, #007acc);
  border-radius: 4px;
  animation: loading-progress 2.5s infinite linear;
}

@keyframes loading-progress {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

/* === RESPONSIVE === */
@media (max-width: 576px) {
  .waiting-card {
    padding: 30px 20px;
  }
  .title {
    font-size: 1.5rem;
  }
  .message {
    font-size: 0.95rem;
  }
}
</style>
