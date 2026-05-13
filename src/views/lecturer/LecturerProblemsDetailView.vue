<script setup>
import { ref, reactive, onBeforeMount, computed } from 'vue';
import axios from "@/configs/axios.js";
import axiosInstance from "@/configs/axios.js";
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
import { Ckeditor, useCKEditorCloud } from "@ckeditor/ckeditor5-vue";
import { buildProblemRichTextEditorConfig } from "@/configs/problemRichTextEditor.js";

const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
const route = useRoute();
const isLoading = ref(true);
const questionDetail = ref(null);
const questionContent = ref(null);
const fileList = ref([]);
const uploading = ref(false);
const chosenCompiler = ref();
const result = ref('Pending');
const comments = ref([]);
const commentValue = ref('');
const isSubmittingComment = ref(false);
const currentUserSubmissions = ref([]);
const compilers = ref([]);
const openTopSubmissions = ref(false);
const status = reactive([]);
const isLoadingTopSubmissions = ref(true);
const currentCourse = ref(null);
const isOpenCodeEditor = ref(false);
const submittedCode = ref('');
const selectedSubmission = ref(null);
const questionCode = ref(null);
const selectedGroups = [];
const selectedSubGroups = [];
const typeProblems = ref([]);
const difficulties = ref([]);
const group = ref([]);
const sub_group = ref([]);
const currentTab = ref(["problems"]);
const problemsList = reactive([]);
const problemListLoading = ref(false);
const filterData = ref([]);
const subjects = ref([]);
const listCompilers = ref([]);
const subTopics = ref([]);
const statusProblems = ref([]);
const customMainFunctions = ref([]);
const listComment = reactive([])
const listApproval = reactive([]);
const courses = ref([]);
const current_course = ref(null);
const listStudyingCourses = ref([]);
const selectedSubjects = ref([]);
const showCustomMain = ref(false);

const confirmLoading = ref(false);

const getSubjectName = (subjectCode) => {
  const subject = subjects.value.find((s) => s.value === subjectCode);
  return subject ? subject.label : "Không xác định";
};

const filteredGroups = (subjectCode) => {
  return group.value.filter((g) => g.subjectCode === subjectCode);
};

const filteredSubGroups = (subjectCode) => {
  return sub_group.value.filter((sg) => sg.subjectCode === subjectCode);
};

const id = route.params.id;
const router = useRouter();

const problemDetailEdit = ref({
  id: "",
  code: "",
  name: "",
  content: "",
  md_content: "",
  sample: "",
  type: "",
  groups: [],
  sub_groups: [],
  level: "",
  time_limit: "",
  memory_limit: "",
  status: "",
  banned_keyword: "",
  subjects: [],
  main_functions: [],
  compilers: [],
});

const isEditModalVisible = ref(false);

const closeEditModal = () => {
  isEditModalVisible.value = false;
};

const openModal = () => {
  isEditModalVisible.value = true;
}


const editorOptions = {
  fontSize: 14,
  minimap: { enabled: false },
  automaticLayout: true,
};

