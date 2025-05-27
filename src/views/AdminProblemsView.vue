<script setup>
import AdminHeader from "@/components/AdminHeader.vue";
import {onBeforeMount, ref, computed, reactive, watch, createVNode} from "vue";
import {useRouter} from "vue-router";
import {EllipsisOutlined, ExclamationCircleOutlined} from "@ant-design/icons-vue";
import {usePagination} from "vue-request";
import axios from "@/configs/axios.js";
import {message, Modal} from "ant-design-vue";
import {Ckeditor, useCKEditorCloud} from "@ckeditor/ckeditor5-vue";

const router = useRouter();
const currentTab = ref(["problems"]);
const isLoading = ref(true);
const problemsList = reactive([]);
const problemListLoading = ref(false);
const filterData = ref([]);
const subjects = ref([]);
const current_subject = ref(null);
const difficulties = ref([]);
const listCompilers = ref([]);
const subTopics = ref([]);
const typeProblems = ref([]);
const statusProblems = ref([]);
const group = ref([]);
const sub_group = ref([]);
const selectedSubjects = ref([]);
const selectedGroups = [];
const selectedSubGroups = [];
const customMainFunctions = ref([]);
const listComment = reactive([])
const problemDetail = reactive({
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
const tabs = ref([
  {
    key: "problems",
    label: "Danh sách bài tập",
    title: "Danh sách bài tập",
  },
  {
    key: "addProblem",
    label: "Thêm bài tập",
    title: "Thêm bài tập",
  },
  {
    key: "comments",
    label: "Danh sách bình luận",
    title: "Danh sách bình luận"
  },
  {
    key: "confirm",
    label: "Phê duyệt bài tập",
    title: "Phê duyệt bài tập",
  },
]);

const newProblems = ref({
  code: "",
  name: "",
  content: "",
  md_content: "",
  sample: "",
  type: "",
  groups: [],
  sub_groups: [],
  level: "1",
  time_limit: 2,
  memory_limit: 56653,
  status: "0",
  banned_keyword: "",
  subjects: [],
  main_functions: [],
  compilers: [],
});

const handleAddProblems = async () => {
  if (
      !newProblems.value.code ||
      !/^[A-Za-z0-9_-]+$/u.test(newProblems.value.code) ||
      newProblems.value.code.length > 50
  ) {
    message.error("Vui lòng nhập lại code.");
    return;
  }
  if (!newProblems.value.name) {
    message.error("Vui lòng nhập tên.");
    return;
  }
  if (!newProblems.value.type) {
    message.error("Vui lòng nhập dạng đề.");
    return;
  }
  if (!newProblems.value.level) {
    message.error("Vui lòng nhập độ khó.");
    return;
  }
  if (!newProblems.value.time_limit) {
    message.error("Vui lòng nhập thời gian giới hạn.");
    return;
  }
  if (!newProblems.value.memory_limit) {
    message.error("Vui lòng nhập bộ nhớ giới hạn.");
    return;
  }
  if (!newProblems.value.status) {
    message.error("Vui lòng nhập trạng thái.");
    return;
  }
  if (!newProblems.value.subjects) {
    message.error("Vui lòng nhập môn học.");
    return;
  }
  if (showCustomMain.value) {
    // Lọc ra những compiler có hàm main không rỗng
    newProblems.value.compilers = listCompilers.value
        .filter((compiler) => {
          const codeContent = newProblems.value.main_functions?.[compiler.value] || "";
          return codeContent.trim() !== ""; // Chỉ giữ lại compiler có nội dung
        })
        .map((compiler) => compiler.value); // Lấy ID thay vì label
    newProblems.value.main_functions = listCompilers.value
        .filter((compiler) => {
          const codeContent = newProblems.value.main_functions?.[compiler.value] || "";
          return codeContent.trim() !== ""; // Chỉ giữ lại compiler có nội dung
        })
        .map((compiler) => newProblems.value.main_functions[compiler.value]); // Lấy ID thay vì label
  }


  const payload = {
    code: newProblems.value.code,
    name: newProblems.value.name,
    content: newProblems.value.content,
    md_content: newProblems.value.code,
    sample: newProblems.value.sample,
    type: newProblems.value.type,
    groups: Object.values(selectedGroups),
    sub_groups: Object.values(selectedSubGroups),
    level: newProblems.value.level,
    time_limit: newProblems.value.time_limit,
    memory_limit: newProblems.value.memory_limit,
    status: newProblems.value.status,
    banned_keyword: newProblems.value.banned_keyword,
    subjects: Array.isArray(newProblems.value.subjects)
        ? newProblems.value.subjects
        : [newProblems.value.subjects],
    main_functions: newProblems.value.main_functions,
    compilers: newProblems.value.compilers,
  };
  console.log("Payload:", payload);
  await axios
      .post("questions", payload)
      .then(async (response) => {
        if (response.data.code === 200) {
          message.success("Thêm bài tập thành công!");
          await fetchProblems(current_subject.value);
        } else {
          message.error("Lỗi khi thêm bài tập, vui lòng thử lại!");
          console.log(response.data);
        }
      })
      .catch((error) => {
        console.error(error);
        message.error("Lỗi khi thêm bài tập, vui lòng thử lại!");
      });
};
onBeforeMount(async () => {
  if (!localStorage.getItem("access_token")) router.push("/login");

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  if (currentUser.member_group === 1) router.push("/not-found");

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
  try {
    const resCompilers = await axios.get("/compilers");
    if (resCompilers.data.code === 200 && resCompilers.data.data) {
      listCompilers.value = resCompilers.data.data.map((item) => ({
        label: item.name, // hoặc tùy chỉnh label theo yêu cầu
        value: item.id,
      }));
      customMainFunctions.value = {};
      listCompilers.value.forEach((compiler) => {
        customMainFunctions.value[compiler.label] = "";
      });
    }
  } catch (error) {
    message.error("Lỗi khi lấy danh sách compilers");
    console.error(error);
  }
  try {
    // Fetch subjects
    const resSubjects = await axios.get("/subjects");
    if (resSubjects.data.data) {
      subjects.value = resSubjects.data.data.map((subject) => ({
        label: `${subject.code} - ${subject.name}`,
        value: subject.id,
      }));

      if (subjects.value.length > 0) {
        current_subject.value = subjects.value[0].value;
      }
    }
  } catch (error) {
    message.error("Lỗi khi lấy danh sách môn học");
    console.error(error);
  }
  try {
    // Fetch subjects
    const resComments = await axios.get("/comments");
    if (resComments.data.data) {
      listComment.value = resComments.data.data.map((comment) => ({
        id: comment.id,
        title: comment.question.name,
        user: comment.name,
        question: comment.question.code,
        status: comment.status,
        created_at: comment.created_at,
      }));

      if (subjects.value.length > 0) {
        current_subject.value = subjects.value[0].value;
      }
    }
  } catch (error) {
    message.error("Lỗi khi lấy danh sách bình luận");
    console.error(error);
  } finally {
    isLoading.value = false;
  }
});
const fetchProblems = async (subjectId) => {
  isLoading.value = true;
  problemListLoading.value = true;
  problemsList.splice(0, problemsList.length); // Xóa danh sách hiện tại

  try {
    const response = await axios.get(
        `/questions?page=1&per_page=500&order=asc&by=code&subject_id=${subjectId}`
    );
    const listProblems = response.data.data;

    let subGroup = new Set();
    listProblems.forEach((problem) => {
      problemsList.push({
        id: problem.id,
        code: problem.code,
        title: problem.name,
        group: problem.group?.name || "",
        subTopic: problem.sub_group?.name || "",
        difficulty: problem.question_level?.name || "",
        correct: problem.ac_user_count,
        type: problem.question_type?.name || "",
        status: problem.status,
      });

      if (problem.sub_group) {
        subGroup.add(problem.sub_group.name);
      }
    });
  } catch (error) {
    message.error("Lỗi khi lấy danh sách bài tập");
    console.log(error.message);
  } finally {
    problemListLoading.value = false;
  }
  isLoading.value = false;
};

watch(
    () => current_subject.value,
    async (newSubject) => {
      if (newSubject) {
        await fetchProblems(newSubject);
      }
    },
    {immediate: true}
);

const searchQuery = ref("");

const filteredProblems = computed(() => {
  if (!searchQuery.value) {
    return problemsList;
  }

  const query = searchQuery.value.toLowerCase();
  return problemsList.filter((problem) => {
    return (
        problem.code.toLowerCase().includes(query) ||
        problem.title.toLowerCase().includes(query)
    );
  });
});

const queryData = async (params) => {
  return problemsList;
};

const {
  data: dataSource,
  run,
  loading,
  current,
  pageSize,
} = usePagination(queryData, {
  formatResult: (res) => {
    return Array.isArray(res) ? res : [];
  },
  pagination: {
    currentKey: "page",
    pageSizeKey: "results",
  },
});

const pagination = computed(() => ({
  total: queryData().length,
  current: current.value,
  pageSize: pageSize.value,
}));

const genUuid = () => {
  return Math.random().toString(36).substring(7);
};

const handleTableChange = (pag, filters, sorter) => {
  run({
    results: pag.pageSize,
    page: pag?.current,
    sortField: sorter.field,
    sortOrder: sorter.order,
    ...filters,
  });
};

const cloud = useCKEditorCloud({
  version: "44.2.0",
  premium: true,
});

const data = ref("");

const editor = computed(() => {
  if (!cloud.data.value) {
    return null;
  }

  return cloud.data.value.CKEditor.ClassicEditor;
});

const config = computed(() => {
  if (!cloud.data.value) {
    return null;
  }

  const {
    Essentials,
    Paragraph,
    Bold,
    Italic,
    Underline,
    Strikethrough,
    BlockQuote,
    Alignment,
    Font,
    FontSize,
    FontColor,
    FontBackgroundColor,
    Link,
    List,
    Table,
    TableToolbar,
    TableProperties,
    TableCellProperties,
    Image,
    ImageUpload,
    ImageResize,
    ImageToolbar,
    MediaEmbed,
    SpecialCharacters,
    SpecialCharactersEssentials,
    Highlight,
    Clipboard,
    Typing,
    Heading,
    SourceEditing,
    Autoformat,
    FindAndReplace,
    WordCount,
  } = cloud.data.value.CKEditor;
  const {FormatPainter} = cloud.data.value.CKEditorPremiumFeatures;

  return {
    licenseKey:
        "eyJhbGciOiJFUzI1NiJ9.eyJleHAiOjE3NDIzNDIzOTksImp0aSI6ImE1MjcxYmY2LTBjNTktNDViZS04NDZhLTllN2NmNDliOWUzMyIsInVzYWdlRW5kcG9pbnQiOiJodHRwczovL3Byb3h5LWV2ZW50LmNrZWRpdG9yLmNvbSIsImRpc3RyaWJ1dGlvbkNoYW5uZWwiOlsiY2xvdWQiLCJkcnVwYWwiLCJzaCJdLCJ3aGl0ZUxhYmVsIjp0cnVlLCJsaWNlbnNlVHlwZSI6InRyaWFsIiwiZmVhdHVyZXMiOlsiKiJdLCJ2YyI6ImIyNzVmODAzIn0.OTYN1JB-xwnGdnCgZz2JE0GcV9lkutzKrmzKTzkaYayXnWWkcQcJcRcBC5YIKNmQ76YmPldmXNE-2YFvuSAftA",
    plugins: [
      Essentials,
      Paragraph,
      Bold,
      Italic,
      Underline,
      Strikethrough,
      BlockQuote,
      Alignment,
      Font,
      FontSize,
      FontColor,
      FontBackgroundColor,
      Link,
      List,
      Table,
      TableToolbar,
      TableProperties,
      TableCellProperties,
      Image,
      ImageUpload,
      ImageResize,
      ImageToolbar,
      MediaEmbed,
      SpecialCharacters,
      SpecialCharactersEssentials,
      Highlight,
      Clipboard,
      Typing,
      Heading,
      SourceEditing,
      Autoformat,
      FindAndReplace,
      WordCount,
    ],
    toolbar: [
      "sourceEditing",
      "|",
      "undo",
      "redo",
      "|",
      "bold",
      "italic",
      "underline",
      "strikethrough",
      "|",
      "heading",
      "fontSize",
      "fontColor",
      "fontBackgroundColor",
      "|",
      "alignment",
      "outdent",
      "indent",
      "|",
      "bulletedList",
      "numberedList",
      "|",
      "link",
      "blockQuote",
      "specialCharacters",
      "highlight",
      "|",
      "insertTable",
      "tableColumn",
      "tableRow",
      "mergeTableCells",
      "tableProperties",
      "tableCellProperties",
      "|",
      "imageUpload",
      "mediaEmbed",
      "|",
      "mathType",
      "|",
      "findAndReplace",
      "wordCount",
      "autoSave",
      "|",
      "formatPainter",
    ],
    typing: {
      enable: true,
    },
  };
});
// const handleContentChange = () => {
//   if (newProblems.value.content) {
//     console.log("✅ Nội dung đã nhận:", newProblems.value.content);
//   } else {
//     console.log("❌ Chưa có nội dung.");
//   }
// };
const showCustomMain = ref(false);
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

const handleSubjectChange = () => {
  selectedSubjects.value.forEach((subject) => {
    if (!selectedGroups.value[subject]) selectedGroups.value[subject] = null;
    if (!selectedSubGroups.value[subject]) selectedSubGroups.value[subject] = null;
  });
};
const showConfirm = () => {
  Modal.confirm({
    title: 'Xác nhận thêm bài tập mới',
    icon: createVNode(ExclamationCircleOutlined),
    content: createVNode(
        'div',
        {
          style: 'color:red;',
        },
        'Hãy kiểm tra kỹ thông tin trước khi thêm bài tập mới!',
    ),
    onOk() {
      handleAddProblems()

    },
    onCancel() {
    },
    class: 'test',
  });
};
const handleDeleteProblem = async (questionID) => {
  await axios.delete(`/questions/${questionID}`)
      .then(async (response) => {
        if (response.data.code === 200) {
          message.success("Xóa bài tập thành công!");
          await fetchProblems(current_subject.value);
        } else {
          message.error("Lỗi khi xóa bài tập, vui lòng thử lại!");
          console.log(response.data);
        }
      })
      .catch((error) => {
        console.error(error.response.data);
        message.error("Lỗi khi xóa bài tập, vui lòng thử lại!");
      });
}
const deleteConfirm = (questionID) => {
  Modal.confirm({
    title: 'Xác nhận xoá bài tập',
    icon: createVNode(ExclamationCircleOutlined),
    content: createVNode(
        'div',
        {
          style: 'color:red;',
        },
        'Bạn có chắc là muốn xoá bài tập này không?',
    ),
    onOk() {
      handleDeleteProblem(questionID)
    },
    onCancel() {
    },
    class: 'test',
  });
};
const open = ref(false);
const showModal = () => {
  open.value = true;
};
const handleOk = () => {
  open.value = false;
};

const handleEditProblem = async (problemAfterEdit, questionID) => {
  console.log(">> check code", questionID);
  if (
      !problemDetail.code ||
      !/^[A-Za-z0-9_-]+$/u.test(problemDetail.code) ||
      problemDetail.code.length > 50
  ) {
    message.error("Vui lòng nhập lại code.");
    return;
  }
  if(!problemAfterEdit.code) {
    message.error("Vui lòng nhập mã bài tập.");
    return;
  }
  if (!problemAfterEdit.name) {
    message.error("Vui lòng nhập tên.");
    return;
  }
  if (!problemAfterEdit.type) {
    message.error("Vui lòng nhập dạng đề.");
    return;
  }
  if (!problemAfterEdit.level) {
    message.error("Vui lòng nhập độ khó.");
    return;
  }
  if (!problemAfterEdit.time_limit) {
    message.error("Vui lòng nhập thời gian giới hạn.");
    return;
  }
  if (!problemAfterEdit.memory_limit) {
    message.error("Vui lòng nhập bộ nhớ giới hạn.");
    return;
  }
  if (!problemAfterEdit.status) {
    message.error("Vui lòng nhập trạng thái.");
    return;
  }
  if (!problemAfterEdit.subjects || problemAfterEdit.subjects.length === 0) {
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
          await fetchProblems(current_subject.value);
        } else {
          message.error("Lỗi khi cập nhật bài tập, vui lòng thử lại!");
          console.log(response.data);
        }
      })
      .catch((error) => {
        console.error(error.response.data);
        message.error("Lỗi khi cập nhật bài tập, vui lòng thử lại!");
      });
  handleOk();
};

