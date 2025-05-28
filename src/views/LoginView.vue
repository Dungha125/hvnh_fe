<script setup>
import {EyeInvisibleOutlined, EyeOutlined, LoginOutlined} from '@ant-design/icons-vue'
import {useRouter} from 'vue-router'
import {onBeforeMount, ref} from "vue";
import axios from "@/configs/axios.js";
import {message} from "ant-design-vue";
import {onMounted, onUnmounted} from "vue";

const router = useRouter();
const username = ref('');
const password = ref('');
const passwordInputType = ref('password');
const isLoading = ref(false);
const baseRidirectURL = import.meta.env.VITE_BASE_REDIRECT_URL;

if (!baseRidirectURL) {
  console.error("Url chưa được thiết lập trong .env");
}

onBeforeMount(async () => {
  const accessToken = localStorage.getItem('access_token');
  if (!accessToken) return;

  try {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    if (currentUser.role === "student") {
      const contestResponse = await axios.get('contests/available');

      if (contestResponse.data?.data?.data?.length > 0) {
        sessionStorage.setItem('contest', "true");
        router.push('/contest');
      } else {
        router.push('/problems');
      }
    } else {
      router.push('/admin/users');
    }
  } catch (error) {
    console.error("Error checking contest availability:", error);
  }
});

const login = async () => {
  isLoading.value = true;
  const user = {username: username.value, password: password.value};
  await axios.post('auth/login', user).then(async (response) => {
    localStorage.setItem('access_token', response.data.access_token);
    localStorage.setItem('username', response.data.user.username);
    await axios.get('auth/profile').then(response => {
      localStorage.setItem('user', JSON.stringify(response.data.data));
    });
    message.success('Đăng nhập thành công!');

    console.log(response.data.user.role);
    if (response.data.user.role === 'student') {
      const contestResponse = await axios.get('contests/available');
      if (contestResponse.data.data && contestResponse.data.data.data.length > 0) {
        sessionStorage.setItem('contest', "true");
        router.push('/contest');
      } else {
        router.push('/problems');
      }
    } else if (response.data.user.role === 'teacher') {
      router.push('/lecturer/questions');
    }
    else if (response.data.user.role === 'admin') {
      router.push('/admin/users');
    }
    else {
      message.error('Tính năng đang phát triển !');
    }
  }).catch(error => {
    if (error.status === 401)
      message.error('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin đăng nhập!');
    else
      message.error('Đã xảy ra lỗi. Vui lòng thử lại sau!');
  });
  isLoading.value = false;
}

const handleEnterPress = (event) => {
  if (event.key === 'Enter' && !isLoading.value) {
    login()
  }
}

onMounted(() => window.addEventListener('keydown', handleEnterPress))
onUnmounted(() => window.removeEventListener('keydown', handleEnterPress))

const loginWithMS = async () => {
  try {
    const response = await axios.get(`auth/o365?redirect_uri=${baseRidirectURL}`)
    if (response.data && response.data.redirect_url) {
      window.location.href = response.data.redirect_url
    } else {
      console.error('Không tìm thấy redirect_url trong phản hồi API')
    }
  } catch (error) {
    console.error('Lỗi khi gọi API đăng nhập:', error)
  }
}

const togglePassword = () => {
  passwordInputType.value = passwordInputType.value === 'password' ? 'text' : 'password';
}
</script>


<template>
  <div class="login">
    <div class="content-wrapper">
      <div class="login-card">
        <h1 class="title">Đăng nhập</h1>
        <div class="input-group">
          <label>Tài khoản <span>*</span></label>
          <input v-model="username" type="text" placeholder="Nhập tài khoản" />
        </div>
        <div class="input-group">
          <label>Mật khẩu <span>*</span></label>
          <div class="password-wrapper ">
            <input v-model="password" :type="passwordInputType" placeholder="Nhập mật khẩu" />
            <EyeOutlined v-if="passwordInputType !== 'password'" @click="togglePassword"/>
            <EyeInvisibleOutlined v-else @click="togglePassword" />
          </div>
        </div>
        <a-button
          :loading="isLoading"
          type="primary"
          class="login-button"
          @click="login"
          @keyup.enter="login"
        >
          <LoginOutlined /> Đăng nhập
        </a-button>
        <div class="or-divider">
          <span>Hoặc đăng nhập bằng</span>
        </div>
        <a-button
          class="login-ms"
          @click="loginWithMS"
        >
          HVNH MICROSOFT OFFICE 365
        </a-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login {
  position: relative;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 15px;
  overflow: hidden;
}

