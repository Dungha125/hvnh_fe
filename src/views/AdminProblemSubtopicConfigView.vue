<template>
    <div class="sub-topic-container">
      <div class="header">
        <h2>Chủ đề con câu hỏi</h2>
        <a-button type="primary" class="add-button" @click="openAddModal">Thêm mới</a-button>
      </div>
  
      <a-table :columns="columns" :dataSource="subTopics" rowKey="code" bordered :pagination="false">
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
      <a-modal v-model:open="showModal" :title="isEditing ? 'Chỉnh sửa chủ đề con' : 'Thêm chủ đề con'" @ok="onSubmit" okText="Lưu" cancelText="Hủy">
        <a-form layout="vertical">
          <a-form-item label="Mã *" required>
            <a-input v-model:value="form.code" :disabled="isEditing" />
          </a-form-item>
          <a-form-item label="Tên *" required>
            <a-input v-model:value="form.name" />
          </a-form-item>
          <a-form-item label="Môn học *" required>
            <a-select
              v-model:value="form.subject_id"
              placeholder="Chọn môn học"
              allow-clear
              show-search
              option-filter-prop="label"
              style="width: 100%"
            >
              <a-select-option
                v-for="s in subjects"
                :key="s.id"
                :value="s.id"
                :label="s.name"
              >
                {{ s.name }}
              </a-select-option>
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
import { ref, onMounted } from 'vue'
import axios from '@/configs/axios.js'
import { message } from 'ant-design-vue'

const subTopics = ref([])
const loading = ref(false)
const subjects = ref([])

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
const editingId = ref(null)
const form = ref({
  code: '',
  name: '',
  subject_id: null,
  description: '',
  order: 0,
  status: 'Hoạt động'
})

// Fetch all subjects
const fetchSubjects = async () => {
  try {
    const response = await axios.get('/subjects')
    if (response.data.code === 200) {
      subjects.value = response.data.data.map(subject => ({
        id: subject.id,
        name: `${subject.code} - ${subject.name}`
      }))
    } else {
      message.error('Không thể tải danh sách môn học')
    }
  } catch (error) {
    console.error('Error fetching subjects:', error)
    message.error('Lỗi khi tải danh sách môn học')
  }
}

// Fetch all question sub-groups
const fetchQuestionSubGroups = async () => {
  loading.value = true
  try {
    const response = await axios.get('/question_sub_groups')
    if (response.data.code === 200) {
      subTopics.value = response.data.data.map(subGroup => ({
        id: subGroup.id,
        code: subGroup.code,
        name: subGroup.name,
        subject: subGroup.subject ? `${subGroup.subject.code} - ${subGroup.subject.name}` : 'N/A',
        subject_id: subGroup.subject_id,
        description: subGroup.description || '',
        order: subGroup.order || 0,
        status: subGroup.status === 1 ? 'Hoạt động' : 'Không hoạt động'
      }))
    } else {
      message.error('Không thể tải danh sách chủ đề con câu hỏi')
    }
  } catch (error) {
    console.error('Error fetching question sub-groups:', error)
    message.error('Lỗi khi tải danh sách chủ đề con câu hỏi')
  } finally {
    loading.value = false
  }
}

// Add or update question sub-group
const onSubmit = async () => {
  if (!form.value.code || !form.value.name || !form.value.subject_id) {
    message.error('Vui lòng nhập đầy đủ Mã, Tên và Môn học!')
    return
  }
  
  const payload = {
    code: form.value.code,
    name: form.value.name,
    subject: form.value.subject_id,
    description: form.value.description,
    order: form.value.order,
    status: form.value.status === 'Hoạt động' ? 1 : 0
  }
  
  try {
    if (isEditing.value) {
      // Update existing question sub-group
      const response = await axios.put(`/question_sub_groups/${editingId.value}`, payload)
      if (response.data.code === 200) {
        message.success('Cập nhật chủ đề con câu hỏi thành công!')
        await fetchQuestionSubGroups()
      } else {
        message.error('Lỗi khi cập nhật chủ đề con câu hỏi')
      }
    } else {
      // Create new question sub-group
      const response = await axios.post('/question_sub_groups', payload)
      if (response.data.code === 200) {
        message.success('Thêm chủ đề con câu hỏi thành công!')
        await fetchQuestionSubGroups()
      } else {
        message.error('Lỗi khi thêm chủ đề con câu hỏi')
      }
    }
    showModal.value = false
    resetForm()
  } catch (error) {
    console.error('Error submitting question sub-group:', error)
    message.error('Lỗi khi lưu chủ đề con câu hỏi')
  }
}

// Delete question sub-group
const onDelete = async (id) => {
  try {
    const response = await axios.delete(`/question_sub_groups/${id}`)
    if (response.data.code === 200) {
      message.success('Xóa chủ đề con câu hỏi thành công!')
      await fetchQuestionSubGroups()
    } else {
      message.error('Lỗi khi xóa chủ đề con câu hỏi')
    }
  } catch (error) {
    console.error('Error deleting question sub-group:', error)
    message.error('Lỗi khi xóa chủ đề con câu hỏi')
  }
}

// Edit question sub-group
const onEdit = (record) => {
  isEditing.value = true
  editingId.value = record.id
  form.value = {
    code: record.code,
    name: record.name,
    subject: record.subject_id ?? null,
    description: record.description,
    order: record.order,
    status: record.status
  }
  showModal.value = true
}

const openAddModal = () => {
  resetForm()
  showModal.value = true
}

const resetForm = () => {
  isEditing.value = false
  editingId.value = null
  form.value = { code: '', name: '', subject_id: null, description: '', order: 0, status: 'Hoạt động' }
}

onMounted(() => {
  fetchSubjects()
  fetchQuestionSubGroups()
})
</script>
<style scoped>
.sub-topic-container {
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
