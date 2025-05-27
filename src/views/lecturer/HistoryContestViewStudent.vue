<script setup>
import {computed, onBeforeMount, reactive, ref, watchEffect} from 'vue';
import {usePagination} from 'vue-request';
import axios from "@/configs/axios.js";
import {LoadingOutlined} from "@ant-design/icons-vue";
import {useRouter} from "vue-router";
import {message} from "ant-design-vue";
import MonacoEditor from 'monaco-editor-vue3';
import HeaderContestLecturer from '@/components/HeaderContestLecturer.vue';

const status = reactive([]);
const isLoading = ref(true);
const router = useRouter();
const isOpenCodeEditor = ref(false);
const currentSubmission = ref(null);
const submittedCode = ref('');
const countdown = ref('')

const editorOptions = {
    fontSize: 14,
    minimap: {enabled: false},
    automaticLayout: true,
};

onBeforeMount(async () => {
    const currentUser = localStorage.getItem('username');
    const contest_id = sessionStorage.getItem('contest_id');
    const contest_start_time = sessionStorage.getItem('start_time'); // Lưu thời gian mở contest (ISO 8601 format)

    await axios.get(`solutions?username=${currentUser}&contest_id=${contest_id}`)
        .then(response => {
            if (response.status === 200) {
                isLoading.value = false;
                const statusResponse = response.data.data;

                // Lọc dữ liệu chỉ lấy những submissions thuộc contest hiện tại và được tạo sau thời gian mở contest
                const filteredStatusResponse = statusResponse.filter(sts =>
                    sts.contest_id == contest_id && new Date(sts.created_at) >= new Date(contest_start_time)
                );

                filteredStatusResponse.forEach(sts => {
                    let runTime = sts.run_time;
                    if (runTime) runTime = runTime.toFixed(2);

                    let createdDate = new Date(sts.created_at);
                    const month = createdDate.getMonth() + 1;

                    sts.created_at = (createdDate.getDate() > 9 ? createdDate.getDate() : '0' + createdDate.getDate()) 
                    + '/' + (month > 9 ? month : '0' + month) 
                    + '/' + createdDate.getFullYear() 
                    + ' ' + (createdDate.getHours() > 9 ? createdDate.getHours() : '0' + createdDate.getHours()) 
                    + ':' + (createdDate.getMinutes() > 9 ? createdDate.getMinutes() : '0' + createdDate.getMinutes())
                    + ':' + (createdDate.getSeconds() > 9 ? createdDate.getSeconds() : '0' + createdDate.getSeconds());

                    let username = `${sts.user.username} - ${sts.user.first_name} ${sts.user.last_name}`;

                    status.push({
                        id: sts.id,
                        date: sts.created_at,
                        account: username,
                        result: sts.result,
                        problem: `${sts.question.code} - ${sts.question.name}`,
                        time: runTime ? `${runTime}s` : '',
                        memory: sts.memory ? `${sts.memory}Kb` : '',
                        compiler: sts.compiler.code,
                        code: sts.question.code,
                    });
                });
            }
        })
        .catch(error => {
            console.log(error);
        });
});

const queryData = async params => {
    return status;
};

