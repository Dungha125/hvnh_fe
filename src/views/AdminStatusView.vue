<script setup>

import {computed, onBeforeMount, onBeforeUnmount, reactive, ref} from 'vue';
import {usePagination} from 'vue-request';
import axios from "@/configs/axios.js";
import {LoadingOutlined} from "@ant-design/icons-vue";
import AdminHeader from "@/components/AdminHeader.vue";
import {useRouter} from "vue-router";

const isLoading = ref(true);

const status = reactive([]);
let intervalId = null;

const router = useRouter();

onBeforeMount(async () =>
{
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    if ((currentUser && currentUser.member_group === 1) || !currentUser)
    {
        router.push('/not-found');
    }

    await fetchSolution();

    intervalId = setInterval(() =>
    {
        fetchSolution();
    }, 3000);
});

onBeforeUnmount(() =>
{
    if (intervalId)
    {
        clearInterval(intervalId);
    }
});

const fetchSolution = async () =>
{
    await axios.get('solutions').then(response =>
    {
        const tempStatus = [];
        if (response.status === 200)
        {
            isLoading.value = false;
            const statusResponse = response.data.data;
            statusResponse.forEach(sts =>
            {
                let runTime = sts.run_time;
                if (runTime)
                    runTime = runTime?.toFixed(2);

                let createdDate = new Date(sts.created_at);

                const month = createdDate.getMonth() + 1;

                sts.created_at = (createdDate.getDate() > 9 ? createdDate.getDate() : '0' + createdDate.getDate()) + '/' + (month > 9 ? month : '0' + month) + '/' + createdDate.getFullYear();

                let username = sts.user.username + ' - ' + sts.user.last_name + ' ' + sts.user.first_name;

                tempStatus.push({
                    id: sts.id,
                    date: sts.created_at,
                    account: username,
                    result: sts.result,
                    problem: sts.question.code + ' - ' + sts.question.name,
                    time: runTime ? runTime + 's' : '',
                    memory: sts.memory ? sts.memory + 'Kb' : '',
                    compiler: sts.compiler.code,
                });
            });

            status.splice(0, status.length, ...tempStatus);
        }
    }).catch(error =>
    {
        console.log(error);
    });
}


const queryData = async params =>
{
    return status;
};

const {data: dataSource, run, loading, current, pageSize} = usePagination(queryData, {
    formatResult: res =>
    {
        return Array.isArray(res) ? res : [];
    },
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

const activeKey = ref([1]);
</script>


<template>
    <AdminHeader/>
    <a-spin :spinning="isLoading">
        <div class="body">
            <div class="part-left">
                <div class="body-header">
                    <h2>Trạng thái giải bài</h2>
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
                                <a-table-column data-index="id">
                                    <template #title>
                                        <span style="font-weight: bold;">ID</span>
                                    </template>
                                </a-table-column>

                                <a-table-column data-index="date" width="12%">
                                    <template #title>
                                        <span style="font-weight: bold">Thời gian</span>
                                    </template>
                                </a-table-column>

                                <a-table-column width="15%" data-index="account">
                                    <template #title>
                                        <span style="font-weight: bold">Tài khoản</span>
                                    </template>
                                </a-table-column>

                                <a-table-column width="10%" data-index="result">
                                    <template #title>
                                        <span style="font-weight: bold">Kết quả</span>
                                    </template>

                                    <template #default="{ text }">
                                        <a-tag style="width: 70%; text-align: center" v-if="text === 'AC'"
                                               color="green">AC
                                        </a-tag>
                                        <a-tag style="width: 70%; text-align: center" v-else-if="text === 'WA'"
                                               color="red">WA
                                        </a-tag>
                                        <a-tag style="width: 70%; text-align: center" v-else-if="text === 'TLE'"
                                               color="orange">TLE
                                        </a-tag>
                                        <a-tag style="width: 70%; text-align: center" v-else-if="text === 'RTE'"
                                               color="red">RTE
                                        </a-tag>
                                        <a-tag style="width: 70%; text-align: center" v-else-if="text === 'CE'"
                                               color="purple">CE
                                        </a-tag>
                                        <a-tag style="width: 70%; text-align: center" v-else-if="text === 'MLE'"
                                               color="red">MLE
                                        </a-tag>
                                        <a-tag style="width: 70%; text-align: center" v-else-if="text === 'OLE'"
                                               color="red">OLE
                                        </a-tag>
                                        <a-tag style="width: 70%; text-align: center" v-else-if="text === 'IR'"
                                               color="red">IR
                                        </a-tag>
                                        <p v-else-if="text === null">
                                            <LoadingOutlined/>
                                        </p>
                                    </template>
                                </a-table-column>

                                <a-table-column width="20%" data-index="problem">
                                    <template #title>
                                        <span style="font-weight: bold">Bài tập</span>
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