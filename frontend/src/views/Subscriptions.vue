<template>
  <div class="subscriptions-view">
    <!-- 页面头部区域 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-main">
          <div class="header-icon">
            <i class="bi bi-link-45deg"></i>
          </div>
          <div class="header-text">
            <h1 class="page-title">订阅管理</h1>
            <p class="page-subtitle">创建和管理您的订阅链接，供各种客户端使用</p>
          </div>
        </div>
        <div class="header-actions">
          <button
            class="premium-btn premium-btn-secondary premium-btn-md"
            @click="store.fetchTokens"
            :disabled="store.isLoading"
          >
            <i class="bi bi-arrow-clockwise"></i>
            <span>{{ store.isLoading ? '刷新中...' : '刷新数据' }}</span>
          </button>
          <button
            class="premium-btn premium-btn-primary premium-btn-md"
            @click="openCreateModal"
          >
            <i class="bi bi-plus-circle"></i>
            <span>创建订阅链接</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 功能介绍卡片 -->
    <div class="info-banner">
      <div class="premium-card premium-card-glass">
        <div class="premium-card-body">
          <div class="info-content">
            <div class="info-main">
              <div class="info-icon">
                <i class="bi bi-info-circle"></i>
              </div>
              <div class="info-text">
                <h3 class="info-title">关于订阅链接</h3>
                <p class="info-description">
                  您可以创建订阅链接，供 Clash、Shadowrocket 等客户端直接使用，无需登录即可获取节点配置。
                </p>
              </div>
            </div>
            <div class="info-features">
              <div class="feature-item">
                <div class="feature-icon">
                  <i class="bi bi-shield-check"></i>
                </div>
                <span class="feature-text">安全访问</span>
              </div>
              <div class="feature-item">
                <div class="feature-icon">
                  <i class="bi bi-arrow-clockwise"></i>
                </div>
                <span class="feature-text">自动更新</span>
              </div>
              <div class="feature-item">
                <div class="feature-icon">
                  <i class="bi bi-devices"></i>
                </div>
                <span class="feature-text">多端支持</span>
              </div>
              <div class="feature-item">
                <div class="feature-icon">
                  <i class="bi bi-graph-up"></i>
                </div>
                <span class="feature-text">实时监控</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="content-area">
      <!-- 加载状态 -->
      <div v-if="store.isLoading" class="loading-state">
        <div class="premium-card premium-card-glass">
          <div class="premium-card-body ds-text-center">
            <div class="premium-spinner premium-spinner-lg ds-text-primary mb-4"></div>
            <h3 class="ds-text-xl ds-font-semibold ds-text-primary mb-2">正在加载订阅链接</h3>
            <p class="ds-text-secondary">请稍候，正在获取最新数据...</p>
          </div>
        </div>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="store.error" class="error-state">
        <div class="premium-card premium-card-elevated">
          <div class="premium-card-body ds-text-center">
            <div class="error-icon">
              <i class="bi bi-exclamation-triangle"></i>
            </div>
            <h3 class="ds-text-xl ds-font-semibold ds-text-primary mb-2">加载失败</h3>
            <p class="ds-text-secondary mb-4">{{ store.error }}</p>
            <button class="premium-btn premium-btn-primary" @click="store.fetchTokens">
              <i class="bi bi-arrow-clockwise"></i>
              重新加载
            </button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else-if="!store.isLoading && store.tokens.length === 0" class="empty-state">
        <div class="premium-card premium-card-elevated">
          <div class="premium-card-body ds-text-center">
            <div class="empty-icon">
              <i class="bi bi-link-45deg"></i>
            </div>
            <h3 class="ds-text-2xl ds-font-bold ds-text-primary mb-2">开始创建您的第一个订阅链接</h3>
            <p class="ds-text-secondary mb-6">订阅链接可以让您的设备自动同步最新的节点配置</p>
            <div class="empty-actions">
              <button class="premium-btn premium-btn-primary premium-btn-lg" @click="openCreateModal">
                <i class="bi bi-plus-circle"></i>
                创建第一个订阅链接
              </button>
              <button class="premium-btn premium-btn-outline premium-btn-lg">
                <i class="bi bi-question-circle"></i>
                了解更多
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 订阅链接网格 -->
      <div v-else class="subscriptions-section">
        <!-- 订阅统计 -->
        <div class="subscription-stats">
          <div class="stats-item">
            <div class="stats-number">{{ store.tokens.length }}</div>
            <div class="stats-label">总订阅数</div>
          </div>
          <div class="stats-item">
            <div class="stats-number">{{ getActiveSubscriptionsCount() }}</div>
            <div class="stats-label">活跃订阅</div>
          </div>
          <div class="stats-item">
            <div class="stats-number">{{ getTotalAccessCount() }}</div>
            <div class="stats-label">总访问次数</div>
          </div>
        </div>

        <!-- 订阅链接列表 -->
        <div class="subscriptions-grid">
          <div
            v-for="token in store.tokens"
            :key="token.id"
            class="subscription-card"
          >
            <!-- 卡片头部 -->
            <div class="card-header">
              <div class="card-title-section">
                <div class="card-icon">
                  <i class="bi bi-link-45deg"></i>
                </div>
                <div class="card-title-text">
                  <h4 class="card-title">{{ token.name }}</h4>
                  <div class="card-meta">
                    <span class="meta-item">
                      <i class="bi bi-calendar"></i>
                      {{ formatDate(token.created_at) }}
                    </span>
                  </div>
                </div>
              </div>
              <div class="card-actions">
                <div class="action-dropdown">
                  <button class="action-btn dropdown-toggle" data-bs-toggle="dropdown">
                    <i class="bi bi-three-dots"></i>
                  </button>
                  <ul class="dropdown-menu">
                    <li>
                      <button class="dropdown-item" @click="copySubscriptionUrl(token)">
                        <i class="bi bi-clipboard"></i>
                        复制链接
                      </button>
                    </li>
                    <li>
                      <button class="dropdown-item" @click="viewSubscriptionDetails(token)">
                        <i class="bi bi-eye"></i>
                        查看详情
                      </button>
                    </li>
                    <li><hr class="dropdown-divider"></li>
                    <li>
                      <button class="dropdown-item text-danger" @click="deleteToken(token)">
                        <i class="bi bi-trash"></i>
                        删除订阅
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- 卡片内容 -->
            <div class="card-body">
              <!-- 状态指示器 -->
              <div class="status-section">
                <div class="status-indicator active">
                  <div class="status-dot"></div>
                  <span class="status-text">活跃</span>
                </div>
                <div class="status-badge">
                  <i class="bi bi-shield-check"></i>
                  <span>安全链接</span>
                </div>
              </div>

              <!-- 统计信息 -->
              <div class="stats-grid">
                <div class="stat-item">
                  <div class="stat-icon">
                    <i class="bi bi-eye"></i>
                  </div>
                  <div class="stat-content">
                    <div class="stat-number">{{ token.access_count || 0 }}</div>
                    <div class="stat-label">访问次数</div>
                  </div>
                </div>
                <div class="stat-item">
                  <div class="stat-icon">
                    <i class="bi bi-clock"></i>
                  </div>
                  <div class="stat-content">
                    <div class="stat-number">{{ token.last_accessed ? formatRelativeTime(token.last_accessed) : '从未' }}</div>
                    <div class="stat-label">最后访问</div>
                  </div>
                </div>
              </div>

              <!-- 订阅链接 -->
              <div class="subscription-url-section">
                <label class="url-label">订阅链接</label>
                <div class="url-input-group">
                  <input
                    type="text"
                    :value="getSubscriptionUrl(token)"
                    readonly
                    class="url-input"
                    @click="selectText($event)"
                  >
                  <button
                    class="url-copy-btn"
                    @click="copySubscriptionUrl(token)"
                    title="复制链接"
                  >
                    <i class="bi bi-clipboard"></i>
                  </button>
                </div>
              </div>

              <!-- 支持的客户端 -->
              <div class="clients-section">
                <div class="clients-label">支持的客户端</div>
                <div class="clients-list">
                  <div class="client-item">
                    <i class="bi bi-phone"></i>
                    <span>Clash</span>
                  </div>
                  <div class="client-item">
                    <i class="bi bi-rocket"></i>
                    <span>Shadowrocket</span>
                  </div>
                  <div class="client-item">
                    <i class="bi bi-wifi"></i>
                    <span>Surge</span>
                  </div>
                  <div class="client-item">
                    <i class="bi bi-plus"></i>
                    <span>更多</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 卡片底部 -->
            <div class="card-footer">
              <div class="quick-actions">
                <button
                  class="quick-action-btn"
                  @click="copySubscriptionUrl(token)"
                  title="复制链接"
                >
                  <i class="bi bi-clipboard"></i>
                  <span>复制</span>
                </button>
                <button
                  class="quick-action-btn"
                  @click="openQRCodeModal(token)"
                  title="显示二维码"
                >
                  <i class="bi bi-qr-code"></i>
                  <span>二维码</span>
                </button>
                <button
                  class="quick-action-btn"
                  @click="testSubscription(token)"
                  title="测试连接"
                >
                  <i class="bi bi-speedometer2"></i>
                  <span>测试</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建订阅模态框 -->
    <div class="modal fade" id="createTokenModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content premium-modal">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-plus-circle"></i>
              创建订阅链接
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="createToken">
              <div class="premium-form-group">
                <label class="premium-form-label">
                  <i class="bi bi-tag"></i>
                  订阅名称
                </label>
                <div class="premium-input-wrapper">
                  <input
                    type="text"
                    class="premium-input"
                    v-model="newTokenName"
                    placeholder="输入订阅链接的名称，例如：我的主力订阅"
                    required
                  >
                </div>
                <div class="ds-text-xs ds-text-tertiary mt-2">
                  <i class="bi bi-info-circle me-1"></i>
                  给订阅链接起一个便于识别的名称
                </div>
              </div>
              <!-- 新增：选择配置策略 -->
              <div class="premium-form-group">
                <label class="premium-form-label">
                  <i class="bi bi-check2-square"></i>
                  授权策略
                </label>
                <div class="scenario-checkbox-group">
                  <div v-if="availableScenarios.length === 0" class="ds-text-tertiary ds-text-sm">
                    正在加载可用策略...
                  </div>
                  <div v-for="scenario in availableScenarios" :key="scenario" class="premium-radio-wrapper">
                    <input
                      type="radio"
                      :id="'scenario-' + scenario"
                      :value="scenario"
                      v-model="selectedScenario"
                      name="scenario-option"
                      class="premium-radio"
                    >
                    <label :for="'scenario-' + scenario" class="premium-radio-label">{{ scenario }}</label>
                  </div>
                </div>
                <div class="ds-text-xs ds-text-tertiary mt-2">
                  <i class="bi bi-info-circle me-1"></i>
                  选择该订阅链接可以访问哪些配置处理策略。
                </div>
              </div>

              <div class="premium-form-group">
                <label class="premium-form-label">
                  <i class="bi bi-gear"></i>
                  高级选项
                </label>
                <div class="advanced-options">
                  <div class="option-item">
                    <input type="checkbox" id="autoUpdate" class="option-checkbox">
                    <label for="autoUpdate" class="option-label">
                      <div class="option-text">
                        <div class="option-title">自动更新</div>
                        <div class="option-desc">启用后将自动同步最新节点配置</div>
                      </div>
                    </label>
                  </div>
                  <div class="option-item">
                    <input type="checkbox" id="enableStats" class="option-checkbox" checked>
                    <label for="enableStats" class="option-label">
                      <div class="option-text">
                        <div class="option-title">访问统计</div>
                        <div class="option-desc">记录订阅链接的访问次数和时间</div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="premium-btn premium-btn-secondary" data-bs-dismiss="modal">
              取消
            </button>
            <button
              type="button"
              class="premium-btn premium-btn-primary"
              @click="createToken"
              :disabled="store.isLoading || !newTokenName.trim()"
            >
              <div class="btn-content">
                <div v-if="store.isLoading" class="premium-spinner"></div>
                <i v-else class="bi bi-plus-circle"></i>
                <span>{{ store.isLoading ? '创建中...' : '创建订阅' }}</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 全局消息提示 -->
    <div v-if="showMessage" class="global-message" :class="messageType">
      <div class="message-content">
        <i class="message-icon" :class="messageType === 'success' ? 'bi-check-circle' : 'bi-exclamation-triangle'"></i>
        <span class="message-text">{{ messageText }}</span>
        <button class="message-close" @click="showMessage = false">
          <i class="bi bi-x"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { getAvailableScenarios } from '@/services/subscriptionService';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { Modal } from 'bootstrap';
