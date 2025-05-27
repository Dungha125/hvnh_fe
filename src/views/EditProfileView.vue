<script setup>
import Header from '../components/Header.vue';
import {
    PlusOutlined,
    KeyOutlined,
    FormOutlined, EyeInvisibleOutlined, EyeOutlined
} from "@ant-design/icons-vue";
import dayjs from 'dayjs';
import {ref, onMounted, onUnmounted, h, reactive, computed} from "vue";
import axios from "@/configs/axios.js";
import {message} from "ant-design-vue";
import AdminHeader from "@/components/AdminHeader.vue";


const isLoading = ref(false);
const currentTab = ref(['general']);
const items = ref([
    {
        key: 'general',
        icon: () => h(FormOutlined),
        label: 'Chỉnh sửa thông tin cá nhân',
        title: 'Chỉnh sửa thông tin cá nhân',
    },
    {
        key: 'password',
        icon: () => h(KeyOutlined),
        label: 'Đổi mật khẩu',
        title: 'Đổi mật khẩu',
    }]);
const currentUserInfo = ref(null);
const passwordInputType = ref('password');

const gender = ref(null);
const birthDate = ref(null);
const email = ref(null);
const phonenumber = ref(null);
const address = ref(null);
const isLoadingButton = ref(false);
const about = ref('');
const oldPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const fileList = ref([]);
const token = localStorage.getItem('access_token');
const headers = {
    Authorization: `Bearer ${token}`,
};

const labelCol = {
    style: {
        width: '150px',
    },
};
const wrapperCol = {
    span: 14,
};
const treeData = reactive([
    {
        title: 'Light',
        value: 'light',
        children: [
            {
                title: 'Bamboo',
                value: 'bamboo',
            },
        ],
    },
]);
const options = reactive([
    {
        value: 'zhejiang',
        label: 'Zhejiang',
        children: [
            {
                value: 'hangzhou',
                label: 'Hangzhou',
            },
        ],
    },
]);

const currentUser = ref(JSON.parse(localStorage.getItem('user')) || {});

onMounted(async () =>
{
    isLoading.value = true;
    await axios.get('auth/profile').then(response =>
    {
        currentUserInfo.value = response.data.data;
    });

    if (currentUserInfo.value.birthday)
        birthDate.value = dayjs(currentUserInfo.value.birthday, 'DD/MM/YYYY');

    email.value = currentUserInfo.value.email;
    phonenumber.value = currentUserInfo.value.phonenumber;
    address.value = currentUserInfo.value.address;
    gender.value = currentUserInfo.value.gender + '';
    about.value = currentUserInfo.value.about;
    isLoading.value = false;
});

const onSubmit = async () =>
{
    isLoadingButton.value = true;

    if (email.value)
    {
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailPattern.test(email.value))
        {
            message.error('Email không hợp lệ');
            isLoadingButton.value = false;
            return;
        }
    }

    if (phonenumber.value)
    {
        const phonePattern = /([0-9]{10})\b/;
        if (!phonePattern.test(phonenumber.value))
        {
            message.error('Số điện thoại không hợp lệ');
            isLoadingButton.value = false;
            return;
        }
    }

    if (about.value && about.value.length > 5000)
    {
        message.error('Giới thiệu không được quá 5000 ký tự');
        isLoadingButton.value = false;
        return;
    }

    const user = {
        email: email.value,
        phone: phonenumber.value,
        address: address.value,
        about: about.value,
        gender: gender.value,
        birthday: birthDate.value ? birthDate.value.format('DD/MM/YYYY') : null,
    }

    await axios.post(`users/${currentUserInfo.value.id}/update`, user).then(response =>
    {
        message.success('Cập nhật thông tin thành công');
    }).catch(error =>
    {
        message.error('Cập nhật thông tin thất bại');
    });

    await axios.get('auth/profile').then(response =>
    {
        localStorage.setItem('user', JSON.stringify(response.data.data));
    });

    isLoadingButton.value = false;
}

const handleUpdatePassword = async () =>
{
    isLoadingButton.value = true;

    if (!oldPassword.value || !newPassword.value || !confirmPassword.value)
    {
        message.error('Vui lòng nhập đầy đủ thông tin');
        isLoadingButton.value = false;
        return;
    }

    if (newPassword.value !== confirmPassword.value)
    {
        message.error('Mật khẩu xác nhận không khớp');
        isLoadingButton.value = false;
        return;
    }

    if (newPassword.value.length < 6)
    {
        message.error('Mật khẩu phải chứa ít nhất 6 ký tự');
        isLoadingButton.value = false;
        return;
    }

    if (newPassword.value === oldPassword.value)
    {
        message.error('Mật khẩu mới không được trùng với mật khẩu cũ');
        isLoadingButton.value = false;
        return;
    }

    if (newPassword.value.length > 30)
    {
        message.error('Mật khẩu không được quá 30 ký tự');
        isLoadingButton.value = false;
        return;
    }

    const data = {
        old: oldPassword.value,
        password: newPassword.value,
    }

    await axios.post(`users/change_password`, data).then(response =>
    {
        message.success('Cập nhật mật khẩu thành công');
    }).catch(error =>
    {
        message.error('Cập nhật mật khẩu thất bại');
    });

    isLoadingButton.value = false;
}

const togglePassword = () =>
{
    passwordInputType.value = passwordInputType.value === 'password' ? 'text' : 'password';
}

const beforeUpload = (file) =>
{
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng)
    {
        message.error('Chỉ được upload file JPG/PNG!');
        return false;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M)
    {
        message.error('Ảnh phải nhỏ hơn 2MB!');
    }
    return isJpgOrPng && isLt2M;
};

