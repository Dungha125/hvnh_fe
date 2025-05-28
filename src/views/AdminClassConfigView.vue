<script setup>
import { ref, onBeforeMount, watch } from 'vue'
import axios from '@/configs/axios.js'
import { message } from 'ant-design-vue'
import { useRoute, useRouter } from 'vue-router'

const classes = ref([])
const loading = ref(false)
const subjects = ref([])
const semesters = ref([])
const router = useRouter()
const route = useRoute()

// Fetch subjects and semesters separately
const fetchSubjects = async () => {
  try {
    const response = await axios.get('/subjects')
    if (response.data && response.data.code === 200) {
      subjects.value = response.data.data.map(subject => ({
        label: `${subject.code} - ${subject.name}`,
        value: subject.id
      }))
    }
  } catch (error) {
    console.error('Error fetching subjects:', error)
  }
}

const fetchSemesters = async () => {
  try {
    const response = await axios.get('/semesters')
    if (response.data && response.data.code === 200) {
      semesters.value = response.data.data.map(semester => ({
        label: semester.name,
        value: semester.id
      }))
    }
  } catch (error) {
    console.error('Error fetching semesters:', error)
  }
}

const columns = [
  { title: 'STT', dataIndex: 'index', key: 'index' },
  { title: 'Nhóm', dataIndex: 'name', key: 'name' },
  { title: 'Môn học', dataIndex: 'subject', key: 'subject' },
  { title: 'Học kỳ', dataIndex: 'semester', key: 'semester' },
  { title: 'Sinh viên', dataIndex: 'students', key: 'students' },
  { title: 'Trạng thái', dataIndex: 'status', key: 'status' },
  { title: 'Thao tác', dataIndex: 'actions', key: 'actions' },
]

const pagination = ref({
  current: 1,
  pageSize: 50,
  total: 0,
})

const filterSubject = ref('')
const filterSemester = ref('')

const isModalVisible = ref(false)
const isEditing = ref(false)
const tempClass = ref({
  name: '',
  subject_id: null,
  semester_id: null,
  status: 'Hoạt động',
  notice: '',
  about: ''
})
const selectedRecord = ref({})
let editingId = null

// Fetch all classes
const fetchAllClasses = async (page = 1) => {
  loading.value = true
  try {
    // Debug the API endpoint
    console.log('Fetching classes with page:', page)
    
    // Try a simpler request first to see if the API works
    const response = await axios.get('/courses')
    console.log('Raw API response:', response)
    
    if (response.data && response.data.code === 200) {
      classes.value = response.data.data.map((item, index) => {
        const subjectName = item.subject ? item.subject.name : 'N/A'
        const semesterName = item.semester ? item.semester.name : 'N/A'
        
        return {
          id: item.id,
          index: index + 1, // Simplified index calculation
          name: item.name,
          subject: subjectName,
          subject_id: item.subject_id,
          semester: semesterName,
          semester_id: item.semester_id,
          students: item.student_count || 0,
          status: item.status === 1 ? 'Hoạt động' : 'Không hoạt động',
          notice: item.notice || '',
          about: item.about || ''
        }
      })
      
      pagination.value.total = response.data.total || response.data.data.length
      console.log('Classes loaded:', classes.value)
    } else {
      console.error('Failed to load classes:', response.data)
      message.error('Không thể tải danh sách lớp học')
    }
  } catch (error) {
    console.error('Error fetching classes:', error)
    message.error('Không thể kết nối đến máy chủ')
  } finally {
    loading.value = false
  }
}

// Fetch class detail
const fetchClassDetail = async (id) => {
  try {
    const response = await axios.get(`/courses/${id}`)
    if (response.data && response.data.code === 200) {
      return response.data.data
    } else {
      console.error('Failed to load class detail:', response.data)
      message.error('Không thể tải thông tin chi tiết lớp học')
      return null
    }
  } catch (error) {
    console.error('Error fetching class detail:', error)
    message.error('Lỗi khi tải thông tin chi tiết lớp học')
    return null
  }
}

onBeforeMount(async () => {
  await Promise.all([fetchSubjects(), fetchSemesters()])
  await fetchAllClasses()
})

// Watch for filter changes
watch([filterSubject, filterSemester], () => {
  pagination.value.current = 1
  fetchAllClasses(1)
})

