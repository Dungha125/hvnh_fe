<template>
  <div class="admin-subjects">
    <div class="admin-container">
      <div class="admin-header">
        <div class="header-content">
          <h1 class="page-title">Quản lý môn học</h1>
          <p class="page-description">Thêm, sửa và quản lý các môn học trong hệ thống</p>
        </div>
      </div>

      <div class="admin-content">
        <div class="content-section">
          <div class="section-header">
            <div class="header-left">
              <h2 class="section-title">Danh sách môn học</h2>
            </div>
            <div class="header-right">
              <a-button type="primary" class="add-button" @click="showModalAdd">
                <PlusOutlined />
                Thêm mới
              </a-button>
            </div>
          </div>

          <div class="table-wrapper">
            <a-table
              :columns="columns"
              :dataSource="subjects"
              rowKey="code"
              bordered
              :pagination="{ pageSize: 10, size: 'small' }"
              :loading="loading"
              class="subjects-table"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.dataIndex === 'status'">
                  <a-tag :color="record.status === 1 || record.status === '1' ? 'success' : 'error'" class="status-tag">
                    {{ statusText(record.status) }}
                  </a-tag>
                </template>

                <template v-else-if="column.dataIndex === 'actions'">
                  <a-space>
                    <a-button type="primary" @click="onEdit(record)" class="action-button-edit">
                      <EditOutlined /> Sửa
                    </a-button>
                    <a-popconfirm
                      title="Bạn có chắc chắn muốn xóa môn học này?"
                      ok-text="Có"
                      cancel-text="Không"
                      @confirm="onDelete(record.code)"
                    >
                      <a-button danger class="action-button-delete">
                        <DeleteOutlined /> Xóa
                      </a-button>
                    </a-popconfirm>
                  </a-space>
                </template>
              </template>
            </a-table>
          </div>
        </div>
      </div>
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
      :confirmLoading="loading"
      class="subject-modal"
    >
      <a-form layout="vertical">
        <a-form-item label="Mã " required>
          <a-input v-model:value="tempSubject.code" placeholder="Nhập mã môn học" :disabled="isEditing" />
        </a-form-item>
        <a-form-item label="Tên " required>
          <a-input v-model:value="tempSubject.name" placeholder="Nhập tên môn học" />
        </a-form-item>

        <a-form-item label="Trình biên dịch " required>
          <a-checkbox-group v-model:value="tempSubject.compilers" :options="compilerOptions" :disabled="fetchingCompilers" />
        </a-form-item>

        <a-form-item label="Mô tả">
          <a-textarea v-model:value="tempSubject.description" placeholder="Mô tả môn học" />
        </a-form-item>

        <a-form-item label="Tên rút gọn " required>
          <a-input v-model:value="tempSubject.short_name" placeholder="Tên rút gọn" />
        </a-form-item>

        <a-form-item label="Số TC học phí " required>
          <a-input-number v-model:value="tempSubject.tuition_credits" :min="1" style="width: 100%" />
        </a-form-item>

        <a-form-item label="Số TC " required>
          <a-input-number v-model:value="tempSubject.credits" :min="1" style="width: 100%" />
        </a-form-item>

        <a-form-item label="Daily AC Limit">
          <a-input-number v-model:value="tempSubject.daily_ac_limit" :min="1" style="width: 100%" />
        </a-form-item>

        <a-form-item label="Trạng thái">
          <a-select v-model:value="tempSubject.status" placeholder="Chọn trạng thái">
            <a-select-option value="1">Hoạt động</a-select-option>
            <a-select-option value="0">Không hoạt động</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item>
          <a-checkbox v-model:checked="tempSubject.test_per_case">Chấm từng test</a-checkbox>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from '@/configs/axios.js'
import { message } from 'ant-design-vue'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons-vue'

const subjects = ref([])
const loading = ref(false)
const compilerOptions = ref([])
const fetchingCompilers = ref(false)

const columns = [
  { title: 'Mã', dataIndex: 'code', key: 'code' },
  { title: 'Tên', dataIndex: 'name', key: 'name' },
  { title: 'Tên rút gọn', dataIndex: 'short_name', key: 'short_name' },
  { title: 'Số TC', dataIndex: 'credits', key: 'credits' },
  { title: 'Trạng thái', dataIndex: 'status', key: 'status' },
  { title: 'Thao tác', dataIndex: 'actions', key: 'actions' },
]

const isModalVisible = ref(false)
const isEditing = ref(false)
const tempSubject = ref({})
let editingCode = null