import { onMounted, ref } from 'vue';
const store = useSubscriptionStore();

const availableScenarios = ref([]); // 存储所有可用策略
const selectedScenario = ref('');  // 绑定用户选择的策略

// 响应式变量
const newTokenName = ref('');
const showMessage = ref(false);
const messageText = ref('');
const messageType = ref('success');

// 生命周期钩子
onMounted(async () => {
  store.fetchTokens();
  try {
    availableScenarios.value = await getAvailableScenarios();
  } catch (error) {
    showGlobalMessage('加载可用策略失败', 'error');
  }
});

// 方法
const openCreateModal = () => {
  newTokenName.value = '';
  selectedScenario.value = ''; // 清空选项
  new Modal(document.getElementById('createTokenModal')).show();
};

const createToken = async () => {
  // 校验名称和是否已选择策略
  if (!newTokenName.value.trim() || !selectedScenario.value) {
    showGlobalMessage('请填写订阅名称并选择一个授权策略', 'error');
    return;
  }

  try {
    const tokenData = {
      name: newTokenName.value.trim(),
      // 后端需要的是一个数组，所以我们将单个选项放入数组中
      configTypes: [selectedScenario.value]
    };

    await store.createToken(tokenData);
    Modal.getInstance(document.getElementById('createTokenModal')).hide();
    showGlobalMessage('订阅链接创建成功！', 'success');
  } catch {
    showGlobalMessage('创建失败，请稍后重试', 'error');
  }
};