const handleTableChange = (paginationData) => {
  pagination.value.current = paginationData.current
  fetchAllClasses(paginationData.current)
}

const showModalAdd = () => {
  isEditing.value = false
  editingId = null
  tempClass.value = { 
    name: '',
    subject_id: subjects.value.length > 0 ? subjects.value[0].value : null,
    semester_id: semesters.value.length > 0 ? semesters.value[0].value : null,
    status: 'Hoạt động',
    notice: '',
    about: ''
  }
  isModalVisible.value = true
}

const closeModal = () => {
  isModalVisible.value = false
}

const onSubmit = async () => {
  if (!tempClass.value.name || !tempClass.value.subject_id || !tempClass.value.semester_id) {
    message.warning('Vui lòng nhập đầy đủ các trường bắt buộc!')
    return
  }

  loading.value = true
  
  try {
    // Make sure subject_id and semester_id are properly set as numbers
    const payload = {
      name: tempClass.value.name,
      subject_id: Number(tempClass.value.subject_id),
      semester_id: Number(tempClass.value.semester_id),
      status: tempClass.value.status === 'Hoạt động' ? 1 : 0,
      notice: tempClass.value.notice || '',
      about: tempClass.value.about || ''
    }
    
    console.log('Payload:', payload)
    
    let response
    if (isEditing.value) {
      response = await axios.put(`/courses/${editingId}`, payload)
    } else {
      response = await axios.post('/courses', payload)
    }
    
    if (response.data && response.data.code === 200) {
      message.success(isEditing.value ? 'Cập nhật lớp học thành công!' : 'Thêm lớp học thành công!')
      isModalVisible.value = false
      await fetchAllClasses()
    } else {
      console.error('API error:', response.data)
      message.error(response.data?.message || 'Có lỗi xảy ra, vui lòng thử lại!')
    }
  } catch (error) {
    console.error('Error submitting form:', error)
    if (error.response) {
      console.error('Response data:', error.response.data)
      message.error(`Lỗi ${error.response.status}: ${error.response.data?.message || 'Lỗi máy chủ'}`)
      
      // Show validation errors if available
      if (error.response.data?.errors) {
        const errorMessages = Object.values(error.response.data.errors).flat()
        errorMessages.forEach(err => message.error(err))
      }
    } else {
      message.error('Không thể kết nối đến máy chủ')
    }
  } finally {
    loading.value = false
  }
}

const onEdit = async (record) => {
  isEditing.value = true
  editingId = record.id
  selectedRecord.value = record
  
  // Fetch detailed class data
  const classDetail = await fetchClassDetail(record.id)
  
  if (classDetail) {
    tempClass.value = {
      name: classDetail.name || record.name,
      subject_id: classDetail.subject_id || record.subject_id,
      semester_id: classDetail.semester_id || record.semester_id,
      status: classDetail.status === 1 ? 'Hoạt động' : 'Không hoạt động',
      notice: classDetail.notice || record.notice || '',
      about: classDetail.about || ''
    }
  } else {
    // Fallback to record data if fetch fails
    tempClass.value = { 
      ...record,
      status: record.status
    }
  }
  
  console.log('Editing class:', tempClass.value)
  isModalVisible.value = true
}

const onDelete = async (id) => {
  try {
    loading.value = true
    const response = await axios.delete(`/courses/${id}`)
    
    if (response.data && response.data.code === 200) {
      message.success('Xóa lớp học thành công!')
      await fetchAllClasses()
    } else {
      console.error('Delete API error:', response.data)
      message.error(response.data?.message || 'Có lỗi xảy ra khi xóa lớp học!')
    }
  } catch (error) {
    console.error('Error deleting class:', error)
    if (error.response) {
      message.error(`Lỗi ${error.response.status}: ${error.response.data?.message || 'Lỗi máy chủ'}`)
    } else {
      message.error('Không thể kết nối đến máy chủ')
    }
  } finally {
    loading.value = false
  }
}

const statusClass = (status) => {
  return status === 'Hoạt động' ? 'status-active' : 'status-inactive'
}

const handleAction = (key, record) => {
  if (key === "student") {
    router.push(`/admin/class/${record.id}/student_list`)
  } else if (key === "lecturer") {
    router.push(`/admin/class/${record.id}/teacher_list`)
  } else if (key === "edit") {
    onEdit(record)
  }
}
</script>

