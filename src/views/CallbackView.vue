<script setup>
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from "@/configs/axios.js"

const router = useRouter()
const route = useRoute()
const baseRidirectURL = import.meta.env.VITE_BASE_REDIRECT_URL;

if (!baseRidirectURL) {
    console.error("Url chưa được thiết lập trong .env");
}

onMounted(async () => {
  const code = route.query.code
  if (!code) {
    console.error('Không tìm thấy code từ Microsoft')
    router.push('/')
    return
  }

  try {

    const response = await axios.post('auth/o365', {
      code,
      redirect_uri: baseRidirectURL
    })

    const token = response.data.access_token
    if (!token) throw new Error("Không nhận được access_token")

    localStorage.setItem('access_token', token)
    localStorage.setItem('user', JSON.stringify(response.data.user))
    localStorage.setItem('username', response.data.user.username);

    if (response.data.user.role === 'student'){
      const contestResponse = await axios.get('contests/available');
        if (contestResponse.data.data && contestResponse.data.data.data.length > 0) {
          sessionStorage.setItem('contest', "true");
          router.push('/contest');
        } 
        else {
          router.push('/home');
        }
      }
        else if (response.data.user.role === 'admin')
      {
        router.push('/admin/users');
      }
        else
        {
            message.error('Tính năng đang phát triển !');
        }
  } catch (error) {
    console.error('Lỗi khi đăng nhập:', error)
    router.push('/') 
  }
})
</script>

<template>
</template>
