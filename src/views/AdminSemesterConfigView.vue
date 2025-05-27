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

const columns = [
  { title: 'Mã', dataIndex: 'code', key: 'code' },
  { title: 'Học kỳ', dataIndex: 'name', key: 'name' },
  { title: 'Trạng thái', dataIndex: 'status', key: 'status' },
  { title: 'Thao tác', dataIndex: 'actions', key: 'actions' },
]

onBeforeMount(async () => {
  try {
    const res = await axios.get('/semesters')
    if (res.data.code === 200 && res.data.data) {
      semesters.value = res.data.data
    }
  } catch (error) {
    message.error('Lỗi khi tải danh sách học kỳ')
    console.error(error)
  }
})

const showModalAdd = () => {
  isEditing.value = false
  editingCode = null
  tempSemester.value = { status: 'Hoạt động' }
  isModalVisible.value = true
}

const closeModal = () => (isModalVisible.value = false)

const onSubmit = async () => {
  if (!tempSemester.value.code || !tempSemester.value.name) {
    message.warning('Vui lòng nhập đủ Mã và Tên học kỳ!')
    return
  }

  // FIX: Đúng field short_name, ép kiểu, default nếu thiếu
  const payload = {
    code: String(tempSemester.value.code),
    name: String(tempSemester.value.name),
    description: tempSemester.value.description || '',
    short_name: tempSemester.value.shortName?.trim() || 'HK',
    status: tempSemester.value.status === 'Hoạt động' ? 1 : 0,
    dailyAcLimit: Number(tempSemester.value.dailyAcLimit) || 1,
    startTime: tempSemester.value.startTime ? dayjs(tempSemester.value.startTime).format('YYYY-MM-DD HH:mm:ss') : null,
    scoringTime: tempSemester.value.scoringTime ? dayjs(tempSemester.value.scoringTime).format('YYYY-MM-DD HH:mm:ss') : null,
    endTime: tempSemester.value.endTime ? dayjs(tempSemester.value.endTime).format('YYYY-MM-DD HH:mm:ss') : null,
  }

  console.log('🔥 Payload gửi lên:', JSON.stringify(payload, null, 2))

  try {
    if (!isEditing.value) {
      const res = await axios.post('/semesters', payload)
      console.log('API Response:', res.data)
      if (res.data.code === 200) {
        semesters.value.push(res.data.data)
        message.success('Thêm học kỳ thành công')
      } else {
        message.error(`Thêm thất bại: ${res.data.message || 'Không rõ lỗi'}`)
      }
    } else {
      const res = await axios.put(`/semesters/${editingCode}`, payload)
      console.log('API Response:', res.data)
      if (res.data.code === 200) {
        const idx = semesters.value.findIndex((s) => s.code === editingCode)
        if (idx !== -1) semesters.value[idx] = res.data.data
        message.success('Cập nhật học kỳ thành công')
      } else {
        message.error(`Cập nhật thất bại: ${res.data.message || 'Không rõ lỗi'}`)
      }
    }
  } catch (error) {
    message.error('Có lỗi xảy ra khi gọi API')
    console.error(error)
  }

  closeModal()
}

const onEdit = (record) => {
  isEditing.value = true
  editingCode = record.code
  tempSemester.value = { ...record }
  isModalVisible.value = true
}

const onDelete = async (code) => {
  try {
    const res = await axios.delete(`/semesters/${code}`)
    if (res.data.code === 200) {
      semesters.value = semesters.value.filter((s) => s.code !== code)
      message.success('Xóa học kỳ thành công')
    } else {
      message.error(`Xóa thất bại: ${res.data.message || 'Không rõ lỗi'}`)
    }
  } catch (error) {
    message.error('Lỗi khi gọi API xóa')
    console.error(error)
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
      :pagination="false"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'status'">
          <a-tag :class="statusClass(record.status)">{{ statusText(record.status) }}</a-tag>
        </template>

        <template v-else-if="column.dataIndex === 'actions'">
          <a-button @click="onEdit(record)">Sửa</a-button>
          <a-button danger @click="onDelete(record.code)">Xóa</a-button>
        </template>

        <template v-else>
          {{ record[column.dataIndex] }}
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
    >
      <a-form layout="vertical">
        <a-form-item label="Mã" required>
          <a-input v-model:value="tempSemester.code" placeholder="Nhập mã học kỳ" />
        </a-form-item>
        <a-form-item label="Tên" required>
          <a-input v-model:value="tempSemester.name" placeholder="Nhập tên học kỳ" />
        </a-form-item>
        <a-form-item label="Mô tả">
          <a-textarea v-model:value="tempSemester.description" placeholder="Mô tả (nếu có)" />
        </a-form-item>
        <a-form-item label="Tên rút gọn (short name)">
          <a-input v-model:value="tempSemester.shortName" placeholder="Tên rút gọn (bắt buộc)" />
        </a-form-item>
        <a-form-item label="Trạng thái">
          <a-select v-model:value="tempSemester.status">
            <a-select-option value="Hoạt động">Hoạt động</a-select-option>
            <a-select-option value="Đóng">Đóng</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="Ngày bắt đầu">
          <a-date-picker v-model:value="tempSemester.startTime" show-time format="YYYY-MM-DD HH:mm:ss" style="width: 100%" />
        </a-form-item>
        <a-form-item label="Ngày chấm điểm">
          <a-date-picker v-model:value="tempSemester.scoringTime" show-time format="YYYY-MM-DD HH:mm:ss" style="width: 100%" />
        </a-form-item>
        <a-form-item label="Ngày kết thúc">
          <a-date-picker v-model:value="tempSemester.endTime" show-time format="YYYY-MM-DD HH:mm:ss" style="width: 100%" />
        </a-form-item>
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
