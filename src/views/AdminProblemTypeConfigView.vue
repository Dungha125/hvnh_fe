<template>
    <div class="problem-type-container">
      <div class="header">
        <h2>Loại bài tập</h2>
        <a-button type="primary" class="add-button" @click="showModal = true">New type</a-button>
      </div>
  
      <a-table :columns="columns" :dataSource="problemTypes" rowKey="code" bordered :pagination="false">
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'status'">
            <a-button class="status-btn">{{ record.status }}</a-button>
          </template>
  
          <!-- ✅ Thêm Dropdown vào Thao tác -->
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
  
      <!-- Modal thêm/sửa -->
      <a-modal v-model:open="showModal" :title="isEditing ? 'Chỉnh sửa loại bài tập' : 'New problem type'" @ok="onSubmit" okText="Lưu" cancelText="Hủy">
        <a-form layout="vertical">
          <a-form-item label="Mã *" required>
            <a-input v-model:value="newType.code" :disabled="isEditing" />
          </a-form-item>
          <a-form-item label="Tên *" required>
            <a-input v-model:value="newType.name" />
          </a-form-item>
          <a-form-item label="Mô tả">
            <a-textarea v-model:value="newType.description" />
          </a-form-item>
          <a-form-item label="Thứ tự">
            <a-input-number v-model:value="newType.order" :min="0" style="width: 100%" />
          </a-form-item>
          <a-form-item label="Trạng thái">
            <a-select v-model:value="newType.status">
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
  
  const problemTypes = ref([
    { code: 'LUYENTAP', name: 'Luyện tập', order: 0, status: 'Hoạt động' },
    { code: 'THUCHANH', name: 'Thực hành', order: 0, status: 'Hoạt động' },
    { code: 'THI', name: 'Thi', order: 0, status: 'Hoạt động' }
  ])
  
  const columns = [
    { title: 'Mã', dataIndex: 'code', key: 'code' },
    { title: 'Tên', dataIndex: 'name', key: 'name' },
    { title: 'Thứ tự', dataIndex: 'order', key: 'order' },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status' },
    { title: 'Thao tác', dataIndex: 'actions', key: 'actions' }
  ]
  
  const showModal = ref(false)
  const isEditing = ref(false)
  const editingCode = ref('')
  const newType = ref({
    code: '',
    name: '',
    description: '',
    order: 0,
    status: 'Hoạt động'
  })
  
  // Thêm mới hoặc update
  const onSubmit = () => {
    if (!newType.value.code || !newType.value.name) {
      alert('Vui lòng nhập Mã và Tên loại bài tập!');
      return;
    }
    if (isEditing.value) {
      const index = problemTypes.value.findIndex(p => p.code === editingCode.value)
      if (index !== -1) problemTypes.value[index] = { ...newType.value }
    } else {
      problemTypes.value.push({ ...newType.value })
    }
    showModal.value = false
    resetForm()
  }
  
  // Xóa
  const onDelete = (code) => {
    problemTypes.value = problemTypes.value.filter(p => p.code !== code)
  }
  
  // Sửa
  const onEdit = (record) => {
    isEditing.value = true
    editingCode.value = record.code
    newType.value = { ...record }
    showModal.value = true
  }
  
  const resetForm = () => {
    isEditing.value = false
    editingCode.value = ''
    newType.value = { code: '', name: '', description: '', order: 0, status: 'Hoạt động' }
  }
  </script>
  
  <style scoped>
  .problem-type-container {
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
    font-weight: 500;
  }
  
  .action-btn {
    background: #f0f0f0;
    border: none;
    cursor: pointer;
    font-weight: bold;
  }
  </style>
  