<script setup>
import Header from '../components/Header.vue';

import {computed, reactive, ref, watch} from 'vue';
import {usePagination} from 'vue-request';
import {onBeforeMount} from "vue";
import {useRouter} from 'vue-router';
import axios from "@/configs/axios.js";
import {CheckCircleTwoTone, CloseCircleTwoTone} from '@ant-design/icons-vue';
import {message} from "ant-design-vue";

const isLoading = ref(true);
const filterData = ref([]);
const activeKey = ref([1]);
const groupList = reactive([]);
const problems = reactive([]);
const difficulties = ref([]);
const subTopics = ref([]);
const router = useRouter();
const currentCourse = ref(null);
const listStudyingCourses = ref([]);
const searchText = ref('')
const totalItems = ref(0);
const sortOrder = ref('asc');
const sortBy = ref('code');

const initialPage = parseInt(localStorage.getItem('currentPage')) || 1;
const initialPageSize = parseInt(localStorage.getItem('pageSize')) || 50;

onBeforeMount(async () =>
{
	const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

	if (currentUser && currentUser.member_group != 1)
	{
		router.push('/not-found');
	}

	try
	{
		const response = await axios.get('courses/studying');
		listStudyingCourses.value = response.data.data;

		if (listStudyingCourses.value.length > 0)
		{
			if (localStorage.getItem('currentCourse'))
			{
				currentCourse.value = JSON.parse(localStorage.getItem('currentCourse'));
			}
			else
			{
				currentCourse.value = listStudyingCourses.value[0];
				localStorage.setItem('currentCourse', JSON.stringify(currentCourse.value));
			}

			listStudyingCourses.value.forEach(course =>
			{
				groupList.push({
					id: course.id,
					name: course?.subject.name + '- Nhóm ' + course.name
				});
			});
			getRecommendedQuestions()
		}
		else
		{
			message.error('Bạn chưa tham gia vào nhóm học nào!');
			isLoading.value = false;
		}
	}
	catch (error)
	{
		console.log(error);
	}
});

const recommendedQuestions = ref([])

const getRecommendedQuestions = async () => {
if (listStudyingCourses.value.length === 0)
		return;
  try {
    // Xây dựng query string chuẩn
    let queryParams = new URLSearchParams();
    queryParams.append('course_id', currentCourse.value.id);
    queryParams.append('page', 1);
    queryParams.append('per_page', 5);
    
    const response = await axios.get(`questions/recommend?${queryParams.toString()}`)
    if (response.data.code === 200) {
      recommendedQuestions.value = response.data.data
    }
  } catch (error) {
    console.error(error)
  }
}


const columns = [
  {
    title: 'Tên',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: 'Level',
    dataIndex: ['question_level', 'name'],
    key: 'level',
  }
]

// Lấy danh sách các mức độ khó và chủ đề con
const fetchFilters = async () => {
  if (listStudyingCourses.value.length === 0) return;
  
  isLoading.value = true;
  filterData.value = [];
  difficulties.value = [];
  subTopics.value = [];
  
  try {
    // Xây dựng query string chuẩn
    let queryParams = new URLSearchParams();
    queryParams.append('page', 1);
    queryParams.append('per_page', 50);
    queryParams.append('order', 'asc');
    queryParams.append('by', 'code');
    queryParams.append('course_id', currentCourse.value.id);
    
    // Lấy tất cả dữ liệu để trích xuất bộ lọc
    const response = await axios.get(`questions?${queryParams.toString()}`);
    const listProblems = response.data.data;
    let subGroup = new Set();
    let difficultySet = new Set();
    
    listProblems.forEach(problem => {
      if (problem.sub_group?.name) {
        subGroup.add(problem.sub_group?.name);
      }
      if (problem.question_level?.name) {
        difficultySet.add(problem.question_level?.name);
      }
    });
    
    subGroup.forEach(subTopic => {
      filterData.value.push({
        text: subTopic,
        value: subTopic
      });
    });
    
    difficulties.value = Array.from(difficultySet);
    difficulties.value.sort((a, b) => a.localeCompare(b));
    
    subTopics.value = Array.from(subGroup);
    subTopics.value.sort((a, b) => a.localeCompare(b));
    
    checkboxListState1.checkedList = [...difficulties.value];
    checkboxListState1.indeterminate = false;
    checkboxListState1.checkAll = true;
    
    checkboxListState2.checkedList = [...subTopics.value];
    checkboxListState2.indeterminate = false;
    checkboxListState2.checkAll = true;
  } catch (error) {
    console.log(error);
  }
  
  isLoading.value = false;
};

