<template>
    <div class="compiler-container">
      <div class="header">
        <h2>Trình biên dịch</h2>
        <a-button type="primary" class="add-button" @click="showModal = true">Thêm mới</a-button>
      </div>
  
      <a-table :columns="columns" :dataSource="compilers" rowKey="code" bordered :pagination="false">
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
      <a-modal v-model:open="showModal" :title="isEditing ? 'Sửa trình biên dịch' : 'Thêm mới'" @ok="onSubmit" okText="Lưu" cancelText="Hủy">
        <a-form layout="vertical">
          <a-form-item label="Mã *" required>
            <a-input v-model:value="form.code" :disabled="isEditing" />
          </a-form-item>
          <a-form-item label="Tên *" required>
            <a-input v-model:value="form.name" />
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
          <a-form-item label="Extension">
            <a-input v-model:value="form.extension" />
          </a-form-item>
          <p style="color: red">(*) Bắt buộc</p>
        </a-form>
      </a-modal>
    </div>
  </template>

<script setup>
import { ref } from 'vue'

const compilers = ref([
  { code: 'C', name: 'c', description: 'Ngôn ngữ lập trình C', status: 'Hoạt động' },
  { code: 'CPP14', name: 'cpp', description: 'Ngôn ngữ lập trình C++', status: 'Hoạt động' },
  { code: 'PY3', name: 'py', description: 'Ngôn ngữ lập trình Python', status: 'Hoạt động' },
  { code: 'MONOCS', name: 'dotnet', description: 'Ngôn ngữ lập trình C#', status: 'Hoạt động' },
  { code: 'JAVA8', name: 'java', description: 'Ngôn ngữ lập trình Java', status: 'Hoạt động' }
])

const columns = [
  { title: 'Mã', dataIndex: 'code', key: 'code' },
  { title: 'Tên', dataIndex: 'name', key: 'name' },
  { title: 'Mô tả', dataIndex: 'description', key: 'description' },
  { title: 'Trạng thái', dataIndex: 'status', key: 'status' },
  { title: 'Thao tác', dataIndex: 'actions', key: 'actions' }
]

const showModal = ref(false)
const isEditing = ref(false)
const editingCode = ref('')
const form = ref({
  code: '',
  name: '',
  description: '',
  order: 0,
  status: 'Hoạt động',
  extension: ''
})

const onSubmit = () => {
  if (!form.value.code || !form.value.name) {
    alert('Vui lòng nhập đủ Mã và Tên!');
    return;
  }
  if (isEditing.value) {
    const idx = compilers.value.findIndex(c => c.code === editingCode.value)
    if (idx !== -1) compilers.value[idx] = { ...form.value }
  } else {
    compilers.value.push({ ...form.value })
  }
  resetForm()
  showModal.value = false
}

const onDelete = (code) => {
  compilers.value = compilers.value.filter(c => c.code !== code)
}

const onEdit = (record) => {
  isEditing.value = true
  editingCode.value = record.code
  form.value = { ...record }
  showModal.value = true
}

const resetForm = () => {
  isEditing.value = false
  editingCode.value = ''
  form.value = { code: '', name: '', description: '', order: 0, status: 'Hoạt động', extension: '' }
}
</script>

<style scoped>
.compiler-container {
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