const fetchCompilers = async () => {
  fetchingCompilers.value = true
  try {
    const res = await axios.get('/compilers')
    console.log('Compilers API Response:', res)
    
    if (res.data && res.data.code === 200 && Array.isArray(res.data.data)) {
      compilerOptions.value = res.data.data.map(compiler => ({
        label: `${compiler.code} - ${compiler.name}`,
        value: compiler.id
      }))
      console.log('Processed compilers:', compilerOptions.value)
    } else {
      console.error('Invalid compilers API response format:', res.data)
      message.error('Không thể tải dữ liệu trình biên dịch')
      // Fallback to static options if API fails
      compilerOptions.value = [
        { label: 'C - c', value: 1 },
        { label: 'CPP14 - cpp', value: 2 },
        { label: 'PY3 - py', value: 3 },
        { label: 'MONOCS - dotnet', value: 4 },
        { label: 'JAVA8 - java', value: 5 },
      ]
    }
  } catch (error) {
    console.error('Error fetching compilers:', error)
    message.error('Lỗi khi tải danh sách trình biên dịch')
    // Fallback to static options if API fails
    compilerOptions.value = [
      { label: 'C - c', value: 1 },
      { label: 'CPP14 - cpp', value: 2 },
      { label: 'PY3 - py', value: 3 },
      { label: 'MONOCS - dotnet', value: 4 },
      { label: 'JAVA8 - java', value: 5 },
    ]
  } finally {
    fetchingCompilers.value = false
  }
}

const fetchSubjects = async () => {
  loading.value = true
  try {
    console.log('Fetching subjects...')
    const res = await axios.get('/subjects')
    console.log('API Response:', res)
    
    if (res.data && res.data.code === 200 && Array.isArray(res.data.data)) {
      subjects.value = res.data.data
      console.log('Processed subjects:', subjects.value)
    } else {
      console.error('Invalid API response format:', res.data)
      message.error('Không thể tải dữ liệu môn học: Định dạng dữ liệu không hợp lệ')
    }
  } catch (error) {
    console.error('Error fetching subjects:', error)
    message.error('Lỗi khi tải danh sách môn học')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchCompilers()
  await fetchSubjects()
})

const showModalAdd = () => {
  isEditing.value = false
  editingCode = null
  tempSubject.value = {
    status: '1',
    daily_ac_limit: 10,
    compilers: [],
    test_per_case: false,
    credits: 3,
    tuition_credits: 3,
    short_name: ''
  }
  isModalVisible.value = true
}

const closeModal = () => isModalVisible.value = false

const onSubmit = async () => {
  if (!tempSubject.value.code || !tempSubject.value.name || !tempSubject.value.short_name) {
    message.warning('Vui lòng nhập đầy đủ các trường bắt buộc!')
    return
  }

  if (!tempSubject.value.compilers || tempSubject.value.compilers.length === 0) {
    message.warning('Vui lòng chọn ít nhất một trình biên dịch!')
    return
  }

  // Create a simplified payload with only the required fields
  const payload = {
    code: String(tempSubject.value.code).trim(),
    name: String(tempSubject.value.name).trim(),
    short_name: String(tempSubject.value.short_name).trim(),
    credits: parseInt(tempSubject.value.credits) || 3,
    tuition_credits: parseInt(tempSubject.value.tuition_credits) || 3,
    daily_ac_limit: parseInt(tempSubject.value.daily_ac_limit) || 10,
    status: tempSubject.value.status === '1' ? 1 : 0,
    test_per_case: tempSubject.value.test_per_case ? 1 : 0,
    compilers: tempSubject.value.compilers.map(c => parseInt(c))
  }
  
  // Only add description if it exists
  if (tempSubject.value.description) {
    payload.description = String(tempSubject.value.description).trim()
  }

  console.log('🔥 Payload gửi lên:', JSON.stringify(payload, null, 2))
  loading.value = true

  try {
    let res;
    if (!isEditing.value) {
      res = await axios.post('/subjects', payload)
    } else {
      res = await axios.put(`/subjects/${editingCode}`, payload)
    }
    
    console.log('API Response:', res.data)
    
    if (res.data && res.data.code === 200) {
      message.success(isEditing.value ? 'Cập nhật môn học thành công' : 'Thêm môn học thành công')
      closeModal()
      await fetchSubjects() // Refresh data
    } else {
      message.error(`${isEditing.value ? 'Cập nhật' : 'Thêm'} thất bại: ${res.data?.message || 'Không rõ lỗi'}`)
    }
  } catch (error) {
    console.error('API Error:', error)
    if (error.response) {
      console.error('Error response:', error.response.data)
      message.error(`Lỗi ${error.response.status}: ${error.response.data?.message || 'Lỗi máy chủ'}`)
    } else if (error.request) {
      console.error('Error request:', error.request)
      message.error('Không thể kết nối đến máy chủ')
    } else {
      console.error('Error message:', error.message)
      message.error(`Lỗi: ${error.message}`)
    }
  } finally {
    loading.value = false
  }
}

