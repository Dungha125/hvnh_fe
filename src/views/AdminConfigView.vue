<template>
  <div class="settings-page">
    <AdminHeader/>
    <div class="page-wrapper">
      <div class="settings-layout">
        <!-- Sidebar điều hướng -->
        <aside class="sidebar">
          <h2 class="sidebar-title">Cấu hình</h2>
          <!-- Cấu hình chung -->
          <div class="menu">
            <button class="menu-button" @click="toggleSection('general')">
              <span>Cấu hình chung</span>
              <RightOutlined class="menu-arrow" :class="{ 'rotate': openSection === 'general' }"/>
            </button>
            <ul v-show="openSection === 'general'" class="submenu">
              <li v-for="item in generalConfig" :key="item.label">
                <button
                    class="submenu-item"
                    :class="{ 'active': activeItem === item.slug }"
                    @click="goto(item.slug)"
                >
                  <img :src="item.icon" alt="icon" class="menu-icon"/>
                  {{ item.label }}
                </button>
              </li>
            </ul>
          </div>

          <!-- Cấu hình học tập -->
          <div class="menu">
            <button class="menu-button" @click="toggleSection('learning')">
              <span>Cấu hình học tập</span>
              <RightOutlined class="menu-arrow" :class="{ 'rotate': openSection === 'learning' }"/>
            </button>
            <ul v-show="openSection === 'learning'" class="submenu">
              <li v-for="item in learningConfig" :key="item.label">
                <button
                    class="submenu-item"
                    :class="{ 'active': activeItem === item.slug }"
                    @click="goto(item.slug)"
                >
                  <img :src="item.icon" alt="icon" class="menu-icon"/>
                  {{ item.label }}
                </button>
              </li>
            </ul>
          </div>
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
import {ref, watchEffect, shallowRef} from 'vue';
import {useRouter, useRoute} from 'vue-router';
import RightOutlined from '@ant-design/icons-vue/RightOutlined';
import AdminHeader from "@/components/AdminHeader.vue";
import AdminContestConfigView from "@/views/AdminContestConfigView.vue";
import AdminSemesterConfigView from '@/views/AdminSemesterConfigView.vue';
import AdminSubjectConfigView from '@/views/AdminSubjectConfigView.vue';
import AdminClassConfigView from '@/views/AdminClassConfigView.vue';
import AdminSystemConfigView from '@/views/AdminSystemConfigView.vue';
import AdminProblemTypeConfigView from '@/views/AdminProblemTypeConfigView.vue';
import AdminProblemTopicConfigView from '@/views/AdminProblemTopicConfigView.vue';
import AdminProblemSubtopicConfigView from '@/views/AdminProblemSubtopicConfigView.vue';
import AdminProblemDifficultConfigView from './AdminProblemDifficultConfigView.vue';
import AdnimCompilerConfigView from './AdminCompilerConfigView.vue';
import AdminJudgeConfigView from './AdminJudgeConfigView.vue';

// Import icon
import bienDich from '../static/img/bien_dich.svg';
import chuDeCon from '../static/img/chu_de_con.svg';
import chuDeBT from '../static/img/chu_de_bt.svg';
import doKho from '../static/img/do_kho.svg';
import heThong from '../static/img/he_thong.svg';
import hocKy from '../static/img/hoc_ky.svg';
import loaiBT from '../static/img/loai_bt.svg';
import lopHoc from '../static/img/lop_hoc.svg';
import mayCham from '../static/img/may_cham.svg';
import monHoc from '../static/img/mon_hoc.svg';
import thucHanh from '../static/img/thuc_hanh.svg';
import { commentProps } from 'ant-design-vue/es/comment';

const openSection = ref(null);
const activeItem = ref(null);
const currentComponent = shallowRef(null); // Lưu component hiển thị

const toggleSection = (section) => {
  openSection.value = openSection.value === section ? null : section;
};

// Vue Router
const router = useRouter();
const route = useRoute();

// Route mapping
const routes = {
  'he-thong': '/admin/system',
  'loai-bai-tap': '/admin/exercise-type',
  'chu-de-bai-tap': '/admin/exercise-topic',
  'chu-de-con-bai-tap': '/admin/exercise-subtopic',
  'do-kho-bai-tap': '/admin/exercise-difficulty',
  'trinh-bien-dich': '/admin/compiler',
  'may-cham': '/admin/judge',
  'hoc-ky': '/admin/semester',
  'mon-hoc': '/admin/subject',
  'lop-hoc': '/admin/class',
  'thuc-hanh': '/admin/contest'
};

// Danh sách menu với icon
const generalConfig = [
  {label: 'Hệ thống', slug: 'he-thong', icon: heThong, component: AdminSystemConfigView},
  {label: 'Loại bài tập', slug: 'loai-bai-tap', icon: loaiBT, component: AdminProblemTypeConfigView},
  {label: 'Chủ đề bài tập', slug: 'chu-de-bai-tap', icon: chuDeBT, component: AdminProblemTopicConfigView},
  {label: 'Chủ đề con bài tập', slug: 'chu-de-con-bai-tap', icon: chuDeCon, component: AdminProblemSubtopicConfigView},
  {label: 'Độ khó bài tập', slug: 'do-kho-bai-tap', icon: doKho, component: AdminProblemDifficultConfigView},
  {label: 'Trình biên dịch', slug: 'trinh-bien-dich', icon: bienDich, component: AdnimCompilerConfigView},
  {label: 'Máy chấm', slug: 'may-cham', icon: mayCham, component: AdminJudgeConfigView}
];

const learningConfig = [
  {label: 'Học kỳ', slug: 'hoc-ky', icon: hocKy, component: AdminSemesterConfigView},
  {label: 'Môn học', slug: 'mon-hoc', icon: monHoc, component: AdminSubjectConfigView},
  {label: 'Lớp học', slug: 'lop-hoc', icon: lopHoc, component: AdminClassConfigView},
  {label: 'Thực hành', slug: 'thuc-hanh', icon: thucHanh, component: AdminContestConfigView
  }
];

// Hàm chuyển trang
const goto = (slug) => {
  // Tìm trong cả 2 config
  const item = learningConfig.find(i => i.slug === slug) || generalConfig.find(i => i.slug === slug);

  if (item?.component) {
    currentComponent.value = item.component; // Hiển thị component nếu có
  } else if (routes[slug]) {
    currentComponent.value = null; // Nếu là route thì xóa component hiện tại
    router.push(routes[slug]);
  }
};


// Cập nhật activeItem khi route thay đổi
watchEffect(() => {
  const currentPath = route.path;
  activeItem.value = Object.keys(routes).find(key => routes[key] === currentPath) || null;
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

.placeholder {
  text-align: center;
  padding: 40px;
  color: #5A738E;
}
</style>