onBeforeMount(async () => {
  if (!localStorage.getItem('currentCourse')) {
    router.push('/not-found');
  }

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  currentCourse.value = JSON.parse(localStorage.getItem('currentCourse') || '{}');
  questionCode.value = JSON.parse(localStorage.getItem('questionCode'));

  if ((currentUser && currentUser.member_group != 2) || !currentCourse.value) {
    router.push('/not-found');
  }

  try {
    const response = await axiosInstance.get('courses/studying');

    if (response.data.code === 200 && Array.isArray(response.data.data)) {
      // Lấy danh sách subjects (môn học) từ API
      subjects.value = response.data.data.map(item => ({
        label: `${item.subject.code} - ${item.subject.name}`,
        value: item.subject.id
      })).filter((value, index, self) =>
        index === self.findIndex((t) => t.value === value.value) // Lọc bỏ trùng lặp
      );
      console.log(response);
      console.log(subjects.value);
      courses.value = response.data.data.map(item => ({
        label: `${item.subject.code} - ${item.subject.name} - ${item.name}`,
        value: item.id
      }))
      console.log(courses.value);

      // console.log(subjects.value);
      // console.log(semesters.value);
      if (courses.value.length > 0) {
        current_course.value = courses.value[0].value;
      }

    } else {
      message.error("Không tìm thấy dữ liệu môn học từ API");
    }
  } catch (error) {
    message.error("Lỗi khi tải danh sách môn học từ API");
    console.error(error);
  }

  try {
    const response = await axios.get(`questions/${id}?course_id=${currentCourse.value.id}`);
    console.log(response);
    if (response.status === 200) {
      isLoading.value = false;
      questionDetail.value = response.data.data;
      comments.value = response.data.data.comments;
      comments.value.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      //questionContent.value = marked(response.data.data.content.replace(/^#\s*/, ''));
      questionContent.value = response.data.data.content;
    }

    const getSubmissionsResponse = await axios.get(`solutions?question_code=${id}&username=${currentUser.username}`);
    if (getSubmissionsResponse.status === 200) {
      currentUserSubmissions.value = getSubmissionsResponse.data.data;
    }

    compilers.value = questionDetail.value.allow_compilers.map((compiler) => ({
      label: compiler.code,
      value: compiler.id + ""
    }));

    if (compilers.value.length > 0) {
      chosenCompiler.value = compilers.value[0].value;
    }

    // await axios.get(`questions/${id}/top`).then(response => {
    //   if (response.status === 200) {
    //     isLoading.value = false;
    //     const statusResponse = response.data.data;
    //     statusResponse.forEach(sts => {
    //       let runTime = sts.run_time;
    //       if (runTime)
    //         runTime = runTime.toFixed(2);

    //       let createdDate = new Date(sts.created_at);
    //       sts.created_at = (createdDate.getDate() > 9 ? createdDate.getDate() : '0' + createdDate.getDate()) + '/' + (createdDate.getMonth() > 9 ? createdDate.getMonth() : '0' + createdDate.getMonth()) + '/' + createdDate.getFullYear();


    //       let username = sts.user.username + ' - ' + sts.user.last_name + ' ' + sts.user.first_name;

    //       status.push({
    //         id: sts.id,
    //         date: sts.created_at,
    //         account: username,
    //         result: sts.result,
    //         problem: sts.question.code + ' - ' + sts.question.name,
    //         time: runTime + 's',
    //         memory: sts.memory + 'Kb',
    //         compiler: sts.compiler.code,
    //       });
    //     });

    //     const uniqueSubmissions = [];
    //     const map = new Map();
    //     for (const item of status) {
    //       if (!map.has(item.account)) {
    //         map.set(item.account, true);
    //         uniqueSubmissions.push(item);
    //       }
    //     }

    //     status.length = 0;

    //     status.push(...uniqueSubmissions);
    //     isLoadingTopSubmissions.value = false;
    //   }
    // }).catch(error => {
    //   router.push('/not-found');
    // });
  } catch (error) {
    router.push('/not-found');
  }

  
  try {
    // Fetch question levels (difficulties)
    const resLevels = await axios.get("/question_levels");
    if (resLevels.data.code === 200 && resLevels.data.data) {
      difficulties.value = resLevels.data.data.map((level) => ({
        label: `${level.code} - ${level.name}`,
        value: level.id,
        code: level.code,
      }));
    }
  } catch (error) {
    message.error("Lỗi khi lấy dữ liệu độ khó");
    console.error(error);
  }

  try {
    // Fetch question levels (questionTypes)
    const resType = await axios.get("/question_types");
    if (resType.data.code === 200 && resType.data.data) {
      typeProblems.value = resType.data.data.map((type) => ({
        label: `${type.code} - ${type.name}`,
        value: type.id,
        code: type.code,
      }));
    }
  } catch (error) {
    message.error("Lỗi khi lấy dữ liệu dạng bài tập");
    console.error(error);
  }

  try {
    const resGroups = await axios.get("/question_groups");
    if (resGroups.data.code === 200 && resGroups.data.data) {
      // Mỗi phần tử sẽ có label là subject.name và value là id của group (hoặc tùy theo cấu trúc mong muốn)
      group.value = resGroups.data.data.map((group) => ({
        label: `${group.code} - ${group.subject.name}`,
        value: group.id,
        subjectCode: group.subject.id,
      }));
    }
  } catch (error) {
    message.error("Lỗi khi lấy danh sách nhóm");
    console.error(error);
  }

  try {
    const resSubQuestions = await axios.get("/question_sub_groups");
    if (resSubQuestions.data.code === 200 && resSubQuestions.data.data) {
      sub_group.value = resSubQuestions.data.data.map((item) => ({
        label: `${item.code} - ${item.subject.code}`,
        value: item.id,
        subjectCode: item.subject.id,
      }));
    }
  } catch (error) {
    message.error("Lỗi khi lấy danh sách nhóm đề tài");
    console.error(error);
  }


  finally {
    isLoading.value = false;
  }
});


const handleRemove = file => {
  const index = fileList.value.indexOf(file);
  const newFileList = fileList.value.slice();
  newFileList.splice(index, 1);
  fileList.value = newFileList;
};

const beforeUpload = file => {
  fileList.value = [...(fileList.value || []), file];
  return false;
};

const handleUpload = async () => {
  const file = fileList.value[0];

  const allowedExtensions = ['py', 'c', 'cpp', 'java', 'zip', 'rar', 'cs'];
  const fileExtension = file.name.split('.').pop().toLowerCase();

  if (!allowedExtensions.includes(fileExtension)) {
    message.error('File không hợp lệ!');
    return;
  }

  if (!file) {
    message.error('Vui lòng chọn file!');
    return;
  }

  const formData = new FormData();
  formData.append('course_id', currentCourse.value.id);
  formData.append('question', id);
  formData.append('compiler', chosenCompiler.value);
  formData.append('code_file', file);

  uploading.value = true;

  try {
    const response = await axios.post('solutions', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.status === 200) {
      result.value = null;
      const submissionId = response.data.solution_id;
      message.success('Nộp bài thành công');
      const intervalId = setInterval(async () => {
        const getSubmissionResponse = await axios.get(`solutions/${submissionId}`);
        if (getSubmissionResponse.status === 200) {
          result.value = getSubmissionResponse.data.data.result;
          if (result.value) {
            clearInterval(intervalId);
            uploading.value = false;
            if (result.value === 'AC') {
              message.success('Chúc mừng bạn đã hoàn thành bài tập này!');
            } else {
              message.error('Rất tiếc, bài làm của bạn không đúng!');
            }
            const getSubmissionsResponse = await axios.get(`solutions?question_code=${id}&username=${currentUser.username}`);
            if (getSubmissionsResponse.status === 200) {
              currentUserSubmissions.value = getSubmissionsResponse.data.data;
            }
          }
        }
      }, 3000);
    }
  } catch (error) {
    uploading.value = false;
    message.error('Nộp bài thất bại');
  }
};


