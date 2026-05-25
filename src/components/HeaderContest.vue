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

const icpc = sessionStorage.getItem("contest_icpc");
const ioi = sessionStorage.getItem("contest_ioi");

const contestType = ref('')
if (icpc === "1" || icpc === "true") {
  contestType.value = "icpc";
} else if (ioi === "1" || ioi === "true") {
  contestType.value = "ioi";
}

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
      <div class="logo" @click="goTo('/contest')">Học viện Ngân Hàng</div>
      <nav class="navigation">
        <!--                <div class="nav-item"-->
        <!--                     :style="styleNavItem('/home')"-->
        <!--                     @click="goTo('/home')"-->
        <!--                     @mouseover="addHoverEvent(event, path='/home')"-->
        <!--                     @mouseout="removeHoverEvent(event, path='/home')">-->
        <!--                    Trang chủ-->
        <!--                </div>-->

        <div class="nav-item"
             :style="styleNavItem('/contest')"
             @click="goTo('/contest')"
             @mouseover="addHoverEvent(event, path='/contest')"
             @mouseout="removeHoverEvent(event, path='/contest')">
          <img src="../static/img/thuc_hanh.svg">
          Kiểm tra
        </div>

        <div class="nav-item"
             :style="styleNavItem('/contest/problems')"
             @click="goTo('/contest/problems')"
             @mouseover="addHoverEvent(event, path='/contest/problems')"
             @mouseout="removeHoverEvent(event, path='/contest/problems')">
          <img src="../static/img/problem.svg">
          Câu hỏi
        </div>

        <div class="nav-item"
             :style="styleNavItem('/contest/history')"
             @click="goTo('/contest/history')"
             @mouseover="addHoverEvent(event, path='/contest/history')"
             @mouseout="removeHoverEvent(event, path='/contest/history')">
          <img src="../static/img/clock_icon.svg">
          Lịch sử
        </div>

      </nav>
      <div class="user-actions">
        <img src="../static/img/icon_vn.svg" @click="message.warning('Tính năng đang được phát triển!')">
        <div style="padding-left: 10%">
          <a-dropdown :arrow="{ pointAtCenter: true }" placement="bottomRight">
            <a class="ant-dropdown-link" @click.prevent>
              <a-avatar
                  style="border: 1px solid #A7453C"
                  :src="currentUser.profile_picture ??
                            `https://ui-avatars.com/api/?name=${getAvatarName(currentUser.last_name + ' ' + currentUser.first_name)}`"
                  alt="Avatar"
              />
            </a>

            <template #overlay>
              <a-menu style="min-width: 150px">
                <a-menu-item>
                  <p style="margin-bottom: 0; padding-bottom: 0">
                    <IdcardOutlined/>
                    {{ currentUser.last_name + ' ' + currentUser.first_name }}
                  </p>
                  <p style="margin-bottom: 0; padding-bottom: 0">{{ currentUser.username }}</p>
                </a-menu-item>
                <a-menu-item v-if="isTeacherLogin" @click="switchBackToTeacher">
                  <UserOutlined />
                  Chuyển về tài khoản giảng viên
                </a-menu-item>
                <a-menu-item @click="handleLogout">
                  <LogoutOutlined/>
                  Đăng xuất
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </div>
    </div>
    <div class="box">
      <img class="line" alt="Line" src="../static/img/line.svg"/>
    </div>
  </header>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Montserrat+Alternates:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');

.box { /* Original Structure */
  height: 5%;
  width: 100vw;
}

.box .line { /* Original Structure */
  width: 100%;
  object-fit: cover;
  position: fixed;
  filter: brightness(0) saturate(100%) invert(91%) sepia(11%) saturate(247%) hue-rotate(178deg) brightness(93%) contrast(89%);
}

