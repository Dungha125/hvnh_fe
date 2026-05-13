import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'

import StatusView from "@/views/StatusView.vue";
import HistoryView from "@/views/HistoryView.vue";
import RankingView from "@/views/RankingView.vue";
import HomeView from "@/views/HomeView.vue";
import ProfileView from "@/views/ProfileView.vue";
import EditProfile from "@/views/EditProfileView.vue";
import NotFoundView from "@/views/NotFoundView.vue";
import AdminUsersView from "@/views/AdminUsersView.vue";
import AdminProblemsView from "@/views/AdminProblemsView.vue";
import AdminStatusView from "@/views/AdminStatusView.vue";
import AdminRankingView from "@/views/AdminRankingView.vue";
import GuideView from "@/views/GuideView.vue";
import CallbackView from '@/views/CallbackView.vue';
import JwtSsoView from "@/views/JwtSsoView.vue";
import AdminConfigView from "@/views/AdminConfigView.vue";
import LecturerProblemsView from "@/views/lecturer/LecturerProblemsView.vue";
import LecturerStatusView from '@/views/lecturer/LecturerStatusView.vue';
import LecturerRankingView from '@/views/lecturer/LecturerRankingView.vue';
import LecturerHistoryView from '@/views/lecturer/LecturerHistoryView.vue';
import LecturerProblemsDetailView from "@/views/lecturer/LecturerProblemsDetailView.vue";
import LecturerConfigView from "@/views/lecturer/LecturerConfigView.vue";
import LecturerContestStudentListView from "@/views/lecturer/LecturerContestStudentListView.vue";
import LecturerContestTeacherListView from "@/views/lecturer/LecturerContestTeacherListView.vue";
import LecturerContestQuestionListView from "@/views/lecturer/LecturerContestQuestionListView.vue";
import LecturerContestActivityView from "@/views/lecturer/LecturerContestActivityView.vue";
import ContestViewStudent from '@/views/lecturer/ContestViewStudent.vue';
import ProblemContestViewStudent from '@/views/lecturer/ProblemContestViewStudent.vue';
import HistoryContestViewStudent from '@/views/lecturer/HistoryContestViewStudent.vue';
import AdminSemesterConfigView from '@/views/AdminSemesterConfigView.vue';
import AdminSystemConfigView from '@/views/AdminSystemConfigView.vue'
import LecturerClassStudentList from "@/views/lecturer/LecturerClassStudentList.vue";
import LecturerClassTeacherListView from "@/views/lecturer/LecturerClassTeacherListView.vue";

import ContestView from '@/views/ContestView.vue';
import ProblemContestView from '@/views/ProblemContestView.vue';
import ProblemContestDetailView from '@/views/ProblemContestDetailView.vue';
import HistoryContestView from '@/views/HistoryContestView.vue';
import LecturerRejudgeView from '@/views/lecturer/LecturerRejudgeView.vue';
import ContestRankingView from '@/views/LecturerContestRankingView.vue';
import ICPCRankingView from '@/views/lecturer/ICPCRankingView.vue';
import ICPCRankingViewStudent from '@/views/ICPCRankingViewStudent.vue';
import ProblemDetailView from '@/views/ProblemDetailView.vue';
import AdminSupportView from '@/views/AdminSupportView.vue';
import AdminUserProfileView from '@/views/AdminUserProfileView.vue';

