<script setup>
import { ref, onBeforeMount } from 'vue'
import axios from '@/configs/axios.js'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'

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
  return status
}

const statusClass = (status) => {
  return status === 1 || status === '1' ? 'status-active' : 'status-inactive'
}
</script>

<template>
  <div class="semester-container">
    <div class="header-area">
      <h1>Quản lý Học kỳ</h1>
      <a-button type="primary" @click="showModalAdd">Thêm mới</a-button>
    </div>

    <a-table
      :columns="columns"
      :dataSource="semesters"
      rowKey="code"
      bordered
      :pagination="{ pageSize: 10 }"
      :loading="loading"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'status'">
          <a-tag :class="statusClass(record.status)">{{ statusText(record.status) }}</a-tag>
        </template>

        <template v-else-if="column.dataIndex === 'actions'">
          <a-space>
            <a-button type="primary" @click="onEdit(record)">Sửa</a-button>
            <a-popconfirm
              title="Bạn có chắc chắn muốn xóa học kỳ này?"
              ok-text="Có"
              cancel-text="Không"
              @confirm="onDelete(record.code)"
            >
              <a-button danger>Xóa</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <a-modal
      v-model:open="isModalVisible"
      :title="isEditing ? 'Sửa học kỳ' : 'Thêm học kỳ'"
      @ok="onSubmit"
      @cancel="closeModal"
      okText="Lưu"
      cancelText="Hủy"
      :confirmLoading="loading"
      width="600px"
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
.semester-container {
  padding: 24px;
  background: #fff;
}

.header-area {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.status-active {
  color: #52c41a;
  border-color: #52c41a;
}

.status-inactive {
  color: #f5222d;
  border-color: #f5222d;
}
</style>
