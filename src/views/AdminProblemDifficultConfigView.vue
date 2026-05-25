<template>
    <div class="level-container">
      <div class="header">
        <h2>Độ khó câu hỏi</h2>
        <a-button type="primary" class="add-button" @click="showModal = true">Thêm mới</a-button>
      </div>
  
      <a-table :columns="columns" :dataSource="levels" rowKey="code" bordered :pagination="false">
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
      <a-modal v-model:open="showModal" :title="isEditing ? 'Chỉnh sửa độ khó' : 'New problem level'" @ok="onSubmit" okText="Lưu" cancelText="Hủy">
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
          <p style="color: red">(*) Bắt buộc</p>
        </a-form>
      </a-modal>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import axios from '@/configs/axios.js'
  import { message } from 'ant-design-vue'

  const levels = ref([])
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
  const form = ref({
    code: '',
    name: '',
    description: '',
    order: 0,
    status: 'Hoạt động'
  })

  // Fetch all question levels
  const fetchQuestionLevels = async () => {
    loading.value = true
    try {
      const response = await axios.get('/question_levels')
      if (response.data.code === 200) {
        levels.value = response.data.data.map(level => ({
          id: level.id,
          code: level.code,
          name: level.name,
          description: level.description || '',
          order: level.order || 0,
          status: level.status === 1 ? 'Hoạt động' : 'Không hoạt động'
        }))
      } else {
        message.error('Không thể tải danh sách độ khó câu hỏi')
      }
    } catch (error) {
      console.error('Error fetching question levels:', error)
      message.error('Lỗi khi tải danh sách độ khó câu hỏi')
    } finally {
      loading.value = false
    }
  }

  // Add or update question level
  const onSubmit = async () => {
    if (!form.value.code || !form.value.name) {
      message.error('Vui lòng nhập đủ Mã và Tên!')
      return
    }
    
    const payload = {
      code: form.value.code,
      name: form.value.name,
      description: form.value.description,
      order: form.value.order,
      status: form.value.status === 'Hoạt động' ? 1 : 0
    }
    
    try {
      if (isEditing.value) {
        // Update existing question level
        const response = await axios.put(`/question_levels/${editingId.value}`, payload)
        if (response.data.code === 200) {
          message.success('Cập nhật độ khó câu hỏi thành công!')
          await fetchQuestionLevels()
        } else {
          message.error('Lỗi khi cập nhật độ khó câu hỏi')
        }
      } else {
        // Create new question level
        const response = await axios.post('/question_levels', payload)
        if (response.data.code === 200) {
          message.success('Thêm độ khó câu hỏi thành công!')
          await fetchQuestionLevels()
        } else {
          message.error('Lỗi khi thêm độ khó câu hỏi')
        }
      }
      showModal.value = false
      resetForm()
    } catch (error) {
      console.error('Error submitting question level:', error)
      message.error('Lỗi khi lưu độ khó câu hỏi')
    }
  }

  // Delete question level
  const onDelete = async (id) => {
    try {
      const response = await axios.delete(`/question_levels/${id}`)
      if (response.data.code === 200) {
        message.success('Xóa độ khó câu hỏi thành công!')
        await fetchQuestionLevels()
      } else {
        message.error('Lỗi khi xóa độ khó câu hỏi')
      }
    } catch (error) {
      console.error('Error deleting question level:', error)
      message.error('Lỗi khi xóa độ khó câu hỏi')
    }
  }

  // Edit question level
  const onEdit = (record) => {
    isEditing.value = true
    editingId.value = record.id
    form.value = { 
      code: record.code,
      name: record.name,
      description: record.description,
      order: record.order,
      status: record.status
    }
    showModal.value = true
  }

  const resetForm = () => {
    isEditing.value = false
    editingId.value = null
    form.value = { code: '', name: '', description: '', order: 0, status: 'Hoạt động' }
  }

  onMounted(() => {
    fetchQuestionLevels()
  })
  </script>

<style scoped>
.level-container {
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