// Lấy danh sách bài tập với phân trang
const queryData = async (params) => {
  const { page = 1, results = 50 } = params || {};
  
  if (listStudyingCourses.value.length === 0) return [];
  
  problems.splice(0, problems.length);
  isLoading.value = true;
  
  try {
    const selectedDifficulties = checkboxListState1.checkedList;
    const selectedSubTopics = checkboxListState2.checkedList;
    
    // Xây dựng query string
    let queryParams = new URLSearchParams();
    queryParams.append('page', page);
    queryParams.append('per_page', results);
    queryParams.append('order', sortOrder.value);
    queryParams.append('by', sortBy.value);
    queryParams.append('course_id', currentCourse.value.id);
    
    // Thêm tham số tìm kiếm nếu có
    if (searchText.value.trim()) {
      queryParams.append('s', searchText.value.trim());
    }
    
    // Thêm bộ lọc nếu có
    if (selectedDifficulties.length > 0 && selectedDifficulties.length < difficulties.value.length) {
      queryParams.append('difficulties', selectedDifficulties.join(','));
    }
    
    if (selectedSubTopics.length > 0 && selectedSubTopics.length < subTopics.value.length) {
      queryParams.append('sub_topics', selectedSubTopics.join(','));
    }
    
    const response = await axios.get(`questions?${queryParams.toString()}`);
    const listProblems = response.data.data;
    totalItems.value = response.data.meta?.total || listProblems.length;
    
    return listProblems.map(problem => ({
      code: problem.code,
      title: problem.name,
      group: problem.group?.name,
      subTopic: problem.sub_group?.name,
      difficulty: problem.question_level?.name,
      correct: problem.ac_user_count,
      is_solved: problem.is_solved,
      is_tried: problem.is_tried
    }));
  } catch (error) {
    console.log(error);
    return [];
  } finally {
    isLoading.value = false;
  }
};

const checkboxListState1 = reactive({
	indeterminate: true,
	checkAll: false,
	checkedList: [],
});

const checkboxListState2 = reactive({
	indeterminate: true,
	checkAll: false,
	checkedList: [],
});

const toggleChecked1 = () =>
{
	if (checkboxListState1.checkedList.length === difficulties.value.length)
	{
		checkboxListState1.checkedList = [];
		checkboxListState1.indeterminate = false;
		checkboxListState1.checkAll = false;
	}
	else
	{
		checkboxListState1.checkedList = [...difficulties.value];
		checkboxListState1.indeterminate = false;
		checkboxListState1.checkAll = true;
	}
};

const toggleChecked2 = () =>
{
	if (checkboxListState2.checkedList.length === subTopics.value.length)
	{
		checkboxListState2.checkedList = [];
		checkboxListState2.indeterminate = false;
		checkboxListState2.checkAll = false;
	}
	else
	{
		checkboxListState2.checkedList = [...subTopics.value];
		checkboxListState2.indeterminate = false;
		checkboxListState2.checkAll = true;
	}
};

const {data: dataSource, run, loading, current, pageSize} = usePagination(queryData, {
	defaultParams: [{
		page: initialPage,
		results: initialPageSize,
	}],
	formatResult: res => Array.isArray(res) ? res : [],
	pagination: {
		currentKey: 'page',
		pageSizeKey: 'results',
	},
});

const pagination = computed(() => ({
  total: totalItems.value,
  current: current.value,
  pageSize: pageSize.value,
}));

const genUuid = () =>
{
	return Math.random().toString(36).substring(7);
};