const getAvatarName = (name) => {
  if (!name) return "User";
  return name.split(' ').join('+');
};

const handleComment = async () => {
  isSubmittingComment.value = true;
  try {
    const response = await axios.post(`questions/${id}/comment`, { comment: commentValue.value });
    if (response.status === 200) {
      comments.value.push({
        name: response.data.data.name,
        content: response.data.data.content,
        created_at: response.data.data.created_at,
        user: {
          photo: currentUser.profile_picture ?? null
        }
      });

      commentValue.value = '';
      comments.value.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      message.success('Bình luận thành công');
    }
  } catch (error) {
    message.error('Bình luận thất bại');
    console.log(error);
  }
  isSubmittingComment.value = false;
}

const queryData = async params => {
  return status;
};

const { data: dataSource, run, loading, current, pageSize } = usePagination(queryData, {
  formatResult: res => {
    return Array.isArray(res) ? res : [];
  },
  pagination: {
    currentKey: 'page',
    pageSizeKey: 'pageSize',
  },
});

const pagination = computed(() => ({
  total: status.length,
  current: current.value,
  pageSize: pageSize.value,
  size: 'small',
}));

const genUuid = () => {
  return Math.random().toString(36).substring(7);
};

const handleTableChange = (pag, filters, sorter) => {
  run({
    pageSize: pag.pageSize,
    page: pag?.current,
    sortField: sorter.field,
    sortOrder: sorter.order,
    ...filters,
  });
};

const showEditor = async (id) => {
  if (id === null) {
    message.error('Không thể mở bài làm này!');
    return;
  }

  isLoading.value = true;
  const response = await axios.get(`solutions/${id}`);
  if (response.status === 200) {
    if (response.data.code === 200) {
      submittedCode.value = response.data.data.source_code;
      selectedSubmission.value = response.data.data;
      isOpenCodeEditor.value = true;
    } else {
      message.error('Không thể mở bài làm này!');
    }
  } else {
    message.error('Không thể mở bài làm này!');
  }
  isLoading.value = false;
}



import { onMounted, onBeforeUnmount } from 'vue'

const isMenuOpen = ref(false)
const menuContainer = ref(null)

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}


const handleClickOutside = (event) => {
  if (menuContainer.value && !menuContainer.value.contains(event.target)) {
    isMenuOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})




const showTestManager = ref(false);
const fileInput = ref(null);

const testCases = ref([]);

const handleShowTestCases = async () => {
  try {
    const response = await axios.get(`questions/${questionDetail.value?.id}/test`);
    console.log(response);
    if (response.status === 200) {
      testCases.value.push(
        response.data.data);
    }
    console.log(testCases.value[0])
  }
  catch (error) {
    console.log(error);
  }
}

const triggerFileInput = () => {
  fileInput.value.click();
};

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    console.log('File selected:', file.name);
    // Xử lý file upload ở đây
  }
};


const changeProblemRejudge = (questionID) => {
  try {
    router.push(`/lecturer/problems/${questionID}/rejudge`);
    console.log(questionID);
  }
  catch (error) {
    console.log(error);
  }
}



const openEditModal = async () => {

  try {
    const response = await axios.get(`/questions/${questionCode.value}?course_id=${currentCourse.value.subject.id}`);
    console.log(response);

    if (response.data?.data) {
      problemDetailEdit.value = {
        id: response.data.data.id,
        code: response.data.data.code || "",
        name: response.data.data.name || "",
        content: response.data.data.content || "",
        md_content: response.data.data.md_content || "",
        sample: response.data.data.sample || "",
        type: response.data.data.type || "",
        groups: [response.data.data.group_name] || [],
        sub_groups: Array.isArray(response.data.data.sub_groups)
          ? response.data.data.sub_groups.map(Number)  // Đảm bảo tất cả phần tử là số
          : [],
        level: response.data.data.level ? String(response.data.data.level) : "default_value",
        time_limit: response.data.data.time_limit || "",
        memory_limit: response.data.data.memory_limit || "",
        status: response.data.data.status || "",
        banned_keyword: response.data.data.banned_keyword || "",
        subjects: response.data.data.subjects || [],
        main_functions: response.data.data.main_functions || [],
        compilers: response.data.data.compilers || [],
      };

      openModal();

    } else {
      console.error("Dữ liệu bài tập không hợp lệ!", response.data);
    }
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu bài tập:", error);
  }

};

