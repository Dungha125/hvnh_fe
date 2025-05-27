<template>
    <div class="class-container">
      <div class="content-wrapper">
        <div class="header-area">
          <h1>Lớp học</h1>
          <a-select v-model:value="filterSubject" style="width: 200px; margin-right: 10px">
            <a-select-option v-for="subject in subjectOptions" :key="subject" :value="subject">
              {{ subject }}
            </a-select-option>
          </a-select>
          <a-select v-model:value="filterSemester" style="width: 250px; margin-right: 10px">
            <a-select-option v-for="semester in semesterOptions" :key="semester" :value="semester">
              {{ semester }}
            </a-select-option>
          </a-select>
          <a-button type="primary" class="add-button" @click="showModalAdd">Thêm mới</a-button>
        </div>
  
        <a-table :columns="columns" :dataSource="classes" rowKey="id" bordered :pagination="false">
          <template #bodyCell="{ column, record, index }">
            <template v-if="column.dataIndex === 'index'">
              {{ index + 1 }}
            </template>
            <template v-else-if="column.dataIndex === 'status'">
              <a-button :class="statusClass(record.status)">{{ record.status }}</a-button>
            </template>
            <template v-else-if="column.dataIndex === 'actions'">
              <a-dropdown>
                <template #overlay>
                  <a-menu>
                    <a-menu-item @click="onEdit(record)">Sửa</a-menu-item>
                    <a-menu-item @click="onDelete(record.id)">Xóa</a-menu-item>
                  </a-menu>
                </template>
                <a-button>...</a-button>
              </a-dropdown>
            </template>
            <template v-else>
              {{ record[column.dataIndex] }}
            </template>
          </template>
        </a-table>
      </div>
  
      <!-- Modal Thêm/Sửa lớp học -->
      <a-modal
        v-model:open="isModalVisible"
        :title="isEditing ? 'Sửa lớp học' : 'Thêm lớp học'"
        @ok="onSubmit"
        @cancel="closeModal"
        okText="Lưu"
        cancelText="Hủy"
        width="800px"
      >
        <a-form layout="vertical">
          <a-form-item label="Tên *" required>
            <a-input v-model:value="tempClass.name" placeholder="Nhập tên nhóm lớp (VD: 01)" />
          </a-form-item>
  
          <a-form-item label="Môn học" required>
            <a-select v-model:value="tempClass.subject">
              <a-select-option v-for="subject in subjectOptions" :key="subject" :value="subject">
                {{ subject }}
              </a-select-option>
            </a-select>
          </a-form-item>
  
          <a-form-item label="Học kỳ" required>
            <a-select v-model:value="tempClass.semester">
              <a-select-option v-for="semester in semesterOptions" :key="semester" :value="semester">
                {{ semester }}
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
            <a-textarea v-model:value="tempClass.notice" placeholder="Thông báo cho lớp" />
          </a-form-item>
        </a-form>
      </a-modal>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import AdminHeader from '@/components/AdminHeader.vue'
  
  const classes = ref([
    { id: 1, name: '01', subject: 'LẬP TRÌNH CƠ BẢN', semester: 'Học kỳ 2 năm học 2022 - 2023', students: 4, status: 'Hoạt động' },
    { id: 2, name: '02', subject: 'LẬP TRÌNH CƠ BẢN', semester: 'Học kỳ 2 năm học 2022 - 2023', students: 0, status: 'Hoạt động' },
    { id: 3, name: '03', subject: 'LẬP TRÌNH CƠ BẢN', semester: 'Học kỳ 2 năm học 2022 - 2023', students: 0, status: 'Hoạt động' },
    { id: 4, name: '04', subject: 'LẬP TRÌNH CƠ BẢN', semester: 'Học kỳ 2 năm học 2022 - 2023', students: 2, status: 'Hoạt động' },
  ])
  
  const columns = [
    { title: 'STT', dataIndex: 'index', key: 'index' },
    { title: 'Nhóm', dataIndex: 'name', key: 'name' },
    { title: 'Môn học', dataIndex: 'subject', key: 'subject' },
    { title: 'Học kỳ', dataIndex: 'semester', key: 'semester' },
    { title: 'Sinh viên', dataIndex: 'students', key: 'students' },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status' },
    { title: 'Thao tác', dataIndex: 'actions', key: 'actions' },
  ]
  
  const subjectOptions = ['LẬP TRÌNH CƠ BẢN', 'LẬP TRÌNH NÂNG CAO', 'THUẬT TOÁN', 'OOP']
  const semesterOptions = ['Học kỳ 2 năm học 2022 - 2023', 'Học kỳ 1 năm học 2022 - 2023']
  
  const filterSubject = ref('')
  const filterSemester = ref('')
  
  const isModalVisible = ref(false)
  const isEditing = ref(false)
  const tempClass = ref({})
  let editingId = null
  
  const showModalAdd = () => {
    isEditing.value = false
    editingId = null
    tempClass.value = { status: 'Hoạt động' }
    isModalVisible.value = true
  }
  
  const closeModal = () => (isModalVisible.value = false)
  
  const onSubmit = () => {
    if (!tempClass.value.name || !tempClass.value.subject || !tempClass.value.semester) {
      alert('Vui lòng nhập đủ các trường bắt buộc!')
      return
    }
    if (!isEditing.value) {
      const newClass = { ...tempClass.value, id: Date.now(), students: 0 }
      classes.value.push(newClass)
    } else {
      const idx = classes.value.findIndex((c) => c.id === editingId)
      if (idx !== -1) classes.value[idx] = { ...tempClass.value, id: editingId }
    }
    closeModal()
  }
  
  const onEdit = (record) => {
    isEditing.value = true
    editingId = record.id
    tempClass.value = { ...record }
    isModalVisible.value = true
  }
  
  const onDelete = (id) => {
    classes.value = classes.value.filter((c) => c.id !== id)
  }
  
  const statusClass = (status) => {
    return status === 'Hoạt động' ? 'active-status' : 'inactive-status'
  }
  </script>
  
  <style scoped>
  .class-container {
    background: #fff;
    min-height: 100vh;
  }
  
  .content-wrapper {
    padding: 24px;
    margin-top: 20px;
  }
  
  .header-area {
    display: flex;
    justify-content: start;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
  }
  
  .add-button {
    background-color: #c62828;
    color: #fff;
    font-weight: 600;
  }
  
  .add-button:hover {
    background-color: #a71d1d;
  }
  
  .active-status {
    border: 1px solid green;
    color: green;
    background-color: #fff;
  }
  
  .inactive-status {
    border: 1px solid red;
    color: red;
    background-color: #fff;
  }
  </style>
  