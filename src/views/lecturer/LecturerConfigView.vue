<template>
  <LecturerHeader/>
  <div class="container">
    <div class="sidebar" style="margin-top: 70px">
      <h2 class="title">Cấu hình</h2>
      <div class="side-bar">
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


import lopHoc from '../../static/img/lop_hoc.svg';
import thucHanh from '../../static/img/thuc_hanh.svg';
import LecturerHeader from "@/components/LecturerHeader.vue";
import LecturerContestConfigView from "@/views/lecturer/LecturerContestConfigView.vue";
import LecturerClassConfigView from "@/views/lecturer/LecturerClassConfigView.vue";

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
  'lop-hoc': '/lecturer/class',
  'thuc-hanh': '/lecturer/contest'
};


const learningConfig = [
  {label: 'Lớp học', slug: 'lop-hoc', icon: lopHoc, component: LecturerClassConfigView},
  {label: 'Thực hành', slug: 'thuc-hanh', icon: thucHanh, component: LecturerContestConfigView}
];

// Hàm chuyển trang
const goto = (slug) => {
  const item = learningConfig.find(i => i.slug === slug);

  // Nếu có component, hiển thị component đó
  if (item?.component) {
    currentComponent.value = item.component;
  } else if (routes[slug]) {
    currentComponent.value = null; // Nếu là route thì xóa component hiện tại
    router.push(routes[slug]);
  }

  // Lưu slug vào localStorage để duy trì trạng thái
  localStorage.setItem('selectedSlug', slug);
};
const selectedSlug = localStorage.getItem('selectedSlug'); // Lấy slug đã lưu từ localStorage
if (selectedSlug) {
  const item = learningConfig.find(i => i.slug === selectedSlug);
  if (item) {
    currentComponent.value = item.component;
  }
}

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
