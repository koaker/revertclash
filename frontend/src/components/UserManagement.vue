<template>
  <div class="rc-card">
    <div class="rc-card-header">
      <i class="bi bi-people me-2"></i>
      用户管理
    </div>
    <div class="rc-card-body">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="mb-0">用户列表</h5>
        <button class="rc-btn rc-btn-primary rc-btn-sm" @click="openAddUserModal">
          <i class="bi bi-person-plus me-1"></i>
          添加用户
        </button>
      </div>

      <div v-if="store.isLoading" class="text-center">正在加载...</div>
      <div v-if="store.error" class="alert alert-danger">{{ store.error }}</div>

      <div v-if="!store.isLoading && store.users.length > 0" class="table-responsive">
        <table class="table table-hover">
          <thead>
            <tr>
              <th>用户名</th>
              <th>角色</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in store.users" :key="user.id">
              <td>{{ user.username }}</td>
              <td>
                <span :class="['badge', user.isAdmin ? 'bg-primary' : 'bg-secondary']">
                  {{ user.isAdmin ? '管理员' : '普通用户' }}
                </span>
              </td>
              <td>{{ new Date(user.createdAt).toLocaleString() }}</td>
              <td>
                <button
                  class="rc-btn rc-btn-outline-danger rc-btn-sm"
                  @click="handleDeleteUser(user.id)"
                  :disabled="isSelf(user.id)">
                  <i class="bi bi-trash"></i> 删除
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- 添加用户模态框 -->
  <div class="modal fade" id="addUserModal" ref="addUserModalElement" tabindex="-1">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">添加新用户</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="handleCreateUser">
            <div class="rc-form-group">
              <label for="new-username" class="rc-form-label">用户名</label>
              <input type="text" class="rc-form-control" id="new-username" v-model="newUser.username" required>
            </div>
            <div class="rc-form-group">
              <label for="add-new-password" class="rc-form-label">密码</label>
              <input type="password" class="rc-form-control" id="add-new-password" v-model="newUser.password" required>
              <div class="rc-form-text">密码长度至少6个字符</div>
            </div>
            <div class="rc-form-group">
              <div class="form-check">
                <input class="form-check-input" type="checkbox" id="isAdmin" v-model="newUser.isAdmin">
                <label class="form-check-label" for="isAdmin">管理员权限</label>
              </div>
            </div>
            <div v-if="creationError" class="alert alert-danger">{{ creationError }}</div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="rc-btn rc-btn-secondary" data-bs-dismiss="modal">取消</button>
          <button type="button" class="rc-btn rc-btn-primary" @click="handleCreateUser" :disabled="store.isLoading">
            {{ store.isLoading ? '添加中...' : '添加' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, reactive } from 'vue';
import { useUserManagementStore } from '@/stores/userManagementStore';
import { useAuthStore } from '@/stores/authStore';
import { Modal } from 'bootstrap';

const store = useUserManagementStore();
const authStore = useAuthStore();

const addUserModalElement = ref(null);
let addUserModal = null;

const newUser = reactive({
  username: '',
  password: '',
  isAdmin: false
});
const creationError = ref(null);

onMounted(() => {
  store.fetchUsers();
  if (addUserModalElement.value) {
    addUserModal = new Modal(addUserModalElement.value);
  }
});

const isSelf = (userId) => {
  return authStore.user?.id === userId;
};

const handleDeleteUser = async (userId) => {
  if (confirm('确定要删除此用户吗？此操作无法撤销。')) {
    try {
      await store.deleteUser(userId);
    } catch (error) {
      alert(error.message || '删除失败');
    }
  }
};

const openAddUserModal = () => {
  newUser.username = '';
  newUser.password = '';
  newUser.isAdmin = false;
  creationError.value = null;
  if (addUserModal) {
    addUserModal.show();
  }
};

const handleCreateUser = async () => {
  creationError.value = null;
  if (!newUser.username || !newUser.password) {
    creationError.value = '用户名和密码不能为空';
    return;
  }
  if (newUser.password.length < 6) {
    creationError.value = '密码长度至少6个字符';
    return;
  }

  try {
    await store.addUser({ ...newUser });
    if (addUserModal) {
      addUserModal.hide();
    }
  } catch (error) {
    creationError.value = error.message || '添加用户失败';
  }
};
</script>
