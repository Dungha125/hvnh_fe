<template>
    <div class="subject-container">
      <div class="content-wrapper">
        <div class="header-area">
          <h1>Môn học</h1>
          <a-button type="primary" class="add-button" @click="showModalAdd">Thêm mới</a-button>
        </div>
  
        <a-table :columns="columns" :dataSource="subjects" rowKey="code" bordered :pagination="false">
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'status'">
              <a-button :class="statusClass(record.status)">
                {{ record.status }}
              </a-button>
            </template>
  
            <template v-else-if="column.dataIndex === 'actions'">
              <a-dropdown>
                <template #overlay>
                  <a-menu>
                    <a-menu-item @click="onEdit(record)">Sửa</a-menu-item>
                    <a-menu-item @click="onDelete(record.code)">Xóa</a-menu-item>
                  </a-menu>
                </template>
                <a-button>...</a-button>
              </a-dropdown>
            </template>
  
            <template v-else>
              {{ record[column.dataIndex] }}
            </template>
          </template>
        </a-table>
      </div>
  
      <!-- Modal Thêm/Sửa Môn Học -->
      <a-modal
        v-model:open="isModalVisible"
        :title="isEditing ? 'Sửa môn học' : 'Thêm môn học'"
        @ok="onSubmit"
        @cancel="closeModal"
        okText="Lưu"
        cancelText="Hủy"
        width="800px"
      >
        <a-form layout="vertical">
          <a-form-item label="Mã *" required>
            <a-input v-model:value="tempSubject.code" placeholder="Nhập mã môn học" />
          </a-form-item>
          <a-form-item label="Tên *" required>
            <a-input v-model:value="tempSubject.name" placeholder="Nhập tên môn học" />
          </a-form-item>
  
          <a-form-item label="Trình biên dịch *" required>
            <a-checkbox-group v-model:value="tempSubject.compilers" :options="compilerOptions" />
          </a-form-item>
  
          <a-form-item label="Mô tả">
            <a-textarea v-model:value="tempSubject.description" placeholder="Mô tả môn học" />
          </a-form-item>
  
          <a-form-item label="Tên rút gọn *" required>
            <a-input v-model:value="tempSubject.shortName" placeholder="Tên rút gọn" />
          </a-form-item>
  
          <a-form-item label="Số TC học phí *" required>
            <a-input-number v-model:value="tempSubject.tuitionCredits" :min="1" style="width: 100%" />
          </a-form-item>
  
          <a-form-item label="Số TC *" required>
            <a-input-number v-model:value="tempSubject.credits" :min="1" style="width: 100%" />
          </a-form-item>
  
          <a-form-item label="Daily AC Limit">
            <a-input-number v-model:value="tempSubject.dailyAcLimit" :min="1" style="width: 100%" />
          </a-form-item>
  
          <a-form-item label="Trạng thái">
            <a-select v-model:value="tempSubject.status">
              <a-select-option value="Hoạt động">Hoạt động</a-select-option>
              <a-select-option value="Không hoạt động">Không hoạt động</a-select-option>
            </a-select>
          </a-form-item>
  
          <a-form-item>
            <a-checkbox v-model:checked="tempSubject.testPerCase">Chấm từng test</a-checkbox>
          </a-form-item>
        </a-form>
      </a-modal>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import AdminHeader from '@/components/AdminHeader.vue'
  
  const subjects = ref([
    { code: 'ADVANCED', name: 'LẬP TRÌNH NÂNG CAO', credits: 3, status: 'Hoạt động' },
    { code: 'ALGORITHM', name: 'THUẬT TOÁN', credits: 3, status: 'Hoạt động' },
    { code: 'BASIC', name: 'LẬP TRÌNH CƠ BẢN', credits: 3, status: 'Hoạt động' },
    { code: 'DOTNET', name: 'Lập trình ASP.NET', credits: 3, status: 'Hoạt động' },
    { code: 'JAVA', name: 'Lập trình căn bản Java', credits: 3, status: 'Hoạt động' },
    { code: 'OOP', name: 'Lập trình hướng đối tượng', credits: 3, status: 'Hoạt động' },
    { code: 'THCS', name: 'Tin học cơ sở', credits: 3, status: 'Hoạt động' },
  ])
  
  const columns = [
    { title: 'Mã', dataIndex: 'code', key: 'code' },
    { title: 'Tên', dataIndex: 'name', key: 'name' },
    { title: 'Số TC', dataIndex: 'credits', key: 'credits' },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status' },
    { title: 'Thao tác', dataIndex: 'actions', key: 'actions' },
  ]
  
  const compilerOptions = [
    { label: 'C - c', value: 'c' },
    { label: 'CPP14 - cpp', value: 'cpp' },
    { label: 'PY3 - py', value: 'py' },
    { label: 'MONOCS - dotnet', value: 'dotnet' },
    { label: 'JAVA8 - java', value: 'java' },
  ]
  
  const isModalVisible = ref(false)
  const isEditing = ref(false)
  const tempSubject = ref({})
  let editingCode = null
  
  const showModalAdd = () => {
    isEditing.value = false
    editingCode = null
    tempSubject.value = { status: 'Hoạt động', dailyAcLimit: 10, compilers: [] }
    isModalVisible.value = true
  }
  
  const closeModal = () => isModalVisible.value = false
  
  const onSubmit = () => {
    if (!tempSubject.value.code || !tempSubject.value.name || !tempSubject.value.shortName) {
      alert('Vui lòng nhập đầy đủ các trường bắt buộc!')
      return
    }
    if (!isEditing.value) {
      if (subjects.value.some((s) => s.code === tempSubject.value.code)) {
        alert('Mã môn học đã tồn tại!')
        return
      }
      subjects.value.push({ ...tempSubject.value })
    } else {
      const idx = subjects.value.findIndex((s) => s.code === editingCode)
      if (idx !== -1) subjects.value[idx] = { ...tempSubject.value }
    }
    closeModal()
  }
  
  const onEdit = (record) => {
    isEditing.value = true
    editingCode = record.code
    tempSubject.value = { ...record }
    isModalVisible.value = true
  }
  
  const onDelete = (code) => {
    subjects.value = subjects.value.filter((s) => s.code !== code)
  }
  
  const statusClass = (status) => {
    return status === 'Hoạt động' ? 'active-status' : 'inactive-status'
  }
  </script>
  
  <style scoped>
  .subject-container {
    background: #fff;
    min-height: 100vh;
  }
  
  .content-wrapper {
    padding: 24px;
    margin-top: 20px;
  }
  
  .header-area {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .add-button {
    background-color: #c62828;
    color: #fff;
    font-weight: 600;
  }
  
  .add-button:hover {
    background-color: #a71d1d;
  }
  
  .active-status {
    border: 1px solid green;
    color: green;
    background-color: #fff;
  }
  
  .inactive-status {
    border: 1px solid red;
    color: red;
    background-color: #fff;
  }
  </style>
  