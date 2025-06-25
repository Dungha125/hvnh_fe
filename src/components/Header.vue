<script setup>
import {useRoute} from 'vue-router';
import {useRouter} from 'vue-router';
import {ref} from "vue";
import {IdcardOutlined, UserOutlined, LogoutOutlined} from "@ant-design/icons-vue";
import axios from "@/configs/axios.js";
import {message} from "ant-design-vue";


const route = useRoute();
const currentPath = route.path;
const router = useRouter();
const isHover = ref(false);
const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
const isTeacherLogin = sessionStorage.getItem("teacher_login");
const isMobileMenuOpen = ref(false);

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};



const switchBackToTeacher = () => {
  const teacherToken = sessionStorage.getItem('teacher_access_token');
  if (teacherToken) {
    localStorage.setItem("access_token", teacherToken);
    localStorage.setItem("user", sessionStorage.getItem("user_teacher"));
    localStorage.setItem("username", sessionStorage.getItem("username_teacher"));
    sessionStorage.clear();
    
    message.success('Đã chuyển về tài khoản giảng viên');
    router.replace("/lecturer/settings");
  } else {
    message.error('Không tìm thấy tài khoản giảng viên');
  }
};



const styleNavItem = (path) => {
  return {
    color: currentPath.includes(path) && !isHover.value ? "#0055A5" : "#737374",
    filter:
      currentPath.includes(path) && !isHover.value
        ? "invert(33%) sepia(83%) saturate(612%) hue-rotate(190deg) brightness(60%) contrast(95%)"
        : "",
    transition: "color 0.3s ease, filter 0.3s ease",
  };
};

const goTo = (path) => {
  router.push(path);
}

const addHoverEvent = (event, path) => {
  if (currentPath.includes(path))
    return;
  isHover.value = true;
}

const removeHoverEvent = (event, path) => {
  if (currentPath.includes(path))
    return;
  isHover.value = false;
}

const handleLogout = async () => {
  await axios.post('/auth/logout');

  localStorage.clear();
  sessionStorage.clear();
  message.success('Đăng xuất thành công');

  router.push('/login');
}

const getAvatarName = (name) => {
  if (!name) return "User";
  return name.split(' ').join('+');
};
</script>

