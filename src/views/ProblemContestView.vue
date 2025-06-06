<script setup>
import {computed, reactive, ref, watch, watchEffect} from 'vue';
import {usePagination} from 'vue-request';
import {onBeforeMount} from "vue";
import {useRouter} from 'vue-router';
import axios from "@/configs/axios.js";
import {CheckCircleTwoTone, CloseCircleTwoTone} from '@ant-design/icons-vue';
import {message} from "ant-design-vue";
import HeaderContest from '@/components/HeaderContest.vue';

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
const countdown = ref('')

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

const fetchProblems = async () =>
{
	if (listStudyingCourses.value.length === 0)
		return;

	isLoading.value = true;
	problems.splice(0, problems.length);
	filterData.value.splice(0, filterData.value.length);
	difficulties.value.splice(0, difficulties.value.length);
	subTopics.value.splice(0, subTopics.value.length);

	try
	{
		const response = await axios.get(`contests/${contestId}/question`);
		const listProblems = response.data.data.questions;
		let subGroup = new Set();

		listProblems.forEach((problem, index) =>
		{
			problems.push({
				index: index + 1,
				code: problem.code,
				id: problem.id,
				title: problem.name,
				group: problem.group?.name,
				subTopic: problem.sub_group?.name,
				difficulty: problem.question_level?.name,
				correct: problem.ac_user_count,
				is_solved: problem.is_ac,
				is_tried: problem.is_tried
			});

			if (problem.sub_group?.name)
			{
				subGroup.add(problem.sub_group?.name);
			}
		});

		subGroup.forEach(subTopic =>
		{
			filterData.value.push({
				text: subTopic,
				value: subTopic
			});
		});

		difficulties.value = Array.from(new Set(problems
			.map(problem => problem?.difficulty)
			.filter(difficulty => difficulty != null)));
		difficulties.value.sort((a, b) => a.localeCompare(b));

		subTopics.value = Array.from(new Set(problems
			.map(problem => problem?.subTopic)
			.filter(subTopic => subTopic != null)));
		subTopics.value.sort((a, b) => a.localeCompare(b));

		checkboxListState1.checkedList = [...difficulties.value];
		checkboxListState1.indeterminate = false;
		checkboxListState1.checkAll = true;

		checkboxListState2.checkedList = [...subTopics.value];
		checkboxListState2.indeterminate = false;
		checkboxListState2.checkAll = true;

		problems.sort((a, b) =>
		{
			return a.index.localeCompare(b.index);
		});
	}
	catch (error)
	{
		console.log(error);
	}

	isLoading.value = false;
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

const queryData = async (params) =>
{
	const selectedDifficulties = checkboxListState1.checkedList;
	const selectedSubTopics = checkboxListState2.checkedList;

	let filteredProblems = problems;

	if (selectedDifficulties.length > 0)
	{
		filteredProblems = filteredProblems.filter(problem => selectedDifficulties.includes(problem.difficulty));
	}

	if (selectedSubTopics.length > 0)
	{
		filteredProblems = filteredProblems.filter(problem => selectedSubTopics.includes(problem.subTopic));
	}

	if (searchText.value.trim())
	{
		const searchLower = searchText.value.toLowerCase();
		filteredProblems = filteredProblems.filter(problem =>
			problem.code.toLowerCase().includes(searchLower) ||
			problem.title.toLowerCase().includes(searchLower)
		);
	}

	return filteredProblems;
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
	total: queryData().length,
	current: current.value,
	pageSize: pageSize.value,
}));

const genUuid = () =>
{
	return Math.random().toString(36).substring(7);
};

const handleTableChange = (pag, filters, sorter) =>
{
	run({
		results: pag.pageSize,
		page: pag?.current,
		sortField: sorter.field,
		sortOrder: sorter.order,
		...filters,
	});
};

