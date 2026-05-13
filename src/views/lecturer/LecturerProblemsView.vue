<script setup>
import {
  onBeforeMount,
  ref,
  computed,
  reactive,
  watch,
  createVNode,
} from "vue";
import { useRouter } from "vue-router";
import {
  EllipsisOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons-vue";
import { usePagination } from "vue-request";
import axios from "@/configs/axios.js";
import { message, Modal } from "ant-design-vue";
import { Ckeditor, useCKEditorCloud } from "@ckeditor/ckeditor5-vue";
import { buildProblemRichTextEditorConfig } from "@/configs/problemRichTextEditor.js";
import LecturerHeader from "@/components/LecturerHeader.vue";
import axiosInstance from "@/configs/axios.js";
import { MoreOutlined } from "@ant-design/icons-vue";

const router = useRouter();
const currentCourse = ref(null);
const currentTab = ref(["problems"]);
const isLoading = ref(true);
const problemsList = reactive([]);
const problemListLoading = ref(false);
const filterData = ref([]);
const subjects = ref([]);
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
const listComment = reactive([]);
const listApproval = reactive([]);
const courses = ref([]);
const current_course = ref(null);
const questionCode = ref(null);
const listStudyingCourses = ref([]);
let course_id = ref(null)

const problemDetailEdit = ref({
  id: "",
  code: "",
  name: "",
  content: "",
  md_content: "",
  sample: "",
  type: "",
  groups: {},
  sub_groups: {},
  level: "",
  time_limit: "",
  memory_limit: "",
  status: "",
  banned_keyword: "",
  subjects: [],
  main_functions: [],
  compilers: [],
});

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
    title: "Danh sách bình luận",
  },
  {
    key: "confirm",
    label: "Phê duyệt bài tập",
    title: "Phê duyệt bài tập",
  },
  {
    key: "managementProblem",
    label: "Quản lý bài tập",
    title: "Quản lý bài tập",
  },
  {
    key: "multipleChoiceProblem",
    label: "Câu hỏi trắc nghiệm",
    title: "Câu hỏi trắc nghiệm",
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
        const codeContent =
          newProblems.value.main_functions?.[compiler.value] || "";
        return codeContent.trim() !== ""; // Chỉ giữ lại compiler có nội dung
      })
      .map((compiler) => compiler.value); // Lấy ID thay vì label
    newProblems.value.main_functions = listCompilers.value
      .filter((compiler) => {
        const codeContent =
          newProblems.value.main_functions?.[compiler.value] || "";
        return codeContent.trim() !== ""; // Chỉ giữ lại compiler có nội dung
      })
      .map((compiler) => newProblems.value.main_functions[compiler.value]); // Lấy ID thay vì label
  }

  const payload = {
    code: newProblems.value.code,
    name: newProblems.value.name,
    content: newProblems.value.content,
    md_content: newProblems.value.md_content,
    sample: newProblems.value.sample,
    type: Number(newProblems.value.type),
    groups: Object.values(selectedGroups),
    sub_groups: Object.values(selectedSubGroups),
    level: Number(newProblems.value.level),
    time_limit: Number(newProblems.value.time_limit),
    memory_limit: Number(newProblems.value.memory_limit),
    status: Number(newProblems.value.status),
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
        await fetchProblems(current_course.value);
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

const handleDeleteProblem = async (questionID) => {
  await axios
    .delete(`/questions/${questionID}`)
    .then(async (response) => {
      if (response.data.code === 200) {
        message.success("Xóa bài tập thành công!");
        await fetchProblems(current_course.value);
      } else {
        message.error("Lỗi khi xóa bài tập, vui lòng thử lại!");
        console.log(response.data);
      }
    })
    .catch((error) => {
      console.error(error.response.data);
      message.error("Lỗi khi xóa bài tập, vui lòng thử lại!");
    });
};

const deleteConfirm = (questionID) => {
  Modal.confirm({
    title: "Xác nhận xoá bài tập",
    icon: createVNode(ExclamationCircleOutlined),
    content: createVNode(
      "div",
      {
        style: "color:red;",
      },
      "Bạn có chắc là muốn xoá bài tập này không?"
    ),
    onOk() {
      handleDeleteProblem(questionID);
    },
    onCancel() {},
    class: "test",
  });
};

const fetchProblems = async (courseId) => {
  if (courseId == null || courseId === "") {
    return;
  }
  isLoading.value = true;
  problemListLoading.value = true;
  problemsList.splice(0, problemsList.length);

  try {
    const resProblem = await axios.get("/questions", {
      params: {
        page: 1,
        per_page: 500,
        order: "asc",
        by: "code",
        course_id: courseId,
      },
    });

    const root = resProblem.data;
    const raw = root?.data;
    const list = Array.isArray(raw)
      ? raw
      : raw && Array.isArray(raw.data)
        ? raw.data
        : [];

    if (!Array.isArray(list)) {
      console.warn("Unexpected /questions response shape", root);
    }

    const rows = Array.isArray(list) ? list : [];

    const mapped = rows.map((question) => {
      const typeId =
        question.question_type_id ??
        question.question_type?.id ??
        (typeof question.type === "object" && question.type !== null
          ? question.type?.id
          : question.type);
      const statusVal =
        question.status !== undefined && question.status !== null
          ? Number(question.status)
          : 0;
      const subName =
        question.sub_group?.name ??
        (Array.isArray(question.sub_groups)
          ? question.sub_groups.map((sg) => sg.name).filter(Boolean).join(", ")
          : "");

      return {
        id: question.id,
        code: question.code ?? "",
        title: question.name ?? "Không có tiêu đề",
        group_name: question.group?.name ?? "Không có nhóm",
        subTopic: subName || "—",
        difficulty:
          question.question_level?.name ??
          question.level?.name ??
          question.level ??
          "Không xác định",
        type:
          typeId != null && typeId !== "" && !Number.isNaN(Number(typeId))
            ? Number(typeId)
            : null,
        status: Number.isNaN(statusVal) ? 0 : statusVal,
      };
    });

    problemsList.push(...mapped);
  } catch (error) {
    message.error("Lỗi khi lấy danh sách bài tập");
    console.error("Lỗi:", error.response?.data || error.message);
  } finally {
    isLoading.value = false;
    problemListLoading.value = false;
  }
};

onBeforeMount(async () => {
  if (!localStorage.getItem("access_token")) router.push("/login");

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  if (currentUser.member_group === 1) router.push("/not-found");

  try {
    const response = await axiosInstance.get("courses/studying");

    if (response.data.code === 200 && Array.isArray(response.data.data)) {
      // Lấy danh sách subjects (môn học) từ API
      subjects.value = response.data.data
        .map((item) => ({
          label: `${item.subject.code} - ${item.subject.name}`,
          value: item.subject.id,
        }))
        .filter(
          (value, index, self) =>
            index === self.findIndex((t) => t.value === value.value) // Lọc bỏ trùng lặp
        );

      courses.value = response.data.data.map((item) => ({
        label: `${item.subject.code} - ${item.subject.name} - ${item.name}`,
        value: item.id,
      }));
      console.log(courses.value);

      // console.log(subjects.value);
      // console.log(semesters.value);
      if (courses.value.length > 0) {
        course_id.value = courses.value[0].value;
      }
    } else {
      message.error("Không tìm thấy dữ liệu môn học từ API");
    }
  } catch (error) {
    message.error("Lỗi khi tải danh sách môn học từ API");
    console.error(error);
  }

  try {
    const response = await axios.get("courses/studying");
    listStudyingCourses.value = response.data.data;

    if (listStudyingCourses.value.length > 0) {
      const matchSaved = (raw) => {
        try {
          const parsed = JSON.parse(raw);
          const sid = parsed?.id;
          if (
            sid != null &&
            listStudyingCourses.value.some((c) => c.id === sid)
          ) {
            return parsed;
          }
        } catch {
          /* ignore */
        }
        return null;
      };

      const saved = localStorage.getItem("currentCourse");
      const savedCourse = saved ? matchSaved(saved) : null;

      if (savedCourse) {
        currentCourse.value = savedCourse;
        current_course.value = savedCourse.id;
      } else {
        currentCourse.value = listStudyingCourses.value[0];
        current_course.value = currentCourse.value.id;
        localStorage.setItem(
          "currentCourse",
          JSON.stringify(currentCourse.value)
        );
      }
    } else {
      message.error("Bạn chưa tham gia vào nhóm học nào!");
      isLoading.value = false;
    }
  } catch (error) {
    console.log(error);
  }

  watch(
    () => current_course.value,
    async (newCourse) => {
      if (newCourse) {
        const full = listStudyingCourses.value.find((c) => c.id === newCourse);
        if (full) {
          currentCourse.value = full;
          localStorage.setItem("currentCourse", JSON.stringify(full));
        }
        await fetchProblems(newCourse);
      }
    },
    { immediate: true }
  );

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
    // Fetch comment
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
        current_course.value = courses.value[0].value;
      }
    }
  } catch (error) {
    message.error("Lỗi khi lấy danh sách bình luận");
    console.error(error);
  }

  try {
    // Fetch approval
    const resApprovals = await axios.get("/approvals");
    if (resApprovals.data.data) {
      listApproval.value = resApprovals.data.data.map((approval) => ({
        id: approval.id,
        code: approval.question.code,
        user_last_name: approval.user.last_name,
        user_first_name: approval.user.first_name,
        question: approval.question.name,
        status: approval.status,
        created_at: approval.created_at,
      }));
      if (subjects.value.length > 0) {
        current_course.value = courses.value[0].value;
      }
    }
  } catch (error) {
    message.error("Lỗi khi lấy danh sách bài tập");
    console.log(error);
  } finally {
    isLoading.value = false;
  }
});

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
  size: 'small',
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
  "eyJhbGciOiJFUzI1NiJ9.eyJleHAiOjE3Nzk5MjYzOTksImp0aSI6IjZiNzgzMzRjLThkOWYtNDZiMy1hNzVjLWFhNTcyMjQzNTJjNyIsInVzYWdlRW5kcG9pbnQiOiJodHRwczovL3Byb3h5LWV2ZW50LmNrZWRpdG9yLmNvbSIsImRpc3RyaWJ1dGlvbkNoYW5uZWwiOlsiY2xvdWQiLCJkcnVwYWwiLCJzaCJdLCJ3aGl0ZUxhYmVsIjp0cnVlLCJsaWNlbnNlVHlwZSI6InRyaWFsIiwiZmVhdHVyZXMiOlsiKiJdLCJ2YyI6IjE2MGU1NjUyIn0.iQvcG996xDdwx8811YglKdS5qZ-fmufO3Ke7AYlTazDU8iQKwqrHnD9rdJKY2u8CG64Tk9lEeOVz0aX58c6QZA";