const handleEditProblem = async (problemAfterEdit, questionID) => {
  console.log(">> check code", questionID);
  if (
    !problemDetailEdit.value.code ||
    !/^[A-Za-z0-9_-]+$/u.test(problemDetailEdit.value.code) ||
    problemDetailEdit.value.code.length > 50
  ) {
    message.error("Vui lòng nhập lại code.");
    return;
  }
  if (!problemDetailEdit.value.code) {
    message.error("Vui lòng nhập mã bài tập.");
    return;
  }
  if (!problemDetailEdit.value.name) {
    message.error("Vui lòng nhập tên.");
    return;
  }
  if (!problemDetailEdit.value.type) {
    message.error("Vui lòng nhập dạng đề.");
    return;
  }
  if (!problemDetailEdit.value.level) {
    message.error("Vui lòng nhập độ khó.");
    return;
  }
  if (!problemDetailEdit.value.time_limit) {
    message.error("Vui lòng nhập thời gian giới hạn.");
    return;
  }
  if (!problemDetailEdit.value.memory_limit) {
    message.error("Vui lòng nhập bộ nhớ giới hạn.");
    return;
  }
  if (!problemDetailEdit.value.status) {
    message.error("Vui lòng nhập trạng thái.");
    return;
  }
  if (!problemDetailEdit.value.subjects || problemDetailEdit.value.subjects.length === 0) {
    message.error("Vui lòng nhập môn học.");
    return;
  }

  if (showCustomMain.value) {
    // Lọc ra những compiler có hàm main không rỗng
    problemAfterEdit.compilers = listCompilers.value
      .filter((compiler) => {
        const codeContent = problemAfterEdit.main_functions?.[compiler.value] || "";
        return codeContent.trim() !== ""; // Chỉ giữ lại compiler có nội dung
      })
      .map((compiler) => compiler.value); // Lấy ID thay vì label
    problemAfterEdit.main_functions = listCompilers.value
      .filter((compiler) => {
        const codeContent = problemAfterEdit.main_functions?.[compiler.value] || "";
        return codeContent.trim() !== ""; // Chỉ giữ lại compiler có nội dung
      })
      .map((compiler) => problemAfterEdit.main_functions[compiler.value]); // Lấy ID thay vì label
  }

  const payload = {
    code: problemAfterEdit.code,
    name: problemAfterEdit.name,
    content: problemAfterEdit.content,
    md_content: problemAfterEdit.md_content,
    sample: problemAfterEdit.sample,
    type: problemAfterEdit.type,

    // ✅ Lọc ra danh sách ID hợp lệ
    groups: Object.values(problemAfterEdit.groups).filter(id => id !== null && id !== undefined),
    sub_groups: Object.values(problemAfterEdit.sub_groups).filter(id => id !== null && id !== undefined),

    level: problemAfterEdit.level,
    time_limit: problemAfterEdit.time_limit,
    memory_limit: problemAfterEdit.memory_limit,
    status: problemAfterEdit.status,
    banned_keyword: problemAfterEdit.banned_keyword,

    subjects: Array.isArray(problemAfterEdit.subjects)
      ? problemAfterEdit.subjects
      : [problemAfterEdit.subjects],

    main_functions: problemAfterEdit.main_functions,
    compilers: problemAfterEdit.compilers,
  };

  console.log("✅ Payload gửi đi:", payload);

  await axios.put(`/questions/${questionID}`, payload)
    .then(async (response) => {
      if (response.data.code === 200) {
        message.success("Cập nhật bài tập thành công!");
        await fetchProblems(current_course.value);
        closeEditModal();
      } else {
        message.error("Lỗi khi cập nhật bài tập, vui lòng thử lại!");
        console.log(response.data);
      }
    })
    .catch((error) => {
      console.error(error.response.data);
      message.error("Lỗi khi cập nhật bài tập, vui lòng thử lại!");
    });
};


const cloud = useCKEditorCloud({
  version: "44.2.0",
  premium: true,
  translations: ["vi"],
});

const data = ref("");

const editor = computed(() => {
  if (!cloud.data.value) {
    return null;
  }
  return cloud.data.value.CKEditor.ClassicEditor;
});

const CKEDITOR_LICENSE =
  "eyJhbGciOiJFUzI1NiJ9.eyJleHAiOjE3NDIzNDIzOTksImp0aSI6ImE1MjcxYmY2LTBjNTktNDViZS04NDZhLTllN2NmNDliOWUzMyIsInVzYWdlRW5kcG9pbnQiOiJodHRwczovL3Byb3h5LWV2ZW50LmNrZWRpdG9yLmNvbSIsImRpc3RyaWJ1dGlvbkNoYW5uZWwiOlsiY2xvdWQiLCJkcnVwYWwiLCJzaCJdLCJ3aGl0ZUxhYmVsIjp0cnVlLCJsaWNlbnNlVHlwZSI6InRyaWFsIiwiZmVhdHVyZXMiOlsiKiJdLCJ2YyI6ImIyNzVmODAzIn0.OTYN1JB-xwnGdnCgZz2JE0GcV9lkutzKrmzKTzkaYayXnWWkcQcJcRcBC5YIKNmQ76YmPldmXNE-2YFvuSAftA";

const config = computed(() =>
  buildProblemRichTextEditorConfig(cloud.data.value, CKEDITOR_LICENSE),
);

const handleSubjectChange = () => {
  selectedSubjects.value.forEach((subject) => {
    if (!selectedGroups.value[subject]) selectedGroups.value[subject] = null;
    if (!selectedSubGroups.value[subject]) selectedSubGroups.value[subject] = null;
  });
};


const editForm = ref();


</script>