const onClick = ({key}) =>
{
	currentCourse.value = listStudyingCourses.value.find(course => course.id === key);
	localStorage.setItem('currentCourse', JSON.stringify(currentCourse.value));
	run();
};
const User = JSON.parse(localStorage.getItem('user'));
const contestId = sessionStorage.getItem('contest_id');
if (!contestId) {
  message.error('Vui lòng bấm nút tiếp tục');
  router.push('/');
}

const navigateToProblem = code =>
{
	router.push(`/contest/problems/${code}`);
};

watch(currentCourse, async () =>
{
	await fetchProblems();
	run();
});

watch([() => checkboxListState1.checkedList, () => checkboxListState2.checkedList], () =>
{
	run();
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
	run();
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



const getCountdown = () => {
  const now = new Date();
  const start = new Date(sessionStorage.getItem('start_time'));
  const end = new Date(sessionStorage.getItem('finish_time'))
  if (now >= end) return 'End Contest';

  const diff = Math.floor((end - now) / 1000);
  const days = Math.floor(diff / 86400);
  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;

  return `${days.toString().padStart(2,'0')}:${hours.toString().padStart(2, '0')}:${minutes.toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

watchEffect(() => {
	setInterval(() => {
  countdown.value = getCountdown();
	}, 1000);
});



</script>

<template>
	<HeaderContest/>
	
	<a-spin :spinning="isLoading">
		<div class="body">
				
				<div class="body-header">
				<div class="countdown-time-test">
					<h2 style="color: #a71d1d; font-size:36px">{{User.last_name}} {{ User.first_name }} ({{ User.username }}) {{countdown}}</h2>
				</div>
				<div class="underline"></div>
					<h2>Thực hành</h2>
					<div class="underline"></div>
					<div class="problem-container">
						<div class="table-container">
							<a-table
								:row-key="genUuid()"
								:data-source="dataSource"
								:pagination="pagination"
								:loading="loading"
							
								@change="handleTableChange"
							>
								<a-table-column data-index="code" width="10%">
									<template #title>
										<span style="font-weight: bold">STT</span>
									</template>

									<template #default="{ record }">
										<a @click="navigateToProblem(record.id)"
										   style="cursor: pointer; color: #909090;">
											<CheckCircleTwoTone v-if="record.is_solved" two-tone-color="#52c41a"/>
											<CloseCircleTwoTone v-else-if="!record.is_solved && record.is_tried"
											                    two-tone-color="#fc031c"
											/>
											{{ record.index }}
										</a>
									</template>
								</a-table-column>

								<a-table-column width="auto" data-index="title" align="left">
									<template #title>
										<span style="font-weight: bold;">Tiêu đề</span>
									</template>

									<template #default="{ record }" >
										<a @click="navigateToProblem(record.id)"
										   style="cursor: pointer; color: #A7453C; font-weight: medium; "
										   onmouseover="this.style.textDecoration='underline'" 
      										onmouseout="this.style.textDecoration='none'">
											{{ record.title.toUpperCase() }}
										</a>
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
.template {
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.body {
  display: flex;
  /* Using gap for clean spacing between left and right parts */
  gap: 24px;
  /* Using padding on the body for overall spacing is more flexible than margin on children */
  padding: 24px 40px;
  margin-top: 70px; /* Assuming a fixed header of ~70px */
  width: 100%;
  background-color: #F5F7FA; /* THEMED: Base page background */
  color: #2c3e50;          /* THEMED: Default text color */
}

.part-left {
  width: 78%; /* Adjusted width to account for gap */
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px; /* Space between header/content blocks inside */
}

.part-right {
  width: 22%; /* Adjusted width to account for gap */
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px; /* Consistent spacing for items in the right column */
}

/* === Urgent Countdown Timer === */
.countdown-time-test {
  position: sticky;
  top: 70px; /* Sticks below the main header */
  z-index: 900;
  width: 100%;
  background-color: #FFF1F0; /* THEMED: Ant Design error background */
  color: #cf1322; /* THEMED: Strong red for urgency */
  font-weight: 700; /* Bolder for emphasis */
  text-align: center;
  padding: 8px;
  border-radius: 8px;
  border: 1px solid #ffccc7;
  letter-spacing: 0.05em;
  /* Subtle pulse animation to draw attention */
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(207, 19, 34, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(207, 19, 34, 0); }
  100% { box-shadow: 0 0 0 0 rgba(207, 19, 34, 0); }
}

/* === Page Header & Titles === */

.body-header {
  /* Removed fixed margins, handled by parent padding now */
  width: 100%;
  display: flex;
  flex-direction: column;
  height: auto; /* Let it size to content */
}

.body-header h2 {
  font-size: 1.6rem; /* Slightly larger for more impact */
  font-weight: 700;
  color: #007ACC; /* THEMED: Darker accent blue */
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.underline {
  width: 100%;
  height: 2px;
  margin-top: 8px;
  /* THEMED: Accent gradient for a more futuristic feel */
  background: linear-gradient(90deg, #00AFFF, #B3E5FC);
}

/* === Reusable Card Style === */
/* Applied to .problem-container and any other similar panels */
.problem-container {
  margin-top: 0; /* Handled by parent gap */
  background-color: #FFFFFF;
  border-radius: 12px; /* Slightly more rounded */
  box-shadow: 0 4px 15px rgba(0, 90, 170, 0.08); /* THEMED: Subtle, cool shadow */
  border: 1px solid #D9E2EC; /* THEMED: Light grey border */
  padding: 24px;
  display: flex;
  flex-direction: column;
  height: 100%;
  margin-bottom: 0; /* Handled by parent gap */
}

.table-container {
  margin-top: 20px;
  flex: 1;
}

/* === Modern Search Input === */

.search-container {
  display: flex;
  align-items: center;
  border: 1px solid #D9E2EC; /* THEMED: Standard border */
  width: 35%; /* Adjusted for better proportion */
  height: 40px;
  padding: 0 12px;
  background-color: #fff;
  border-radius: 8px;
  transition: border-color 0.3s, box-shadow 0.3s;
}
.search-container:focus-within {
  border-color: #00AFFF;
  box-shadow: 0 0 0 3px rgba(0, 175, 255, 0.15); /* Glowing effect */
}

.search-container input {
  margin-left: 3px;
  border: none;
  width: 100%;
  height: 100%;
  background: transparent;
  color: #2c3e50;
}

.search-container input:focus {
  outline: none;
}
.search-container input::placeholder {
  color: #90A4AE;
}

/* === Custom Icon Buttons === */

.group-icon-container {
  display: flex;
  align-items: center;
  margin-top: 0; /* Handled by parent gap */
  margin-left: 0; /* Handled by parent gap/padding */
}

.group-icon {
  display: flex;
  align-items: center;
  gap: 8px; /* Use gap for spacing icon and text */
  color: #5A738E; /* THEMED: Default text color */
  cursor: pointer;
  transition: color 0.3s ease;
}

.group-icon p {
  margin: 0 !important; /* Override other margin rules */
  font-weight: 600;
}

.group-icon img {
  filter: opacity(0.7);
  transition: filter 0.3s ease;
}

.group-icon:hover, .group-icon:hover p {
  color: #00AFFF; /* THEMED: Vibrant accent blue on hover */
}

.group-icon:hover img {
  /* THEMED: Filter for #00AFFF (Vibrant Accent Blue) */
  filter: brightness(0) saturate(100%) invert(72%) sepia(99%) saturate(4463%) hue-rotate(165deg) brightness(102%) contrast(104%);
}

/* === Right Column Wrappers === */

.collapse-options {
  /* Removed specific margins, assuming parent .part-right has a 'gap' */
  margin: 0;
  width: 100%;
}

.button-group {
  margin-top: 15px;
  /* Removed margin-left, prefer text-align or flexbox for alignment */
  text-align: right;
}
</style>
