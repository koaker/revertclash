<template>
  <div class="rc-content">
    <div class="rc-container">
      <div class="rc-card rc-mb-4">
        <div class="rc-card-header d-flex justify-content-between align-items-center">
          <h5 class="rc-mb-0">订阅链接管理</h5>
          <button @click="openCreateModal" class="rc-btn rc-btn-primary">
            <i class="bi bi-plus-circle"></i> 创建订阅链接
          </button>
        </div>
        <div class="rc-card-body">
          <p class="rc-mb-3">您可以创建订阅链接，供 Clash、Shadowrocket 等客户端直接使用，无需登录。</p>

          <!-- Loading Indicator -->
          <div v-if="store.isLoading" class="rc-alert rc-alert-info">
            <i class="bi bi-info-circle"></i> 正在加载订阅链接...
          </div>

          <!-- Error Message -->
          <div v-if="store.error" class="rc-alert rc-alert-danger">
            <i class="bi bi-x-circle"></i> 获取订阅链接失败: {{ store.error }}
          </div>

          <!-- Empty State -->
          <div v-if="!store.isLoading && !store.error && store.tokens.length === 0" class="rc-alert rc-alert-warning">
            <i class="bi bi-exclamation-triangle"></i> 您还没有创建任何订阅链接
          </div>

          <!-- Token List -->
          <div v-if="store.tokens.length > 0" class="list-group">
            <div v-for="token in store.tokens" :key="token.id" class="list-group-item">
              <div class="d-flex justify-content-between align-items-center">
                <h5 class="mb-1">
                  {{ token.name }}
                  <span :class="getStatusBadge(token).class">{{ getStatusBadge(token).text }}</span>
                </h5>
                <div>
                  <button @click="handleDelete(token.id)" class="rc-btn rc-btn-sm rc-btn-outline-danger">
                    <i class="bi bi-trash"></i>
                  </button>
                  <button @click="handleRegenerate(token.id)" class="rc-btn rc-btn-sm rc-btn-outline-primary ms-2">
                    <i class="bi bi-arrow-repeat"></i>
                  </button>
                </div>
              </div>
              <p class="mb-1">创建时间: {{ new Date(token.createdAt).toLocaleString() }}</p>
              <p class="mb-1">{{ token.expiresAt ? `过期时间: ${new Date(token.expiresAt).toLocaleDateString()}` : '永不过期' }}</p>
              <p class="mb-1">配置类型: {{ token.configTypes.join(', ') }}</p>

              <div class="mt-2">
                <div class="accordion" :id="`accordion-${token.id}`">
                  <div class="accordion-item">
                    <h2 class="accordion-header">
                      <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" :data-bs-target="`#collapse-${token.id}`">
                        显示订阅链接
                      </button>
                    </h2>
                    <div :id="`collapse-${token.id}`" class="accordion-collapse collapse" :data-bs-parent="`#accordion-${token.id}`">
                      <div class="accordion-body">
                        <div class="list-group">
                          <div v-for="urlInfo in token.subscribeUrls" :key="urlInfo.url" class="list-group-item">
                            <div class="d-flex justify-content-between align-items-center">
                              <div>
                                <h6 class="mb-1">{{ urlInfo.type }}</h6>
                                <p class="mb-1 text-break">{{ urlInfo.url }}</p>
                              </div>
                              <button @click="copyUrl(urlInfo.url, $event)" class="rc-btn rc-btn-sm rc-btn-outline-primary">
                                <i class="bi bi-clipboard"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Create Token Modal -->
  <div class="modal fade" id="createTokenModal" ref="createModalElement" tabindex="-1">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">创建订阅链接</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="handleCreate">
            <div class="mb-3">
              <label for="tokenName" class="form-label">名称</label>
              <input type="text" class="form-control" id="tokenName" v-model="newToken.name" required>
              <div class="form-text">为订阅链接指定一个易于识别的名称</div>
            </div>
            <div class="mb-3">
              <label class="form-label">配置类型</label>
              <div class="form-check">
                <input class="form-check-input" type="checkbox" value="config" id="configType1" v-model="newToken.configTypes">
                <label class="form-check-label" for="configType1">标准配置 (config)</label>
              </div>
              <div class="form-check">
                <input class="form-check-input" type="checkbox" value="processed-config" id="configType2" v-model="newToken.configTypes">
                <label class="form-check-label" for="configType2">处理后的配置 (processed-config)</label>
              </div>
            </div>
            <div class="mb-3">
              <label for="tokenExpiry" class="form-label">过期时间（可选）</label>
              <input type="date" class="form-control" id="tokenExpiry" v-model="newToken.expiresAt">
              <div class="form-text">留空表示永不过期</div>
            </div>
            <div v-if="creationError" class="alert alert-danger">{{ creationError }}</div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
          <button type="button" class="btn btn-primary" @click="handleCreate" :disabled="store.isLoading">
            {{ store.isLoading ? '创建中...' : '创建' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { Modal } from 'bootstrap';

const store = useSubscriptionStore();

const createModalElement = ref(null);
let createModal = null;

const newToken = reactive({
  name: '',
  configTypes: ['config'],
  expiresAt: ''
});
const creationError = ref(null);

onMounted(() => {
  store.fetchTokens();
  if (createModalElement.value) {
    createModal = new Modal(createModalElement.value);
  }
});

const getStatusBadge = (token) => {
  const isExpired = token.expiresAt && new Date(token.expiresAt) < new Date();
  if (!token.isActive) {
    return { class: 'badge bg-danger', text: '已禁用' };
  }
  if (isExpired) {
    return { class: 'badge bg-warning', text: '已过期' };
  }
  return { class: 'badge bg-success', text: '有效' };
};

const copyUrl = (url, event) => {
  navigator.clipboard.writeText(url).then(() => {
    const button = event.currentTarget;
    const originalIcon = button.innerHTML;
    button.innerHTML = '<i class="bi bi-check"></i>';
    setTimeout(() => {
      button.innerHTML = originalIcon;
    }, 1500);
  }).catch(err => {
    console.error('复制失败:', err);
    alert('复制失败，请手动复制');
  });
};

const handleDelete = (tokenId) => {
  if (confirm('确定要删除此订阅链接吗？此操作无法撤销。')) {
    store.deleteToken(tokenId);
  }
};

const handleRegenerate = (tokenId) => {
  if (confirm('确定要重新生成此订阅链接吗？旧链接将失效，需要更新客户端。')) {
    store.regenerateToken(tokenId);
  }
};

const openCreateModal = () => {
  // Reset form
  newToken.name = '';
  newToken.configTypes = ['config'];
  newToken.expiresAt = '';
  creationError.value = null;
  if (createModal) {
    createModal.show();
  }
};

const handleCreate = async () => {
  creationError.value = null;
  if (!newToken.name.trim()) {
    creationError.value = '请输入名称';
    return;
  }
  if (newToken.configTypes.length === 0) {
    creationError.value = '请至少选择一种配置类型';
    return;
  }

  const payload = {
    name: newToken.name.trim(),
    configTypes: newToken.configTypes,
    expiresAt: newToken.expiresAt || null
  };

  try {
    await store.createToken(payload);
    if (createModal) {
      createModal.hide();
    }
  } catch (err) {
    creationError.value = err.error || '创建失败，请检查输入或查看控制台';
  }
};
</script>

<style scoped>
.ms-2 {
  margin-left: 0.5rem;
}
.text-break {
  word-break: break-all;
}
</style>
