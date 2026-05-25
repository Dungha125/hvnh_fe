<template>
    <div class="problem-type-container">
      <div class="header">
        <h2>Loại câu hỏi</h2>
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
      <a-modal v-model:open="showModal" :title="isEditing ? 'Chỉnh sửa loại câu hỏi' : 'New problem type'" @ok="onSubmit" okText="Lưu" cancelText="Hủy">
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
  import { ref, onMounted } from 'vue'
  import axios from '@/configs/axios.js'
  import { message } from 'ant-design-vue'

  const problemTypes = ref([])
  const loading = ref(false)

  const columns = [
    { title: 'Mã', dataIndex: 'code', key: 'code' },
    { title: 'Tên', dataIndex: 'name', key: 'name' },
    { title: 'Thứ tự', dataIndex: 'order', key: 'order' },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status' },
    { title: 'Thao tác', dataIndex: 'actions', key: 'actions' }
  ]

  const showModal = ref(false)
  const isEditing = ref(false)
  const editingId = ref(null)
  const newType = ref({
    code: '',
    name: '',
    description: '',
    order: 0,
    status: 'Hoạt động'
  })

  // Fetch all question types
  const fetchQuestionTypes = async () => {
    loading.value = true
    try {
      const response = await axios.get('/question_types')
      if (response.data.code === 200) {
        problemTypes.value = response.data.data.map(type => ({
          id: type.id,
          code: type.code,
          name: type.name,
          description: type.description || '',
          order: type.order || 0,
          status: type.status === 1 ? 'Hoạt động' : 'Không hoạt động'
        }))
      } else {
        message.error('Không thể tải danh sách loại câu hỏi')
      }
    } catch (error) {
      console.error('Error fetching question types:', error)
      message.error('Lỗi khi tải danh sách loại câu hỏi')
    } finally {
      loading.value = false
    }
  }

  // Add or update question type
  const onSubmit = async () => {
    if (!newType.value.code || !newType.value.name) {
      message.error('Vui lòng nhập Mã và Tên loại câu hỏi!')
      return
    }
    
    const payload = {
      code: newType.value.code,
      name: newType.value.name,
      description: newType.value.description,
      order: newType.value.order,
      status: newType.value.status === 'Hoạt động' ? 1 : 0
    }
    
    try {
      if (isEditing.value) {
        // Update existing question type
        const response = await axios.put(`/question_types/${editingId.value}`, payload)
        if (response.data.code === 200) {
          message.success('Cập nhật loại câu hỏi thành công!')
          await fetchQuestionTypes()
        } else {
          message.error('Lỗi khi cập nhật loại câu hỏi')
        }
      } else {
        // Create new question type
        const response = await axios.post('/question_types', payload)
        if (response.data.code === 200) {
          message.success('Thêm loại câu hỏi thành công!')
          await fetchQuestionTypes()
        } else {
          message.error('Lỗi khi thêm loại câu hỏi')
        }
      }
      showModal.value = false
      resetForm()
    } catch (error) {
      console.error('Error submitting question type:', error)
      message.error('Lỗi khi lưu loại câu hỏi')
    }
  }

  // Delete question type
  const onDelete = async (id) => {
    try {
      const response = await axios.delete(`/question_types/${id}`)
      if (response.data.code === 200) {
        message.success('Xóa loại câu hỏi thành công!')
        await fetchQuestionTypes()
      } else {
        message.error('Lỗi khi xóa loại câu hỏi')
      }
    } catch (error) {
      console.error('Error deleting question type:', error)
      message.error('Lỗi khi xóa loại câu hỏi')
    }
  }

  // Edit question type
  const onEdit = (record) => {
    isEditing.value = true
    editingId.value = record.id
    newType.value = { ...record }
    showModal.value = true
  }

  const resetForm = () => {
    isEditing.value = false
    editingId.value = null
    newType.value = { code: '', name: '', description: '', order: 0, status: 'Hoạt động' }
  }

  onMounted(() => {
    fetchQuestionTypes()
  })
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
  
