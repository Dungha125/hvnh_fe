<script setup>
import { ref, onBeforeMount, watch } from 'vue'
import axios from '@/configs/axios.js'
import { message } from 'ant-design-vue'
import { useRoute, useRouter } from 'vue-router'
import { PlusOutlined, EditOutlined, DeleteOutlined, EllipsisOutlined } from '@ant-design/icons-vue'

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

const filterSubject = ref(null)
const filterSemester = ref(null)

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

  const params = {
    page: pagination.value.current,
    per_page: pagination.value.pageSize,
    subject_id: filterSubject.value,
    semester_id: filterSemester.value
  }

  try {
    // Debug the API endpoint
    console.log('Fetching classes with page:', page)
    
    // Try a simpler request first to see if the API works
    const response = await axios.get('/courses',{ params })
    console.log('Raw API response:', response)
    
    if (response.data && response.data.code === 200) {
      classes.value = response.data.data.map((item, index) => {
        const subjectName = item.subject ? item.subject.name : 'N/A'
        const semesterName = item.semester ? item.semester.name : 'N/A'
        const subjectId = item.subject ? item.subject_id : 'N/A'
        
        return {
          id: item.id,
          index: index + 1, // Simplified index calculation
          name: item.name,
          subject: subjectName,
          subject_id: subjectId,
          semester: semesterName,
          semester_id: item.semester_id,
          students: item.students || 0,
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
const findAndSetDefaultFilters = async () => {
  for (const subject of subjects.value) {
    for (const semester of semesters.value) {
      try {
        // Gọi API để kiểm tra xem cặp filter này có dữ liệu không
        const { data } = await axios.get('/courses', { 
          params: { 
            subject_id: subject.value, 
            semester_id: semester.value,
            per_page: 1 // Chỉ cần 1 bản ghi để xác nhận
          } 
        });

        // Nếu có, đặt làm mặc định và thoát
        if (data && data.code === 200 && data.data.length > 0) {
          filterSubject.value = subject.value;
          filterSemester.value = semester.value;
          return; 
        }
      } catch (error) {
        console.error(`Lỗi khi kiểm tra filter:`, error);
      }
    }
  }

  // Phương án dự phòng: nếu không có cặp nào có dữ liệu, chọn cặp đầu tiên
  if (subjects.value.length > 0) {
    filterSubject.value = subjects.value[0].value;
  }
  if (semesters.value.length > 0) {
    filterSemester.value = semesters.value[0].value;
  }
};


// --- LIFECYCLE & WATCHERS ---
onBeforeMount(async () => {
  // 1. Tải danh sách cho bộ lọc
  await Promise.all([fetchSubjects(), fetchSemesters()]);
  
  // 2. Tìm và đặt bộ lọc mặc định (logic mới)
  // Watcher sẽ tự động gọi fetchAllClasses khi filter thay đổi
  await findAndSetDefaultFilters();
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
    subject: subjects.value.length > 0 ? subjects.value[0].value : null,
    semester: semesters.value.length > 0 ? semesters.value[0].value : null,
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
      subject_id: tempClass.value.subject_id || '',
      semester_id: tempClass.value.semester_id || '',
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
  <div class="admin-classes">
    <div class="admin-container">
      <div class="admin-header">
        <div class="header-content">
          <h1 class="page-title">Quản lý Lớp học</h1>
          <p class="page-description">Thêm, sửa và quản lý các lớp học trong hệ thống</p>
        </div>
      </div>

      <div class="admin-content">
        <div class="content-section">
          <div class="section-header">
            <div class="header-left">
              <h2 class="section-title">Danh sách lớp học</h2>
              <div class="filter-group">
                <a-select 
                  v-model:value="filterSubject" 
                  style="width: 220px"
                  placeholder="Lọc theo môn học"
                  allowClear
                  show-search
                  :options="subjects"
                  :filter-option="(input, option) => option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0"
                />
                <a-select 
                  v-model:value="filterSemester" 
                  style="width: 250px"
                  placeholder="Lọc theo học kỳ"
                  allowClear
                  :options="semesters"
                />
              </div>
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
              :dataSource="classes" 
              rowKey="id" 
              bordered 
              :pagination="pagination"
              :loading="loading"
              @change="handleTableChange"
              class="classes-table"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.dataIndex === 'status'">
                  <a-tag :color="record.status === 'Hoạt động' ? 'success' : 'error'" class="status-tag">{{ record.status }}</a-tag>
                </template>
                <template v-else-if="column.dataIndex === 'actions'">
                  <a-dropdown>
                    <a-button shape="circle" class="action-button-more"> <EllipsisOutlined /> </a-button>
                    <template #overlay>
                      <a-menu @click="({ key }) => handleAction(key, record)">
                        <a-menu-item key="student"><UserOutlined /> Danh sách sinh viên</a-menu-item>
                        <a-menu-item key="lecturer"><TeamOutlined /> Danh sách giảng viên</a-menu-item>
                        <a-menu-divider/>
                        <a-menu-item key="edit"><EditOutlined /> Sửa thông tin</a-menu-item>
                        <a-popconfirm
                          title="Bạn có chắc chắn muốn xóa lớp học này?"
                          ok-text="Có"
                          cancel-text="Không"
                          @confirm="onDelete(record.id)"
                        >
                          <a-menu-item key="delete" danger><DeleteOutlined /> Xóa lớp</a-menu-item>
                        </a-popconfirm>
                      </a-menu>
                    </template>
                  </a-dropdown>
                </template>
              </template>
            </a-table>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Thêm/Sửa lớp học -->
    <a-modal
      v-model:open="isModalVisible"
      :title="isEditing ? `Sửa lớp học: ${selectedRecord.name}` : 'Thêm lớp học mới'"
      @cancel="closeModal"
      width="800px"
      :footer="null"
      class="class-modal"
    >
      <a-form layout="vertical" @submit.prevent="onSubmit">
        <a-form-item label="Tên nhóm" required>
          <a-input v-model:value="tempClass.name" placeholder="Nhập tên nhóm lớp (VD: 01, 02,...)" />
        </a-form-item>

        <a-row :gutter="16">
            <a-col :span="12">
                <a-form-item label="Môn học" required>
                    <a-select 
                        v-model:value="tempClass.subject_id"
                        placeholder="Chọn môn học"
                        show-search
                        :options="subjects"
                        :filter-option="(input, option) => option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0"
                    />
                </a-form-item>
            </a-col>
            <a-col :span="12">
                <a-form-item label="Học kỳ" required>
                    <a-select 
                        v-model:value="tempClass.semester_id"
                        placeholder="Chọn học kỳ"
                        :options="semesters"
                    />
                </a-form-item>
            </a-col>
        </a-row>
        
        <a-form-item label="Trạng thái">
          <a-select v-model:value="tempClass.status">
            <a-select-option value="Hoạt động">Hoạt động</a-select-option>
            <a-select-option value="Không hoạt động">Không hoạt động</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="Thông báo (Hiển thị tới sinh viên - Hỗ trợ HTML)">
          <a-textarea v-model:value="tempClass.notice" placeholder="Thông báo cho lớp" :rows="4" />
        </a-form-item>
        
        <a-form-item label="Mô tả">
          <a-textarea v-model:value="tempClass.about" placeholder="Mô tả lớp học" :rows="4" />
        </a-form-item>
        
        <a-form-item>
            <div class="modal-footer-buttons">
                <a-button @click="closeModal" class="cancel-button">Hủy</a-button>
                <a-button type="primary" html-type="submit" :loading="loading" class="save-button">Lưu</a-button>
            </div>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>
/* General Page Layout */
.admin-classes {
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
  flex-wrap: wrap;
  gap: 16px; 
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
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

.filter-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
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
  text-align: center;
}

:deep(.ant-table-tbody > tr:hover > td) {
  background: #f8fafc;
}

.status-tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

.action-button-more {
  height: 32px;
  width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Modal Styling */
:deep(.class-modal .ant-modal-header) {
  border-bottom: 1px solid #eef2f7;
  padding: 16px 24px;
}

:deep(.class-modal .ant-modal-title) {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

:deep(.class-modal .ant-modal-body) {
  padding: 24px;
}

:deep(.class-modal .ant-modal-footer) {
  display: none; /* Hide default footer as we have custom buttons */
}

.modal-footer-buttons {
  text-align: right;
  padding-top: 16px;
  border-top: 1px solid #eef2f7;
  margin-top: 24px; /* Adjust as needed */
}

.cancel-button {
  margin-right: 8px;
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
:deep(.ant-textarea) {
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
  .filter-group {
    width: 100%;
    justify-content: space-between;
  }
  .add-button {
    flex-grow: 1;
  }
}
</style>
