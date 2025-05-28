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
import { ref, onMounted } from 'vue'
import axios from '@/configs/axios.js'
import { message } from 'ant-design-vue'

const compilers = ref([])
const loading = ref(false)

const columns = [
  { title: 'Mã', dataIndex: 'code', key: 'code' },
  { title: 'Tên', dataIndex: 'name', key: 'name' },
  { title: 'Mô tả', dataIndex: 'description', key: 'description' },
  { title: 'Trạng thái', dataIndex: 'status', key: 'status' },
  { title: 'Thao tác', dataIndex: 'actions', key: 'actions' }
]

const showModal = ref(false)
const isEditing = ref(false)
const editingCode = ref(null)
const form = ref({
  code: '',
  name: '',
  description: '',
  order: 0,
  status: 'Hoạt động',
  extension: ''
})

// Fetch all compilers
const fetchCompilers = async () => {
  loading.value = true
  try {
    const response = await axios.get('/compilers')
    console.log('API Response:', response.data)
    
    if (response.data && response.data.code === 200) {
      compilers.value = response.data.data.map(compiler => ({
        code: compiler.code,
        name: compiler.name,
        description: compiler.description || '',
        extension: compiler.extension || '',
        order: compiler.order || 0,
        status: compiler.status === 1 ? 'Hoạt động' : 'Không hoạt động'
      }))
      console.log('Processed compilers:', compilers.value)
    } else {
      message.error('Không thể tải danh sách trình biên dịch')
    }
  } catch (error) {
    console.error('Error fetching compilers:', error)
    message.error('Lỗi khi tải danh sách trình biên dịch')
  } finally {
    loading.value = false
  }
}

// Add or update compiler
const onSubmit = async () => {
  if (!form.value.code || !form.value.name) {
    message.error('Vui lòng nhập đủ Mã và Tên!')
    return
  }
  
  const payload = {
    code: form.value.code,
    name: form.value.name,
    description: form.value.description,
    extension: form.value.extension,
    order: form.value.order,
    status: form.value.status === 'Hoạt động' ? 1 : 0
  }
  
  try {
    if (isEditing.value) {
      // Update existing compiler using code instead of id
      const response = await axios.put(`/compilers/${editingCode.value}`, payload)
      if (response.data && response.data.code === 200) {
        message.success('Cập nhật trình biên dịch thành công!')
        await fetchCompilers()
      } else {
        message.error('Lỗi khi cập nhật trình biên dịch')
      }
    } else {
      // Create new compiler
      const response = await axios.post('/compilers', payload)
      if (response.data && response.data.code === 200) {
        message.success('Thêm trình biên dịch thành công!')
        await fetchCompilers()
      } else {
        message.error('Lỗi khi thêm trình biên dịch')
      }
    }
    showModal.value = false
    resetForm()
  } catch (error) {
    console.error('Error submitting compiler:', error)
    message.error('Lỗi khi lưu trình biên dịch: ' + (error.response?.data?.message || error.message))
  }
}

// Delete compiler
const onDelete = async (code) => {
  try {
    const response = await axios.delete(`/compilers/${code}`)
    if (response.data && response.data.code === 200) {
      message.success('Xóa trình biên dịch thành công!')
      await fetchCompilers()
    } else {
      message.error('Lỗi khi xóa trình biên dịch')
    }
  } catch (error) {
    console.error('Error deleting compiler:', error)
    message.error('Lỗi khi xóa trình biên dịch: ' + (error.response?.data?.message || error.message))
  }
}

// Edit compiler
const onEdit = (record) => {
  isEditing.value = true
  editingCode.value = record.code
  form.value = { 
    code: record.code,
    name: record.name,
    description: record.description,
    extension: record.extension,
    order: record.order,
    status: record.status
  }
  showModal.value = true
}

const resetForm = () => {
  isEditing.value = false
  editingCode.value = null
  form.value = { code: '', name: '', description: '', extension: '', order: 0, status: 'Hoạt động' }
}

onMounted(() => {
  fetchCompilers()
})
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