const fetchQuestionData = async (code) => {
  try {
    const response = await axios.get(`/questions/${code}`);
    if (response.data.code === 200) {
      const data = response.data.data;

      problemDetail.code = data.code || "";
      problemDetail.name = data.name || "";
      problemDetail.content = data.content || "";
      problemDetail.md_content = data.md_content || "";
      problemDetail.sample = data.sample || "";
      problemDetail.type = data.type || "";
      problemDetail.level = data.level || "";
      problemDetail.time_limit = data.time_limit || "";
      problemDetail.memory_limit = data.memory_limit || "";
      problemDetail.status = String(data.status) || "0";
      problemDetail.banned_keyword = data.banned_keyword || "";
      problemDetail.subjects = data.subjects.map(sub => sub.id) || [];

      // Gán group và sub_group dựa vào subject được chọn
      problemDetail.groups = {};
      problemDetail.sub_groups = {};

      data.subjects.forEach(sub => {
        problemDetail.groups[sub.id] = sub.group?.id || null;
        problemDetail.sub_groups[sub.id] = sub.sub_group?.id || null;
      });

      problemDetail.compilers = data.compilers.map(compiler => compiler.id);
      problemDetail.main_functions = data.compilers.map(compiler => compiler.pivot?.main_function || "");


      console.log(problemDetail);
      console.log(response.data.data);

      showModal();
    }
  } catch (error) {
    message.error("Lỗi khi lấy dữ liệu bài tập");
    console.error(error);
  }
};


