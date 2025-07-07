<script setup>
import { ref, onBeforeMount } from 'vue'
import axios from '@/configs/axios.js'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons-vue'

const semesters = ref([])
const isModalVisible = ref(false)
const isEditing = ref(false)
const tempSemester = ref({})
let editingCode = null
const loading = ref(false)

const columns = [
  { title: 'Mã', dataIndex: 'code', key: 'code' },
  { title: 'Học kỳ', dataIndex: 'name', key: 'name' },
  { title: 'Tên rút gọn', dataIndex: 'short_name', key: 'short_name' },
  { title: 'Trạng thái', dataIndex: 'status', key: 'status' },
  { title: 'Thao tác', dataIndex: 'actions', key: 'actions' },
]

const fetchSemesters = async () => {
  loading.value = true
  try {
    const res = await axios.get('/semesters')
    if (res.data.code === 200 && res.data.data) {
      semesters.value = res.data.data.map(item => ({
        ...item,
        // Convert date strings to dayjs objects for editing
        startTime: item.start_time ? dayjs(item.start_time) : null,
        scoringTime: item.scoring_time ? dayjs(item.scoring_time) : null,
        endTime: item.end_time ? dayjs(item.end_time) : null,
        // Map API fields to form fields
        shortName: item.short_name,
        dailyAcLimit: item.daily_ac_limit || 1
      }))
    } else {
      message.error('Không thể tải dữ liệu học kỳ')
    }
  } catch (error) {
    message.error('Lỗi khi tải danh sách học kỳ')
    console.error(error)
  } finally {
    loading.value = false
  }
}

onBeforeMount(() => {
  fetchSemesters()
})

const showModalAdd = () => {
  isEditing.value = false
  editingCode = null
  tempSemester.value = { 
    status: 'Hoạt động',
    shortName: 'HK',
    dailyAcLimit: 1
  }
  isModalVisible.value = true
}

const closeModal = () => (isModalVisible.value = false)