.header { /* Original Structure */
  background-color: #ffffff; /* Kept: Light theme background */
  width: 100%;
  position: fixed;
  top: 0;
  z-index: 1000;
  /* THEMED: Added for light theme separation, color-related property */
  border-bottom: 1px solid #D9E2EC;
  box-shadow: 0 1px 3px rgba(0, 90, 170, 0.05); /* Subtle shadow for elevation */
}

.header-content { /* Original Structure */
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 50px;
}

.logo { /* Original Structure */
  font-family: 'Montserrat Alternates', Helvetica, serif;
  font-size: 20px;
  white-space: nowrap;
  font-weight: 700;
  /* padding-left: 2%; */ /* Original comment retained */
  color: #007ACC; /* THEMED: Darker Accent Blue */
  cursor: pointer; /* Added for consistency, minimal impact */
}

.navigation { /* Original Structure */
  display: flex;
  flex: 1;
  min-width: 0;
  justify-content: center;
  gap: 28px;
  width: auto;
  margin: 0 40px;
}

.nav-item { /* Original Structure: First .nav-item block */
  font-family: 'Inter', Helvetica, serif;
  font-size: 17px;
  font-weight: 600;
  color: #5A738E; /* THEMED: Standard dark grey for inactive text (was #333) */
  cursor: pointer;
  white-space: nowrap;
}

.nav-item:hover { /* Original Structure */
  color: #00AFFF !important; /* THEMED: Vibrant Accent Blue (was #A7453C) */
  transition: color 0.3s ease, filter 0.3s ease; /* filter added to transition */
}

.nav-item { /* Original Structure: Second .nav-item block */
  color: #5A738E; /* THEMED: Standard dark grey for inactive text (was #737374) */
  font-size: 100%;
  display: flex; /* Kept from original */
  align-items: center; /* Added from previous good suggestion, minimal structural impact */
}

.nav-item img { /* Original Structure */
  padding-right: 8%;
  /* THEMED: Default state for icons (assuming they are black SVGs) */
  filter: opacity(0.65); /* Slightly subdued for inactive state */
  transition: filter 0.3s ease; /* Added for smooth filter transition */
}

.nav-item:hover img { /* Original Structure */
  /* THEMED: Filter for #00AFFF (Vibrant Accent Blue) - assuming original icon is black */
  filter: brightness(0) saturate(100%) invert(72%) sepia(99%) saturate(4463%) hue-rotate(165deg) brightness(102%) contrast(104%);
  transition: color 0.3s ease, filter 0.3s ease; /* filter was already part of original transition */
}

.user-actions { /* Original Structure */
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  width: auto;
}

.user-actions img { /* Original Structure, applies to both action icons */
  padding-left: 10%;
  /* THEMED additions for better interactivity feedback */
  cursor: pointer;
  filter: opacity(0.65); /* Default subdued state */
  transition: filter 0.2s ease, transform 0.2s ease;
}
.user-actions img:hover {
    filter: opacity(1); /* Full opacity on hover */
    transform: scale(1.05); /* Slight scale effect */
}
/* THEMED: Specific hover for question mark to become accent, if :styleNavItem doesn't cover its hover dynamically */
.user-actions img[src*="icon_question.svg"]:hover {
   filter: brightness(0) saturate(100%) invert(72%) sepia(99%) saturate(4463%) hue-rotate(165deg) brightness(102%) contrast(104%) opacity(1); /* #00AFFF */
}


/* THEMED: Ant Design Dropdown Menu Item Theming (global for better consistency) */
:global(.ant-dropdown-menu-item .anticon) {
  margin-right: 8px;
  color: #007ACC; /* Ensures icons in dropdown match accent */
}
:global(.ant-dropdown-menu-item) {
  color: #2c3e50; /* Dark text for dropdown items */
}
:global(.ant-dropdown-menu-item:hover), :global(.ant-dropdown-menu-submenu-title:hover) {
  background-color: rgba(0, 175, 255, 0.08) !important; /* Light accent hover for dropdown items */
  color: #007ACC !important;
}
</style>