const handleTableChange = (pag, filters, sorter) =>
{
  if (sorter && sorter.field) {
    sortBy.value = sorter.field === 'difficulty' ? 'level' : 
                  sorter.field === 'title' ? 'name' : sorter.field;
    sortOrder.value = sorter.order === 'ascend' ? 'asc' : 'desc';
  }
  
	run({
		results: pag.pageSize,
		page: pag?.current,
	});
};

const handleCourseSelect = (courseId) => {
  currentCourse.value = listStudyingCourses.value.find(course => course.id === courseId);
  localStorage.setItem('currentCourse', JSON.stringify(currentCourse.value));
  fetchFilters().then(() => run({ page: 1 }));
};

const navigateToProblem = code =>
{
	router.push(`/problems/${code}`);
};

watch(currentCourse, async () =>
{
	await fetchFilters();
	run({ page: 1 });
});

watch([() => checkboxListState1.checkedList, () => checkboxListState2.checkedList], () =>
{
	run({ page: 1 });
});

watch(() => checkboxListState1.checkedList, (newVal) =>
{
	const allChecked = newVal.length === difficulties.value.length;
	const noneChecked = newVal.length === 0;
	checkboxListState1.indeterminate = !allChecked && !noneChecked;
	checkboxListState1.checkAll = allChecked;
});

watch(() => checkboxListState2.checkedList, (newVal) =>
{
	const allChecked = newVal.length === subTopics.value.length;
	const noneChecked = newVal.length === 0;
	checkboxListState2.indeterminate = !allChecked && !noneChecked;
	checkboxListState2.checkAll = allChecked;
});

watch(searchText, () =>
{
	run({ page: 1 });
});

watch(current, (newPage) =>
{
	localStorage.setItem('currentPage', newPage);
});

watch(pageSize, (newSize) =>
{
	current.value = 1;
	localStorage.setItem('pageSize', newSize);
});
</script>

