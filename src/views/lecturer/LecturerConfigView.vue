<template>
  <div class="settings-page">
    <LecturerHeader/>
    <div class="page-wrapper">
      <div class="settings-layout">
        <!-- Sidebar điều hướng -->
        <aside class="sidebar">
          <h2 class="sidebar-title">Cấu hình</h2>
          <div class="menu">
            <button class="menu-button" @click="toggleSection('learning')">
              <span>Cấu hình học tập</span>
              <RightOutlined class="menu-arrow" :class="{ 'rotate': openSection === 'learning' }"/>
            </button>
            <ul v-show="openSection === 'learning'" class="submenu">
              <li v-for="item in learningConfig" :key="item.slug">
                <button
                    class="submenu-item"
                    :class="{ 'active': activeItem === item.slug }"
                    @click="handleItemClick(item)"
                >
                  <img :src="item.icon" alt="icon" class="menu-icon"/>
                  {{ item.label }}
                </button>
              </li>
            </ul>
          </div>
          <!-- Thêm các menu khác ở đây nếu cần -->
        </aside>

        <!-- Khu vực nội dung chính -->
        <main class="content-area">
          <div class="content-card">
            <component v-if="currentComponent" :is="currentComponent"/>
            <div v-else class="placeholder">
              <p>Chọn một mục từ menu bên cạnh để bắt đầu cấu hình.</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, shallowRef, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { RightOutlined } from '@ant-design/icons-vue';

// Import các component và tài nguyên
import LecturerHeader from "@/components/LecturerHeader.vue";
import LecturerContestConfigView from "@/views/lecturer/LecturerContestConfigView.vue";
import LecturerClassConfigView from "@/views/lecturer/LecturerClassConfigView.vue";
import lopHoc from '../../static/img/lop_hoc.svg';
import thucHanh from '../../static/img/thuc_hanh.svg';

// State quản lý UI
const openSection = ref('learning'); // Mặc định mở section này
const activeItem = ref(null);
const currentComponent = shallowRef(null);

// Cấu hình menu
const learningConfig = [
  { label: 'Lớp học', slug: 'lop-hoc', icon: lopHoc, component: LecturerClassConfigView },
  { label: 'Thực hành', slug: 'thuc-hanh', icon: thucHanh, component: LecturerContestConfigView }
];

// Vue Router
const router = useRouter();
const route = useRoute();

// Hàm xử lý sự kiện
const toggleSection = (section) => {
  openSection.value = openSection.value === section ? null : section;
};

const handleItemClick = (item) => {
  activeItem.value = item.slug;
  currentComponent.value = item.component;
  // Cập nhật URL để phản ánh trạng thái
  router.push({ path: route.path, query: { view: item.slug } });
};

// Hàm đồng bộ trạng thái từ URL khi tải trang hoặc điều hướng
const syncStateFromUrl = () => {
  const viewSlug = route.query.view;
  if (viewSlug) {
    const item = learningConfig.find(i => i.slug === viewSlug);
    if (item) {
      activeItem.value = item.slug;
      currentComponent.value = item.component;
      // Mở section tương ứng nếu đang đóng
      if (!openSection.value) {
          openSection.value = 'learning'; // Giả sử chỉ có section 'learning'
      }
    }
  }
};

// Theo dõi sự thay đổi của route query để cập nhật component
watch(() => route.query.view, () => {
  syncStateFromUrl();
});

// Đồng bộ lần đầu khi component được mount
onMounted(() => {
  syncStateFromUrl();
  // Nếu không có view nào trong URL, chọn mục đầu tiên làm mặc định
  if (!route.query.view && learningConfig.length > 0) {
      handleItemClick(learningConfig[0]);
  }
});
</script>

<style scoped>
/*
  CSS cho trang Cấu hình - Chủ đề Neo-Futuristic Sáng
  Đã được thiết kế lại và responsive.
*/

.settings-page {
  background-color: #F5F7FA;
  min-height: 100vh;
}

.page-wrapper {
  margin-top: 70px; /* Chiều cao của Header */
  padding: 24px;
}

/* === Bố cục chính === */
.settings-layout {
  display: flex;
  gap: 24px;
  max-width: 1600px;
  margin: 0 auto;
  align-items: flex-start;
}

/* === Sidebar === */
.sidebar {
  width: 280px;
  flex-shrink: 0;
  background: #ffffff;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #D9E2EC;
  box-shadow: 0 4px 15px rgba(0, 90, 170, 0.08);
  position: sticky;
  top: 94px; /* 70px header + 24px padding */
}

.sidebar-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #007ACC;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #E8EFF5;
}

.menu {
  margin-bottom: 12px;
}

.menu-button {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  background: none;
  border: none;
  padding: 12px 10px;
  font-size: 1rem;
  cursor: pointer;
  text-align: left;
  font-weight: 600;
  color: #33475B;
  border-radius: 8px;
  transition: background 0.2s, color 0.2s;
}

.menu-button:hover {
  background: #f0f4ff;
  color: #007ACC;
}

.menu-arrow {
  transition: transform 0.3s ease-in-out;
}
.menu-arrow.rotate {
  transform: rotate(90deg);
}

.submenu {
  list-style: none;
  padding-left: 15px;
  margin-top: 8px;
  margin-left: 5px;
  border-left: 2px solid #00AFFF;
}

.submenu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  background: none;
  border: none;
  padding: 10px;
  font-size: 0.95rem;
  cursor: pointer;
  text-align: left;
  border-radius: 6px;
  color: #5A738E;
  transition: background 0.2s, color 0.2s, font-weight 0.2s;
  font-weight: 500;
}

.submenu-item:hover {
  background: #e6f7ff;
  color: #007ACC;
}

.submenu-item.active {
  color: #007ACC;
  font-weight: 600;
  background: #e6f7ff;
}

.menu-icon {
  width: 18px;
  height: 18px;
}

/* === Khu vực nội dung === */
.content-area {
  flex-grow: 1;
  min-width: 0; 
}
.content-card {
    background-color: #FFFFFF;
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0, 90, 170, 0.08);
    border: 1px solid #D9E2EC;
    padding: 24px;
    min-height: calc(100vh - 90px - 48px);
}

/* FIX: Loại bỏ padding kép từ component con để tránh tràn giao diện */
.content-card :deep(.contest-config-container) {
  padding: 0;
}
.content-card :deep(.ant-card-head) {
  border-bottom: 2px solid #E8EFF5;
  font-size: 1.1rem;
}


.placeholder {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    color: #90A4AE;
    font-size: 1.1rem;
}


/* === RESPONSIVE === */
@media (max-width: 992px) {
  .settings-layout {
    flex-direction: column;
  }
  .sidebar {
    width: 100%;
    position: static;
  }
  .content-area
  {
    width: 100%;
  }
  .content-card {
    min-height: auto;
  }
}

@media (max-width: 576px) {
  .page-wrapper { padding: 15px; }
  .sidebar, .content-card { padding: 15px; }
  .sidebar-title { font-size: 1.3rem; }
}
</style>
