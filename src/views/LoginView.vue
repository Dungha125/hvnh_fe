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
        router.push('/home');
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
        router.push('/home');
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
        <h1 class="title">ĐĂNG NHẬP</h1>
        <div class="input-group">
          <label>Tài khoản <span>*</span></label>
          <input v-model="username" type="text" placeholder="Nhập tài khoản" />
        </div>
        <div class="input-group">
          <label>Mật khẩu <span>*</span></label>
          <div class="password-wrapper">
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
/* For a true Neo-Futuristic feel, consider importing a sleek, geometric sans-serif font */
/* @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Rajdhani:wght@400;600;700&display=swap'); */
/* body { font-family: 'Rajdhani', sans-serif; } */

.login {
  position: relative;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 15px;
  overflow: hidden;
  /* background-color: #05080d; /* Fallback if image fails */
}

/* Background ảnh với blur - Neo-Futuristic often uses abstract or cityscape backgrounds */
.login::before {
  content: "";
  position: fixed; /* full màn hình */
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-image: url('../static/img/unnamed.jpg'); /* Consider a more techy/abstract image */
  background-size: cover;
  background-position: center;
  filter: blur(8px) brightness(0.7); /* Slightly darker and blurred */
  z-index: -2;
}

/* Lớp phủ gradient - cooler, darker tones */
.login::after {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(0deg, rgba(249, 249, 249, 0.904), rgba(62, 62, 62, 0.3),rgba(62, 62, 62, 0.06)); /* Dark blue/grey overlay */
  z-index: -1;
}

.content-wrapper {
  width: 100%;
  max-width: 400px; /* Slightly smaller for a sleeker feel */
  padding: 20px;
}

.login-card {
  background: rgba(247, 247, 247, 0.9); /* Dark, slightly transparent card */
  border-radius: 12px; /* Sharper, but still modern */
  border: 1px solid rgba(0, 175, 255, 0.3); /* Accent color border */
  box-shadow: 0 0 30px rgba(0, 175, 255, 0.15), 0 0 50px rgba(0, 175, 255, 0.1); /* Accent glow */
  padding: 35px 30px;
  text-align: center;
  transition: box-shadow 0.3s ease, border-color 0.3s ease;
}

.login-card:hover {
  box-shadow: 0 0 40px rgba(0, 175, 255, 0.25), 0 0 60px rgba(0, 175, 255, 0.2);
  border-color: rgba(0, 175, 255, 0.5);
}

.title {
  font-size: 26px; /* Slightly larger for impact */
  font-weight: 700;
  /* font-family: 'Orbitron', sans-serif; /* Example of a futuristic font */
  color: #00AFFF; /* Bright accent blue/cyan */
  margin-bottom: 35px;
  line-height: 1.2;
  letter-spacing: 0.05em; /* More spacing for a futuristic look */
  text-shadow: 0 0 8px rgba(0, 175, 255, 0.5), 0 0 12px rgba(0, 175, 255, 0.3); /* Glow effect */
  text-transform: uppercase; /* Common in futuristic UI */
}

.input-group {
  text-align: left;
  margin-bottom: 22px;
}

.input-group label {
  font-weight: 600;
  color: #38649e; /* Light steel blue - readable on dark */
  font-size: 14px;
  margin-bottom: 8px; /* Added margin for clarity */
  display: block; /* Ensure it takes its own line */
}

.input-group label span {
  color: #ff0000; /* Accent color for asterisk */
}

.input-group input {
  width: 100%;
  padding: 12px 15px;
  margin-top: 4px; /* Reduced from 6px */
  background-color: #fafafa; /* Dark input background */
  border: 1px solid #444; /* Subtler border */
  border-radius: 8px; /* Sharper corners */
  color: #00AFFF; /* Light text color */
  font-size: 15px;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.3);
}

.input-group input::placeholder {
  color: #777;
  font-style: normal; /* Less italic, more direct */
}

.input-group input:focus {
  border-color: #00AFFF; /* Accent color focus */
  box-shadow: 0 0 12px rgba(0, 175, 255, 0.4), inset 0 1px 3px rgba(0,0,0,0.3);
  outline: none;
}

.password-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-wrapper input {
  flex: 1;
  padding-right: 40px; /* Space for the icon */
}

.password-wrapper .anticon {
  position: absolute;
  right: 12px;
  cursor: pointer;
  color: #00AFFF; 
  font-size: 18px; /* Slightly smaller */
  transition: color 0.3s ease;
}

.password-wrapper .anticon:hover {
  color: #33CFFF; /* Brighter accent on hover */
}

.login-button {
  width: 100%;
  height: 45px;
  background: linear-gradient(90deg, #007ACC, #00AFFF); /* Accent blue gradient */
  color: white !important;
  font-weight: 700;
  font-size: 16px;
  border: none;
  border-radius: 8px; /* Sharper corners */
  box-shadow: 0 4px 12px rgba(0, 122, 204, 0.4);
  transition: background 0.3s ease, box-shadow 0.3s ease, transform 0.1s ease;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.login-button:hover {
  background: linear-gradient(90deg, #0088DD, #33CFFF);
  box-shadow: 0 6px 18px rgba(0, 136, 221, 0.6);
  transform: translateY(-1px);
}
.login-button:active {
  transform: translateY(0px);
  box-shadow: 0 3px 10px rgba(0, 122, 204, 0.3);
}


.or-divider {
  align-items: center;
  margin: 28px 0 ;
  color: #888;
  font-size: 13px;
  user-select: none;
}

.or-divider span {
  padding: 0 10px; /* Space around text */
  position: relative;
}

.or-divider span::before,
.or-divider span::after {
  content: "";
  flex: 1;
  height: 1px; /* Thinner line */
  background: #ececec; /* Darker line */
  /* margin: 0 10px; /* Replaced by padding on span */
}
/* Need to handle the flex distribution with the span in middle */
.or-divider span::before {
    position: absolute;
    left: 100%;
    top: 50%;
    width: 80px; /* Adjust as needed */
    margin-left: 10px;
}
.or-divider span::after {
    position: absolute;
    right: 100%;
    top: 50%;
    width: 80px; /* Adjust as needed */
    margin-right: 10px;
}


.login-ms {
  width: 100%;
  height: 45px;
  background-color: #1e3a5f; /* Darker, desaturated blue */
  color: #E0E0E0; /* Lighter text for contrast */
  font-weight: 600; /* Slightly less bold */
  border: 1px solid #0078D4; /* MS Blue border for subtle branding */
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 14px;
  box-shadow: 0 4px 10px rgba(0, 120, 212, 0.2);
  transition: background-color 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
  text-transform: uppercase;
}

.login-ms:hover {
  background-color: #2a4c7c;
  border-color: #33A1FF;
  color: #FFFFFF;
  box-shadow: 0 6px 15px rgba(0, 120, 212, 0.3);
}

</style>