<template>
  <header class="header">
    <div class="header-content">
      <div class="logo" @click="goTo('/home')">Học viện Ngân Hàng</div>

      <!-- Desktop Navigation -->
      <!-- <nav class="navigation desktop-nav">
        <div class="nav-item" :style="styleNavItem('/problems')" @click="goTo('/problems')">
          <img src="../static/img/problem.svg" alt="Bài tập icon">
          <span class="nav-text">Bài tập</span>
        </div>
        <div class="nav-item" :style="styleNavItem('/status')" @click="goTo('/status')">
          <img src="../static/img/status_icon.svg" alt="Trạng thái icon">
          <span class="nav-text">Trạng thái</span>
        </div>
        <div class="nav-item" :style="styleNavItem('/history')" @click="goTo('/history')">
          <img src="../static/img/clock_icon.svg" alt="Lịch sử icon">
          <span class="nav-text">Lịch sử</span>
        </div>
        <div class="nav-item" :style="styleNavItem('/ranking')" @click="goTo('/ranking')">
          <img src="../static/img/ranking_icon.svg" alt="Bảng xếp hạng icon">
          <span class="nav-text">Bảng xếp hạng</span>
        </div>
      </nav> -->

      <!-- User Actions for Desktop -->
      <div class="user-actions desktop-actions">
        <img class="action-icon" src="../static/img/icon_question.svg" alt="Hướng dẫn" :style="styleNavItem('/guide')" @click="goTo('/guide')">
        <img class="action-icon" src="../static/img/icon_vn.svg" alt="Tiếng Việt" @click="message.warning('Tính năng đang được phát triển!')">
        <div class="avatar-container">
          <a-dropdown :arrow="{ pointAtCenter: true }" placement="bottomRight">
            <a class="ant-dropdown-link" @click.prevent>
              <a-avatar :src="currentUser.profile_picture ?? `https://ui-avatars.com/api/?name=${getAvatarName(currentUser.last_name + ' ' + currentUser.first_name)}&background=007ACC&color=FFFFFF&font-size=0.5`" alt="Avatar"/>
            </a>
            <template #overlay>
              <a-menu style="min-width: 150px;">
                <a-menu-item>
                  <p style="margin-bottom: 0; padding-bottom: 0;"><IdcardOutlined/> {{ currentUser.last_name + ' ' + currentUser.first_name }}</p>
                  <p style="margin-bottom: 0; padding-bottom: 0; font-size:0.9em; color: #5A738E;">{{ currentUser.username }}</p>
                </a-menu-item>
                <a-menu-item @click="goTo('/profile')"><UserOutlined/> Hồ sơ</a-menu-item>
                <a-menu-item v-if="isTeacherLogin" @click="switchBackToTeacher"><UserOutlined /> Chuyển về tài khoản giảng viên</a-menu-item>
                <a-menu-item @click="handleLogout"><LogoutOutlined/> Đăng xuất</a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </div>
      
      <!-- Hamburger Menu Button -->
      <button class="hamburger-button" @click="toggleMobileMenu" :class="{ 'is-active': isMobileMenuOpen }">
        <span></span>
        <span></span>
        <span></span>
      </button>

    </div>

    <!-- Mobile Navigation Panel -->
    <div class="mobile-nav-panel" :class="{ 'is-open': isMobileMenuOpen }">
      <nav class="navigation mobile-nav">
        <!-- Main Navigation -->
        <div class="nav-item" :style="styleNavItem('/problems')" @click="goTo('/problems'); toggleMobileMenu();">
          <img src="../static/img/problem.svg" alt="Bài tập icon">
          <span class="nav-text">Bài tập</span>
        </div>
        <div class="nav-item" :style="styleNavItem('/status')" @click="goTo('/status'); toggleMobileMenu();">
          <img src="../static/img/status_icon.svg" alt="Trạng thái icon">
          <span class="nav-text">Trạng thái</span>
        </div>
        <div class="nav-item" :style="styleNavItem('/history')" @click="goTo('/history'); toggleMobileMenu();">
          <img src="../static/img/clock_icon.svg" alt="Lịch sử icon">
          <span class="nav-text">Lịch sử</span>
        </div>
        <div class="nav-item" :style="styleNavItem('/ranking')" @click="goTo('/ranking'); toggleMobileMenu();">
          <img src="../static/img/ranking_icon.svg" alt="Bảng xếp hạng icon">
          <span class="nav-text">Bảng xếp hạng</span>
        </div>
        <div class="nav-item" :style="styleNavItem('/guide')" @click="goTo('/guide'); toggleMobileMenu();">
           <img class="action-icon" src="../static/img/icon_question.svg" alt="Hướng dẫn">
           <span class="nav-text">Hướng dẫn</span>
        </div>

        <!-- Divider -->
        <div class="mobile-nav-divider"></div>
        
        <!-- Account Info & Actions -->
        <div class="mobile-account-info">
            <a-avatar :src="currentUser.profile_picture ?? `https://ui-avatars.com/api/?name=${getAvatarName(currentUser.last_name + ' ' + currentUser.first_name)}&background=007ACC&color=FFFFFF&font-size=0.5`" alt="Avatar"/>
            <div class="info-text">
                <p class="name">{{ currentUser.last_name + ' ' + currentUser.first_name }}</p>
                <p class="username">{{ currentUser.username }}</p>
            </div>
        </div>
        <div class="nav-item" @click="goTo('/profile'); toggleMobileMenu();">
          <UserOutlined />
          <span class="nav-text">Hồ sơ</span>
        </div>
        <div v-if="isTeacherLogin" class="nav-item" @click="switchBackToTeacher(); toggleMobileMenu();">
          <UserOutlined />
          <span class="nav-text">Về tài khoản giảng viên</span>
        </div>
        <div class="nav-item" @click="handleLogout(); toggleMobileMenu();">
          <LogoutOutlined />
          <span class="nav-text">Đăng xuất</span>
        </div>

      </nav>
    </div>
  </header>
</template>
<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Montserrat+Alternates:wght@700&display=swap');

/* === Bố cục Header chính === */
.header {
  background-color: #ffffff;
  width: 100%;
  position: fixed;
  top: 0;
  z-index: 1000;
  border-bottom: 1px solid #d9e2ec;
  box-shadow: 0 2px 8px rgba(0, 90, 170, 0.06);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 40px;
  max-width: 1600px;
  margin: 0 auto;
  position: relative;
}

/* === Logo === */
.logo {
  font-family: 'Montserrat Alternates', Helvetica, serif;
  font-size: 24px;
  font-weight: 700;
  color: #007acc;
  cursor: pointer;
  white-space: nowrap;
  z-index: 10; /* Ensure logo is above mobile panel */
}

/* === Menu điều hướng === */
.navigation {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
}

.desktop-nav {
  flex-grow: 1;
  margin: 0 24px; /* Khoảng cách với logo và khu vực người dùng */
}

.nav-item {
  font-family: 'Inter', Helvetica, serif;
  font-size: 16px;
  font-weight: 600;
  color: #5a738e;
  cursor: pointer;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 8px; /* Khoảng cách giữa icon và chữ */
  padding: 8px 12px;
  border-radius: 6px;
  transition: color 0.2s ease, background-color 0.2s ease;
}