watch(
    () => problemDetail.groups,
    (newGroups) => {
      console.log("Nhóm thay đổi:", newGroups);
    },
    {deep: true}
);

watch(
    () => problemDetail.sub_groups,
    (newSubGroups) => {
      console.log("Chủ đề con thay đổi:", newSubGroups);
    },
    {deep: true}
);


</script>

<template>
  <AdminHeader/>

  <a-spin :spinning="isLoading">
    <div class="body">
      <div class="part-left">
        <div class="body-header">
          <h2>Bài tập</h2>
          <div class="underline"></div>
          <div class="part-right">
            <div class="content-container">
              <a-menu
                  v-model:selectedKeys="currentTab"
                  mode="horizontal"
                  :items="tabs"
                  style="margin-bottom: 10px; font-size: 110%"
              />

              <div
                  v-if="currentTab[0] === 'problems'"
                  class="problem-list-container"
              >
                <p style="margin-top: 10px; font-size: 110%; font-weight: bold">
                  Danh sách bài tập hiện có trên hệ thống:
                </p>

                <div style="display: flex; align-items: center">
                  <p
                      style="
                      margin-top: 10px;
                      font-size: 110%;
                      font-weight: bold;
                      margin-right: 8px;
                    "
                  >
                    Môn học:
                  </p>
                  <a-select
                      v-model:value="current_subject"
                      style="width: 24%; margin-top: 10px"
                      :options="subjects"
                  ></a-select>
                </div>

                <div
                    style="
                    display: flex;
                    justify-content: space-between;
                    margin-top: 10px;
                  "
                >
                  <div class="search-container">
                    <img src="../static/img/search_icon.svg" alt=""/>
                    <a-input
                        type="text"
                        style="border: none; height: 100%; width: 100%"
                        placeholder="Tìm kiếm..."
                        v-model:value="searchQuery"
                        allow-clear
                    />
                  </div>

                  <div>
                    <a-button
                        type="primary"
                        @click="currentTab[0] = 'addProblem'"
                    >Thêm bài tập
                    </a-button>
                  </div>
                </div>
                <div class="table-container">
                  <a-table
                      :row-key="genUuid()"
                      :data-source="filteredProblems"
                      :pagination="pagination"
                      :loading="loading"
                      @change="handleTableChange"
                  >
                    <a-table-column data-index="code" width="12%">
                      <template #title>
                        <span style="font-weight: bold">Mã</span>
                      </template>

                      <template #default="{ record }">
                        <a style="cursor: pointer; color: #a7453c">
                          {{ record.code }}
                        </a>
                      </template>
                    </a-table-column>

                    <a-table-column width="30%" data-index="title">
                      <template #title>
                        <span style="font-weight: bold">Tiêu đề</span>
                      </template>

                      <template #default="{ record }">
                        <a style="cursor: pointer; color: #a7453c">
                          {{ record.title.toUpperCase() }}
                        </a>
                      </template>
                    </a-table-column>

                    <a-table-column data-index="group">
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

                    <a-table-column width="10%" data-index="correct">
                      <template #title>
                        <span style="font-weight: bold">Làm đúng</span>
                      </template>
                    </a-table-column>

                    <a-table-column width="12%" data-index="status">
                      <template #title>
                        <span style="font-weight: bold">Trạng thái</span>
                      </template>

                      <template #default="{ text }">
                        <a-tag
                            style="width: 75px; text-align: center"
                            color="green"
                            v-if="text === 1"
                        >Công khai
                        </a-tag>
                        <a-tag
                            style="width: 75px; text-align: center"
                            color="red"
                            v-else
                        >Riêng tư
                        </a-tag>
                      </template>
                    </a-table-column>

                    <a-table-column data-index="type">
                      <template #title>
                        <span style="font-weight: bold">Loại</span>
                      </template>

                      <template #default="{ text }">
                        <a-tag
                            style="width: 75px; text-align: center"
                            color="blue"
                        >{{ text }}
                        </a-tag>
                      </template>
                    </a-table-column>

                    <a-table-column width="8%">
                      <template #title>
                        <span style="font-weight: bold">Thao tác</span>
                      </template>

                      <template #default="{ record }">
                        <a-dropdown
                            :arrow="{ pointAtCenter: true }"
                            placement="bottom"
                        >
                          <a class="ant-dropdown-link" @click.prevent>
                            <EllipsisOutlined style="font-weight: bolder"/>
                          </a>
                          <template #overlay>
                            <a-menu>
                              <a-menu-item type="primary" @click="fetchQuestionData(record.code)">Sửa</a-menu-item>
                              <a-modal v-model:open="open" title="Sửa bài tập" width="1000px"
                                      @ok="handleEditProblem(problemDetail, record.id)"
                                      :mask="false">
                                <a-form layout="vertical">
                                  <div class="form-container">
                                    <!-- Cột trái -->
                                    <div class="form-group">
                                      <a-form-item label="Mã bài tập" required>
                                        <a-input
                                            v-model:value="problemDetail.code"
                                            placeholder="Nhập mã bài tập"
                                            :rules="[
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
                                                  ]"
                                        />
                                      </a-form-item>

                                      <a-form-item label="Tiêu Đề">
                                        <a-input
                                            v-model:value="problemDetail.name"
                                            placeholder="Nhập tiêu đề"
                                        />
                                      </a-form-item>

                                      <a-form-item label="Môn học" required>
                                        <a-checkbox-group v-model:value="problemDetail.subjects">
                                          <a-checkbox v-for="subject in subjects" :key="subject.value"
                                                      :value="subject.value"
                                                      @change="handleSubjectChange">
                                            {{ subject.label }}
                                          </a-checkbox>
                                        </a-checkbox-group>
                                      </a-form-item>

                                      <div v-for="subject in problemDetail.subjects" :key="subject"
                                          class="subject-dropdowns">
                                        <h3>{{ getSubjectName(subject) }}</h3>

                                        <a-form-item label="Nhóm" required>
                                          <a-select v-model:value="problemDetail.groups[subject]"
                                                    placeholder="Chọn nhóm">
                                            <a-select-option
                                                v-for="group in filteredGroups(subject)"
                                                :key="group.value"
                                                :value="group.value"
                                            >
                                              {{ group.label }}
                                            </a-select-option>
                                          </a-select>
                                        </a-form-item>

                                        <a-form-item label="Chủ đề con" required>
                                          <a-select v-model:value="problemDetail.sub_groups[subject]"
                                                    placeholder="Chọn chủ đề con">
                                            <a-select-option
                                                v-for="subGroup in filteredSubGroups(subject)"
                                                :key="subGroup.value"
                                                :value="subGroup.value"
                                            >
                                              {{ subGroup.label }}
                                            </a-select-option>
                                          </a-select>
                                        </a-form-item>
                                      </div>
                                      <div style="display: flex; gap: 20px">
                                        <a-form-item label="Độ khó" required>
                                          <a-select
                                              v-model:value="problemDetail.level"
                                              placeholder="Chọn độ khó"
                                              :options="
                                                      difficulties.map((item) => ({
                                                        label: item.code,
                                                        value: item.value,
                                                      }))
                                                    "
                                          />
                                        </a-form-item>
                                        <a-form-item label="Thời gian giới hạn" required>
                                          <a-input
                                              v-model:value="problemDetail.time_limit"
                                              placeholder="Nhập thời gian giới hạn"
                                              :rules="[
                                                      {
                                                        required: true,
                                                        message: 'Vui lòng nhập thời gian giới hạn',
                                                      },
                                                    ]"
                                          />
                                        </a-form-item>
                                        <a-form-item label="Bộ nhớ giới hạn" required>
                                          <a-input
                                              v-model:value="problemDetail.memory_limit"
                                              placeholder="Nhập bộ nhớ giới hạn"
                                              :rules="[
                                                      {
                                                        required: true,
                                                        message: 'Vui lòng nhập bộ nhớ giới hạn',
                                                      },
                                                    ]"
                                          />
                                        </a-form-item>
                                      </div>
                                      <a-form-item label="Trạng thái" required>
                                        <a-radio-group
                                            v-model:value="problemDetail.status"
                                            style="display: flex; flex-direction: column"
                                            :rules="[
                                                    {
                                                      required: true,
                                                      message: 'Vui lòng chọn trạng thái',
                                                    },
                                                  ]"
                                        >
                                          <a-radio value="1">Công khai</a-radio>
                                          <a-radio value="0">Riêng tư</a-radio>
                                        </a-radio-group>
                                      </a-form-item>
                                      <a-form-item label="Loại bài tập" required>
                                        <a-select
                                            v-model:value="problemDetail.type"
                                            placeholder="Chọn độ khó"
                                            :options="
                                                    typeProblems.map((item) => ({
                                                      label: item.code,
                                                      value: item.value,
                                                    }))
                                                  "
                                        />
                                      </a-form-item>
                                    </div>

                                    <!-- Cột phải -->
                                    <div class="form-group">
                                      <a-form-item label="Nội dung" required>
                                        <ckeditor
                                            v-if="editor"
                                            v-model="problemDetail.content"
                                            :editor="editor"
                                            :config="config"
                                            :rules="[
                                                    {
                                                      required: true,
                                                      message: 'Vui lòng nhập nội dung',
                                                    },
                                                  ]"
                                        />
                                      </a-form-item>
                                      <a-form-item label="banned_keyword">
                                        <a-input
                                            v-model:value="problemDetail.banned_keyword"
                                            placeholder="Nhập từ khoá"
                                        />
                                      </a-form-item>
                                      <!-- Toggle Switch -->
                                      <a-form-item label="Sử dụng Custom Main Function">
                                        <a-switch v-model:checked="showCustomMain"/>
                                      </a-form-item>

                                      <!-- Các input chỉ hiện khi bật toggle -->
                                      <template v-if="showCustomMain">
                                        <a-form-item
                                            v-for="compiler in listCompilers"
                                            v-model:value="problemDetail.compilers[compiler.value]"
                                            :key="compiler.value"
                                            :label="`${compiler.label} Main Function`"
                                        >
                                          <a-textarea
                                              v-model:value="problemDetail.main_functions[compiler.value]"
                                              placeholder="Nhập code"
                                              :autoSize="{ minRows: 2, maxRows: 10 }"
                                          />
                                        </a-form-item>
                                      </template>
                                    </div>
                                  </div>
                                </a-form>
                              </a-modal>
                              <a-menu-item type="primary" @click="deleteConfirm(record.id)">Xóa</a-menu-item>
                            </a-menu>
                          </template>
                        </a-dropdown>
                      </template>
                    </a-table-column>
                  </a-table>
                </div>
              </div>

              <div
                  v-if="currentTab[0] === 'addProblem'"
                  class="problem-list-container"
              >
                <p style="margin-top: 10px; font-size: 110%; font-weight: bold">
                  Thêm bài tập mới:
                </p>
                <a-form layout="vertical">
                  <div class="form-container">
                    <!-- Cột trái -->
                    <div class="form-group">
                      <a-form-item label="Mã bài tập" required>
                        <a-input
                            v-model:value="newProblems.code"
                            placeholder="Nhập mã bài tập"
                            :rules="[
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
                          ]"
                        />
                      </a-form-item>

                      <a-form-item label="Tiêu Đề">
                        <a-input
                            v-model:value="newProblems.name"
                            placeholder="Nhập tiêu đề"
                        />
                      </a-form-item>

                      <a-form-item label="Môn học" required>
                        <a-checkbox-group v-model:value="newProblems.subjects">
                          <a-checkbox v-for="subject in subjects" :key="subject.value" :value="subject.value"
                                      @change="handleSubjectChange">
                            {{ subject.label }}
                          </a-checkbox>
                        </a-checkbox-group>
                      </a-form-item>

                      <div v-for="subject in newProblems.subjects" :key="subject" class="subject-dropdowns">
                        <h3>{{ getSubjectName(subject) }}</h3>

                        <a-form-item label="Nhóm" required>
                          <a-select v-model:value="selectedGroups[subject]" placeholder="Chọn nhóm">
                            <a-select-option v-for="group in filteredGroups(subject)" :key="group.value"
                                             :value="group.value">
                              {{ group.label }}
                            </a-select-option>
                          </a-select>
                        </a-form-item>

                        <a-form-item label="Chủ đề con" required>
                          <a-select v-model:value="selectedSubGroups[subject]" placeholder="Chọn chủ đề con">
                            <a-select-option v-for="subGroup in filteredSubGroups(subject)" :key="subGroup.value"
                                             :value="subGroup.value">
                              {{ subGroup.label }}
                            </a-select-option>
                          </a-select>
                        </a-form-item>
                      </div>

                      <div style="display: flex; gap: 20px">
                        <a-form-item label="Độ khó" required>
                          <a-select
                              v-model:value="newProblems.level"
                              placeholder="Chọn độ khó"
                              :options="
                              difficulties.map((item) => ({
                                label: item.code,
                                value: item.value,
                              }))
                            "
                          />
                        </a-form-item>
                        <a-form-item label="Thời gian giới hạn" required>
                          <a-input
                              v-model:value="newProblems.time_limit"
                              placeholder="Nhập thời gian giới hạn"
                              :rules="[
                              {
                                required: true,
                                message: 'Vui lòng nhập thời gian giới hạn',
                              },
                            ]"
                          />
                        </a-form-item>
                        <a-form-item label="Bộ nhớ giới hạn" required>
                          <a-input
                              v-model:value="newProblems.memory_limit"
                              placeholder="Nhập bộ nhớ giới hạn"
                              :rules="[
                              {
                                required: true,
                                message: 'Vui lòng nhập bộ nhớ giới hạn',
                              },
                            ]"
                          />
                        </a-form-item>
                      </div>
                      <a-form-item label="Trạng thái" required>
                        <a-radio-group
                            v-model:value="newProblems.status"
                            style="display: flex; flex-direction: column"
                            :rules="[
                            {
                              required: true,
                              message: 'Vui lòng chọn trạng thái',
                            },
                          ]"
                        >
                          <a-radio value="1">Công khai</a-radio>
                          <a-radio value="0">Riêng tư</a-radio>
                        </a-radio-group>
                      </a-form-item>
                      <a-form-item label="Loại bài tập" required>
                        <a-select
                            v-model:value="newProblems.type"
                            placeholder="Chọn độ khó"
                            :options="
                            typeProblems.map((item) => ({
                              label: item.code,
                              value: item.value,
                            }))
                          "
                        />
                      </a-form-item>
                    </div>

                    <!-- Cột phải -->
                    <div class="form-group">
                      <a-form-item label="Nội dung" required>
                        <ckeditor
                            v-if="editor"
                            v-model="newProblems.content"
                            :editor="editor"
                            :config="config"
                            :rules="[
                            {
                              required: true,
                              message: 'Vui lòng nhập nội dung',
                            },
                          ]"
                        />
                      </a-form-item>
                      <a-form-item label="banned_keyword">
                        <a-input
                            v-model:value="newProblems.banned_keyword"
                            placeholder="Nhập từ khoá"
                        />
                      </a-form-item>
                      <!-- Toggle Switch -->
                      <a-form-item label="Sử dụng Custom Main Function">
                        <a-switch v-model:checked="showCustomMain"/>
                      </a-form-item>

                      <!-- Các input chỉ hiện khi bật toggle -->
                      <template v-if="showCustomMain">
                        <a-form-item
                            v-for="compiler in listCompilers"
                            v-model:value="newProblems.compilers[compiler.value]"
                            :key="compiler.value"
                            :label="`${compiler.label} Main Function`"
                        >
                          <a-textarea
                              v-model:value="
                              newProblems.main_functions[compiler.value]
                            "
                              placeholder="Nhập code"
                              :autoSize="{ minRows: 2, maxRows: 10 }"
                          />
                        </a-form-item>
                      </template>
                    </div>
                  </div>
                </a-form>
                <div style="text-align: center; margin-top: 20px">
                  <a-button type="primary" @click="showConfirm">
                    Tạo bài mới
                  </a-button>
                </div>
              </div>

              <div v-if="currentTab[0] === 'comments'"
                   class="problem-list-container">
                <table class="table-bordered">
                  <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tài khoản</th>
                    <th>Mã</th>
                    <th>Tiêu đề</th>
                    <th>Trạng thái</th>
                    <th>Thời gian</th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr v-for="item in listComment.value" :key="item.id">
                    <td>{{ item.id }}</td>
                    <td class="red-text">{{ item.user }}</td>
                    <td>{{ item.question }}</td>
                    <td class="red-text">{{ item.title }}</td>
                    <td>{{ item.status === 1 ? "Hiển thị" : "Ẩn" }}</td>
                    <td>{{ item.created_at }}</td>
                  </tr>
                  </tbody>
                </table>

              </div>
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
            colorBorderSecondary: 'rgba(186,151,147,0.45)',
          },
        }"
      />
    </div>

    <a-config-provider
        :theme="{
        token: {
          colorPrimary: '#A7453C',
          colorTextHeading: '#000000',
          colorText: '#A7453C',
          colorBorderSecondary: 'rgba(186,151,147,0.45)',
        },
      }"
    />
  </a-spin>
