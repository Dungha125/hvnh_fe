<template>
    <div class="system-container">
      <div class="content-wrapper">
        <h2 class="title">Cấu hình hệ thống</h2>
  
        <a-form layout="vertical" class="system-form">
          <div class="checkbox-group">
            <a-checkbox v-model:checked="config.enableCaptcha">Bật captcha khi đăng nhập</a-checkbox>
            <a-checkbox v-model:checked="config.allowExternalLogin">Cho phép đăng nhập từ ngoài Internet</a-checkbox>
            <a-checkbox v-model:checked="config.allowPracticeLogin">Cho phép đăng nhập chế độ luyện tập</a-checkbox>
            <a-checkbox v-model:checked="config.showIP">Hiển thị IP cho người dùng</a-checkbox>
            <a-checkbox v-model:checked="config.requireStudentID">Yêu cầu chứng minh thư / thẻ sinh viên khi thi</a-checkbox>
          </div>
  
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="Cho phép đăng nhập trước thời gian thi (phút)">
                <a-input-number v-model:value="config.loginBeforeContest" :min="0" style="width: 100%" />
              </a-form-item>
  
              <a-form-item label="ID Scoreboard mặc định">
                <a-input v-model:value="config.defaultScoreboardId" />
              </a-form-item>
  
              <a-form-item label="Online Scoreboard ID">
                <a-input v-model:value="config.onlineScoreboardId" />
              </a-form-item>
  
              <a-form-item label="Public Room Contest ID">
                <a-input v-model:value="config.publicRoomContestId" />
              </a-form-item>
            </a-col>
  
            <a-col :span="12">
              <a-form-item label="Public Room Password">
                <a-input v-model:value="config.publicRoomPassword" />
              </a-form-item>
  
              <a-form-item label="Time refresh scoreboard (ms)">
                <a-input-number v-model:value="config.refreshTime" :min="1000" style="width: 100%" />
              </a-form-item>
  
              <a-form-item label="Internal IP Address">
                <a-textarea v-model:value="config.internalIP" rows="2" />
              </a-form-item>
  
              <a-form-item label="Prefix Username">
                <a-input v-model:value="config.prefixUsername" />
              </a-form-item>
            </a-col>
          </a-row>
  
          <div class="button-group">
            <a-button type="primary" @click="onUpdate">Cập nhật</a-button>
            <a-button @click="onReset">Khôi phục</a-button>
          </div>
        </a-form>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  
  const config = ref({
    enableCaptcha: false,
    allowExternalLogin: true,
    allowPracticeLogin: true,
    showIP: true,
    requireStudentID: true,
    loginBeforeContest: 30,
    defaultScoreboardId: '',
    onlineScoreboardId: '',
    publicRoomContestId: '',
    publicRoomPassword: '',
    refreshTime: 3000,
    internalIP: '',
    prefixUsername: ''
  })
  
  const onUpdate = () => {
    console.log('Cấu hình gửi lên:', config.value)
    alert('Cập nhật cấu hình thành công!')
  }
  
  const onReset = () => {
    alert('Khôi phục cấu hình mặc định!')
  }
  </script>
  
  <style scoped>
  .system-container {
    background: #fff;
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: flex-start;  
    padding-top: 40px;        
  }
  
  .content-wrapper {
    padding: 20px;
    max-width: 720px;       
    background: #fff;
    border-radius: 8px;
    border: 1px solid #e0e0e0;
    box-shadow: 0 2px 10px rgba(255, 0, 0, 0.1);  
  }
  
  .title {
    font-size: 18px;         
    font-weight: 600;
    margin-bottom: 16px;
    color: #b71c1c;         
    text-align: center;
  }
  
  .checkbox-group {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 16px;
    margin-bottom: 16px;
  }
  
  .system-form {
    background: #fff;
    padding: 16px;
    border-radius: 8px;
  }
  
  .button-group {
    margin-top: 16px;
    display: flex;
    gap: 12px;
    justify-content: center;
  }
  
  a-button {
    background-color: #b71c1c;
    color: #fff;
    border: none;
  }
  
  a-button:hover {
    background-color: #a01313;
  }
  </style>
  