const deleteToken = async (token) => {
  if (!confirm(`确定要删除订阅 "${token.name}" 吗？\n删除后该链接将无法使用。`)) return;

  try {
    await store.deleteToken(token.id);
    showGlobalMessage('订阅链接已删除', 'success');
  } catch {
    showGlobalMessage('删除失败，请稍后重试', 'error');
  }
};

const getSubscriptionUrl = (token) => {
  if (token.subscribeUrls && token.subscribeUrls.length > 0) {
    const processedConfigUrl = token.subscribeUrls.find(url => url.type === 'processed-config');
    if (processedConfigUrl) {
      return processedConfigUrl.url;
    }
    return token.subscribeUrls[0].url;
  }

  const baseUrl = window.location.origin;
  const configType = 'processed-config';
  return `${baseUrl}/subscribe/${token.token}/${configType}`;
};

const copySubscriptionUrl = async (token) => {
  const url = getSubscriptionUrl(token);
  try {
    await navigator.clipboard.writeText(url);
    showGlobalMessage('链接已复制到剪贴板', 'success');
  } catch {
    const textArea = document.createElement('textarea');
    textArea.value = url;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    showGlobalMessage('链接已复制到剪贴板', 'success');
  }
};

const selectText = (event) => {
  event.target.select();
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('zh-CN');
};