const router = createRouter({
    history: createWebHistory(
        import.meta.env.BASE_URL),
    routes: [{
            path: '/',
            name: 'root',
            component: LoginView
        },
        {
            path: '/login',
            name: 'login',
            component: LoginView
        },
        {
            path: '/home',
            name: 'home',
            component: HomeView
        },
        {
            path: '/status',
            name: 'status',
            component: StatusView
        },
        {
            path: '/history',
            name: 'history',
            component: HistoryView
        },
        {
            path: '/ranking',
            name: 'ranking',
            component: RankingView
        },
        {
            path: '/contest',
            name: 'contest',
            component: ContestView
        },
        {
            path: '/contest/problems',
            name: 'contest-problems',
            component: ProblemContestView
        },
        {
            path: '/contest/:id/ranking',
            name: 'contest-ranking',
            component: ContestRankingView
        },
        {
            path: '/contest/ranking_contest',
            name: 'student_ranking_contest',
            component: ICPCRankingViewStudent
        },
        {
            path: '/contest/problems/:id',
            name: 'contest-problems-details',
            component: ProblemContestDetailView
        },
        {
            path: '/contest/history',
            name: 'contest-history',
            component: HistoryContestView
        },
        {
            path: '/profile',
            name: 'profile',
            component: ProfileView
        },
        {
            path: '/profile/edit',
            name: 'edit-profile',
            component: EditProfile
        },
        {
            path: '/admin/users',
            name: 'admin-home',
            component: AdminUsersView
        },
        {
            path: '/admin/users/:id',
            name: 'admin-user-profile',
            component: AdminUserProfileView
        },
        {
            path: '/admin/problems',
            name: 'admin-problems',
            component: AdminProblemsView
        },
        {
            path: '/problems/:id', 
            name: 'problem-detail',
            component: ProblemDetailView
        },
        {
            path: '/admin/status',
            name: 'admin-status',
            component: AdminStatusView
        },
        {
            path: '/admin/settings',
            name: 'admin-settings',
            component: AdminConfigView
        },
        {
            path: '/admin/contest',
            name: 'admin-test',
            component: AdminConfigView
        },
        {
            path: '/admin/semester',
            name: 'semester',
            component: AdminSemesterConfigView
        },
        {
            path: '/admin/ranking',
            name: 'admin-ranking',
            component: AdminRankingView
        },
        {
            path: '/admin/support',
            name: 'admin-support',
            component: AdminSupportView
        },
        {
            path: '/admin/class/:id/student_list',
            name: 'admin-class-student_list',
            component: LecturerClassStudentList
        },
        {
            path: '/admin/class/:id/teacher_list',
            name: 'admin-class-teacher_list',
            component: LecturerClassTeacherListView
        },
        {
            path: '/lecturer/questions',
            name: 'lecturer-questions',
            component: LecturerProblemsView
        },
        {
            path: '/lecturer/status',
            name: 'lecturer-status',
            component: LecturerStatusView
        },
        {
            path: '/lecturer/problems/:id',
            name: 'lecturer-problem-detail',
            component: LecturerProblemsDetailView
        },
        {
            path: '/lecturer/settings',
            name: 'lecturer-settings',
            component: LecturerConfigView
        },
        {
            path: '/lecturer/settings/:id/student_list',
            name: 'lecturer-student_list',
            component: LecturerContestStudentListView
        },
        {
            path: '/lecturer/settings/:id/ranking_contest',
            name: 'lecturer-student_ranking_contest',
            component: ICPCRankingView
        },
        {
            path: '/lecturer/settings/:id/teacher_list',
            name: 'lecturer-teacher_list',
            component: LecturerContestTeacherListView
        },
        {
            path: '/lecturer/settings/class/:id/student_list',
            name: 'lecturer-class-student_list',
            component: LecturerClassStudentList
        },
        {
            path: '/lecturer/settings/class/:id/teacher_list',
            name: 'lecturer-class-teacher_list',
            component: LecturerClassTeacherListView
        },
        {
            path: '/lecturer/settings/:id/list_question',
            name: 'lecturer-question_list',
            component: LecturerContestQuestionListView
        },
        {
            path: '/lecturer/settings/:id/activity',
            name: 'lecturer-contest-activity',
            component: LecturerContestActivityView
        },
        {
            path: '/lecturer/contest',
            name: 'lecturer-contest',
            component: LecturerConfigView
        },
        {
            path: '/lecturer/history',
            name: 'lecturer-history',
            component: LecturerHistoryView
        },
        {
            path: '/lecturer/ranking',
            name: 'lecturer-ranking',
            component: LecturerRankingView
        },
        {
            path: '/lecturer/contest/student',
            name: 'lecturer-contest-view-student',
            component: ContestViewStudent
        },
        {
            path: '/lecturer/contest/student/problems',
            name: 'lecturer-contest-view-student-problem',
            component: ProblemContestViewStudent
        },
        {
            path: '/lecturer/contest/student/problems/:id',
            name: 'lecturer-contest-view-student-problem-detail',
            component: ProblemContestDetailView
        },
        {
            path: '/lecturer/contest/student/history',
            name: 'lecturer-contest-view-student-history',
            component: HistoryContestViewStudent
        },
        {
            path: '/lecturer/problems/:id/rejudge',
            name: 'lecturer-problems-rejudge',
            component: LecturerRejudgeView
        },
        {
            path: '/guide',
            name: 'guide',
            component: GuideView
        },
        {
            path: '/jwt',
            name: 'jwt-sso',
            component: JwtSsoView
        },
        {
            path: '/auth/o365',
            name: 'callback',
            component: CallbackView
        },
        {
            path: '/admin/system',
            name: 'AdminSystemConfig',
            component: AdminSystemConfigView
        },
        {
            path: '/:pathMatch(.*)*',
            name: 'not-found',
            component: NotFoundView
        },
    ],
    scrollBehavior(to, from, savedPosition) {
        // Nếu có vị trí đã lưu (khi nhấn nút back/forward), thì quay lại vị trí đó
        if (savedPosition) {
            return savedPosition
        } 
        // Ngược lại, luôn cuộn lên đầu trang
        else {
            return { top: 0, behavior: 'smooth' }
        }
    },
})

router.beforeEach(async(to, from, next) => {
    // File tĩnh trong public/file/* — không để SPA bắt vào catch-all not-found; ép tải đúng URL
    if (to.path.startsWith('/file/')) {
        const baseHref = new URL(import.meta.env.BASE_URL || '/', window.location.origin).href;
        window.location.href = new URL(to.path.replace(/^\//, ''), baseHref).href;
        return false;
    }

    if (to.path === '/') {
        try {
            const user = JSON.parse(localStorage.getItem('user') || 'null');
            console.log(user)
            const contest = sessionStorage.getItem('contest');
            if (user && user.member_group === 1) {

                if (contest) {
                    next('/contest');
                } else {
                    next('/home');
                }
            } else if (user && user.member_group === 2) {
                next('/lecturer/questions')
            } else if (user && user.role === 'admin') {
                next('/admin/users');
            } else {
                next('/login');
            }
        } catch (error) {
            console.error('Lỗi kiểm tra đăng nhập:', error);
            next('/login');
        }
    } else {
        next();
    }
});


export default router