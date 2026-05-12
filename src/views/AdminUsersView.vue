<script setup>
import AdminHeader from "@/components/AdminHeader.vue";
import {onBeforeMount, ref, h, computed, reactive, watch} from "vue";
import {useRouter} from "vue-router";
import {
  AppstoreOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  MailOutlined,
  DownloadOutlined,
  UploadOutlined
} from "@ant-design/icons-vue";
import axios from "@/configs/axios.js";
import {message} from "ant-design-vue";

const router = useRouter();
const currentTab = ref(['users']);
const isLoading = ref(true);
const usersList = reactive([]);
const userListLoading = ref(false);
const searchQuery = ref('');
const isUploadFile = ref(false);
const searchTimeout = ref(null);

// Thêm các biến cho phân trang
const pagination = reactive({
  current: 1,
  pageSize: 50,
  total: 0,
  showSizeChanger: true,
  pageSizeOptions: ['10', '20', '50', '100'],
});

const tabs = ref([
  {
    key: 'users',
    label: 'Danh sách người dùng',
    title: 'Danh sách người dùng',
  },
  {
    key: 'addUser',
    label: 'Thêm người dùng',
    title: 'Thêm người dùng',
  },
  {
    key: 'addUsers',
    label: 'Thêm nhiều người dùng',
    title: 'Thêm nhiều người dùng',
  },
  // {
  //     key: 'activities',
  //     label: 'Hoạt động',
  //     title: 'Hoạt động',
  // }
]);

const newUser = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  status: 1,
  firstname: '',
  lastname: '',
  district: '',
  province: '',
  identity: '',
  address: '',
  phone: '',
  introduction: '',
  class: '',
  gender: '',
  sudo: 0,
  member_group: 1,
  birthDate: null,
});

const roles = ref([
  {
    value: '1',
    label: 'Sinh viên',
  },
  {
    value: 2,
    label: 'Giảng viên',
  },
  {
    value: 4,
    label: 'Giám sát',
  },
  {
    value: 6,
    label: 'Administrator',
  }
]);


const statuses = ref([
  {
    value: 1,
    label: 'Hoạt động',
  },
  {
    value: 0,
    label: 'Không hoạt động',
  }
]);


const handleLoginStudent = async (studentID) => {
  try {
    const response = await axios.get(`/users/${studentID}/login`);
    const admin_access_token = localStorage.getItem("access_token");
    const admin_user = JSON.parse(localStorage.getItem("user"));
    const admin_username = localStorage.getItem("username");
    if (response.status === 200) {
      const { access_token, user } = response.data.data;
      localStorage.setItem("admin_access_token", admin_access_token);
      localStorage.setItem("admin_user", JSON.stringify(admin_user));
      localStorage.setItem("admin_username", admin_username);
      if (!sessionStorage.getItem("teacher_access_token")) {
        sessionStorage.setItem("teacher_access_token", localStorage.getItem("access_token"));
        sessionStorage.setItem("user_teacher", localStorage.getItem("user"));
        sessionStorage.setItem("username_teacher", localStorage.getItem("username"));
      }
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("username", user.username);
      message.info(`Đăng nhập vào tài khoản: ${user.username}`);
      if(user.member_group === 1) {
        router.push(`/home`);
      } else {
        router.push(`/lecturer/questions`);
      }
    }
  } catch (error) {
    console.error("Login Error:", error);
    message.error("Đăng nhập thất bại!");
  }
};

const fetchUsers = async (page = 1, size = 50, search = '') => {
  userListLoading.value = true;
  usersList.splice(0, usersList.length);
  
  try {
    const params = {
      page: page,
      per_page: size
    };
    
    if (search && search.trim() !== '') {
      params.s = search.trim();
    }
    
    const response = await axios.get('/users', { params });
    
    const responseData = response.data;
    
    if (responseData.data) {
      usersList.push(...responseData.data.map((user, index) => {
        return {
          stt: (page - 1) * size + index + 1,
          code: user.id,
          username: user.username,
          lastname: user.last_name,
          firstname: user.first_name,
          email: user.email,
          class: user.class,
          status: user.status,
        };
      }));
      
      // Cập nhật thông tin phân trang
      pagination.current = responseData.current_page;
      pagination.total = responseData.total;
      pagination.pageSize = size;
    }
  } catch (error) {
    message.error('Lỗi khi lấy danh sách người dùng');
    console.error(error);
  } finally {
    userListLoading.value = false;
  }
};