const formatRelativeTime = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return '刚刚';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} 分钟前`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} 小时前`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} 天前`;

  return formatDate(dateString);
};

const getActiveSubscriptionsCount = () => {
  return store.tokens.length; // 所有订阅都被认为是活跃的
};

const getTotalAccessCount = () => {
  return store.tokens.reduce((total, token) => total + (token.access_count || 0), 0);
};

const viewSubscriptionDetails = (token) => {
  // TODO: 实现订阅详情查看
  console.log('查看订阅详情:', token);
};

const openQRCodeModal = (token) => {
  // TODO: 实现二维码显示
  console.log('显示二维码:', token);
};

const testSubscription = (token) => {
  // TODO: 实现订阅测试
  console.log('测试订阅:', token);
};

const showGlobalMessage = (text, type = 'success') => {
  messageText.value = text;
  messageType.value = type;
  showMessage.value = true;

  setTimeout(() => {
    showMessage.value = false;
  }, 3000);
};
</script>

<style scoped>
.subscriptions-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding: var(--spacing-8);
}

/* 页面头部 */
.page-header {
  margin-bottom: var(--spacing-8);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-6);
}

.header-main {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
}

.header-icon {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-2xl);
  background: var(--gradient-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-inverse);
  font-size: var(--text-2xl);
  box-shadow: var(--shadow-lg);
}

.page-title {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-1) 0;
  line-height: var(--leading-tight);
}

.page-subtitle {
  font-size: var(--text-base);
  color: var(--text-secondary);
  margin: 0;
  line-height: var(--leading-normal);
}

.header-actions {
  display: flex;
  gap: var(--spacing-3);
}

/* 功能介绍横幅 */
.info-banner {
  margin-bottom: var(--spacing-8);
}

.info-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-6);
}

.info-main {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
}

.info-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-xl);
  background: var(--gradient-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-inverse);
  font-size: var(--text-xl);
}

.info-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-1) 0;
}

.info-description {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0;
  line-height: var(--leading-relaxed);
}

.info-features {
  display: flex;
  gap: var(--spacing-6);
}

.feature-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.feature-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-lg);
  background: var(--primary-100);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-600);
  font-size: var(--text-sm);
}

.feature-text {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
}

/* 内容区域 */
.content-area {
  position: relative;
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.error-icon,
.empty-icon {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-full);
  background: var(--surface-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-4xl);
  color: var(--text-tertiary);
  margin: 0 auto var(--spacing-4);
}

.empty-actions {
  display: flex;
  gap: var(--spacing-3);
  justify-content: center;
}

/* 订阅统计 */
.subscription-stats {
  display: flex;
  justify-content: center;
  gap: var(--spacing-8);
  margin-bottom: var(--spacing-8);
  padding: var(--spacing-6);
  background: var(--surface-elevated);
  border-radius: var(--radius-2xl);
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-sm);
}

.stats-item {
  text-align: center;
}

.stats-number {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  line-height: var(--leading-none);
}

.stats-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-top: var(--spacing-1);
}

/* 订阅网格 */
.subscriptions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: var(--spacing-6);
}

/* 订阅卡片 */
.subscription-card {
  background: var(--surface-elevated);
  border-radius: var(--radius-2xl);
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  transition: all var(--transition-normal);
  position: relative;
}

.subscription-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--gradient-primary);
}

.subscription-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-elevated);
  border-color: var(--border-medium);
}

/* 卡片头部 */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-6);
  border-bottom: 1px solid var(--border-light);
  background: var(--gradient-surface);
}

.card-title-section {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.card-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-lg);
  background: var(--gradient-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-inverse);
  font-size: var(--text-base);
}

.card-title {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-1) 0;
}

.card-meta {
  display: flex;
  gap: var(--spacing-3);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.action-dropdown {
  position: relative;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius-lg);
  background: var(--surface-secondary);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-normal);
}

.action-btn:hover {
  background: var(--surface-tertiary);
  color: var(--text-primary);
}

/* 卡片内容 */
.card-body {
  padding: var(--spacing-6);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.status-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  background: var(--success-500);
}

.status-text {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--success-600);
}

.status-badge {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  padding: var(--spacing-1) var(--spacing-2);
  background: var(--success-100);
  color: var(--success-700);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-4);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3);
  background: var(--surface-secondary);
  border-radius: var(--radius-lg);
}

.stat-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-lg);
  background: var(--primary-100);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-600);
  font-size: var(--text-sm);
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  line-height: var(--leading-tight);
}

.stat-label {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  margin-top: var(--spacing-0-5);
}

.subscription-url-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.url-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
}

.url-input-group {
  display: flex;
  background: var(--surface-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all var(--transition-normal);
}

.url-input-group:focus-within {
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.url-input {
  flex: 1;
  padding: var(--spacing-3);
  border: none;
  background: transparent;
  font-family: var(--font-family-mono);
  font-size: var(--text-xs);
  color: var(--text-secondary);
  outline: none;
}

.url-copy-btn {
  padding: var(--spacing-3);
  border: none;
  background: var(--primary-500);
  color: var(--text-inverse);
  cursor: pointer;
  transition: all var(--transition-normal);
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
}

.url-copy-btn:hover {
  background: var(--primary-600);
}

.clients-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.clients-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
}

.clients-list {
  display: flex;
  gap: var(--spacing-2);
}

.client-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  padding: var(--spacing-1) var(--spacing-2);
  background: var(--surface-secondary);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

/* 卡片底部 */
.card-footer {
  padding: var(--spacing-4) var(--spacing-6);
  background: var(--surface-secondary);
  border-top: 1px solid var(--border-light);
}

.quick-actions {
  display: flex;
  gap: var(--spacing-3);
}

.quick-action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-1);
  padding: var(--spacing-2) var(--spacing-3);
  border: none;
  border-radius: var(--radius-lg);
  background: transparent;
  color: var(--text-secondary);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: all var(--transition-normal);
}

.quick-action-btn:hover {
  background: var(--surface-tertiary);
  color: var(--text-primary);
}

/* 模态框 */
.premium-modal .modal-content {
  border: none;
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-2xl);
  overflow: hidden;
}

.premium-modal .modal-header {
  background: var(--gradient-surface);
  border-bottom: 1px solid var(--border-light);
  padding: var(--spacing-6);
}

.premium-modal .modal-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
}

.advanced-options {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.option-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-3);
}

.option-checkbox {
  width: 18px;
  height: 18px;
  border-radius: var(--radius-sm);
  margin-top: var(--spacing-0-5);
}

.option-label {
  flex: 1;
  cursor: pointer;
}

.option-title {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
  margin-bottom: var(--spacing-0-5);
}

.option-desc {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  line-height: var(--leading-relaxed);
}

.btn-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

/* 全局消息 */
.global-message {
  position: fixed;
  top: var(--spacing-8);
  right: var(--spacing-8);
  z-index: var(--z-toast);
  padding: var(--spacing-4) var(--spacing-6);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-floating);
  animation: slideInDown var(--transition-normal);
  min-width: 300px;
}

.global-message.success {
  background: var(--gradient-success);
  color: var(--text-inverse);
}

.global-message.error {
  background: var(--gradient-error);
  color: var(--text-inverse);
}

.message-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.message-icon {
  font-size: var(--text-base);
}

.message-text {
  flex: 1;
  font-weight: var(--font-medium);
}

.message-close {
  background: none;
  border: none;
  color: currentColor;
  cursor: pointer;
  padding: var(--spacing-1);
  border-radius: var(--radius-sm);
  transition: all var(--transition-normal);
  opacity: 0.7;
}

.message-close:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.1);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .subscriptions-view {
    padding: var(--spacing-6);
  }

  .subscriptions-grid {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  }

  .info-content {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-4);
  }

  .info-features {
    flex-wrap: wrap;
    gap: var(--spacing-4);
  }
}

@media (max-width: 768px) {
  .subscriptions-view {
    padding: var(--spacing-4);
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-4);
  }

  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .subscription-stats {
    flex-direction: column;
    gap: var(--spacing-4);
  }

  .subscriptions-grid {
    grid-template-columns: 1fr;
  }

  .info-features {
    grid-template-columns: repeat(2, 1fr);
    display: grid;
    width: 100%;
  }

  .global-message {
    left: var(--spacing-4);
    right: var(--spacing-4);
    min-width: auto;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: var(--text-2xl);
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .quick-actions {
    flex-direction: column;
  }

  .info-features {
    grid-template-columns: 1fr;
  }
}

.scenario-checkbox-group {
  display: flex; flex-wrap: wrap; gap: 12px;
  padding: 12px; background: #f8f9fa; border-radius: 8px;
}
.premium-checkbox-wrapper { display: flex; align-items: center; gap: 8px; }
.premium-checkbox-label { cursor: pointer; }
</style>