<template>
  <Header/>
  <a-config-provider
    :theme="{
      token: {
        colorPrimary: '#00AFFF', /* Main accent color */
        colorLink: '#007ACC',     /* Darker accent for links on light bg */
        colorLinkHover: '#005C9E',/* Even darker for hover */
        colorText: '#2c3e50',     /* Dark grey for main text */
        colorTextSecondary: '#5A738E', /* Lighter dark grey for secondary text */
        colorTextHeading: '#1A2B3C', /* Very dark grey/off-black for headings */
        colorBgContainer: '#FFFFFF', /* Default background for components */
        colorBgElevated: '#FFFFFF',  /* Background for popovers, dropdowns */
        colorBorder: '#D9E2EC',      /* Light grey for borders */
        colorBorderSecondary: '#E8EFF5', /* Lighter grey for secondary borders (e.g., table cell lines) */
        controlItemBgActive: 'rgba(0, 175, 255, 0.1)', /* Light accent for active items */
        controlItemBgHover: 'rgba(0, 175, 255, 0.05)',/* Very light accent for hover */
      }
    }"
  >
    <a-spin :spinning="isLoading">
      <div class="body-wrapper">
        <div class="part-left">
          <div class="body-header">
            <h2>Danh sách bài tập</h2>
            <div class="underline"></div>
            <div class="problem-container">
              <div v-if="currentCourse">
                <h2 class="course-title">{{ currentCourse?.subject.name }} - Nhóm {{ currentCourse?.name }}</h2>
              </div>
              <div class="course-select-wrapper">
                <p class="course-select-label">Môn học:</p>
                <a-select
                  style="width: 45%;"
                  placeholder="Chọn khóa học"
                  :value="currentCourse?.id"
                  @change="handleCourseSelect"
                  :dropdownMatchSelectWidth="false"
                >
                  <a-select-option
                    v-for="course in listStudyingCourses"
                    :key="course.id"
                    :value="course.id"
                  >
                    {{ course.subject.name }} - Nhóm {{ course.name }}
                  </a-select-option>
                </a-select>
              </div>
              <div class="search-container">
                <img src="../static/img/search_icon.svg" alt="Search" class="search-icon"/>
                <a-input v-model:value="searchText"
                         type="text"
                         placeholder="Tìm kiếm theo mã hoặc tiêu đề..."/>
              </div>
              <div class="table-container">
                <a-table
                  :row-key="record => record.id || genUuid()"
                  :data-source="dataSource"
                  :pagination="pagination"
                  :loading="loading"
                  @change="handleTableChange"
                >
                  <a-table-column data-index="code" width="12%">
                    <template #title>
                      <span class="table-header-title">Mã</span>
                    </template>
                    <template #default="{ record, index }">
                      <a @click="navigateToProblem(record.code)" class="table-link">
                        <CheckCircleTwoTone v-if="record.is_solved" two-tone-color="#52c41a"/>
                        <CloseCircleTwoTone v-else-if="!record.is_solved && record.is_tried"
                                            two-tone-color="#ff4d4f"/>
                        {{ index + 1 }}
                      </a>
                    </template>
                  </a-table-column>

                  <a-table-column width="30%" data-index="title">
                    <template #title>
                      <span class="table-header-title">Tiêu đề</span>
                    </template>
                    <template #default="{ record }">
                      <a @click="navigateToProblem(record.code)" class="table-link">
                        {{ record.title.toUpperCase() }}
                      </a>
                    </template>
                  </a-table-column>

                  <a-table-column width="20%" data-index="group">
                     <template #title>
                      <span class="table-header-title">Nhóm</span>
                    </template>
                  </a-table-column>

                  <a-table-column data-index="subTopic">
                     <template #title>
                      <span class="table-header-title">Chủ đề con</span>
                    </template>
                  </a-table-column>

                  <a-table-column width="10%" data-index="difficulty">
                     <template #title>
                      <span class="table-header-title">Độ khó</span>
                    </template>
                  </a-table-column>
                </a-table>
              </div>
            </div>
          </div>
        </div>
        <div class="part-right">
          <div class="collapse-options">
            <a-collapse v-model:activeKey="activeKey" accordion>
              <a-collapse-panel key="1" header="ĐỘ KHÓ">
                <div class="options-container">
                  <a-checkbox-group v-model:value="checkboxListState1.checkedList"
                                    :options="difficulties"/>
                </div>
                <div class="button-group">
                  <a-button type="primary" size="small" @click="toggleChecked1">
                    {{ checkboxListState1.checkAll ? "Bỏ chọn tất cả" : "Chọn tất cả" }}
                  </a-button>
                </div>
              </a-collapse-panel>
              <a-collapse-panel key="2" header="CHỦ ĐỀ CON">
                <div class="options-container">
                  <a-checkbox-group v-model:value="checkboxListState2.checkedList" :options="subTopics"/>
                </div>
                <div class="button-group">
                  <a-button type="primary" size="small" @click="toggleChecked2">
                    {{ checkboxListState2.checkAll ? "Bỏ chọn tất cả" : "Chọn tất cả" }}
                  </a-button>
                </div>
              </a-collapse-panel>
            </a-collapse>
          </div>
          <div class="next-problems">
            <p class="next-problems-title">TƯ VẤN TIẾN TRÌNH</p>
            <table class="custom-table">
              <thead>
              <tr>
                <th>BÀI TẬP</th>
              </tr>
              </thead>
              <tbody>
              <tr
                v-for="record in recommendedQuestions"
                :key="record.id"
                class="pointer-row"
                @click="navigateToProblem(record.code)"
              >
                <td>{{ record.name }}</td>
              </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </a-spin>
  </a-config-provider>
</template>

<style scoped>

.body-wrapper {
  display: flex;
  margin-top: 90px;
  min-height: calc(100vh - 90px);
  color: #2c3e50; /* Default dark text color */
  padding: 20px;
  gap: 20px;
}

.part-left {
  width: 78%;
  height: 100%;
}