<template>
  <LecturerHeader />
  <a-spin :spinning="isLoading">
    <div class="body">
      <div class="part-left">
        <div class="body-header">
          <h2>{{ questionDetail?.name.toUpperCase() }}</h2>
          <div class="underline"></div>
          <!--copy-->
          <div class="problem-container" v-if="questionDetail">
            <div v-if="questionContent" v-html="questionContent"></div>
            <br>
            <p>Giới hạn thời gian: {{ questionDetail?.time_limit }}s</p>
            <p>Giới hạn bộ nhớ: {{ questionDetail?.memory_limit }}Kb</p>
          </div>

          <div class="tools-container">
            <div class="compiler-container">
              <h3 style="margin-right: 7px">Trình biên dịch:</h3>
              <a-select ref="select" v-model:value="chosenCompiler" style="width: 120px; margin-bottom: 5px"
                :options="compilers"></a-select>
            </div>

            <div class="submit-container">
              <a-upload :file-list="fileList" :before-upload="beforeUpload" @remove="handleRemove">
                <a-button style="width: 100%" :disabled="fileList.length === 1">
                  <UploadOutlined />
                  Tải file lên
                </a-button>
              </a-upload>

              <div class="submit-status-container">
                <p>Trạng thái:
                  <span v-if="result === 'AC'" style="color: #2AAA2F">AC</span>
                  <span v-else-if="result === 'WA'" style="color: #FF0000">WA</span>
                  <span v-else-if="result === 'TLE'" style="color: #FF0000">TLE</span>
                  <span v-else-if="result === 'MLE'" style="color: #FF0000">MLE</span>
                  <span v-else-if="result === 'OLE'" style="color: #FF0000">OLE</span>
                  <span v-else-if="result === 'RTE'" style="color: #FF0000">RTE</span>
                  <span v-else-if="result === 'IR'" style="color: #FF0000">IR</span>
                  <span v-else-if="result === 'CE'" style="color: #FF0000">CE</span>
                  <span v-else-if="result === null">
                    <LoadingOutlined />
                  </span>
                </p>

                <a-button type="primary" style="width: 30%; margin-top: 10px" :loading="uploading" @click="handleUpload"
                  :disabled="fileList.length === 0">Nộp bài
                </a-button>
              </div>
            </div>
          </div>

          <h3 style="margin-top: 2%">Bình luận</h3>
          <div class="comment-container">
            <a-comment>
              <template #avatar>
                <a-avatar
                  :src="currentUser.profile_picture ??
                    `https://ui-avatars.com/api/?name=${getAvatarName(currentUser.last_name + ' ' + currentUser.first_name)}`"
                  alt="Avatar" />

              </template>
              <template #content>
                <a-form-item>
                  <a-textarea
                    placeholder="Sinh viên có thể đặt câu hỏi về bài tập, chia sẻ cách giải bài tập, nhưng không nên chia sẻ mã nguồn..."
                    v-model:value="commentValue" :rows="4" />
                </a-form-item>
                <a-form-item>
                  <a-button html-type="submit" :loading="isSubmittingComment" type="primary" @click="handleComment">
                    Thêm bình luận
                  </a-button>
                </a-form-item>
              </template>
            </a-comment>

            <a-list v-if="comments.length" :data-source="comments" :header="`${comments.length} bình luận`"
              item-layout="horizontal">
              <template #renderItem="{ item }">
                <a-list-item>
                  <a-comment :author="item.name"
                    :avatar="item.user.photo && item.user.photo?.length > 0 ? item.user.photo : `https://ui-avatars.com/api/?name=${getAvatarName(item.name)}`"
                    :content="item.content" :datetime="item.created_at" />
                </a-list-item>
              </template>
            </a-list>
          </div>
        </div>
      </div>
      <div class="part-right">
        <a-config-provider :theme="{
          token: {
            colorPrimary: '#A7453C',
            colorTextHeading: '#000000',
            colorText: '#A7453C',
            colorBorderSecondary: 'rgba(186,151,147,0.45)'
          }
        }" />
        <div class="group-icon-container">
          <div class="group-icon">
            <RiseOutlined style="margin-right: 2%;" />
            <p style="font-size: 100%;" @click="openTopSubmissions = true">Bài làm tốt nhất</p>
          </div>
        </div>

        <div class="card-content">
          <div class="ellipsis-menu-container" ref="menuContainer">
            <!-- Nút dấu 3 chấm -->
            <button class="ellipsis-button" @click="toggleMenu">
              <span>•••</span>
            </button>

            <!-- Menu popup -->
            <div v-if="isMenuOpen" class="ellipsis-menu">
              <button @click="showTestManager = true, handleShowTestCases()" class="manage-button">
                Quản lý test
              </button>
              <div v-if="showTestManager" class="modal-overlay" @click.self="showTestManager = false">
                <div class="test-manager-modal">
                  <div class="modal-header">
                    <h3>{{ questionDetail.name }}</h3>
                    <button @click="showTestManager = false" class="close-button">&times;</button>
                  </div>

                  <div class="modal-body">
                    <p>Sử dụng file zip để upload dữ liệu <a href="#" class="sample-link">Dữ liệu mẫu</a></p>

                    <div class="test-cases">
                      <h4>{{ testCases[0] }}</h4>
                    </div>

                    <div class="download-section">
                      <button class="download-button">Tải về</button>
                    </div>

                    <div class="upload-section">
                      <h4>Tải lên</h4>
                      <div class="file-input">
                        <input type="file" id="file-upload" ref="fileInput" @change="handleFileUpload"
                          style="display: none;">
                        <button style="padding-right: 340px;" @click="triggerFileInput" class="browse-button">Chọn
                          tệp</button>
                        <button @click="triggerFileInput" class="browse-button">Duyệt</button>
                      </div>
                      <div class="action-buttons">
                        <button class="upload-button">Tải lên</button>
                        <button @click="showTestManager = false" class="cancel-button">Hủy</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>


              <button class="manage-button" @click="openEditModal">Sửa</button>
              <button class="manage-button" @click="changeProblemRejudge(questionDetail.id)">Chấm lại</button>
            </div>
          </div>
          <p style="font-weight: bold">Lịch sử nộp bài:</p>
          <div v-for="submission in currentUserSubmissions">
            <div style="display: flex; justify-content: space-between; align-items: center">
              <div>
                <p style="margin-bottom: 0">{{ submission?.question?.name }}</p>
                <p style="font-size: 80%; color: #9e9e9e">{{ submission?.created_at }}</p>
              </div>

              <a @click="showEditor(submission?.id)">
                <span v-if="submission?.result === 'AC'" style="color: #2AAA2F">AC</span>
                <span v-else-if="submission?.result === 'WA'" style="color: #FF0000">WA</span>
                <span v-else-if="submission?.result === 'TLE'" style="color: #FF0000">TLE</span>
                <span v-else-if="submission?.result === 'MLE'" style="color: #FF0000">MLE</span>
                <span v-else-if="submission?.result === 'OLE'" style="color: #FF0000">OLE</span>
                <span v-else-if="submission?.result === 'RTE'" style="color: #FF0000">RTE</span>
                <span v-else-if="submission?.result === 'IR'" style="color: #FF0000">IR</span>
                <span v-else-if="submission?.result === 'CE'" style="color: #FF0000">CE</span>
                <span v-else-if="submission?.result === null">
                  <LoadingOutlined />
                </span>
              </a>
            </div>
            <div class="underline" style="opacity: 40%; margin-bottom: 3%"></div>
          </div>
        </div>



        <!-- Popup cập nhật bài tập -->
        <a-modal v-model:open="isEditModalVisible" title="Sửa bài tập" width="1000px"
          @ok="handleEditProblem(problemDetailEdit, problemDetailEdit.id)" :mask="false">
          <a-form layout="vertical">
            <div class="form-container">
              <!-- Cột trái -->
              <div class="form-group">
                <a-form-item label="Mã bài tập" required>
                  <a-input v-model:value="problemDetailEdit.code" placeholder="Nhập mã bài tập" :rules="[
                    {
                      required: true,
                      message: 'Vui lòng nhập mã bài tập',
                    },
                    {
                      pattern: /^[A-Za-z0-9_-]+$/u,
                      message:
                        'Mã bài tập chỉ chứa chữ cái, số, dấu gạch dưới và dấu gạch ngang',
                    },
                    {
                      max: 50,
                      message: 'Mã bài tập không được quá 50 ký tự',
                    },
                  ]" />
                </a-form-item>

                <a-form-item label="Tiêu Đề">
                  <a-input v-model:value="problemDetailEdit.name" placeholder="Nhập tiêu đề" />
                </a-form-item>

                <a-form-item label="Môn học" required>
                  <a-checkbox-group v-model:value="problemDetailEdit.subjects">
                    <a-checkbox v-for="subject in subjects" :key="subject.value" :value="subject.value"
                      @change="handleSubjectChange">
                      {{ subject.label }}
                    </a-checkbox>
                  </a-checkbox-group>
                </a-form-item>

                <div v-for="subject in problemDetailEdit.subjects" :key="subject" class="subject-dropdowns">
                  <h3>{{ getSubjectName(subject) }}</h3>

                  <a-form-item label="Nhóm" required>
                    <a-select v-model:value="problemDetailEdit.groups[subject]" placeholder="Chọn nhóm">
                      <a-select-option v-for="group in filteredGroups(subject)" :key="group.value" :value="group.value">
                        {{ group.label }}
                      </a-select-option>
                    </a-select>
                  </a-form-item>

                  <a-form-item label="Chủ đề con" required>
                    <a-select v-model:value="problemDetailEdit.sub_groups[subject]" placeholder="Chọn chủ đề con">
                      <a-select-option v-for="subGroup in filteredSubGroups(subject)" :key="subGroup.value"
                        :value="subGroup.value">
                        {{ subGroup.label }}
                      </a-select-option>
                    </a-select>
                  </a-form-item>
                </div>
                <div style="display: flex; gap: 20px">
                  <a-form-item label="Độ khó" required>
                    <a-select v-model:value="problemDetailEdit.level" placeholder="Chọn độ khó" :options="difficulties.map((item) => ({
                      label: item.code,
                      value: item.value,
                    }))
                      " />
                  </a-form-item>
                  <a-form-item label="Thời gian giới hạn" required>
                    <a-input v-model:value="problemDetailEdit.time_limit" placeholder="Nhập thời gian giới hạn" :rules="[
                      {
                        required: true,
                        message: 'Vui lòng nhập thời gian giới hạn',
                      },
                    ]" />
                  </a-form-item>
                  <a-form-item label="Bộ nhớ giới hạn" required>
                    <a-input v-model:value="problemDetailEdit.memory_limit" placeholder="Nhập bộ nhớ giới hạn" :rules="[
                      {
                        required: true,
                        message: 'Vui lòng nhập bộ nhớ giới hạn',
                      },
                    ]" />
                  </a-form-item>
                </div>
                <a-form-item label="Trạng thái" required>
                  <a-radio-group v-model:value="problemDetailEdit.status" style="display: flex; flex-direction: column"
                    :rules="[
                      {
                        required: true,
                        message: 'Vui lòng chọn trạng thái',
                      },
                    ]">
                    <a-radio value="1">Công khai</a-radio>
                    <a-radio value="0">Riêng tư</a-radio>
                  </a-radio-group>
                </a-form-item>
                <a-form-item label="Loại bài tập" required>
                  <a-select v-model:value="problemDetailEdit.type" placeholder="Chọn độ khó" :options="typeProblems.map((item) => ({
                    label: item.code,
                    value: item.value,
                  }))
                    " />
                </a-form-item>
              </div>

              <!-- Cột phải -->
              <div class="form-group">
                <a-form-item label="Nội dung" required>
                  <ckeditor v-if="editor && config" v-model="problemDetailEdit.content" :editor="editor" :config="config" :rules="[
                    {
                      required: true,
                      message: 'Vui lòng nhập nội dung',
                    },
                  ]" />
                </a-form-item>
                <a-form-item label="banned_keyword">
                  <a-input v-model:value="problemDetailEdit.banned_keyword" placeholder="Nhập từ khoá" />
                </a-form-item>
                <!-- Toggle Switch -->
                <a-form-item label="Sử dụng Custom Main Function">
                  <a-switch v-model:checked="showCustomMain" />
                </a-form-item>

                <!-- Các input chỉ hiện khi bật toggle -->
                <template v-if="showCustomMain">
                  <a-form-item v-for="compiler in listCompilers"
                    v-model:value="problemDetailEdit.compilers[compiler.value]" :key="compiler.value"
                    :label="`${compiler.label} Main Function`">
                    <a-textarea v-model:value="problemDetailEdit.main_functions[compiler.value]" placeholder="Nhập code"
                      :autoSize="{ minRows: 2, maxRows: 10 }" />
                  </a-form-item>
                </template>
              </div>
            </div>
          </a-form>
        </a-modal>



      </div>
    </div>

    <div>
      <a-modal v-model:open="openTopSubmissions" width="100%" wrap-class-name="full-modal" style="top: 3%;"
        :title="'Bài làm tốt nhất cho ' + questionDetail?.name.toUpperCase()">
        <div class="table-container">
          <a-table :row-key="genUuid()" :data-source="dataSource" :pagination="pagination"
            :loading="isLoadingTopSubmissions" @change="handleTableChange">
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
                <a-tag style="width: 70%; text-align: center" v-if="text === 'AC'" color="green">AC
                </a-tag>
                <a-tag style="width: 70%; text-align: center" v-else-if="text === 'WA'" color="red">WA
                </a-tag>
                <a-tag style="width: 70%; text-align: center" v-else-if="text === 'TLE'" color="orange">TLE
                </a-tag>
                <a-tag style="width: 70%; text-align: center" v-else-if="text === 'RTE'" color="red">RTE
                </a-tag>
                <a-tag style="width: 70%; text-align: center" v-else-if="text === 'CE'" color="purple">CE
                </a-tag>
                <a-tag style="width: 70%; text-align: center" v-else-if="text === 'MLE'" color="red">MLE
                </a-tag>
                <a-tag style="width: 70%; text-align: center" v-else-if="text === 'OLE'" color="red">OLE
                </a-tag>
                <a-tag style="width: 70%; text-align: center" v-else-if="text === 'OLE'" color="red">IR
                </a-tag>
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
        <a-config-provider :theme="{
          token: {
            colorPrimary: '#A7453C',
            colorTextHeading: '#000000',
            colorText: '#A7453C',
            colorBorderSecondary: 'rgba(186,151,147,0.45)'
          },
        }" />

        <template #footer>
        </template>
      </a-modal>
    </div>

    <div>
      <a-modal style="top: 20px" v-model:open="isOpenCodeEditor" width="1000px"
        :title="questionDetail?.code + ' - ' + questionDetail?.name.toUpperCase()">
        <div v-if="selectedSubmission">
          <p style="margin-bottom: 5px; font-weight: bold">Thời gian nộp bài: {{ selectedSubmission?.created_at }}</p>
          <p style="margin-bottom: 5px; font-weight: bold">Ngôn ngữ: {{ selectedSubmission?.compiler.name }}</p>
          <p style="margin-bottom: 5px; font-weight: bold">Kết quả:
            <span v-if="selectedSubmission?.result === 'AC'" style="color: #2AAA2F">AC</span>
            <span v-else-if="selectedSubmission?.result === 'WA'" style="color: #FF0000">WA</span>
            <span v-else-if="selectedSubmission?.result === 'TLE'" style="color: #FF0000">TLE</span>
            <span v-else-if="selectedSubmission?.result === 'MLE'" style="color: #FF0000">MLE</span>
            <span v-else-if="selectedSubmission?.result === 'OLE'" style="color: #FF0000">OLE</span>
            <span v-else-if="selectedSubmission?.result === 'RTE'" style="color: #FF0000">RTE</span>
            <span v-else-if="selectedSubmission?.result === 'IR'" style="color: #FF0000">IR</span>
            <span v-else-if="selectedSubmission?.result === 'CE'" style="color: #FF0000">CE</span>
            <span v-else-if="selectedSubmission?.result === null">
              <LoadingOutlined />
            </span>
          </p>
        </div>

        <div class="editor-container">
          <MonacoEditor theme="vs-light" language="python" :width="900" :height="700" :options="editorOptions"
            v-model:value="submittedCode" />
        </div>

        <template #footer>
          <a-button type="primary" @click="isOpenCodeEditor = false">Đóng</a-button>
        </template>
      </a-modal>
    </div>
  </a-spin>