const handleChange = async (info) =>
{

    if (info.file.status !== 'done')
    {
        return;
    }

    currentUserInfo.value.profile_picture = info.file.response.data;

    localStorage.setItem('user', JSON.stringify(currentUserInfo.value));

    message.success('Cập nhật ảnh đại diện thành công');
};

const getDataUpload = async (file) =>
{
    const formData = new FormData();
    formData.append('file', file);

    return formData;
}
</script>

<template>
    <Header v-if="currentUser.member_group === 1"/>
    <AdminHeader v-else/>
    <a-spin :spinning="isLoading">
        <div class="body">
            <div class="part-left">
                <div class="body-header">
                    <h2>Chỉnh sửa hồ sơ người dùng</h2>
                    <div class="underline"></div>
                    <div class="part-right">
                        <div class="content-container">
                            <a-menu style="font-size: 110%" v-model:selectedKeys="currentTab" mode="horizontal"
                                    :items="items"/>
                            <div class="general-container" v-if="currentTab[0] === 'general'">
                                <a-form
                                    :label-col="labelCol"
                                    :wrapper-col="wrapperCol"
                                    layout="horizontal"
                                    style="max-width: 600px; margin-top: 20px"
                                >
                                    <a-form-item label="Ảnh đại diện">
                                        <a-upload
                                            v-model:file-list="fileList"
                                            list-type="picture-card"
                                            class="avatar-uploader"
                                            action="https://code.ptit.edu.vn/api/users/photo"
                                            :headers="headers"
                                            :data="getDataUpload"
                                            :show-upload-list="false"
                                            :before-upload="beforeUpload"
                                            @change="handleChange"
                                        >
                                            <img style="max-width: 100px; max-height: 100px"
                                                 v-if="currentUserInfo?.profile_picture"
                                                 :src="currentUserInfo?.profile_picture" alt="avatar"/>
                                            <div v-else>
                                                <plus-outlined></plus-outlined>
                                                <div class="ant-upload-text">Upload</div>
                                            </div>
                                        </a-upload>
                                    </a-form-item>

                                    <a-form-item label="Họ và tên">
                                        <a-input :value="currentUserInfo?.last_name + ' ' + currentUserInfo?.first_name"
                                                 disabled/>
                                    </a-form-item>


                                    <a-form-item label="Ngày sinh">
                                        <a-date-picker v-model:value="birthDate" format="DD/MM/YYYY"/>
                                    </a-form-item>

                                    <a-form-item label="Giới tính">
                                        <a-radio-group v-model:value="gender">
                                            <a-radio value="0">Nam</a-radio>
                                            <a-radio value="1">Nữ</a-radio>
                                        </a-radio-group>
                                    </a-form-item>

                                    <a-form-item label="Email">
                                        <a-input v-model:value="email"/>
                                    </a-form-item>

                                    <a-form-item label="Số điện thoại">
                                        <a-input v-model:value="phonenumber"/>
                                    </a-form-item>

                                    <a-form-item label="Địa chỉ">
                                        <a-input v-model:value="address"/>
                                    </a-form-item>

                                    <a-form-item label="Giởi thiệu">
                                        <a-textarea v-model:value="about" :rows="4"/>
                                    </a-form-item>

                                    <a-form-item :wrapper-col="{ span: 14, offset: 6 }">
                                        <a-button :loading="isLoadingButton" type="primary" @click="onSubmit">Lưu thông
                                            tin
                                        </a-button>
                                    </a-form-item>
                                </a-form>
                            </div>

                            <div class="history-container" v-if="currentTab[0] === 'password'">
                                <a-form
                                    :label-col="labelCol"
                                    :wrapper-col="wrapperCol"
                                    layout="horizontal"
                                    style="max-width: 600px; margin-top: 20px"
                                >

                                    <a-form-item label="Mật khẩu hiện tại">
                                        <a-input :type="passwordInputType" v-model:value="oldPassword"/>
                                    </a-form-item>

                                    <a-form-item label="Mật khẩu mới">
                                        <a-input :type="passwordInputType" v-model:value="newPassword"/>
                                    </a-form-item>

                                    <a-form-item label="Xác nhận mật khẩu">
                                        <a-input :type="passwordInputType" v-model:value="confirmPassword"/>
                                    </a-form-item>

                                    <a-form-item label="Hiển thị">
                                        <EyeOutlined v-if="passwordInputType !== 'password'" style="font-size: 20px"
                                                     class="vuesax-linear-eye" @click="togglePassword"/>
                                        <EyeInvisibleOutlined v-else style="font-size: 20px" class="vuesax-linear-eye"
                                                              @click="togglePassword"/>
                                    </a-form-item>

                                    <a-form-item :wrapper-col="{ span: 14, offset: 8 }">
                                        <a-button :loading="isLoadingButton" type="primary"
                                                  @click="handleUpdatePassword">Cập nhật mật khẩu
                                        </a-button>
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
                    colorPrimary: '#A7453C',
                    colorTextHeading: '#000000',
                    colorText: '#A7453C',
                    colorBorderSecondary: 'rgba(186,151,147,0.45)'
                },
            }"
        />
    </a-spin>
</template>

<style scoped>
.body
{
    color: #A7453C;
    display: flex;
    margin-top: 90px;
}

.part-left
{
    width: 96%;
    margin-bottom: 5%;

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

.underline
{
    width: 100%;
    height: 1px;
    margin-top: 5px;
    background-color: #cacaca;
}

.part-right
{
    width: 100%;
}

.group-icon:hover img
{
    filter: invert(32%) sepia(64%) saturate(506%) hue-rotate(330deg) brightness(70%) contrast(95%);
}

.group-icon-container p
{
    margin-top: 12px;
}

.content-container
{
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

.history-container
{
    margin-top: 10px;
}
</style>
