<template>
  <AdminHeader/>
  <div class="container">
    <div class="sidebar" style="margin-top: 70px">
      <h2 class="title">Cấu hình</h2>
      <div class="side-bar">
        <!-- Cấu hình chung -->
        <div class="menu">
          <button class="menu-button" @click="toggleSection('general')">
            Cấu hình chung
            <RightOutlined :class="{ 'rotate': openSection === 'general' }"/>
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
            Cấu hình học tập
            <RightOutlined :class="{ 'rotate': openSection === 'learning' }"/>
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
      </div>
    </div>
    <!-- Nội dung hiển thị -->
    <div class="content">
      <component v-if="currentComponent" :is="currentComponent"/>
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
import AdnimCompilerConfigView from './AdnimCompilerConfigView.vue';
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

.title {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 15px;
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
  padding: 10px;
  font-size: 16px;
  cursor: pointer;
  text-align: left;
  font-weight: 500;
  border-radius: 8px;
  transition: background 0.3s, color 0.3s;
}

.menu-button:hover {
  background: #f0f4ff;
  color: #0056b3;
}

.submenu {
  list-style: none;
  padding-left: 20px;
  border-left: 3px solid #007bff;
  margin-top: 5px;
}

.submenu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  background: none;
  border: none;
  padding: 10px;
  font-size: 14px;
  cursor: pointer;
  text-align: left;
  border-radius: 6px;
  transition: background 0.3s, color 0.3s;
}

.submenu-item:hover {
  background: #e3f2fd;
  color: #007bff;
}

.active {
  color: #007bff;
  font-weight: bold;
  background: #e3f2fd;
}

.menu-icon {
  width: 20px;
  height: 20px;
}

.rotate {
  transform: rotate(90deg);
  transition: transform 0.3s ease-in-out;
}
.container {
  display: flex;
  height: 100vh;
}

.sidebar {
  width: 280px;
  background: #ffffff;
  padding: 20px;
  border-right: 2px solid #e0e0e0;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
}

.content {
  flex-grow: 1;
  margin: 100px 20px;
  overflow-y: auto;
}
</style>