</template>


<style scoped>
template {
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.body {
  display: flex;
  margin-top: 90px;
}

.part-left {
  width: 80%;
  height: 100%;
}

.body-header {
  margin-left: 50px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.body-header h2 {
  font-size: 1.3rem;
  font-weight: 600;
  color: black;
}

.problem-container {
  margin-top: 20px;
  background-color: rgba(255, 255, 255, 0.35);
  border-radius: 10px;
  box-shadow: 2px 10px 20px rgba(0, 0, 0, 0.2);
  padding: 2%;
  display: flex;
  flex-direction: column;
  height: 100%;
  margin-bottom: 3%;
}

.search-container input {
  margin-left: 3px;
  border: none;
  width: 100%;
  height: 100%;
}

.underline {
  width: 100%;
  height: 1px;
  margin-top: 5px;
  background-color: #cacaca;
}

.part-right {
  width: 20%;
  height: 100%;
  margin-top: 20px;
  display: flex;
  flex-direction: column;
}

.group-icon:hover img {
  filter: invert(32%) sepia(64%) saturate(506%) hue-rotate(330deg) brightness(70%) contrast(95%);
}

.group-icon-container {
  display: flex;
  align-items: center;
  margin-left: 20px;
  width: 100%;
}

.group-icon {
  display: flex;
  align-items: center;
  width: 100%;
  margin-top: 5px;
  margin-bottom: 13px;
}

.group-icon:hover {
  cursor: pointer;
  color: #A7453C;
}

.card-content {
  margin-left: 20px;
  margin-right: 20px;
  background-color: rgba(255, 255, 255, 0.35);
  border-radius: 10px;
  box-shadow: 2px 10px 20px rgba(0, 0, 0, 0.2);
  padding: 10px;
  display: flex;
  flex-direction: column;
  margin-bottom: 10%;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
  font-size: 16px;
  text-align: left;
}

th,
td {
  border: 1px solid #ddd;
  padding: 8px;
}

th {
  background-color: #f4f4f4;
  font-weight: bold;
}

tr:nth-child(even) {
  background-color: #f9f9f9;
}

tr:hover {
  background-color: #f1f1f1;
}

.compiler-container {
  display: flex;
  align-items: center;
}

.tools-container {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.submit-container {
  width: 50%;
  display: flex;
  align-items: flex-end;
  flex-direction: column;
}

.submit-status-container {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.submit-status-container p {
  margin: 0;
}

.comment-container {
  background-color: rgba(255, 255, 255, 0.35);
  border-radius: 10px;
  box-shadow: 2px 10px 20px rgba(0, 0, 0, 0.1);
  padding: 2%;
  display: flex;
  flex-direction: column;
  height: 100%;
  margin-bottom: 3%;
}

.editor-container {
  width: 100%;
  background-color: rgba(255, 255, 255, 0.35);
  border-radius: 10px;
  box-shadow: 2px 10px 20px rgba(0, 0, 0, 0.2);
  padding: 10px;
  margin-bottom: 40px;
  margin-top: 20px;
}


.ant-checkbox-wrapper {
  display: block;
  margin: 8px 0;
}


.ellipsis-menu-container {
  position: relative;
  display: inline-block;
}

.ellipsis-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px 10px;
  font-size: 18px;
}

.ellipsis-menu {
  position: absolute;
  right: 0;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  z-index: 100;
  display: flex;
  flex-direction: column;
  min-width: 150px;
}

.ellipsis-menu button {
  padding: 8px 12px;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
}

.ellipsis-menu button:hover {
  background-color: #f5f5f5;
}




.manage-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  font-size: 14px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.test-manager-modal {
  background-color: white;
  border-radius: 8px;
  width: 500px;
  max-width: 90%;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 20px;
}

.sample-link {
  color: #0066cc;
  text-decoration: none;
}

.sample-link:hover {
  text-decoration: underline;
}

.test-cases {
  margin: 15px 0;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.test-cases ul {
  margin: 5px 0 0 20px;
  padding: 0;
}

.download-section {
  margin: 15px 0;
  text-align: right;
}

.download-button {
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  padding: 5px 15px;
  border-radius: 4px;
  cursor: pointer;
}

.upload-section {
  margin-top: 20px;
}

.file-input {
  display: flex;
  margin: 10px 0;
}

.file-input input[type="text"] {
  flex-grow: 1;
  padding: 8px;
  border: 1px solid #ccc;
  border-right: none;
  border-radius: 4px 0 0 4px;
}

.browse-button {
  padding: 8px 15px;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-left: none;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 15px;
}

.upload-button {
  background-color: white;
  color: #4CAF50;
  border: none;
  padding: 8px 20px;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-button {
  background-color: white;
  color: #f44336;
  border: none;
  padding: 8px 20px;
  border-radius: 4px;
  cursor: pointer;
}

::v-deep(.ck-editor__editable) {
  min-height: 200px;
  max-height: 500px;
  font-size: 18px;
}

::v-deep(.ck.ck-editor) {
  width: 100%;
  max-width: 1200px;
}

.fixed-dropdown {
  /* Ngăn chặn các vấn đề về layout */
  position: relative;
  z-index: 1;
}

.ant-modal-wrap {
  overflow: visible !important;
}
</style>