.body-header {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.body-header > h2 { /* Main page title "Danh sách bài tập" */
  font-size: 1.8rem;
  font-weight: 700;
  color: #007ACC; /* Darker accent blue for titles on light bg */
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
  /* text-shadow: 0 0 5px rgba(0, 175, 255, 0.3); Removed for light theme */
}

.underline {
  width: 100%;
  height: 2px;
  margin-top: 5px;
  background: linear-gradient(90deg, #00AFFF, #B3E5FC); /* Accent to light accent */
  margin-bottom: 25px;
}

.problem-container {
  margin-top: 10px;
  background-color: #FFFFFF; /* White card background */
  border-radius: 10px;
  border: 1px solid #D9E2EC; /* Light grey border */
  box-shadow: 0 4px 15px rgba(0, 90, 170, 0.08); /* Subtle cool shadow */
  padding: 25px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.course-title {
  color: #006BB3; /* Darker accent for course name */
  margin-bottom: 15px;
  font-size: 1.4rem;
  font-weight: 600;
  letter-spacing: 0.03em;
}

.course-select-wrapper {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.course-select-label {
  margin-top: 0;
  font-size: 1rem;
  font-weight: bold;
  color: #4A5C6D; /* Darker grey for labels */
  margin-right: 12px;
  margin-bottom: 0;
}

.search-container {
  display: flex;
  align-items: center;
  border: 1px solid #B0C4DE; /* Light grey-blue border */
  width: 35%;
  height: 38px;
  padding: 0 12px;
  background-color: #FFFFFF; /* White background */
  border-radius: 8px;
  margin-bottom: 20px;
}
.search-container:focus-within {
  border-color: #00AFFF; /* Accent blue on focus */
  box-shadow: 0 0 0 2px rgba(0, 175, 255, 0.2); /* Subtle focus ring */
}

.search-icon {
  margin-right: 8px;
  width: 16px;
  height: 16px;
  /* Assuming original SVG is black/dark. This filter makes it a dark blue. */
  /* If original is black & you want black, use filter:none or filter: brightness(0.2) */
  filter: brightness(0) saturate(100%) invert(29%) sepia(97%) saturate(1508%) hue-rotate(181deg) brightness(97%) contrast(101%); /* Makes it #0072C6 */
}

.search-container input {
  margin-left: 3px;
  border: none;
  width: 100%;
  height: 100%;
  background-color: transparent;
  color: #2c3e50; /* Dark text color */
  font-size: 0.95rem;
}

.search-container input::placeholder {
  color: #90A4AE; /* Lighter grey for placeholder */
}

.search-container input:focus {
  outline: none;
}

.table-container {
  margin-top: 10px;
  flex: 1;
}


.table-header-title {
  font-weight: bold;
  color: #007ACC; /* Darker accent blue for table headers */
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.table-link {
  cursor: pointer;
  color: #007ACC; /* Darker accent blue for links */
  transition: color 0.3s ease;
  font-weight: 500;
}
.table-link:hover {
  color: #005C9E; /* Even darker on hover */
}
.table-link .anticon {
  margin-right: 6px;
  font-size: 1.1em;
}

.part-right {
  width: 22%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.collapse-options, .next-problems {
  background-color: #FFFFFF; /* White background */
  border-radius: 10px;
  padding: 15px;
  border: 1px solid #D9E2EC; /* Light grey border */
  box-shadow: 0 3px 10px rgba(0, 91, 170, 0.07); /* Subtle cool shadow */
}

/* Override Ant Collapse styles for light theme */
:global(.ant-collapse) {
  background-color: transparent; /* Handled by .collapse-options bg */
  border-color: #D9E2EC;
}
:global(.ant-collapse > .ant-collapse-item) {
   border-bottom-color: #E8EFF5; /* Lighter separator */
}
:global(.ant-collapse > .ant-collapse-item:last-child) {
   border-bottom: none;
}
:global(.ant-collapse > .ant-collapse-item > .ant-collapse-header) {
  color: #007ACC; /* Dark accent for header text */
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
:global(.ant-collapse-content) {
  background-color: transparent; /* Content background */
  color: #33475B; /* Dark text for content */
  border-top-color: #E8EFF5;
}
:global(.ant-collapse-content > .ant-collapse-content-box) {
  padding-top: 15px;
  padding-bottom: 10px;
}

/* Override Ant Checkbox styles for light theme */
:global(.ant-checkbox-wrapper) {
  color: #33475B; /* Checkbox label color */
}
/* Hover/focus/checked states are mostly handled by a-config-provider's colorPrimary */

.options-container {
  max-height: 150px;
  overflow-y: auto;
  padding-right: 10px; /* Space for scrollbar */
}
/* Custom scrollbar for options container - light theme */
.options-container::-webkit-scrollbar {
  width: 8px;
}
.options-container::-webkit-scrollbar-track {
  background: #E8EFF5;
  border-radius: 4px;
}
.options-container::-webkit-scrollbar-thumb {
  background: #B0C4DE; /* Light grey-blue thumb */
  border-radius: 4px;
}
.options-container::-webkit-scrollbar-thumb:hover {
  background: #007ACC; /* Dark accent blue on hover */
}

.button-group {
  margin-top: 15px;
  text-align: right;
}
.button-group .ant-btn-primary {
  background: linear-gradient(90deg, #007ACC, #00AFFF); /* Blue gradient */
  border: none;
  box-shadow: 0 2px 8px rgba(0, 122, 204, 0.3);
  color: white; /* Ensure text is white */
}
.button-group .ant-btn-primary:hover {
  background: linear-gradient(90deg, #0088DD, #33CFFF);
  box-shadow: 0 4px 12px rgba(0, 136, 221, 0.4);
}

.next-problems-title {
  font-weight: 700;
  font-size: 1.1rem;
  margin: 0 0 15px 0;
  text-align: center;
  color: #007ACC; /* Dark accent blue */
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.custom-table {
  width: 100%;
  border-collapse: collapse;
}

.custom-table td, .custom-table th {
  padding: 10px 12px;
  border: 1px solid #D0E0F0; /* Light blue-grey border */
  text-align: left;
}

.custom-table th {
  background: #EBF4FA; /* Very light blue header background */
  color: #006BB3; /* Dark accent blue for header text */
  font-weight: 700;
  text-align: center;
  text-transform: uppercase;
}
.custom-table td {
  color: #33475B; /* Dark grey-blue for table data */
}

.pointer-row {
  cursor: pointer;
}

.pointer-row:hover {
  background-color: #E6F7FF; /* Very light accent hover (Ant default light blue) */
}
.pointer-row:hover td {
  color: #005C9E; /* Darker accent text on hover */
}

/* Ant Table Overrides for Neo-Futuristic light theme */
:global(.ant-table) {
  background: transparent; /* Table wrapper background */
}
:global(.ant-table-thead > tr > th) {
  background-color: #F0F5FA !important; /* Light header background for Ant Table */
  border-bottom: 1px solid #D9E2EC !important; /* Border from config */
  color: #007ACC !important; /* Header text color from .table-header-title or direct */
}
:global(.ant-table-tbody > tr > td) {
  border-bottom: 1px solid #E8EFF5 !important; /* Row separator from config */
  color: #33475B; /* Text color */
}
:global(.ant-table-tbody > tr.ant-table-row:hover > td) {
  background: #E6F7FF !important; /* Row hover background (Ant default light blue) */
}

/* Ant Pagination for light theme - relies heavily on a-config-provider */
:global(.ant-pagination-item a) {
  color: #5A738E; /* Default item color */
}
/* Active & hover states handled by colorPrimary from config provider */
:global(.ant-pagination-disabled .ant-pagination-item-link) {
   color: #B0C4DE !important; /* Disabled color */
}

/* Ant Select Dropdown for light theme - relies heavily on a-config-provider */
:global(.ant-select-selector) {
    background-color: #FFFFFF !important; /* Ensure select bg is white */
    border-color: #D9E2EC !important; /* Default border from config */
}
:global(.ant-select-focused .ant-select-selector),
:global(.ant-select-selector:focus),
:global(.ant-select-selector:hover) {
    border-color: #00AFFF !important; /* Accent color on hover/focus */
}
:global(.ant-select-arrow) {
    color: #5A738E !important; /* Default arrow color */
}
:global(.ant-select-focused .ant-select-arrow) {
    color: #00AFFF !important;
}


/* Ant Spin - colorPrimary from config provider should style this */
:global(.ant-spin-dot-item) {
  background-color: #00AFFF; /* Explicitly set if needed */
}
</style>