<template>
  <div class="class-container">
    <div class="content-wrapper">
      <div class="header-area">
        <h1>Lớp học</h1>
        <a-select 
          v-model:value="filterSubject" 
          style="width: 200px; margin-right: 10px"
          placeholder="Lọc theo môn học"
          allowClear
        >
          <a-select-option v-for="subject in subjects" :key="subject.value" :value="subject.value">
            {{ subject.label }}
          </a-select-option>
        </a-select>
        <a-select 
          v-model:value="filterSemester" 
          style="width: 250px; margin-right: 10px"
          placeholder="Lọc theo học kỳ"
          allowClear
        >
          <a-select-option v-for="semester in semesters" :key="semester.value" :value="semester.value">
            {{ semester.label }}
          </a-select-option>
        </a-select>
        <a-button type="primary" class="add-button" @click="showModalAdd">Thêm mới</a-button>
      </div>

      <a-table 
        :columns="columns" 
        :dataSource="classes" 
        rowKey="id" 
        bordered 
        :pagination="pagination"
        :loading="loading"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.dataIndex === 'index'">
            {{ index + 1 }}
          </template>
          <template v-else-if="column.dataIndex === 'status'">
            <a-tag :class="statusClass(record.status)">{{ record.status }}</a-tag>
          </template>
          <template v-else-if="column.dataIndex === 'actions'">
            <a-dropdown>
              <a-button> ⋮ </a-button>
              <template #overlay>
                <a-menu @click="({ key }) => handleAction(key, record)">
                  <a-menu-item key="student">Sinh Viên</a-menu-item>
                  <a-menu-item key="lecturer">Giảng viên</a-menu-item>
                  <a-menu-divider/>
                  <a-menu-item key="edit" danger>Sửa</a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </template>
        </template>
      </a-table>
    </div>

    <!-- Modal Thêm/Sửa lớp học -->
    <a-modal
      v-model:open="isModalVisible"
      :title="isEditing ? `Sửa lớp học ${selectedRecord.name || ''}` : 'Thêm lớp học'"
      @ok="onSubmit"
      @cancel="closeModal"
      okText="Lưu"
      cancelText="Hủy"
      width="800px"
      :confirmLoading="loading"
    >
      <a-form layout="vertical">
        <a-form-item label="Tên *" required>
          <a-input v-model:value="tempClass.name" placeholder="Nhập tên nhóm lớp (VD: 01)" />
        </a-form-item>

        <a-form-item label="Môn học *" required>
          <a-select v-model:value="tempClass.subject_id">
            <a-select-option v-for="subject in subjects" :key="subject.value" :value="subject.value">
              {{ subject.label }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="Học kỳ *" required>
          <a-select v-model:value="tempClass.semester_id">
            <a-select-option v-for="semester in semesters" :key="semester.value" :value="semester.value">
              {{ semester.label }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="Trạng thái">
          <a-select v-model:value="tempClass.status">
            <a-select-option value="Hoạt động">Hoạt động</a-select-option>
            <a-select-option value="Không hoạt động">Không hoạt động</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="Thông báo (Hiển thị tới sinh viên - Hỗ trợ HTML)">
          <a-textarea v-model:value="tempClass.notice" placeholder="Thông báo cho lớp" rows="4" />
        </a-form-item>
        
        <a-form-item label="Mô tả">
          <a-textarea v-model:value="tempClass.about" placeholder="Mô tả lớp học" rows="4" />
        </a-form-item>
      </a-form>
      
      <template #footer>
        <a-button @click="closeModal">Hủy</a-button>
        <a-button type="primary" @click="onSubmit">Lưu</a-button>
      </template>
    </a-modal>
  </div>
</template>

<style scoped>
.class-container {
  background: #fff;
  padding: 24px;
  min-height: 100vh;
}

.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
}

.header-area {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.header-area h1 {
  margin-right: 20px;
  margin-bottom: 0;
}

.add-button {
  background-color: #a7453c;
  border-color: #a7453c;
}

.add-button:hover {
  background-color: #8a3931;
  border-color: #8a3931;
}

.status-active {
  color: #52c41a;
  background: #f6ffed;
  border-color: #b7eb8f;
}

.status-inactive {
  color: #ff4d4f;
  background: #fff1f0;
  border-color: #ffa39e;
}
</style>