</template>

<style scoped>
.body {
  color: #a7453c;
  display: flex;
  margin-top: 90px;
}

.part-left {
  width: 96%;
  margin-bottom: 5%;
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

.underline {
  width: 100%;
  height: 1px;
  margin-top: 5px;
  background-color: #cacaca;
}

.part-right {
  width: 100%;
}

.group-icon:hover img {
  filter: invert(32%) sepia(64%) saturate(506%) hue-rotate(330deg) brightness(70%) contrast(95%);
}

.group-icon-container p {
  margin-top: 12px;
}

.content-container {
  display: flex;
  flex-direction: column;
  background-color: rgba(255, 255, 255, 0.35);
  border-radius: 10px;
  box-shadow: 2px 10px 20px rgba(0, 0, 0, 0.2);
  padding: 2%;
  width: 100%;
  margin-top: 20px;
  min-height: 768px;
}

.search-container {
  display: flex;
  border: 1px solid #cacaca;
  width: 30%;
  height: 40px;
  padding: 10px;
  background-color: #fff;
  border-radius: 10px;
  margin-bottom: 10px;
}

a-radio,
a-radio-group {
  font-size: 12px;
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

.form-container {
  display: flex;
  gap: 20px; /* Khoảng cách giữa 2 cột */
}

.form-group {
  flex: 1; /* Mỗi cột chiếm 50% */
  min-width: 300px; /* Đảm bảo không bị co quá nhỏ */
}

.subject-dropdowns {
  border: 1px solid #ddd;
  padding: 15px;
  margin-bottom: 10px;
  border-radius: 5px;
}

.table-bordered {
  width: 100%;
}

.table-bordered th {
  font-weight: bold;
  background-color: #d86d64;
  color: #ffffff;
  padding: 4px;
}

.table-bordered td {
  text-align: center;
  padding-bottom: 8px;
}

.table-bordered tbody tr {
  border-bottom: #bdbdbd 1px solid;
}

</style>