.nav-item img {
  width: 18px;
  height: 18px;
  filter: opacity(0.7);
  transition: filter 0.2s ease;
}

/* Hiệu ứng khi di chuột */
.nav-item:hover {
  color: #00afff !important;
  background-color: rgba(0, 175, 255, 0.08);
}

.nav-item:hover img,
.nav-item:hover .action-icon {
  filter: brightness(0) saturate(100%) invert(72%) sepia(99%) saturate(4463%) hue-rotate(165deg) brightness(102%) contrast(104%);
}

/* === Khu vực người dùng === */
.user-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.action-icon {
  cursor: pointer;
  width: 22px;
  height: 22px;
  filter: opacity(0.65);
  transition: filter 0.2s ease, transform 0.2s ease;
}

.action-icon:hover {
  filter: opacity(1);
  transform: scale(1.1);
}

.avatar-container .ant-avatar {
  border: 2px solid #00afff;
  cursor: pointer;
  transition: box-shadow 0.2s ease;
}
.avatar-container .ant-avatar:hover {
  box-shadow: 0 0 8px rgba(0, 175, 255, 0.5);
}

/* === Menu Hamburger === */
.hamburger-button {
  display: none; /* Ẩn trên desktop */
  width: 30px;
  height: 24px;
  position: relative;
  background: transparent;
  border: none;
  cursor: pointer;
  z-index: 10;
}
.hamburger-button span {
  display: block;
  position: absolute;
  height: 3px;
  width: 100%;
  background: #007acc;
  border-radius: 3px;
  opacity: 1;
  left: 0;
  transform: rotate(0deg);
  transition: .25s ease-in-out;
}
.hamburger-button span:nth-child(1) { top: 0px; }
.hamburger-button span:nth-child(2) { top: 10px; }
.hamburger-button span:nth-child(3) { top: 20px; }

/* Animation cho nút hamburger khi active */
.hamburger-button.is-active span:nth-child(1) {
  top: 10px;
  transform: rotate(135deg);
}
.hamburger-button.is-active span:nth-child(2) {
  opacity: 0;
  left: -30px;
}
.hamburger-button.is-active span:nth-child(3) {
  top: 10px;
  transform: rotate(-135deg);
}

/* === Panel menu cho mobile === */
.mobile-nav-panel {
  display: none;
  position: fixed; /* Đổi thành fixed để che phủ toàn bộ màn hình */
  top: 50px; /* Vị trí ngay dưới header, 68px là chiều cao header + 1px border */
  left: 0;
  width: 100%;
  height: calc(100vh - 69px); /* Chiều cao còn lại của viewport */
  background-color: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(5px); /* Hiệu ứng làm mờ nền phía sau */
  padding: 16px;
  transform: translateX(100%); /* Bắt đầu từ bên ngoài màn hình (phải) */
  opacity: 0;
  visibility: hidden;
  transition: transform 0.3s ease-out, opacity 0.3s ease-out, visibility 0.3s;
  overflow-y: auto; /* Cho phép cuộn nếu nội dung dài */
}
.mobile-nav-panel.is-open {
  transform: translateX(0);
  opacity: 1;
  visibility: visible;
}
.mobile-nav {
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
}
.mobile-nav .nav-item {
  width: 100%;
  padding: 16px; /* Tăng padding cho dễ chạm */
  border-radius: 8px;
  font-size: 18px; /* Tăng cỡ chữ */
}
.mobile-nav .nav-item img,
.mobile-nav .nav-item .anticon /* Target Ant Design icons */
{
    width: 20px;
    height: 20px;
    font-size: 20px;
    margin-right: 4px;
}
.mobile-nav .action-icon {
  width: 20px;
  height: 20px;
  filter: opacity(0.7);
}

/* Mobile Nav Account Section */
.mobile-nav-divider {
  height: 1px;
  width: 100%;
  background-color: #e8eff5;
  margin: 16px 0;
}

.mobile-account-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  width: 100%;
}
.mobile-account-info .info-text .name {
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}
.mobile-account-info .info-text .username {
  font-size: 0.9em;
  color: #5a738e;
  margin: 0;
}


/* === RESPONSIVE CHO THIẾT BỊ DI ĐỘNG === */
@media (max-width: 992px) {
  .desktop-nav, .desktop-actions {
    display: none; /* Ẩn menu desktop và user actions */
  }
  .hamburger-button {
    display: block; /* Hiện nút hamburger */
  }
  .mobile-nav-panel {
    display: block; /* Cho phép panel hiện ra */
  }
}

@media (max-width: 768px) {
  .header-content {
    padding: 12px 20px;
  }
  .logo {
    font-size: 20px;
  }
}
</style>
