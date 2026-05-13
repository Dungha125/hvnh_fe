<script setup>

import {computed, reactive, ref, watch, onUnmounted, onBeforeMount} from 'vue';
import {useRouter} from 'vue-router';
import axios from "@/configs/axios.js";
import {CheckCircleTwoTone, CloseCircleTwoTone} from '@ant-design/icons-vue';
import {message} from "ant-design-vue";
import HeaderContestLecturer from '@/components/HeaderContestLecturer.vue';

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
	if (!contestId) {
		message.error('Không tìm thấy thông tin contest!');
		return;
	}

	isLoading.value = true;
	problems.splice(0, problems.length);
	filterData.value.splice(0, filterData.value.length);
	difficulties.value.splice(0, difficulties.value.length);
	subTopics.value.splice(0, subTopics.value.length);

	try
	{
		const response = await axios.get(`contests/${contestId}/question`);
		const root = response.data;
		const payload = root?.data;
		const listProblems = Array.isArray(payload?.questions)
			? payload.questions
			: Array.isArray(payload)
				? payload
				: Array.isArray(payload?.data)
					? payload.data
					: [];

		const explicitFail = root?.code != null && root.code !== 200;
		if (explicitFail && !listProblems.length) {
			message.error(
				root?.message || 'Không tải được danh sách bài trong contest.'
			);
		} else if (!listProblems.length) {
			message.warning('Contest chưa có bài tập.');
		} else {
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

		problems.sort((a, b) => Number(a.index) - Number(b.index));

		run();
		}
	}
	catch (error)
	{
		console.log(error);
		message.error('Lỗi khi tải danh sách bài contest.');
	}
	finally
	{
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
	size: 'small',
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
  message.error('Không tìm thấy thông tin contest!');
  router.push('/');
}

const navigateToProblem = code =>
{
	router.push(`/lecturer/contest/student/problems/${code}`);
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

let countdownIntervalId = null;
countdownIntervalId = setInterval(() => {
	countdown.value = getCountdown();
}, 1000);

onUnmounted(() => {
	if (countdownIntervalId) {
		clearInterval(countdownIntervalId);
	}
});



</script>

<template>
	<HeaderContestLecturer/>
	
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
								:row-key="(record) => record.id"
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
.template
{
	height: 100vh;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
}

.countdown-time-test
{
	width: 100%;
	background-color: #ffffff;
	color: #a71d1d;
	font-weight: bold;
}



.body
{
	display: flex;
	justify-content: center;
	margin-top: 90px;
	width: 100%;
}



.body-header
{
	margin:0 50px;
	width: 100%;
	min-width: 80vw;
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



.button-group
{
	margin-top: 15px;
	margin-left: 5px;
}
</style>