const onEdit = (record) => {
  isEditing.value = true
  editingCode = record.code
  
  // Create a clean copy of the record with only the fields we need
  tempSubject.value = {
    code: record.code,
    name: record.name,
    short_name: record.short_name,
    description: record.description || '',
    credits: parseInt(record.credits) || 3,
    tuition_credits: parseInt(record.tuition_credits) || 3,
    daily_ac_limit: parseInt(record.daily_ac_limit) || 10,
    status: record.status === 1 || record.status === '1' ? '1' : '0',
    test_per_case: record.test_per_case === 1 || record.test_per_case === '1'
  }
  
  // Handle compilers field - convert to array of IDs
  if (record.compilers) {
    if (Array.isArray(record.compilers)) {
      // If it's already an array, map to IDs if they're objects
      if (record.compilers.length > 0 && typeof record.compilers[0] === 'object') {
        tempSubject.value.compilers = record.compilers.map(c => c.id)
      } else {
        tempSubject.value.compilers = record.compilers.map(c => parseInt(c) || c)
      }
    } else if (typeof record.compilers === 'string') {
      // If it's a comma-separated string
      tempSubject.value.compilers = record.compilers.split(',').map(c => parseInt(c.trim()) || c.trim())
    } else {
      // If it's a single value
      tempSubject.value.compilers = [parseInt(record.compilers) || record.compilers]
    }
  } else {
    tempSubject.value.compilers = []
  }
  
  console.log('Editing subject:', tempSubject.value)
  isModalVisible.value = true
}

const onDelete = async (code) => {
  try {
    loading.value = true
    const res = await axios.delete(`/subjects/${code}`)
    console.log('Delete response:', res.data)
    
    if (res.data && res.data.code === 200) {
      message.success('Xóa môn học thành công')
      await fetchSubjects() // Refresh data
    } else {
      message.error(`Xóa thất bại: ${res.data?.message || 'Không rõ lỗi'}`)
    }
  } catch (error) {
    console.error('Delete error:', error)
    if (error.response) {
      message.error(`Lỗi ${error.response.status}: ${error.response.data?.message || 'Lỗi máy chủ'}`)
    } else {
      message.error('Lỗi khi gọi API xóa')
    }
  } finally {
    loading.value = false
  }
}

const statusText = (status) => {
  if (status === 1 || status === '1') return 'Hoạt động'
  if (status === 0 || status === '0') return 'Không hoạt động'
  return String(status)
}

</script>

<style scoped>
/* General Page Layout */
.admin-subjects {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.admin-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 24px;
}

.admin-header {
  margin-bottom: 24px;
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #eef2f7;
}

.header-content {
  max-width: 800px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
}

.page-description {
  color: #64748b;
  font-size: 14px;
}

.admin-content {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #eef2f7;
}

/* Content Section Header */
.content-section {
  padding: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.add-button {
  height: 40px;
  padding: 0 16px;
  font-size: 14px;
  font-weight: 500;
}

/* Table Styling */
.table-wrapper {
  margin-top: 16px;
  border: 1px solid #eef2f7;
  border-radius: 8px;
  overflow: hidden;
}

:deep(.ant-table) {
  background: transparent;
  border-spacing: 0;
}

:deep(.ant-table-thead > tr > th) {
  background: #f8fafc;
  border-bottom: 1px solid #eef2f7;
  padding: 12px 16px;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 13px;
}

:deep(.ant-table-tbody > tr > td) {
  padding: 12px 16px;
  border-bottom: 1px solid #eef2f7;
  color: #1e293b;
  text-align: center;
}

:deep(.ant-table-tbody > tr:last-child > td) {
  border-bottom: none;
}

:deep(.ant-table-tbody > tr:hover > td) {
  background: #f8fafc;
}

.status-tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

.action-button-edit,
.action-button-delete {
  height: 32px;
  padding: 0 12px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Modal Styling */
:deep(.subject-modal .ant-modal-header) {
  border-bottom: 1px solid #eef2f7;
  padding: 16px 24px;
}

:deep(.subject-modal .ant-modal-title) {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

:deep(.subject-modal .ant-modal-body) {
  padding: 24px;
}

:deep(.subject-modal .ant-modal-footer) {
  border-top: 1px solid #eef2f7;
  padding: 16px 24px;
}

:deep(.ant-form-item) {
  margin-bottom: 20px;
}

:deep(.ant-form-item-label > label) {
  font-weight: 500;
  color: #374151;
}

:deep(.ant-input),
:deep(.ant-input-number),
:deep(.ant-select-selector),
:deep(.ant-textarea),
:deep(.ant-checkbox-group),
:deep(.ant-radio-group) {
  border-radius: 8px;
  border-color: #d1d5db;
  padding: 8px 12px;
  height: auto;
  min-height: 40px;
}

:deep(.ant-input:hover),
:deep(.ant-input-number:hover),
:deep(.ant-select-selector:hover),
:deep(.ant-textarea:hover) {
  border-color: #60a5fa;
}

:deep(.ant-input:focus),
:deep(.ant-input-number:focus),
:deep(.ant-select-selector:focus),
:deep(.ant-textarea:focus) {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}

:deep(.ant-checkbox-wrapper),
:deep(.ant-radio-wrapper) {
  color: #374151;
}

/* Responsive */
@media (max-width: 768px) {
  .admin-container {
    padding: 16px;
  }
  .section-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  .header-left,
  .header-right {
    width: 100%;
    justify-content: space-between;
  }
  .add-button {
    flex-grow: 1;
  }
}
</style>
