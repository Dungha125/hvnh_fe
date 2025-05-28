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
	<a-spin :spinning="isLoading">
		<div class="body">
			<div class="part-left">
				<div class="body-header">
					<h2>Danh sách bài tập</h2>
					<div class="underline"></div>
					<div class="problem-container">
						<div v-if="currentCourse">
							<h2 style="color: #A7453C; margin-bottom: 10px">{{ currentCourse?.subject.name }} - Nhóm
								{{ currentCourse?.name }}</h2>
						</div>
						<div style="display: flex; align-items: center ;margin-bottom: 10px;">
							<p style="
								margin-top: 10px;
								font-size: 110%;
								font-weight: bold;
								margin-right: 8px;
								">
								Môn học:
							</p>
							<a-select
							style="width: 45%; margin-top: 10px"
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
							<img src="../static/img/search_icon.svg" alt=""/>
							<a-input v-model:value="searchText"
							         type="text"
							         placeholder="Tìm kiếm theo mã hoặc tiêu đề..."/>
						</div>
						<div class="table-container">
							<a-table
								:row-key="genUuid()"
								:data-source="dataSource"
								:pagination="pagination"
								:loading="loading"
								@change="handleTableChange"
							>
								<a-table-column data-index="code" width="12%">
									<template #title>
										<span style="font-weight: bold">Mã</span>
									</template>

									<template #default="{ record, index }">
										<a @click="navigateToProblem(record.code)"
										   style="cursor: pointer; color: #A7453C;">
											<CheckCircleTwoTone v-if="record.is_solved" two-tone-color="#52c41a"/>
											<CloseCircleTwoTone v-else-if="!record.is_solved && record.is_tried"
											                    two-tone-color="#fc031c"/>
											{{ index + 1 }}
										</a>
									</template>
								</a-table-column>

								<a-table-column width="30%" data-index="title">
									<template #title>
										<span style="font-weight: bold">Tiêu đề</span>
									</template>

									<template #default="{ record }">
										<a @click="navigateToProblem(record.code)"
										   style="cursor: pointer; color: #A7453C;">
											{{ record.title.toUpperCase() }}
										</a>
									</template>
								</a-table-column>

								<a-table-column width="20%" data-index="group">
									<template #title>
										<span style="font-weight: bold">Nhóm</span>
									</template>
								</a-table-column>

								<a-table-column data-index="subTopic">
									<template #title>
										<span style="font-weight: bold">Chủ đề con</span>
									</template>
								</a-table-column>

								<a-table-column width="10%" data-index="difficulty">
									<template #title>
										<span style="font-weight: bold">Độ khó</span>
									</template>
								</a-table-column>

<!--								<a-table-column width="10%" data-index="correct">-->
<!--									<template #title>-->
<!--										<span style="font-weight: bold">Làm đúng</span>-->
<!--									</template>-->
<!--								</a-table-column>-->
							</a-table>
						</div>
					</div>
				</div>
			</div>
			<div class="part-right">
				<!-- <div class="group-icon-container">
					<a-dropdown :arrow="{ pointAtCenter: true }" placement="bottom">
						<a class="ant-dropdown-link" @click.prevent>
							<div class="group-icon">
								<img style="margin-right: 7%" src="../static/img/group_icon.svg">
								<p style="margin-right: 7%; font-size: 100%; margin-bottom: 10px">Nhóm</p>
								<img src="../static/img/dropdown_icon.svg">
							</div>
						</a>
						<template #overlay>
							<a-menu @click="onClick">
								<a-menu-item v-for="group in groupList" :key="group.id">{{ group.name }}</a-menu-item>
							</a-menu>
						</template>
					</a-dropdown>
				</div> -->

				<div class="collapse-options" style="background-color: white !important;">
					<a-collapse v-model:activeKey="activeKey" accordion>
						<a-collapse-panel key="1" header="Độ khó">
							<div class="options-container">
								<a-checkbox-group v-model:value="checkboxListState1.checkedList"
								                  :options="difficulties"/>
							</div>
							<div class="button-group">
								<a-button type="primary" size="small" @click="toggleChecked1">{{
										checkboxListState1.checkAll ? "Bỏ chọn tất cả" : "Chọn tất cả"
									}}
								</a-button>
							</div>
						</a-collapse-panel>
						<a-collapse-panel key="2" header="Chủ đề con">
							<div class="options-container">
								<a-checkbox-group v-model:value="checkboxListState2.checkedList" :options="subTopics"/>
							</div>
							<div class="button-group">
								<a-button type="primary" size="small" @click="toggleChecked2">{{
										checkboxListState2.checkAll ? "Bỏ chọn tất cả" : "Chọn tất cả"
									}}
								</a-button>
							</div>
						</a-collapse-panel>
					</a-collapse>
				</div>
				<div class="next-problems" style="background-color: white !important; margin-top: 2%;">

				<p style="font-weight: 700; font-size: 18px; margin: 2% 0; text-align: center;">Tư vấn tiến trình</p>
				<table class="custom-table" @click="handleTableClick">
					<thead>
					<tr>
						<th>Bài tập</th>
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
		<a-config-provider
			:theme="{
              token: {
                colorPrimary: '#A7453C',
                colorTextHeading: '#000000',
                colorText: '#A7453C',
                colorBorderSecondary: 'rgba(186,151,147,0.45)'
              }
            }"
		/>
	</a-spin>
