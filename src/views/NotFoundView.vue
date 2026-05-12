<script setup>
import {useRouter} from 'vue-router';
import {HomeOutlined} from '@ant-design/icons-vue'

const router = useRouter();

const goToHome = () =>
{
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (!user) {
    router.push('/login');
    return;
  }

  if (user.role === 'admin') {
    router.push('/admin/users');
    return;
  }

  if (user.member_group === 2) {
    router.push('/lecturer/questions');
    return;
  }

  router.push('/home');
};
</script>

<template>
    <div class="container">
        <img class="image foreground" alt="Not found" src="../static/img/404NotFound.svg"/>
        <img class="image background" alt="Not found background" src="../static/img/404NotFoundBg.svg"/>
        <a-button type="primary" class="home-button" @click="goToHome">
            <HomeOutlined />
            Quay về trang chủ
        </a-button>

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
.container
{
    position: relative;
    width: 100%;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
}

.image
{
    position: absolute;
    max-width: 100%;
    max-height: 100%;
}

.foreground
{
    z-index: 2;
}

.background
{
    z-index: 1;
    opacity: 0.7;
}

.home-button
{
    position: absolute;
    bottom: 20px;
    left: 51.5%;
    transform: translateX(-50%);
    font-size: 16px;
    border: none;
    border-radius: 5px;
    color: white;
    cursor: pointer;
    z-index: 3;
}
</style>
