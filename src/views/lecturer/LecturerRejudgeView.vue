<script setup>
import { ref, reactive, onBeforeMount, computed, onMounted } from 'vue';
import axios from "@/configs/axios.js";
import {
    RiseOutlined,
    UploadOutlined,
    LoadingOutlined,
    CheckCircleTwoTone,
    CloseCircleTwoTone
} from '@ant-design/icons-vue';
import { useRoute, useRouter } from 'vue-router';
import { message } from "ant-design-vue";
import { usePagination } from "vue-request";
import MonacoEditor from 'monaco-editor-vue3';
import LecturerHeader from "@/components/LecturerHeader.vue";

const route = useRoute()
const router = useRouter();
const questionDetail = ref(null);
const currentCourse = ref(null);
const id = route.params.id;

const startTime = ref('');
const endTime = ref('');
const includeAC = ref(true);
const includeCE = ref(false);

axios.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
axios.defaults.headers.common['Accept'] = 'application/json';

onBeforeMount(async () => {
    if (!localStorage.getItem('currentCourse')) {
        router.push('/not-found');
    }

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    currentCourse.value = JSON.parse(localStorage.getItem('currentCourse') || '{}');

    if ((currentUser && currentUser.member_group != 2) || !currentCourse.value) {
        router.push('/not-found');
    }

    try {
        const response = await axios.get(`questions/${id}?course_id=${currentCourse.value.id}`);
        console.log(response);
        if (response.status === 200) {
            questionDetail.value = response.data.data;
        }
        setDefaultTimes();
    } catch (error) {
        console.log(error);
        //router.push('/not-found');
    }
});

const submitRegrade = async () => {
    try {
        const payload = {
            "id": id,
            "start_time": startTime.value,
            "end_time": endTime.value,
        };
        console.log("Payload:", payload);

        await axios.post("questions/rejudge", payload);
    }
    catch (error){
        console.log(error);
    }
};

const setDefaultTimes = () => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    startTime.value = formatDateTime(oneWeekAgo);
    endTime.value = formatDateTime(now);
};

const formatDateTime = (date) => {
    return date.toISOString().slice(0, 16);
};

onMounted(() => {
    setDefaultTimes();
});

</script>

<template>
    <LecturerHeader />
    <br>
    <br>
    <br>
    <br>
    <div class="regrade-container">
        <h2 class="title">Chấm lại {{ questionDetail.code }}</h2>

        <div class="time-range">
            <div class="time-input">
                <label>Bắt đầu</label>
                <input type="datetime-local" v-model="startTime">
            </div>
            <div class="time-input">
                <label>Kết thúc</label>
                <input type="datetime-local" v-model="endTime">
            </div>
        </div>

        <div class="options">
            <label class="checkbox-option">
                <input type="checkbox" v-model="includeAC"> Include AC
            </label>
            <label class="checkbox-option">
                <input type="checkbox" v-model="includeCE"> Include CE
            </label>
        </div>

        <div class="action-buttons">
            <button @click="submitRegrade" class="submit-button">Chấm lại</button>
        </div>
    </div>
</template>

<style scoped>
.regrade-container {
    padding: 20px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background-color: #f9f9f9;
    max-width: 600px;
    margin: 20px auto;
}

.title {
    color: #333;
    margin-bottom: 20px;
    text-align: center;
}

.time-range {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
}

.time-input {
    flex: 1;
}

.time-input label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #555;
}

.time-input input {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
}

.options {
    margin-bottom: 20px;
    padding: 10px;
    background-color: #f0f0f0;
    border-radius: 4px;
}

.checkbox-option {
    display: block;
    margin-bottom: 10px;
    cursor: pointer;
    padding: 5px;
}

.checkbox-option input {
    margin-right: 10px;
}

.action-buttons {
    text-align: center;
}

.submit-button {
    background-color: #4CAF50;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    transition: background-color 0.3s;
}

.submit-button:hover {
    background-color: #45a049;
}
</style>