const config = computed(() =>
  buildProblemRichTextEditorConfig(cloud.data.value, CKEDITOR_LICENSE),
);

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
    if (!selectedSubGroups.value[subject])
      selectedSubGroups.value[subject] = null;
  });
};
const showConfirm = () => {
  Modal.confirm({
    title: "Xác nhận thêm bài tập mới",
    icon: createVNode(ExclamationCircleOutlined),
    content: createVNode(
      "div",
      {
        style: "color:red;",
      },
      "Hãy kiểm tra kỹ thông tin trước khi thêm bài tập mới!"
    ),
    onOk() {
      handleAddProblems();
    },
    onCancel() {},
    class: "test",
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
    !problemDetailEdit.value.code ||
    !/^[A-Za-z0-9_-]+$/u.test(problemDetailEdit.value.code) ||
    problemDetailEdit.value.code.length > 50
  ) {
    message.error("Vui lòng nhập lại code.");
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
  const st = problemDetailEdit.value.status;
  if (st !== 0 && st !== 1 && st !== "0" && st !== "1") {
    message.error("Vui lòng chọn trạng thái (công khai / riêng tư).");
    return;
  }
  if (
    !problemDetailEdit.value.subjects ||
    problemDetailEdit.value.subjects.length === 0
  ) {
    message.error("Vui lòng nhập môn học.");
    return;
  }

  if (showCustomMain.value) {
    // Lọc ra những compiler có hàm main không rỗng
    problemAfterEdit.compilers = listCompilers.value
      .filter((compiler) => {
        const codeContent =
          problemAfterEdit.main_functions?.[compiler.value] || "";
        return codeContent.trim() !== ""; // Chỉ giữ lại compiler có nội dung
      })
      .map((compiler) => compiler.value); // Lấy ID thay vì label
    problemAfterEdit.main_functions = listCompilers.value
      .filter((compiler) => {
        const codeContent =
          problemAfterEdit.main_functions?.[compiler.value] || "";
        return codeContent.trim() !== ""; // Chỉ giữ lại compiler có nội dung
      })
      .map((compiler) => problemAfterEdit.main_functions[compiler.value]); // Lấy ID thay vì label
  }

  const payload = {
    name: problemAfterEdit.name,
    content: problemAfterEdit.content,
    md_content: problemAfterEdit.md_content,
    sample: problemAfterEdit.sample,
    type: Number(problemAfterEdit.type),

    // ✅ Lọc ra danh sách ID hợp lệ
    groups: Object.values(problemAfterEdit.groups ?? {}).filter(
      (id) => id !== null && id !== undefined
    ),
    sub_groups: Object.values(problemAfterEdit.sub_groups ?? {}).filter(
      (id) => id !== null && id !== undefined
    ),

    level: Number(problemAfterEdit.level),
    time_limit: Number(problemAfterEdit.time_limit),
    memory_limit: Number(problemAfterEdit.memory_limit),
    status: Number(problemAfterEdit.status),
    banned_keyword: problemAfterEdit.banned_keyword,

    subjects: Array.isArray(problemAfterEdit.subjects)
      ? problemAfterEdit.subjects
      : [problemAfterEdit.subjects],

    main_functions: problemAfterEdit.main_functions,
    compilers: problemAfterEdit.compilers,
  };

  console.log("✅ Payload gửi đi:", payload);

  await axios
    .put(`/questions/${questionID}`, payload)
    .then(async (response) => {
      if (response.data.code === 200) {
        message.success("Cập nhật bài tập thành công!");
        await fetchProblems(current_course.value);
      } else {
        message.error("Lỗi khi cập nhật bài tập, vui lòng thử lại!");
        console.log(response.data);
      }
    })
    .catch((error) => {
      console.error(error.response.data);
      message.error("Lỗi khi cập nhật bài tập, vui lòng thử lại!");
    });
  closeEditModal();
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
      problemDetail.subjects = data.subjects.map((sub) => sub.id) || [];

      // Gán group và sub_group dựa vào subject được chọn
      problemDetail.groups = {};
      problemDetail.sub_groups = {};

      data.subjects.forEach((sub) => {
        problemDetail.groups[sub.id] = sub.group?.id || null;
        problemDetail.sub_groups[sub.id] = sub.sub_group?.id || null;
      });

      problemDetail.compilers = data.compilers.map((compiler) => compiler.id);
      problemDetail.main_functions = data.compilers.map(
        (compiler) => compiler.pivot?.main_function || ""
      );

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
  { deep: true }
);

watch(
  () => problemDetail.sub_groups,
  (newSubGroups) => {
    console.log("Chủ đề con thay đổi:", newSubGroups);
  },
  { deep: true }
);

const isEditModalVisible = ref(false);

// Mở popup và điền dữ liệu vào form
const openEditModal = async (problem) => {
  console.log(problem);
  if (!problem || Object.keys(problem).length === 0) {
    console.error("Không có dữ liệu bài tập!", problem);
    return;
  }

  try {
    const response = await axios.get(
      `/questions/${problem.code}?course_id=${current_course.value}`
    );
    console.log(response);

    const data = response.data?.data;
    if (data) {
      const subjectIds = (data.subjects ?? []).map((s) => s.id);
      const groupsMap = {};
      const subGroupsMap = {};
      (data.subjects ?? []).forEach((sub) => {
        groupsMap[sub.id] = sub.group?.id ?? null;
        subGroupsMap[sub.id] = sub.sub_group?.id ?? null;
      });

      problemDetailEdit.value = {
        id: data.id,
        code: data.code || "",
        name: data.name || "",
        content: data.content || "",
        md_content: data.md_content || "",
        sample: data.sample || "",
        type:
          data.question_type_id ??
          data.question_type?.id ??
          data.type ??
          "",
        groups: groupsMap,
        sub_groups: subGroupsMap,
        level:
          data.question_level_id != null
            ? String(data.question_level_id)
            : data.level != null
              ? String(data.level)
              : "",
        time_limit: data.time_limit ?? "",
        memory_limit: data.memory_limit ?? "",
        status:
          data.status !== undefined && data.status !== null
            ? String(data.status)
            : "0",
        banned_keyword: data.banned_keyword || "",
        subjects: subjectIds,
        main_functions: (data.compilers ?? []).map(
          (c) => c.pivot?.main_function ?? ""
        ),
        compilers: (data.compilers ?? []).map((c) => c.id),
      };

      isEditModalVisible.value = true;
    } else {
      console.error("Dữ liệu bài tập không hợp lệ!", response.data);
    }
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu bài tập:", error);
  }
};

// Đóng popup
const closeEditModal = () => {
  isEditModalVisible.value = false;
};

// Chuyển hướng đến detail problem
const changeDetailProblem = (questionID) => {
  try {
    router.push(`/lecturer/problems/${questionID}`);
    localStorage.setItem("questionCode", JSON.stringify(questionID));
    console.log(questionID);
  } catch (error) {
    console.log(error);
  }
};

const handleCourseChange = (value) => {
  localStorage.setItem("course_id", String(value));
  course_id.value = localStorage.getItem("course_id");
  const full = listStudyingCourses.value.find((c) => c.id === value);
  if (full) {
    currentCourse.value = full;
    localStorage.setItem("currentCourse", JSON.stringify(full));
  }
};

</script>

<template>
  <LecturerHeader />

  <a-spin :spinning="isLoading">
    <div class="body">
      <div class="part-left">
        <div class="body-header">
          <h2>Bài tập</h2>
          <div class="underline"></div>
          <div class="part-right">
            <div class="content-container">
              <div class="menu-container">
                <a-menu
                  v-model:selectedKeys="currentTab"
                  mode="horizontal"
                  :items="tabs"
                />
              </div>

              <div
                v-if="currentTab[0] === 'managementProblem'"
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
                    v-model:value="current_course"
                    style="width: 24%; margin-top: 10px"
                    :options="courses"
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
                    <img src="../../static/img/search_icon.svg" alt="" />
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
                  <table class="table-bordered">
                    <thead>
                      <tr>
                        <th>Mã</th>
                        <th>Tiêu đề</th>
                        <th>Nhóm</th>
                        <th>Chủ đề con</th>
                        <th>Loại</th>
                        <th>Độ khó</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="item in filteredProblems" :key="item.id">
                        <td
                          style="cursor: pointer"
                          @click="changeDetailProblem(item.code)"
                        >
                          {{ item.code }}
                        </td>
                        <td
                          style="cursor: pointer"
                          @click="changeDetailProblem(item.code)"
                        >
                          {{ item?.title }}
                        </td>
                        <td>{{ item?.group_name }}</td>
                        <td>{{ item.subTopic }}</td>
                        <td v-if="item.type === 1">Luyện tập</td>
                        <td v-else-if="item.type === 2">Thực hành</td>
                        <td v-else-if="item.type === 3">Thi</td>
                        <td v-else>—</td>
                        <td>{{ item.difficulty }}</td>
                        <td>
                          {{
                            item.status === 0 || item.status === "0"
                              ? "Riêng tư"
                              : "Công khai"
                          }}
                        </td>

                        <a-dropdown placement="bottomRight">
                          <template #overlay>
                            <a-menu>
                              <a-menu-item @click="openEditModal(item)">
                                <span>Sửa</span>
                              </a-menu-item>
                              <a-menu-item
                                danger
                                @click="deleteConfirm(item.id)"
                              >
                                <span>Xóa</span>
                              </a-menu-item>
                            </a-menu>
                          </template>
                          <a-button type="text">
                            <MoreOutlined style="font-size: 18px" />
                          </a-button>
                        </a-dropdown>

                        <!-- Popup cập nhật bài tập -->
                        <a-modal
                          style="width: 60%"
                          v-model:visible="isEditModalVisible"
                          title="Cập nhật bài tập"
                          @ok="
                            handleEditProblem(
                              problemDetailEdit,
                              problemDetailEdit.id
                            )
                          "
                          @cancel="closeEditModal"
                        >
                          <a-form layout="vertical">
                            <!-- Mã bài tập -->
                            <a-form-item label="Mã bài tập" required>
                              <a-input v-model:value="problemDetailEdit.code" />
                            </a-form-item>

                            <!-- Tiêu đề -->
                            <a-form-item label="Tiêu Đề">
                              <a-input v-model:value="problemDetailEdit.name" />
                            </a-form-item>

                            <!-- Môn học -->
                            <a-form-item label="Môn học" required>
                              <a-checkbox-group
                                v-model:value="problemDetailEdit.subjects"
                              >
                                <a-checkbox
                                  v-for="subject in subjects"
                                  :key="subject.id"
                                  :value="subject.value"
                                  @change="handleSubjectChange"
                                >
                                  {{ subject.label }}
                                </a-checkbox>
                              </a-checkbox-group>
                            </a-form-item>

                            <div
                              v-for="subject in problemDetailEdit.subjects"
                              :key="subject"
                              class="subject-dropdowns"
                            >
                              <h3>{{ getSubjectName(subject) }}</h3>

                              <a-form-item label="Nhóm" required>
                                <a-select
                                  v-model:value="
                                    problemDetailEdit.groups[subject]
                                  "
                                  placeholder="Chọn nhóm"
                                >
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
                                <a-select
                                  v-model:value="
                                    problemDetailEdit.sub_groups[subject]
                                  "
                                  placeholder="Chọn chủ đề con"
                                >
                                  <a-select-option
                                    v-for="subGroup in filteredSubGroups(
                                      subject
                                    )"
                                    :key="subGroup.value"
                                    :value="subGroup.value"
                                  >
                                    {{ subGroup.label }}
                                  </a-select-option>
                                </a-select>
                              </a-form-item>
                            </div>

                            <!-- Độ khó -->
                            <a-form-item label="Độ khó" required>
                              <a-select
                                v-model:value="problemDetailEdit.level"
                                placeholder="Chọn độ khó"
                                :options="difficulties"
                              />
                            </a-form-item>

                            <a-form-item label="*Thời gian giới hạn" required>
                              <a-input
                                v-model:value="problemDetailEdit.time_limit"
                              />
                            </a-form-item>

                            <a-form-item label="*Bộ nhớ giới hạn" required>
                              <a-input
                                v-model:value="problemDetailEdit.memory_limit"
                              />
                            </a-form-item>

                            <!-- Trạng thái -->
                            <a-form-item label="Trạng thái" required>
                              <a-radio-group
                                v-model:value="problemDetailEdit.status"
                              >
                                <a-radio value="1">Công khai</a-radio>
                                <a-radio value="0">Riêng tư</a-radio>
                              </a-radio-group>
                            </a-form-item>

                            <a-form-item label="*Loại bài tập" required>
                              <a-select
                                v-model:value="problemDetailEdit.type"
                                :options="typeProblems"
                              />
                            </a-form-item>

                            <!-- Nội dung -->
                            <a-form-item label="Nội dung">
                              <ckeditor
                                v-if="editor && config"
                                v-model="problemDetailEdit.content"
                                :editor="editor"
                                :config="config"
                              />
                            </a-form-item>
                          </a-form>
                        </a-modal>
                      </tr>
                    </tbody>
                  </table>
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
                          <a-checkbox
                            v-for="subject in subjects"
                            :key="subject.value"
                            :value="subject.value"
                            @change="handleSubjectChange"
                          >
                            {{ subject.label }}
                          </a-checkbox>
                        </a-checkbox-group>
                      </a-form-item>

                      <div
                        v-for="subject in newProblems.subjects"
                        :key="subject"
                        class="subject-dropdowns"
                      >
                        <h3>{{ getSubjectName(subject) }}</h3>

                        <a-form-item label="Nhóm" required>
                          <a-select
                            v-model:value="selectedGroups[subject]"
                            placeholder="Chọn nhóm"
                          >
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
                          <a-select
                            v-model:value="selectedSubGroups[subject]"
                            placeholder="Chọn chủ đề con"
                          >
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
                          v-if="editor && config"
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
                        <a-switch v-model:checked="showCustomMain" />
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

              <div
                v-if="currentTab[0] === 'comments'"
                class="problem-list-container"
              >
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

              <div
                v-if="currentTab[0] === 'confirm'"
                class="problem-list-container"
              >
                <table class="table-bordered">
                  <thead>
                    <tr>
                      <th>STT</th>
                      <th>Từ</th>
                      <th>Bài tập</th>
                      <th>Trạng thái</th>
                      <th>Thời gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in listApproval.value" :key="item.id">
                      <td>{{ item.id }}</td>
                      <td class="red-text">{{ item.user_last_name + " " + item.user_first_name }}</td>
                      <td>{{ item.question }}</td>
                      <td>{{ item.status === 1 ? "Hiển thị" : "Đang chờ" }}</td>
                      <td>{{ item.created_at }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div
                style="display: flex; flex-direction: column; gap: 10px"
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
                    v-model:value="current_course"
                    style="width: 24%; margin-top: 10px"
                    :options="courses"
                    @change="handleCourseChange"
                  />
                </div>

                <div
                  style="
                    display: flex;
                    justify-content: space-between;
                    margin-top: 10px;
                  "
                >
                  <div style="margin-bottom: 0" class="search-container">
                    <img src="../../static/img/search_icon.svg" alt="" />
                    <a-input
                      type="text"
                      style="
                        margin-bottom: 0%;
                        border: none;
                        height: 100%;
                        width: 100%;
                      "
                      placeholder="Tìm kiếm..."
                      v-model:value="searchQuery"
                      allow-clear
                    />
                  </div>
                </div>
                <table style="margin-top: 0" class="table-bordered">
                  <thead>
                    <tr>
                      <th>STT</th>
                      <th>Mã</th>
                      <th>Tiêu đề</th>
                      <th>Nhóm</th>
                      <th>Chủ đề con</th>
                      <th>Độ khó</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, index) in filteredProblems" :key="item.id">
                      <td>{{ index + 1 }}</td>
                      <td style="cursor: pointer" @click="changeDetailProblem(item.code)">{{ item.code }}</td>
                      <td style="cursor: pointer" @click="changeDetailProblem(item.code)">{{ item?.title }}</td>
                      <td>{{ item?.group_name }}</td>
                      <td>{{ item.subTopic }}</td>
                      <td>{{ item.difficulty }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div
                v-if="currentTab[0] === 'multipleChoiceProblem'"
                class="problem-list-container"
              >
                <table class="table-bordered">
                  <thead>
                    <tr>
                      <th>Mã</th>
                      <th>Tiêu đề</th>
                      <th>Loại</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody></tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <a-config-provider
          :theme="{
            token: {
              colorPrimary: '#00AFFF', /* Màu nhấn chính, rực rỡ */
              colorTextHeading: '#007ACC',  /* Màu cho tiêu đề */
              colorText: '#2c3e50',       /* Màu chữ chính */
              colorBorderSecondary: '#D9E2EC', /* Màu viền phụ, nhạt */
            },
          }"
        />
      </div>

    </div>
  </a-spin>
</template>

<style scoped>
.body {
  color: #2c3e50;
  display: flex;
  margin-top: 90px;
  background-color: #f5f7fa;
  padding: 24px 40px;
}

.part-left {
  width: 100%;
  margin-bottom: 5%;
}

.body-header {
  margin-left: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.body-header h2 {
  font-size: 1.6rem;
  font-weight: 700;
  color: #007acc;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.underline {
  width: 100%;
  height: 2px;
  margin-top: 8px;
  background: linear-gradient(90deg, #00afff, #b3e5fc);
}

.content-container {
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 90, 170, 0.08);
  border: 1px solid #d9e2ec;
  padding: 24px;
  width: 100%;
  margin-top: 20px;
  min-height: 768px;
}

.search-container {
  display: flex;
  align-items: center;
  border: 1px solid #d9e2ec;
  width: 35%;
  height: 48px;
  padding: 10px;
  background-color: #fff;
  border-radius: 8px;
  margin-bottom: 20px;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.search-container img {
  margin-right: 8px;
  flex-shrink: 0;
  height: 24px;
  width: 24px;
}

.search-container :deep(.ant-input) {
  border: none;
  height: 100%;
  width: 100%;
  padding: 0 8px;
  font-size: 15px;
  background: transparent;
  line-height: 48px;
}

.search-container :deep(.ant-input:focus) {
  box-shadow: none;
}

.search-container :deep(.ant-input::placeholder) {
  color: #a0aec0;
}

.search-container:focus-within {
  border-color: #00afff;
  box-shadow: 0 0 0 3px rgba(0, 175, 255, 0.15);
}

::v-deep(.ck.ck-editor) {
  width: 100%;
  max-width: 1200px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #d9e2ec;
}

::v-deep(.ck-editor__editable) {
  min-height: 200px;
  max-height: 500px;
  font-size: 16px;
  background-color: #ffffff;
  color: #2c3e50;
}

::v-deep(.ck.ck-toolbar) {
  background-color: #f8f9fc;
  border-bottom: 1px solid #d9e2ec;
}

.form-container {
  display: flex;
  gap: 24px;
}

.form-group {
  flex: 1;
  min-width: 300px;
}

.subject-dropdowns {
  border: 1px solid #d9e2ec;
  padding: 15px;
  margin-bottom: 10px;
  border-radius: 8px;
  background-color: #fafcfe;
}

.table-bordered {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.table-bordered th {
  font-weight: 600;
  background-color: #f0f5fa;
  color: #007acc;
  padding: 12px 16px;
  border: 1px solid #e8eff5;
  text-align: center;
  font-size: 14px;
}

.table-bordered td {
  text-align: center;
  padding: 12px 16px;
  border: 1px solid #e8eff5;
  font-size: 14px;
  color: #2c3e50;
}

.table-bordered tbody tr {
  border-bottom: none;
  transition: background-color 0.2s ease;
}

.table-bordered tbody tr:hover td {
  background-color: rgba(0, 175, 255, 0.05);
}

.red-text {
  color: #ff4d4f;
  font-weight: 500;
}

/* Ant Design Components Customization */
:deep(.ant-btn-primary) {
  background-color: #00afff;
  border-color: #00afff;
  box-shadow: 0 2px 0 rgba(0, 175, 255, 0.1);
}

:deep(.ant-btn-primary:hover) {
  background-color: #0099e6;
  border-color: #0099e6;
}

:deep(.ant-input) {
  border-color: #d9e2ec;
  border-radius: 8px;
}

:deep(.ant-input:hover),
:deep(.ant-input:focus) {
  border-color: #00afff;
  box-shadow: 0 0 0 2px rgba(0, 175, 255, 0.1);
}

:deep(.ant-select-selector) {
  border-color: #d9e2ec !important;
  border-radius: 8px !important;
}

:deep(.ant-select-focused .ant-select-selector) {
  border-color: #00afff !important;
  box-shadow: 0 0 0 2px rgba(0, 175, 255, 0.1) !important;
}

:deep(.ant-radio-wrapper) {
  color: #2c3e50;
}

:deep(.ant-checkbox-wrapper) {
  color: #2c3e50;
}

:deep(.ant-form-item-label > label) {
  color: #2c3e50;
  font-weight: 500;
}

:deep(.ant-modal-content) {
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 90, 170, 0.08);
}

:deep(.ant-modal-header) {
  border-radius: 12px 12px 0 0;
  background-color: #f8f9fc;
  border-bottom: 1px solid #d9e2ec;
}

:deep(.ant-modal-title) {
  color: #007acc;
  font-weight: 600;
}

:deep(.ant-menu) {
  background: transparent;
  border-bottom: 1px solid #e8eff5;
  padding: 0 16px;
}

:deep(.ant-menu-item) {
  color: #2c3e50;
  font-size: 15px;
  font-weight: 500;
  padding: 0 20px;
  margin: 0 4px;
  height: 48px;
  line-height: 48px;
  transition: all 0.3s ease;
}

:deep(.ant-menu-item:hover) {
  color: #00afff !important;
  background-color: rgba(0, 175, 255, 0.05);
}

:deep(.ant-menu-item-selected) {
  color: #00afff !important;
  font-weight: 600;
  background-color: rgba(0, 175, 255, 0.08);
  border-bottom: 2px solid #00afff;
}

:deep(.ant-menu-item::after) {
  display: none;
}

/* Menu Container */
.menu-container {
  margin-bottom: 24px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* Responsive Menu */
@media screen and (max-width: 768px) {
  .body {
    padding: 16px;
    margin-top: 70px;
  }

  .content-container {
    padding: 16px;
    min-height: auto;
  }

  .search-container {
    width: 100%;
    margin-bottom: 16px;
  }

  .form-container {
    flex-direction: column;
    gap: 16px;
  }

  .form-group {
    min-width: 100%;
  }

  .table-bordered {
    display: block;
    overflow-x: auto;
    white-space: nowrap;
    -webkit-overflow-scrolling: touch;
  }

  .table-bordered th,
  .table-bordered td {
    padding: 8px 12px;
    font-size: 13px;
  }

  /* Adjust modal for mobile */
  :deep(.ant-modal) {
    width: 95% !important;
    max-width: none;
    margin: 10px auto;
  }

  :deep(.ant-modal-content) {
    padding: 16px;
  }

  /* Adjust form items for mobile */
  :deep(.ant-form-item) {
    margin-bottom: 16px;
  }

  :deep(.ant-form-item-label) {
    padding-bottom: 4px;
  }

  /* Adjust select dropdowns for mobile */
  :deep(.ant-select) {
    width: 100% !important;
  }

  /* Adjust buttons for mobile */
  :deep(.ant-btn) {
    width: 100%;
    margin-bottom: 8px;
  }

  /* Adjust menu items for mobile */
  :deep(.ant-menu) {
    padding: 0 8px;
  }

  /* Adjust CKEditor for mobile */
  ::v-deep(.ck.ck-editor) {
    max-width: 100%;
  }

  ::v-deep(.ck-editor__editable) {
    min-height: 150px;
    max-height: 300px;
  }

  /* Adjust subject dropdowns for mobile */
  .subject-dropdowns {
    padding: 12px;
  }

  .subject-dropdowns h3 {
    font-size: 14px;
    margin-bottom: 8px;
  }

  /* Adjust header for mobile */
  .body-header h2 {
    font-size: 1.4rem;
  }

  /* Adjust search icon for mobile */
  .search-container img {
    height: 20px;
    width: 20px;
  }

  /* Adjust input text for mobile */
  .search-container :deep(.ant-input) {
    font-size: 14px;
  }

  .menu-container {
    margin-bottom: 16px;
  }
}

/* Additional breakpoint for very small devices */
@media screen and (max-width: 480px) {
  .body {
    padding: 12px;
  }

  .content-container {
    padding: 12px;
  }

  .table-bordered th,
  .table-bordered td {
    padding: 6px 8px;
    font-size: 12px;
  }

  .body-header h2 {
    font-size: 1.2rem;
  }

  :deep(.ant-modal-content) {
    padding: 12px;
  }

  .menu-container {
    padding: 0 4px;
  }

  :deep(.ant-menu-item) {
    font-size: 13px;
    padding: 0 8px;
    margin: 0 1px;
  }
}

/* Active Tab Indicator */
:deep(.ant-menu-item-selected::before) {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #00afff;
  border-radius: 2px 2px 0 0;
}

/* Menu Item Icons */
:deep(.ant-menu-item .anticon) {
  margin-right: 8px;
  font-size: 16px;
}

/* Menu Item Badge */
:deep(.ant-menu-item .ant-badge) {
  margin-left: 8px;
}

/* Menu Item Count */
:deep(.ant-menu-item .count) {
  background: #f0f5fa;
  color: #2c3e50;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  margin-left: 8px;
}

/* Menu Item Hover Effect */
:deep(.ant-menu-item:hover) {
  transform: translateY(-1px);
}

/* Menu Item Active State */
:deep(.ant-menu-item-selected) {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 175, 255, 0.15);
}

/* Menu Item Disabled State */
:deep(.ant-menu-item-disabled) {
  color: #a0aec0 !important;
  cursor: not-allowed;
  background: #f8f9fc;
}

/* Menu Item Loading State */
:deep(.ant-menu-item-loading) {
  position: relative;
  overflow: hidden;
}

:deep(.ant-menu-item-loading::after) {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}
</style>
