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
      <img class="image" alt="Image" src="../static/img/image-1.png"/>
      <div class="log-in">
        <img class="imageLogoPTIT" src="../static/img/logo-ptit.svg" alt="Image">
        <div class="text-wrapper">Đăng nhập CodePtit</div>
        <div class="input-text">
          <div class="label">
            <p class="p">
              <span class="span">Tài khoản </span>
              <span class="text-wrapper-2">*</span>
            </p>
          </div>
          <input v-model="username" type="text" class="placeholder"/>
        </div>
        <div class="input-text">
          <div class="label">
            <p class="p">
              <span class="span">Mật khẩu </span>
              <span class="text-wrapper-2">*</span>
            </p>
          </div>
          <div class="password-wrapper">
            <input v-model="password" :type="passwordInputType" class="placeholder-2"/>
            <EyeOutlined v-if="passwordInputType !== 'password'" style="font-size: 20px"
                         class="vuesax-linear-eye" @click="togglePassword"/>
            <EyeInvisibleOutlined v-else style="font-size: 20px" class="vuesax-linear-eye"
                                  @click="togglePassword"/>
          </div>
          <!--                    <div class="label-2">-->
          <!--                        <div class="text-wrapper-5">Quên mật khẩu?</div>-->
          <!--                    </div>-->
        </div>

        <a-button :loading="isLoading" type="primary"
                  style="font-size: 100%; width: 100%; min-height: 45px; color: white !important;" @click="login"
                  @keyup.enter="login">
          <LoginOutlined/>
          Đăng nhập
        </a-button>

        <div class="frame-2">
          <div class="frame-3">
            <img class="vector" alt="Vector" src="../static/img/vector-1.svg"/>
            <div class="text-wrapper-7">Hoặc đăng nhập với</div>
            <img class="img" alt="Vector" src="../static/img/vector-2.svg"/>
          </div>
          <a-button
              type="primary"
              style="font-size: 100%; width: 100%; min-height: 45px; color: white !important; background-color: #2d73ed ;"
              @click="loginWithMS"
          >
            PTIT MICROSOFT OFFICE 365
          </a-button>
        </div>
      </div>
    </div>

    <a-config-provider
        :theme="{
                token: {
                    colorPrimary: '#A7453C',
                    colorTextHeading: '#000000',
                    colorText: '#A7453C',
                    colorBorderSecondary: 'rgba(186,151,147,0.45)'
                },
            }"
    />
  </div>
</template>


<style scoped>
.login {
  background-color: #f6f6f6;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100vw;
  height: 100vh;
  padding: 20px;
  /* Thêm padding để tạo khoảng cách khi trên màn hình nhỏ */
}

.content-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 50px;
  /* Khoảng cách giữa hình ảnh và form đăng nhập */
  width: 100%;
}

.image {
  height: auto;
  max-height: 100%;
  width: auto;
  max-width: 50%;
  /* Điều chỉnh tỷ lệ hình ảnh */
  object-fit: cover;
}

.imageLogoPTIT {
  height: auto;
  max-height: 50%;
  width: auto;
  max-width: 20%;
  /* Điều chỉnh tỷ lệ hình ảnh */
  object-fit: cover;
}

.log-in {
  background-color: #ffffff;
  border-radius: 10px;
  box-shadow: 0px 4px 8px #424f5b40;
  padding: 40px 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  width: 100%;
  max-width: 400px;
}

.text-wrapper {
  color: #282828;
  font-family: "Inter-Bold", Helvetica;
  font-size: 22px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 20px;
  color: #A7453C;
}

.input-text {
  width: 100%;
}

.label {
  display: flex;
  justify-content: space-between;
  padding: 0px 5px;
}

.p {
  font-family: "Inter-Regular", Helvetica;
  font-size: 16px;
  font-weight: 400;
  color: #282828;
  margin: 0;
}

.span {
  letter-spacing: -0.13px;
}

.text-wrapper-2 {
  color: #ec4782;
}

.placeholder,
.placeholder-2 {
  width: 100%;
  padding: 14px;
  border: 1px solid #ec4782;
  border-radius: 8px;
  background-color: #ffffff;
  box-sizing: border-box;
}

.password-wrapper {
  display: flex;
  align-items: center;
  width: 100%;
  position: relative;
}

.vuesax-linear-eye {
  position: absolute;
  right: 15px;
}

.label-2 {
  display: flex;
  justify-content: flex-end;
  width: 100%;
  padding: 0px 5px;
}

.text-wrapper-5 {
  color: #282828;
  font-family: "Inter-Regular", Helvetica;
  font-size: 12px;
}

.text-wrapper-6 {
  font-family: "Inter-Regular", Helvetica;
  font-size: 16px;
  font-weight: 400;
}

.frame-2 {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.frame-3 {
  display: flex;
  align-items: center;
  gap: 5px;
}

.vector,
.img {
  height: 3px;
  width: 85px;
}

.text-wrapper-7 {
  color: #000000;
  font-family: "Inter-Light", Helvetica;
  font-size: 14px;
  font-weight: 300;
  opacity: 0.5;
  text-align: center;
}

.bar-icon {
  width: 100%;
}


/* Responsive styles */
@media (max-width: 768px) {
  .content-wrapper {
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }

  .image {
    display: none;
  }

  .log-in {
    max-width: 100%;
  }
}

</style>