<template>
    <div class="topic-container">
      <div class="header">
        <h2>Chủ đề bài tập</h2>
        <a-button type="primary" class="add-button" @click="showModal = true">Thêm mới</a-button>
      </div>
  
      <a-table :columns="columns" :dataSource="topics" rowKey="code" bordered :pagination="false">
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'status'">
            <a-button class="status-btn">{{ record.status }}</a-button>
          </template>
  
          <template v-else-if="column.dataIndex === 'actions'">
            <a-dropdown>
              <template #overlay>
                <a-menu>
                  <a-menu-item @click="onEdit(record)">Sửa</a-menu-item>
                  <a-menu-item @click="onDelete(record.code)">Xóa</a-menu-item>
                </a-menu>
              </template>
              <a-button class="action-btn">...</a-button>
            </a-dropdown>
          </template>
  
          <template v-else>
            {{ record[column.dataIndex] }}
          </template>
        </template>
      </a-table>
  
      <!-- Modal Thêm/Sửa -->
      <a-modal v-model:open="showModal" :title="isEditing ? 'Chỉnh sửa chủ đề bài tập' : 'Thêm chủ đề bài tập'" @ok="onSubmit" okText="Lưu" cancelText="Hủy">
        <a-form layout="vertical">
          <a-form-item label="Mã *" required>
            <a-input v-model:value="form.code" :disabled="isEditing" />
          </a-form-item>
          <a-form-item label="Tên *" required>
            <a-input v-model:value="form.name" />
          </a-form-item>
          <a-form-item label="Môn học *" required>
            <a-select v-model:value="form.subject">
              <a-select-option v-for="s in subjects" :key="s" :value="s">{{ s }}</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="Mô tả">
            <a-textarea v-model:value="form.description" />
          </a-form-item>
          <a-form-item label="Thứ tự">
            <a-input-number v-model:value="form.order" :min="0" style="width: 100%" />
          </a-form-item>
          <a-form-item label="Trạng thái">
            <a-select v-model:value="form.status">
              <a-select-option value="Hoạt động">Hoạt động</a-select-option>
              <a-select-option value="Không hoạt động">Không hoạt động</a-select-option>
            </a-select>
          </a-form-item>
          <p style="color: red">(*) Bắt buộc</p>
        </a-form>
      </a-modal>
    </div>
  </template>

<script setup>
import { ref } from 'vue'

const subjects = [
  'BASIC - LẬP TRÌNH CƠ BẢN',
  'ADVANCED - LẬP TRÌNH NÂNG CAO',
  'DOTNET - Lập trình ASP.NET',
  'OOP - Lập trình hướng đối tượng'
]

const topics = ref([
  { code: 'B1', name: 'B1', subject: 'BASIC - LẬP TRÌNH CƠ BẢN', order: 1, status: 'Hoạt động' },
  { code: 'A1', name: 'A1', subject: 'ADVANCED - LẬP TRÌNH NÂNG CAO', order: 1, status: 'Hoạt động' }
])

const columns = [
  { title: 'Mã', dataIndex: 'code', key: 'code' },
  { title: 'Tên', dataIndex: 'name', key: 'name' },
  { title: 'Môn học', dataIndex: 'subject', key: 'subject' },
  { title: 'Thứ tự', dataIndex: 'order', key: 'order' },
  { title: 'Trạng thái', dataIndex: 'status', key: 'status' },
  { title: 'Thao tác', dataIndex: 'actions', key: 'actions' }
]

const showModal = ref(false)
const isEditing = ref(false)
const editingCode = ref('')
const form = ref({
  code: '',
  name: '',
  subject: '',
  description: '',
  order: 0,
  status: 'Hoạt động'
})

// Thêm hoặc Sửa
const onSubmit = () => {
  if (!form.value.code || !form.value.name || !form.value.subject) {
    alert('Vui lòng nhập đầy đủ Mã, Tên và Môn học!');
    return;
  }
  if (isEditing.value) {
    const index = topics.value.findIndex(t => t.code === editingCode.value)
    if (index !== -1) topics.value[index] = { ...form.value }
  } else {
    topics.value.push({ ...form.value })
  }
  resetForm()
  showModal.value = false
}

// Xóa
const onDelete = (code) => {
  topics.value = topics.value.filter(t => t.code !== code)
}

// Sửa
const onEdit = (record) => {
  isEditing.value = true
  editingCode.value = record.code
  form.value = { ...record }
  showModal.value = true
}

const resetForm = () => {
  isEditing.value = false
  editingCode.value = ''
  form.value = { code: '', name: '', subject: '', description: '', order: 0, status: 'Hoạt động' }
}
</script>

<style scoped>
.topic-container {
  background: #fff;
  min-height: 100vh;
  padding: 24px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.add-button {
  background-color: #b71c1c;
  color: #fff;
  font-weight: 600;
}

.add-button:hover {
  background-color: #a01313;
}

.status-btn {
  border: 1px solid green;
  color: green;
  background: #fff;
}

.action-btn {
  background: #f0f0f0;
  border: none;
  cursor: pointer;
}

a-modal {
  max-width: 650px;
}
</style>