onBeforeMount(async () => {
  if (!localStorage.getItem('access_token'))
    router.push('/login');

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  if (currentUser.member_group === 1)
    router.push('/not-found');

  await fetchUsers(pagination.current, pagination.pageSize);

  isLoading.value = false;
});

const handleTableChange = (pag, filters, sorter) => {
  fetchUsers(pag.current, pag.pageSize, searchQuery.value);
};

const handleSearch = (value) => {
  // Hủy timeout trước đó nếu có
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }
  
  // Đặt timeout mới để tránh gửi request liên tục khi người dùng đang gõ
  searchTimeout.value = setTimeout(() => {
    fetchUsers(1, pagination.pageSize, value);
  }, 500);
};

// Thay đổi watcher
watch(searchQuery, (newVal) => {
  handleSearch(newVal);
});

const genUuid = () => {
  return Math.random().toString(36).substring(7);
};

const handleAddUser = async () => {
  if (!newUser.value.username) {
    message.error('Vui lòng nhập tài khoản.');
    return;
  }

  if (!newUser.value.email || !/^\S+@\S+\.\S+$/.test(newUser.value.email)) {
    message.error('Vui lòng nhập email hợp lệ.');
    return;
  }

  if (!newUser.value.password || newUser.value.password !== newUser.value.confirmPassword) {
    message.error('Mật khẩu không khớp hoặc bị thiếu.');
    return;
  }

  if (!newUser.value.firstname) {
    message.error('Vui lòng nhập tên.');
    return;
  }

  if (!newUser.value.lastname) {
    message.error('Vui lòng nhập họ.');
    return;
  }

  let birthDate = null;

  if (newUser.value.birthDate) {
    const date = new Date(newUser.value.birthDate);
    let day = date.getDate() + '';
    let month = date.getMonth() + 1 + '';
    const year = date.getFullYear() + '';

    if (day.length === 1)
      day = '0' + day;
    if (month.length === 1)
      month = '0' + month;

    birthDate = `${day}/${month}/${year}`;
  }

  const payload = {
    username: newUser.value.username,
    email: newUser.value.email,
    password: newUser.value.password,
    status: newUser.value.status,
    first_name: newUser.value.firstname,
    last_name: newUser.value.lastname,
    district: newUser.value.district,
    province: newUser.value.province,
    citizen_id: newUser.value.identity,
    address: newUser.value.address,
    phone: newUser.value.phone,
    about: newUser.value.introduction,
    class: newUser.value.class,
    gender: newUser.value.gender,
    sudo: newUser.value.sudo,
    member_group: newUser.value.member_group,
    birthday: birthDate,
  };

  await axios.post('users', payload)
      .then(async (response) => {
        if (response.data.code === 200) {
          message.success('Thêm người dùng thành công!');

          newUser.value = {
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
            status: '',
            firstname: '',
            lastname: '',
            district: '',
            province: '',
            identity: '',
            address: '',
            phone: '',
            introduction: '',
            class: '',
            gender: '',
            sudo: 0,
            member_group: '',
            birthDate: null,
          };

          await fetchUsers(pagination.current, pagination.pageSize, searchQuery.value);
        } else {
          message.error('Lỗi khi thêm người dùng, vui lòng thử lại!');
        }
      })
      .catch((error) => {
        console.error(error);
        message.error('Lỗi khi thêm người dùng, vui lòng thử lại!');
      });
}

const addUsersForm = ref({
  file: null,
  type: 3,
  password_type: 2,
  remove_student: false,
  active_type: 2,
});

const fileName = ref('');

const handleFileUpload = (file) => {
  addUsersForm.value.file = file;
  fileName.value = file.name;
  return false;
};

const handleAddUsers = async () => {
  if (!addUsersForm.value.file) {
    message.error("Vui lòng chọn tệp Excel.");
    return;
  }

  const formData = new FormData();
  formData.append('file', addUsersForm.value.file);
  formData.append('type', addUsersForm.value.type);
  formData.append('password_type', addUsersForm.value.password_type);
  formData.append('remove_student', addUsersForm.value.remove_student ? 1 : 0);
  formData.append('active_type', addUsersForm.value.active_type);

  isUploadFile.value = true;

  try {
    const response = await axios.post('users/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.code === 200) {
      message.success("Tải tệp thành công và xử lý dữ liệu.");
      await fetchUsers(pagination.current, pagination.pageSize, searchQuery.value);
    } else {
      message.error("Có lỗi xảy ra khi xử lý tệp.");
    }
  } catch (error) {
    message.error("Lỗi trong quá trình tải lên.");
  }

  isUploadFile.value = false;
};