/* Background ảnh với blur */
.login::before {
  content: "";
  position: fixed; /* full màn hình */
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-image: url('../static/img/unnamed.jpg');
  background-size: cover;
  background-position: center;
  filter: blur(8px);
  z-index: -2;
}

/* Lớp phủ gradient xanh trong suốt */
.login::after {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(0deg, rgba(0, 51, 102, 0.6), rgba(0, 85, 165, 0));
  z-index: -1;
}
.content-wrapper {
  width: 100%;
  max-width: 420px;
  padding: 25px;
}

.login-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(255, 140, 0, 0.25);
  padding: 40px 35px;
  text-align: center;
  transition: box-shadow 0.3s ease;
}

.login-card:hover {
  box-shadow: 0 16px 48px rgba(255, 140, 0, 0.4);
}

.logo-banking {
  max-width: 110px;
  margin-bottom: 28px;
  filter: drop-shadow(0 0 3px rgba(255, 140, 0, 0.6));
}

.title {
  font-size: 24px;
  font-weight: 700;
  color: #FF6F00; /* vàng cam nổi bật */
  margin-bottom: 32px;
  line-height: 1.2;
  letter-spacing: 0.04em;
  text-shadow: 1px 1px 2px rgba(255,111,0,0.4);
}

.input-group {
  text-align: left;
  margin-bottom: 20px;
}

.input-group label {
  font-weight: 600;
  color: #333333;
  font-size: 15px;
}

.input-group label span {
  color: #FF6F00;
}

.input-group input {
  width: 100%;
  padding: 14px 16px;
  margin-top: 6px;
  border: 2px solid #E0E0E0;
  border-radius: 12px;
  font-size: 15px;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: inset 0 2px 5px rgba(0,0,0,0.05);
}

.input-group input::placeholder {
  color: #bbb;
  font-style: italic;
}

.input-group input:focus {
  border-color: #FF6F00;
  box-shadow: 0 0 10px rgba(255, 111, 0, 0.3);
  outline: none;
}

.password-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-wrapper input {
  flex: 1;
  padding-right: 44px;
}

.password-wrapper .anticon {
  position: absolute;
  right: 14px;
  cursor: pointer;
  color: #FF6F00;
  font-size: 20px;
  transition: color 0.3s ease;
}

.password-wrapper .anticon:hover {
  color: #ff8c00;
}

.login-button {
  width: 100%;
  height: 48px;
  background: linear-gradient(90deg, #FF6F00, #FF8C00);
  color: white !important;
  font-weight: 700;
  font-size: 17px;
  border: none;
  border-radius: 12px;
  box-shadow: 0 6px 15px rgba(255, 111, 0, 0.5);
  transition: background 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.login-button:hover {
  background: linear-gradient(90deg, #ff8c00, #ff9d1a);
  box-shadow: 0 8px 24px rgba(255, 141, 0, 0.7);
}

.or-divider {
  display: flex;
  align-items: center;
  margin: 26px 0 24px;
  color: #888;
  font-size: 14px;
  user-select: none;
}

.or-divider span {
  flex: 1;
  text-align: center;
  position: relative;
}

.or-divider span::before,
.or-divider span::after {
  content: "";
  flex: 1;
  height: 1.5px;
  background: #ccc;
  margin: 0 12px;
  border-radius: 2px;
}

.login-ms {
  width: 100%;
  height: 45px;
  background-color: #0078D4;
  color: #FFFFFF;
  font-weight: 700;
  border: none;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 15px;
  box-shadow: 0 5px 15px rgba(0, 120, 212, 0.5);
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
}

.login-ms:hover {
  background-color: #005a9e;
  box-shadow: 0 7px 20px rgba(0, 90, 158, 0.7);
}

</style>