const { data: dataSource, run, loading, current, pageSize } = usePagination(queryData, {
    formatResult: res => (Array.isArray(res) ? res : []),
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

const genUuid = () => Math.random().toString(36).substring(7);

const handleTableChange = (pag, filters, sorter) => {
    run({
        results: pag.pageSize,
        page: pag?.current,
        sortField: sorter.field,
        sortOrder: sorter.order,
        ...filters,
    });
};

const activeKey = ref([1]);

const navigateToProblem = code => {
    router.push(`/lecturer/contest/student/problems/${code}`);
};

const showEditor = async contestId => {
    if (!contestId) {
        message.error('Không thể mở bài làm này!');
        return;
    }

    isLoading.value = true;
    
    try {
        const response = await axios.get(`contest/${contestId}/history`);
        
        if (response.status === 200 && response.data?.code === 200) {
            submittedCode.value = response.data.data.source_code;
            currentSubmission.value = response.data.data;
            isOpenCodeEditor.value = true;
        } else {
            message.error('Không thể mở bài làm này!');
        }
    } catch (error) {
        message.error('Không thể mở bài làm này!');
        console.error('Lỗi khi lấy lịch sử bài làm:', error);
    }

    isLoading.value = false;
};

const User = JSON.parse(localStorage.getItem('user'));

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
    <HeaderContestLecturer/>
    <a-spin :spinning="isLoading">
        <div class="body">
            <div class="part-left">
                <div class="body-header">
                    <div class="countdown-time-test">
					<h2 style="color: #a71d1d; font-size: 36px;">{{User.last_name}} {{ User.first_name }} {{ User.username }} {{countdown}}</h2>
                    <div class="underline"></div>
				  </div>
                    <h2>Lịch sử</h2>
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
                                <a-table-column data-index="id" width="12%">
                                    <template #title>
                                        <span style="font-weight: bold;">ID</span>
                                    </template>

                                    <template #default="{ text }">
                                        <a style="color: #A7453C" @click="showEditor(text)">{{ text }}</a>
                                    </template>
                                </a-table-column>

                                <a-table-column data-index="date" width="12%">
                                    <template #title>
                                        <span style="font-weight: bold">Thời gian</span>
                                    </template>
                                </a-table-column>

                                <a-table-column width="8%" data-index="result">
                                    <template #title>
                                        <span style="font-weight: bold">Kết quả</span>
                                    </template>

                                    <template #default="{ record }">
                                        <a @click="showEditor(record.id)">
                                            <a-tag style="width: 70%; text-align: center" v-if="record.result === 'AC'"
                                                   color="green">AC
                                            </a-tag>
                                            <a-tag style="width: 70%; text-align: center"
                                                   v-else-if="record.result === 'WA'"
                                                   color="red">WA
                                            </a-tag>
                                            <a-tag style="width: 70%; text-align: center"
                                                   v-else-if="record.result === 'TLE'"
                                                   color="orange">TLE
                                            </a-tag>
                                            <a-tag style="width: 70%; text-align: center"
                                                   v-else-if="record.result === 'RTE'"
                                                   color="red">RTE
                                            </a-tag>
                                            <a-tag style="width: 70%; text-align: center"
                                                   v-else-if="record.result === 'CE'"
                                                   color="purple">CE
                                            </a-tag>
                                            <a-tag style="width: 70%; text-align: center"
                                                   v-else-if="record.result === 'MLE'"
                                                   color="red">MLE
                                            </a-tag>
                                            <a-tag style="width: 70%; text-align: center"
                                                   v-else-if="record.result === 'OLE'"
                                                   color="red">OLE
                                            </a-tag>
                                            <a-tag style="width: 70%; text-align: center"
                                                   v-else-if="record.result === 'IR'"
                                                   color="red">IR
                                            </a-tag>
                                            <p v-else-if="record.result === null">
                                                <LoadingOutlined/>
                                            </p>
                                        </a>
                                    </template>
                                </a-table-column>

                                <a-table-column width="20%" data-index="problem">
                                    <template #title>
                                        <span style="font-weight: bold">Bài tập</span>
                                    </template>

                                    <template #default="{ record }">
                                        <a @click="navigateToProblem(record.code)"
                                           style="cursor: pointer; color: #A7453C;">
                                            {{ record.problem.toUpperCase() }}
                                        </a>
                                    </template>
                                </a-table-column>

                                <a-table-column width="10%" data-index="time">
                                    <template #title>
                                        <span style="font-weight: bold">Thời gian</span>
                                    </template>
                                </a-table-column>

                                <a-table-column width="10%" data-index="memory">
                                    <template #title>
                                        <span style="font-weight: bold">Bộ nhớ</span>
                                    </template>
                                </a-table-column>

                                <a-table-column width="10%" data-index="compiler">
                                    <template #title>
                                        <span style="font-weight: bold">Trình biên dịch</span>
                                    </template>
                                </a-table-column>
                            </a-table>
                        </div>
                        <a-config-provider
                            :theme="{
                          token: {
                            colorPrimary: '#A7453C',
                            colorTextHeading: '#000000',
                            colorText: '#A7453C',
                            colorBorderSecondary: 'rgba(186,151,147,0.45)'
                          },
                        }"
                        />
                    </div>
                </div>
            </div>
            <div class="part-right">
                <div class="card-content">
                    <a-card style="width: 100%; background-color: #ffe9e8">
                        <p style="color: #2AAA2F">AC: Accepted (Kết quả đúng)</p>
                        <p>WA: Wrong Answer (Kết quả sai)</p>
                        <p>TLE: Time Limit Exceeded (Quá giới hạn thời gian)</p>
                        <p>MLE: Memory Limit Exceeded (Quá giới hạn bộ nhớ)</p>
                        <p>OLE: Output Limit Exceeded (Quá giới hạn đầu ra)</p>
                        <p>RTE: Runtime Error (Lỗi thực thi)</p>
                        <p>IR: Invalid Return (Trả về không hợp lệ)</p>
                        <p style="color: black">CE: Compile Error (Lỗi biên dịch)</p>
                    </a-card>
                </div>
            </div>
        </div>

        <a-modal style="top: 20px" v-model:open="isOpenCodeEditor" width="1000px"
                 :title="currentSubmission?.question?.code + ' - ' + currentSubmission?.question?.name.toUpperCase()">
            <div v-if="currentSubmission">
                <p style="margin-bottom: 5px; font-weight: bold">Thời gian nộp bài:
                    {{ currentSubmission?.created_at }}</p>
                <p style="margin-bottom: 5px; font-weight: bold">Ngôn ngữ: {{ currentSubmission?.compiler.name }}</p>
                <p style="margin-bottom: 5px; font-weight: bold">Kết quả:
                    <span v-if="currentSubmission?.result === 'AC'" style="color: #2AAA2F">AC</span>
                    <span v-else-if="currentSubmission?.result === 'WA'" style="color: #FF0000">WA</span>
                    <span v-else-if="currentSubmission?.result === 'TLE'" style="color: #FF0000">TLE</span>
                    <span v-else-if="currentSubmission?.result === 'MLE'" style="color: #FF0000">MLE</span>
                    <span v-else-if="currentSubmission?.result === 'OLE'" style="color: #FF0000">OLE</span>
                    <span v-else-if="currentSubmission?.result === 'RTE'" style="color: #FF0000">RTE</span>
                    <span v-else-if="currentSubmission?.result === 'IR'" style="color: #FF0000">IR</span>
                    <span v-else-if="currentSubmission?.result === 'CE'" style="color: #FF0000">CE</span>
                    <span v-else-if="currentSubmission?.result === null"><LoadingOutlined/></span>
                </p>
            </div>

            <div class="editor-container">
                <MonacoEditor
                    theme="vs-light"
                    language="python"
                    :width="900"
                    :height="700"
                    :options="editorOptions"
                    v-model:value="submittedCode"
                />
            </div>

            <template #footer>
                <a-button type="primary" @click="isOpenCodeEditor = false">Đóng</a-button>
            </template>
        </a-modal>
    </a-spin>
</template>

<style scoped>
template
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

.countdown-time-test
{
	width: 100%;
	background-color: #ffffff;
	color: #a71d1d;
	font-weight: bold;
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
    margin-top: 60px;
    display: flex;
    flex-direction: column;
}

.group-icon:hover img
{
    filter: invert(32%) sepia(64%) saturate(506%) hue-rotate(330deg) brightness(70%) contrast(95%);
}

.group-icon-container p
{
    margin-top: 12px;
}

.card-content
{
    margin-left: 20px;
    margin-right: 20px;
    border-radius: 10px;
    box-shadow: 2px 10px 20px rgba(0, 0, 0, 0.2);
}


</style>