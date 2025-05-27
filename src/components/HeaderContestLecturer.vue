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

const styleNavItem = (path) => {
  return {
    color: currentPath.includes(path) && !isHover.value ? '#A7453C' : '#737374',
    filter: currentPath.includes(path) && !isHover.value ? 'invert(32%) sepia(64%) saturate(506%) hue-rotate(330deg) brightness(70%) contrast(95%)' : '',
    transition: 'color 0.3s ease, filter 0.3s ease'
  }
}



const goTo = (path) => {
  router.push(path);
}

const addHoverEvent = (event, path) => {
  if (currentPath.includes(path))
    return;
  isHover.value = true;
}

const switchBackToTeacher = () => {
  const teacherToken = sessionStorage.getItem('teacher_access_token');
  if (teacherToken) {
    localStorage.setItem("access_token", sessionStorage.getItem("teacher_access_token"));
    localStorage.setItem("user", sessionStorage.getItem("user_teacher"));
    localStorage.setItem("username", sessionStorage.getItem("username_teacher"));
    sessionStorage.clear();
    
    message.success('Đã chuyển về tài khoản giảng viên');
    // window.location.reload().then(()=>{
    //   router.replace("/lecturer/settings");
    // })
    router.replace("/lecturer/settings");
  } else {
    message.error('Không tìm thấy tài khoản giảng viên');
  }
};

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
      <div class="logo" @click="goTo('/lecturer/contest/student')">CodePtit.</div>
      <nav class="navigation">
        <!--                <div class="nav-item"-->
        <!--                     :style="styleNavItem('/home')"-->
        <!--                     @click="goTo('/home')"-->
        <!--                     @mouseover="addHoverEvent(event, path='/home')"-->
        <!--                     @mouseout="removeHoverEvent(event, path='/home')">-->
        <!--                    Trang chủ-->
        <!--                </div>-->

        <div class="nav-item"
             :style="styleNavItem('//lecturer/contest/student')"
             @click="goTo('/lecturer/contest/student')"
             @mouseover="addHoverEvent(event, path='/lecturer/contest/student')"
             @mouseout="removeHoverEvent(event, path='/lecturer/contest/student')">
          Thực hành
        </div>

        <div class="nav-item"
             :style="styleNavItem('/lecturer/contest/student/problems')"
             @click="goTo('/lecturer/contest/student/problems')"
             @mouseover="addHoverEvent(event, path='/lecturer/contest/student/problems')"
             @mouseout="removeHoverEvent(event, path='/lecturer/contest/student/problems')">
          <img src="../static/img/problem.svg">
          Bài tập
        </div>

        <div class="nav-item"
             :style="styleNavItem('/lecturer/contest/student/history')"
             @click="goTo('/lecturer/contest/student/history')"
             @mouseover="addHoverEvent(event, path='/lecturer/contest/student/history')"
             @mouseout="removeHoverEvent(event, path='/lecturer/contest/student/history')">
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
                <a-menu-item @click="goTo('/profile')">
                  <UserOutlined/>
                  Hồ sơ
                </a-menu-item>
                <a-menu-item @click="switchBackToTeacher">
                  <UserOutlined/>
                  Quay lại tài khoản giảng viên
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

.box {
  height: 5%;
  width: 100vw;
}

.box .line {
  width: 100%;
  object-fit: cover;
  position: fixed;
}

.header {
  background-color: #ffffff;
  width: 100%;
  position: fixed;
  top: 0;
  z-index: 1000;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
}

.logo {
  font-family: 'Montserrat Alternates', Helvetica, serif;
  font-size: 32px;
  font-weight: 700;
  padding-left: 2%;
  color: #A7453C;
}

.navigation {
  display: flex;
  justify-content: space-evenly;
  width: 100vw;
  margin-left: 10%;
  margin-right: 10%;
}

.nav-item {
  font-family: 'Inter', Helvetica, serif;
  font-size: 17px;
  font-weight: 600;
  color: #333;
  cursor: pointer;
  white-space: nowrap;
}

.nav-item:hover {
  color: #A7453C !important;
  transition: color 0.3s ease, filter 0.3s ease;
}

.nav-item {
  color: #737374;
  font-size: 100%;
  display: flex;
}

.nav-item img {
  padding-right: 8%;
}

.nav-item:hover img {
  filter: invert(32%) sepia(64%) saturate(506%) hue-rotate(330deg) brightness(70%) contrast(95%);
  transition: color 0.3s ease, filter 0.3s ease;
}

.user-actions {
  display: flex;
  align-items: center;
  width: 15vw;
}

.user-actions img {
  padding-left: 10%;
}
</style>