// Hàm lấy thông tin profile người dùng bằng token
const fetchUserProfile = async (userId) => {
  try {
    const adminToken = localStorage.getItem('admin_user_access_token');
    
    if (!adminToken) {
      message.error('Token không tồn tại, vui lòng đăng nhập lại');
      return null;
    }
    
    const response = await axios.get('/auth/profile', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    if (response.data.code === 200) {
      return response.data.data;
    } else {
      message.error('Không thể lấy thông tin profile');
      return null;
    }
  } catch (error) {
    console.error('Lỗi khi lấy thông tin profile:', error);
    message.error('Lỗi khi lấy thông tin profile');
    return null;
  }
};

const handleViewUserProfile = async (record) => {
  try {
    const response = await axios.get(`/users/${record.code}/login`);
    
    if (response.data.code === 200) {
      const { access_token, user } = response.data.data;
      
      // Lưu token và thông tin user vào localStorage
      localStorage.setItem('admin_user_access_token', access_token);
      localStorage.setItem('admin_user', JSON.stringify(user));
      
      router.push(`/admin/users/${record.code}`);
    } else {
      message.error('Không thể đăng nhập với tài khoản này');
    }
  } catch (error) {
    console.error('Lỗi khi lấy thông tin đăng nhập:', error);
    message.error('Lỗi khi lấy thông tin đăng nhập');
  }
};

</script>

<template>
  <AdminHeader/>

  <a-spin :spinning="isLoading">
    <div class="body">
      <div class="part-left">
        <div class="body-header">
          <h2>Người dùng</h2>
          <div class="underline"></div>
          <div class="part-right">
            <div class="content-container">
              <a-menu v-model:selectedKeys="currentTab" mode="horizontal" :items="tabs"
                      style="margin-bottom: 10px; font-size: 110%"/>

              <div v-if="currentTab[0] === 'users'" class="user-list-container">
                <p style="margin-top: 10px; font-size: 110%; font-weight: bold; margin-bottom: 10px">
                  Danh sách người dùng hiện có trên hệ thống:</p>

                <div style="display: flex; justify-content: space-between; margin-top: 10px">
                  <div class="search-container">
                    <img src="../static/img/search_icon.svg" alt="" style="width: 20px; margin: 0 2px;"/>
                    <a-input type="text" style="border: none; height: 100%; width: 100%;"
                             placeholder="Tìm kiếm..." v-model:value="searchQuery" 
                             @pressEnter="handleSearch(searchQuery)" @change="handleSearch(searchQuery)" allow-clear/>
                  </div>

                  <div>
                    <a-button type="primary" @click="currentTab[0] = 'addUser'">Thêm người dùng
                    </a-button>
                  </div>
                </div>

                <a-table
                    :row-key="genUuid()"
                    :data-source="usersList"
                    :pagination="pagination"
                    :loading="userListLoading"
                    @change="handleTableChange"
                >
                  <a-table-column data-index="stt" width="8%">
                    <template #title>
                      <span style="font-weight: bold">STT</span>
                    </template>
                  </a-table-column>

                  <a-table-column data-index="username" width="12%">
                    <template #title>
                      <span style="font-weight: bold">Tài khoản</span>
                    </template>
                    <template #default="{ text, record }">
                      <a @click="handleViewUserProfile(record)" style="cursor: pointer; color: #A7453C;">{{ text }}</a>
                    </template>
                  </a-table-column>

                  <a-table-column width="18%" data-index="lastname">
                    <template #title>
                      <span style="font-weight: bold">Họ</span>
                    </template>
                  </a-table-column>

                  <a-table-column width="10%" data-index="firstname">
                    <template #title>
                      <span style="font-weight: bold">Tên</span>
                    </template>
                  </a-table-column>

                  <a-table-column data-index="email">
                    <template #title>
                      <span style="font-weight: bold">Email</span>
                    </template>
                  </a-table-column>

                  <a-table-column width="15%" data-index="class">
                    <template #title>
                      <span style="font-weight: bold">Lớp</span>
                    </template>
                  </a-table-column>

                  <a-table-column width="12%" data-index="status">
                    <template #title>
                      <span style="font-weight: bold">Trạng thái</span>
                    </template>

                    <template #default="{ text }">
                      <a-tag color="green" v-if="text === 1">Hoạt động</a-tag>
                      <a-tag color="red" v-else>Không hoạt động</a-tag>
                    </template>
                  </a-table-column>

                  <a-table-column width="10%">
                    <template #title>
                      <span style="font-weight: bold">Thao tác</span>
                    </template>

                    <template #default="{ record }">
                      <a-button type="primary"
                                @click="handleLoginStudent(record.code)">
                                Đăng nhập
                      </a-button>
                    </template>
                  </a-table-column>
                </a-table>
              </div>

              <div v-if="currentTab[0] === 'addUser'" class="user-list-container">
                <p style="margin-top: 10px; font-size: 110%; font-weight: bold">Thêm người dùng mới:</p>

                <div style="margin-top: 20px">
                  <a-form layout="vertical">
                    <a-row :gutter="16">
                      <a-col :span="12">
                        <a-form-item label="Tài khoản">
                          <a-input v-model:value="newUser.username"/>
                        </a-form-item>
                      </a-col>
                      <a-col :span="12">
                        <a-form-item label="Mật khẩu">
                          <a-input type="password" v-model:value="newUser.password"/>
                        </a-form-item>
                      </a-col>
                    </a-row>

                    <a-row :gutter="16">
                      <a-col :span="12">
                        <a-form-item label="Nhập lại mật khẩu">
                          <a-input type="password" v-model:value="newUser.confirmPassword"/>
                        </a-form-item>
                      </a-col>
                      <a-col :span="12">
                        <a-form-item label="Email">
                          <a-input v-model:value="newUser.email"/>
                        </a-form-item>
                      </a-col>
                    </a-row>

                    <a-row :gutter="16">
                      <a-col :span="12">
                        <a-form-item label="Họ">
                          <a-input v-model:value="newUser.lastname"/>
                        </a-form-item>
                      </a-col>
                      <a-col :span="12">
                        <a-form-item label="Tên">
                          <a-input v-model:value="newUser.firstname"/>
                        </a-form-item>
                      </a-col>
                    </a-row>

                    <a-row :gutter="16">
                      <a-col :span="12">
                        <a-form-item label="Organization Email">
                          <a-input v-model:value="newUser.orgEmail"/>
                        </a-form-item>
                      </a-col>
                      <a-col :span="12">
                        <a-form-item label="CMND/CCCD">
                          <a-input v-model:value="newUser.identity"/>
                        </a-form-item>
                      </a-col>
                    </a-row>

                    <a-row :gutter="16">
                      <a-col :span="12">
                        <a-form-item label="Lớp">
                          <a-input v-model:value="newUser.class"/>
                        </a-form-item>
                      </a-col>
                      <a-col :span="12">
                        <a-form-item label="Ngày sinh">
                          <a-date-picker v-model:value="newUser.birthDate"
                                         format="DD/MM/YYYY"/>
                        </a-form-item>
                      </a-col>
                    </a-row>

                    <a-row :gutter="16">
                      <a-col :span="12">
                        <a-form-item label="Giới tính">
                          <a-radio-group v-model:value="newUser.gender">
                            <a-radio value="0">Nam</a-radio>
                            <a-radio value="1">Nữ</a-radio>
                          </a-radio-group>
                        </a-form-item>
                      </a-col>
                      <a-col :span="12">
                        <a-form-item label="Vai trò">
                          <a-select
                              v-model:value="newUser.member_group"
                              style="width: 100%"
                              :options="roles"
                          ></a-select>
                        </a-form-item>
                      </a-col>
                    </a-row>

                    <a-row :gutter="16">
                      <a-col :span="12">
                        <a-form-item label="Địa chỉ">
                          <a-input v-model:value="newUser.address"/>
                        </a-form-item>
                      </a-col>
                      <a-col :span="12">
                        <a-form-item label="Huyện">
                          <a-input v-model:value="newUser.district"/>
                        </a-form-item>
                      </a-col>
                    </a-row>

                    <a-row :gutter="16">
                      <a-col :span="12">
                        <a-form-item label="Tỉnh">
                          <a-input v-model:value="newUser.province"/>
                        </a-form-item>
                      </a-col>
                      <a-col :span="12">
                        <a-form-item label="Số điện thoại">
                          <a-input v-model:value="newUser.phone"/>
                        </a-form-item>
                      </a-col>
                    </a-row>

                    <a-row :gutter="16">
                      <a-col :span="12">
                        <a-form-item label="Trạng thái">
                          <a-select
                              v-model:value="newUser.status"
                              style="width: 100%"
                              :options="statuses"
                          ></a-select>
                        </a-form-item>
                      </a-col>
                    </a-row>

                    <a-row :gutter="16">
                      <a-col :span="24">
                        <a-form-item label="Giới thiệu">
                          <a-textarea v-model:value="newUser.introduction" :rows="4"
                                      placeholder="Nhập thông tin giới thiệu..."/>
                        </a-form-item>
                      </a-col>
                    </a-row>

                    <a-row :gutter="16">
                      <a-col :span="24">
                        <a-form-item>
                          <a-checkbox v-model:checked(v-model)="newUser.sudo">
                            Quản trị viên
                          </a-checkbox>
                        </a-form-item>
                      </a-col>
                    </a-row>

                    <a-row>
                      <a-col :span="24">
                        <a-form-item>
                          <a-button type="primary" block @click="handleAddUser">Thêm người
                            dùng
                          </a-button>
                        </a-form-item>
                      </a-col>
                    </a-row>
                  </a-form>
                </div>
              </div>

              <div v-if="currentTab[0] === 'addUsers'" class="user-list-container">
                <p style="margin-top: 10px; font-size: 110%; font-weight: bold">Thêm nhiều người
                  dùng:</p>

                <a-form style="margin-top: 10px" layout="vertical">
                  <a-form-item label="Sử dụng Excel để thêm dữ liệu:">
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <a-button type="primary" href="https://code.ptit.edu.vn/file_templates/MauImport_20232.xlsx"
                                download>
                        <DownloadOutlined/>
                        Tải file mẫu
                      </a-button>

                      <a-upload
                          :beforeUpload="handleFileUpload"
                          :file-list="[]"
                          accept=".xlsx,.xls"
                      >
                        <a-button>
                          <UploadOutlined/>
                          Tải file lên
                        </a-button>
                      </a-upload>
                    </div>

                    <p style="margin-top: 10px; font-style: italic;" v-if="fileName">
                      File đã chọn: <strong>{{ fileName }}</strong>
                    </p>
                  </a-form-item>

                  <a-form-item label="Chế độ">
                    <a-radio-group v-model:value="addUsersForm.type">
                      <a-radio :value="1">Chỉ thêm mới</a-radio>
                      <a-radio :value="2">Chỉ cập nhật</a-radio>
                      <a-radio :value="3">Thêm và cập nhật</a-radio>
                    </a-radio-group>
                    <a-checkbox v-model:checked="addUsersForm.remove_student" style="margin-top: 10px;">
                      Xóa sinh viên ngoài danh sách khỏi nhóm môn học
                    </a-checkbox>
                  </a-form-item>

                  <a-form-item label="Mật khẩu">
                    <a-radio-group v-model:value="addUsersForm.password_type">
                      <a-radio :value="1">Giữ nguyên tài khoản cũ</a-radio>
                      <a-radio :value="2">Cập nhật tài khoản cũ</a-radio>
                    </a-radio-group>
                  </a-form-item>

                  <a-form-item label="Mở khóa tài khoản">
                    <a-radio-group v-model:value="addUsersForm.active_type">
                      <a-radio :value="1">Giữ nguyên tài khoản cũ</a-radio>
                      <a-radio :value="2">Mở khóa tài khoản cũ</a-radio>
                    </a-radio-group>
                  </a-form-item>

                  <a-form-item>
                    <a-button :loading="isUploadFile" type="primary" block @click="handleAddUsers">Tải lên</a-button>
                  </a-form-item>
                </a-form>
              </div>


            </div>
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
  </a-spin>
</template>

<style scoped>
.body {
  color: #2c3e50;
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

.user-list-container {
  padding: 20px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

a-form-item {
  margin-bottom: 16px;
}

a-button {
  margin-top: 16px;
}

.search-container {
  display: flex;
  border: 1px solid #cacaca;
  width: 30%;
  height: 40px;
  padding: 4px;
  background-color: #fff;
  border-radius: 10px;
  margin-bottom: 10px;
}

</style>