</template>

<style scoped>
.template
{
	height: 100vh;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
}

.body
{
	display: flex;
	margin-top: 90px;
}

.part-left
{
	width: 80%;
	height: 100%;
}

.body-header
{
	margin-left: 50px;
	display: flex;
	flex-direction: column;
	height: 100%;
}

.body-header h2
{
	font-size: 1.3rem;
	font-weight: 600;
	color: black;
}

.problem-container
{
	margin-top: 20px;
	background-color: rgba(255, 255, 255, 0.35);
	border-radius: 10px;
	box-shadow: 2px 10px 20px rgba(0, 0, 0, 0.2);
	padding: 2%;
	display: flex;
	flex-direction: column;
	height: 100%;
	margin-bottom: 5%;
}

.search-container
{
	display: flex;
	border: 1px solid #cacaca;
	width: 25%;
	height: 40px;
	padding: 10px;
	background-color: #fff;
	border-radius: 10px;
}

.search-container input
{
	margin-left: 3px;
	border: none;
	width: 100%;
	height: 100%;
}

.table-container
{
	margin-top: 20px;
	flex: 1;
}

.search-container input:focus
{
	outline: none;
}

.underline
{
	width: 100%;
	height: 1px;
	margin-top: 5px;
	background-color: #cacaca;
}

.part-right
{
	width: 20%;
	height: 100%;
	display: flex;
	flex-direction: column;
}

.group-icon-container
{
	display: flex;
	align-items: center;
	margin-top: 20px;
	margin-left: 10px;
}

.group-icon
{
	display: flex;
	align-items: center;
	margin-left: 20%;
}

.group-icon
{
	color: rgb(115, 115, 116);
	display: flex;
	align-items: center;
}

.group-icon:hover p
{
	cursor: pointer;
	color: #A7453C;
}

.group-icon:hover img
{
	filter: invert(32%) sepia(64%) saturate(506%) hue-rotate(330deg) brightness(70%) contrast(95%);
}

.group-icon-container p
{
	margin-top: 12px;
}

.collapse-options
{
	margin-left: 5%;
	margin-right: 5%;
}

.next-problems
{
	margin-left: 5%;
	margin-right: 5%;
	padding: 5px;
}



.button-group
{
	margin-top: 15px;
	margin-left: 5px;
}

.custom-table {
  width: 100%;
  border-collapse: collapse;
}

.custom-table td {
  padding: 8px 12px;
  border: 1px solid #f07a7a;
  text-align: left;
  color: #af4747;
}

.custom-table thead
{
	background: #ffe1e1;
	color:#333333 ;
	font-weight: 700;
	text-align: center;
}

.custom-table th
{
	font-weight: 700;
	border: 1px solid #f07a7a;
}

.pointer-row {
  cursor: pointer;
}

.pointer-row:hover {
  background-color: #f5f5f5;
}
</style>