const onSubmit = async () => {
  if (!tempSemester.value.code || !tempSemester.value.name) {
    message.warning('Vui lòng nhập đủ Mã và Tên học kỳ!')
    return
  }

  const payload = {
    code: String(tempSemester.value.code),
    name: String(tempSemester.value.name),
    description: tempSemester.value.description || '',
    short_name: tempSemester.value.shortName?.trim() || 'HK',
    status: tempSemester.value.status === 'Hoạt động' ? 1 : 0,
    daily_ac_limit: Number(tempSemester.value.dailyAcLimit) || 1,
    start_time: tempSemester.value.startTime ? dayjs(tempSemester.value.startTime).format('YYYY-MM-DD HH:mm:ss') : null,
    scoring_time: tempSemester.value.scoringTime ? dayjs(tempSemester.value.scoringTime).format('YYYY-MM-DD HH:mm:ss') : null,
    end_time: tempSemester.value.endTime ? dayjs(tempSemester.value.endTime).format('YYYY-MM-DD HH:mm:ss') : null,
  }

  console.log('🔥 Payload gửi lên:', JSON.stringify(payload, null, 2))
  loading.value = true

  try {
    if (!isEditing.value) {
      const res = await axios.post('/semesters', payload)
      console.log('API Response:', res.data)
      if (res.data.code === 200) {
        message.success('Thêm học kỳ thành công')
        await fetchSemesters() // Refresh data
      } else {
        message.error(`Thêm thất bại: ${res.data.message || 'Không rõ lỗi'}`)
      }
    } else {
      const res = await axios.put(`/semesters/${editingCode}`, payload)
      console.log('API Response:', res.data)
      if (res.data.code === 200) {
        message.success('Cập nhật học kỳ thành công')
        await fetchSemesters() // Refresh data
      } else {
        message.error(`Cập nhật thất bại: ${res.data.message || 'Không rõ lỗi'}`)
      }
    }
    closeModal()
  } catch (error) {
    message.error('Có lỗi xảy ra khi gọi API')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const onEdit = (record) => {
  isEditing.value = true
  editingCode = record.code
  tempSemester.value = { 
    ...record,
    status: statusText(record.status)
  }
  isModalVisible.value = true
}

const onDelete = async (code) => {
  try {
    loading.value = true
    const res = await axios.delete(`/semesters/${code}`)
    if (res.data.code === 200) {
      message.success('Xóa học kỳ thành công')
      await fetchSemesters() // Refresh data
    } else {
      message.error(`Xóa thất bại: ${res.data.message || 'Không rõ lỗi'}`)
    }
  } catch (error) {
    message.error('Lỗi khi gọi API xóa')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const statusText = (status) => {
  if (status === 1 || status === '1') return 'Hoạt động'
  if (status === 0 || status === '0') return 'Đóng'
  return String(status)
}
</script>

<template>
  <div class="admin-semesters">
    <div class="admin-container">
      <div class="admin-header">
        <div class="header-content">
          <h1 class="page-title">Quản lý Học kỳ</h1>
          <p class="page-description">Thêm, sửa và quản lý các học kỳ trong hệ thống</p>
        </div>
      </div>

      <div class="admin-content">
        <div class="content-section">
          <div class="section-header">
            <div class="header-left">
              <h2 class="section-title">Danh sách học kỳ</h2>
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
              :dataSource="semesters"
              rowKey="code"
              bordered
              :pagination="{ pageSize: 10 }"
              :loading="loading"
              class="semesters-table"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.dataIndex === 'status'">
                  <a-tag :color="record.status === 1 || record.status === '1' ? 'success' : 'error'" class="status-tag">{{ statusText(record.status) }}</a-tag>
                </template>

                <template v-else-if="column.dataIndex === 'actions'">
                  <a-space>
                    <a-button type="primary" @click="onEdit(record)" class="action-button-edit">
                      <EditOutlined /> Sửa
                    </a-button>
                    <a-popconfirm
                      title="Bạn có chắc chắn muốn xóa học kỳ này?"
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

    <a-modal
      v-model:open="isModalVisible"
      :title="isEditing ? 'Sửa học kỳ' : 'Thêm học kỳ'"
      @ok="onSubmit"
      @cancel="closeModal"
      okText="Lưu"
      cancelText="Hủy"
      :confirmLoading="loading"
      width="600px"
      class="semester-modal"
    >
      <a-form layout="vertical">
        <a-form-item label="Mã" required>
          <a-input v-model:value="tempSemester.code" placeholder="Nhập mã học kỳ" :disabled="isEditing" />
        </a-form-item>
        <a-form-item label="Tên" required>
          <a-input v-model:value="tempSemester.name" placeholder="Nhập tên học kỳ" />
        </a-form-item>
        <a-form-item label="Tên rút gọn (short name)" required>
          <a-input v-model:value="tempSemester.shortName" placeholder="Tên rút gọn" />
        </a-form-item>
        <a-form-item label="Mô tả">
          <a-textarea v-model:value="tempSemester.description" placeholder="Mô tả (nếu có)" />
        </a-form-item>
        <a-form-item label="Trạng thái">
          <a-select v-model:value="tempSemester.status">
            <a-select-option value="Hoạt động">Hoạt động</a-select-option>
            <a-select-option value="Đóng">Đóng</a-select-option>
          </a-select>
        </a-form-item>
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="Ngày bắt đầu">
              <a-date-picker v-model:value="tempSemester.startTime" show-time format="YYYY-MM-DD HH:mm:ss" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="Ngày chấm điểm">
              <a-date-picker v-model:value="tempSemester.scoringTime" show-time format="YYYY-MM-DD HH:mm:ss" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="Ngày kết thúc">
              <a-date-picker v-model:value="tempSemester.endTime" show-time format="YYYY-MM-DD HH:mm:ss" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="Giới hạn AC hàng ngày" required>
          <a-input-number v-model:value="tempSemester.dailyAcLimit" :min="1" style="width: 100%" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>
/* General Page Layout */
.admin-semesters {
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
:deep(.semester-modal .ant-modal-header) {
  border-bottom: 1px solid #eef2f7;
  padding: 16px 24px;
}

:deep(.semester-modal .ant-modal-title) {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

:deep(.semester-modal .ant-modal-body) {
  padding: 24px;
}

:deep(.semester-modal .ant-modal-footer) {
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
