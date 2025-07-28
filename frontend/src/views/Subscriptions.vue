<template>
  <div class="subscriptions-view">
    <div class="subscriptions-container">
      <!-- 页面标题 -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <i class="bi bi-link-45deg"></i>
          </div>
          <div class="header-text">
            <h1 class="page-title">订阅管理</h1>
            <p class="page-subtitle">创建和管理您的订阅链接，供各种客户端使用</p>
          </div>
          <div class="header-actions">
            <button @click="openCreateModal" class="create-btn">
              <i class="bi bi-plus-circle"></i>
              <span>创建订阅链接</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 说明卡片 -->
      <div class="info-card">
        <div class="info-icon">
          <i class="bi bi-info-circle"></i>
        </div>
        <div class="info-content">
          <h3>关于订阅链接</h3>
          <p>您可以创建订阅链接，供 Clash、Shadowrocket 等客户端直接使用，无需登录即可获取节点配置。</p>
          <div class="info-features">
            <div class="feature">
              <i class="bi bi-shield-check"></i>
              <span>安全访问</span>
            </div>
            <div class="feature">
              <i class="bi bi-arrow-clockwise"></i>
              <span>自动更新</span>
            </div>
            <div class="feature">
              <i class="bi bi-devices"></i>
              <span>多端支持</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 主要内容区域 -->
      <div class="content-area">
        <!-- 加载状态 -->
        <div v-if="store.isLoading" class="loading-state">
          <div class="loading-card">
            <div class="loading-spinner">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">正在加载...</span>
              </div>
            </div>
            <h5>正在加载订阅链接...</h5>
            <p class="text-muted">请稍候，正在获取最新数据</p>
          </div>
        </div>

        <!-- 错误状态 -->
        <div v-else-if="store.error" class="error-state">
          <div class="error-card">
            <div class="error-icon">
              <i class="bi bi-exclamation-triangle"></i>
            </div>
            <h5>加载失败</h5>
            <p class="error-message">{{ store.error }}</p>
            <button class="rc-btn rc-btn-primary" @click="store.fetchTokens">
              <i class="bi bi-arrow-clockwise"></i>
              重新加载
            </button>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else-if="!store.isLoading && store.tokens.length === 0" class="empty-state">
          <div class="empty-card">
            <div class="empty-icon">
              <i class="bi bi-link-45deg"></i>
            </div>
            <h5>暂无订阅链接</h5>
            <p class="text-muted">您还没有创建任何订阅链接，点击上方按钮创建第一个</p>
            <button class="rc-btn rc-btn-primary" @click="openCreateModal">
              <i class="bi bi-plus-circle"></i>
              创建第一个订阅链接
            </button>
          </div>
        </div>

        <!-- 订阅链接列表 -->
        <div v-else class="subscriptions-grid">
          <div
            v-for="token in store.tokens"
            :key="token.id"
            class="subscription-card"
          >
            <div class="card-header">
              <div class="card-title">
                <i class="bi bi-link-45deg card-icon"></i>
                <h4>{{ token.name }}</h4>
              </div>
              <div class="card-actions">
                <button
                  class="action-btn copy-btn"
                  @click="copySubscriptionUrl(token)"
                  title="复制链接"
                >
                  <i class="bi bi-clipboard"></i>
                </button>
                <button
                  class="action-btn delete-btn"
                  @click="deleteToken(token)"
                  title="删除订阅"
                >
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>

            <div class="card-body">
              <div class="subscription-info">
                <div class="info-item">
                  <span class="info-label">创建时间</span>
                  <span class="info-value">{{ formatDate(token.created_at) }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">访问次数</span>
                  <span class="info-value">{{ token.access_count || 0 }} 次</span>
                </div>
                <div class="info-item">
                  <span class="info-label">状态</span>
                  <span class="status-badge active">
                    <i class="bi bi-check-circle"></i>
                    活跃
                  </span>
                </div>
              </div>

              <div class="subscription-url">
                <div class="url-display">
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
                  >
                    <i class="bi bi-clipboard"></i>
                  </button>
                </div>
              </div>
            </div>

            <div class="card-footer">
              <div class="usage-stats">
                <div class="stats-item">
                  <i class="bi bi-eye"></i>
                  <span>最后访问：{{ token.last_accessed ? formatRelativeTime(token.last_accessed) : '从未' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建订阅模态框 -->
    <div class="modal fade" id="createTokenModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content modern-modal">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-plus-circle"></i>
              创建订阅链接
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="createToken">
              <div class="form-group">
                <label class="form-label">
                  <i class="bi bi-tag"></i>
                  订阅名称
                </label>
                <input
                  type="text"
                  class="form-control modern-input"
                  v-model="newTokenName"
                  placeholder="输入订阅链接的名称，例如：我的主力订阅"
                  required
                >
                <div class="form-help">
                  <i class="bi bi-info-circle"></i>
                  给订阅链接起一个便于识别的名称
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
              取消
            </button>
            <button
              type="button"
              class="btn btn-primary"
              @click="createToken"
              :disabled="store.isLoading || !newTokenName.trim()"
            >
              <div class="btn-content">
                <div v-if="store.isLoading" class="btn-spinner">
                  <div class="spinner"></div>
                </div>
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
        <i class="bi" :class="messageType === 'success' ? 'bi-check-circle' : 'bi-exclamation-triangle'"></i>
        <span>{{ messageText }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { Modal } from 'bootstrap';

const store = useSubscriptionStore();

// 响应式变量
const newTokenName = ref('');
const showMessage = ref(false);
const messageText = ref('');
const messageType = ref('success');

// 生命周期钩子
onMounted(() => {
  store.fetchTokens();
});

// 方法
const openCreateModal = () => {
  newTokenName.value = '';
  new Modal(document.getElementById('createTokenModal')).show();
};

const createToken = async () => {
  if (!newTokenName.value.trim()) return;

  try {
    await store.createToken(newTokenName.value.trim());
    Modal.getInstance(document.getElementById('createTokenModal')).hide();
    showGlobalMessage('订阅链接创建成功！', 'success');
    newTokenName.value = '';
  } catch (error) {
    showGlobalMessage('创建失败: ' + error.message, 'error');
  }
};

const deleteToken = async (token) => {
  if (!confirm(`确定要删除订阅 "${token.name}" 吗？\n删除后该链接将无法使用。`)) return;

  try {
    await store.deleteToken(token.id);
    showGlobalMessage('订阅链接已删除', 'success');
  } catch (error) {
    showGlobalMessage('删除失败: ' + error.message, 'error');
  }
};

const getSubscriptionUrl = (token) => {
  // 优先使用后端提供的订阅链接，如果没有则生成默认链接
  if (token.subscribeUrls && token.subscribeUrls.length > 0) {
    // 优先使用 processed-config 类型的链接
    const processedConfigUrl = token.subscribeUrls.find(url => url.type === 'processed-config');
    if (processedConfigUrl) {
      return processedConfigUrl.url;
    }
    // 如果没有 processed-config，使用第一个可用的链接
    return token.subscribeUrls[0].url;
  }

  // 回退方案：如果后端没有提供链接，则自行生成
  // 在生产环境中，前后端运行在同一域名和端口下
  const baseUrl = window.location.origin;
  const configType = 'processed-config'; // 默认配置类型

  return `${baseUrl}/subscribe/${token.token}/${configType}`;
};

const copySubscriptionUrl = async (token) => {
  const url = getSubscriptionUrl(token);
  try {
    await navigator.clipboard.writeText(url);
    showGlobalMessage('链接已复制到剪贴板', 'success');
  } catch (error) {
    // 降级方案
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
  position: relative;
  padding: 0;
}

.subscriptions-container {
  width: 100%;
  padding: 0;
}

/* 页面标题 */
.page-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 0 0 20px 20px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  margin-bottom: 0;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  width: 100%;
  padding: 0 2rem;
}

.header-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2.5rem;
  box-shadow: 0 8px 30px rgba(102, 126, 234, 0.3);
  flex-shrink: 0;
}

.header-text {
  flex: 1;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
  line-height: 1.2;
}

.page-subtitle {
  font-size: 1.1rem;
  color: #7f8c8d;
  margin: 0;
  line-height: 1.4;
}

.header-actions {
  flex-shrink: 0;
}

.create-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.create-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

/* 主要内容区域 */
.content-area {
  padding: 2rem;
}

/* 信息卡片 */
.info-card {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
  border: 1px solid rgba(102, 126, 234, 0.2);
}

.info-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.info-content h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
}

.info-content p {
  color: #7f8c8d;
  margin: 0 0 1rem 0;
  line-height: 1.5;
}

.info-features {
  display: flex;
  gap: 2rem;
}

.feature {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #667eea;
  font-size: 0.9rem;
  font-weight: 500;
}

/* 状态卡片 */
.loading-state,
.error-state,
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.loading-card,
.error-card,
.empty-card {
  background: white;
  padding: 3rem;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 400px;
}

.loading-spinner {
  margin-bottom: 1.5rem;
}

.error-icon,
.empty-icon {
  font-size: 4rem;
  color: #e74c3c;
  margin-bottom: 1.5rem;
}

.empty-icon {
  color: #95a5a6;
}

.error-message {
  color: #e74c3c;
  margin-bottom: 1.5rem;
}

/* 订阅网格 */
.subscriptions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 2rem;
}

/* 订阅卡片 */
.subscription-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
  border: 1px solid #f0f0f0;
}

.subscription-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
}

.card-header {
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-bottom: 1px solid #e9ecef;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.card-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.25rem;
}

.card-title h4 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.copy-btn {
  background: rgba(52, 152, 219, 0.1);
  color: #3498db;
}

.copy-btn:hover {
  background: #3498db;
  color: white;
  transform: scale(1.05);
}

.delete-btn {
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
}

.delete-btn:hover {
  background: #e74c3c;
  color: white;
  transform: scale(1.05);
}

.card-body {
  padding: 1.5rem;
}

.subscription-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.8rem;
  color: #7f8c8d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}

.info-value {
  font-size: 0.95rem;
  color: #2c3e50;
  font-weight: 500;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-badge.active {
  color: #27ae60;
}

.subscription-url {
  margin-top: 1rem;
}

.url-display {
  display: flex;
  background: #f8f9fa;
  border-radius: 12px;
  border: 2px solid #e9ecef;
  overflow: hidden;
  transition: all 0.3s ease;
}

.url-display:focus-within {
  border-color: #667eea;
  box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
}

.url-input {
  flex: 1;
  padding: 0.875rem 1rem;
  border: none;
  background: transparent;
  font-family: 'SF Mono', 'Monaco', monospace;
  font-size: 0.85rem;
  color: #495057;
  outline: none;
}

.url-copy-btn {
  padding: 0.875rem 1rem;
  border: none;
  background: #667eea;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.url-copy-btn:hover {
  background: #5a6fd8;
}

.card-footer {
  padding: 1rem 1.5rem;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

.usage-stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stats-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #7f8c8d;
}

.stats-item i {
  font-size: 0.9rem;
}

/* 模态框 */
.modern-modal .modal-content {
  border: none;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modern-modal .modal-header {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 20px 20px 0 0;
  padding: 1.5rem;
}

.modern-modal .modal-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 600;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.modern-input {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;
  outline: none;
}

.modern-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
}

.form-help {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #7f8c8d;
  margin-top: 0.5rem;
}

.btn-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-spinner {
  display: flex;
  align-items: center;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 全局消息 */
.global-message {
  position: fixed;
  top: 100px;
  right: 2rem;
  z-index: 9999;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease-out;
}

.global-message.success {
  background: linear-gradient(135deg, #27ae60, #2ecc71);
  color: white;
}

.global-message.error {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
}

.message-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 500;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .header-content {
    padding: 0 1.5rem;
  }

  .content-area {
    padding: 1.5rem;
  }

  .subscriptions-grid {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  }
}

@media (max-width: 768px) {
  .page-header {
    padding: 1.5rem;
    border-radius: 0 0 15px 15px;
  }

  .header-content {
    padding: 0 1rem;
    flex-direction: column;
    text-align: center;
    gap: 1.5rem;
  }

  .content-area {
    padding: 1rem;
  }

  .header-icon {
    width: 60px;
    height: 60px;
    font-size: 2rem;
  }

  .page-title {
    font-size: 2rem;
  }

  .header-actions {
    width: 100%;
  }

  .create-btn {
    width: 100%;
    justify-content: center;
  }

  .info-card {
    flex-direction: column;
    text-align: center;
    padding: 1.5rem;
  }

  .info-features {
    justify-content: center;
    gap: 1rem;
  }

  .subscriptions-grid {
    grid-template-columns: 1fr;
  }

  .subscription-info {
    grid-template-columns: 1fr;
  }

  .global-message {
    right: 1rem;
    left: 1rem;
    top: 90px;
  }
}

@media (max-width: 480px) {
  .page-header {
    padding: 1rem;
  }

  .header-content {
    padding: 0 0.75rem;
  }

  .content-area {
    padding: 0.75rem;
  }

  .page-title {
    font-size: 1.75rem;
  }

  .info-card {
    padding: 1rem;
  }

  .info-features {
    flex-direction: column;
    gap: 0.75rem;
  }

  .card-header {
    padding: 1rem;
  }

  .card-body {
    padding: 1rem;
  }

  .card-footer {
    padding: 0.75rem 1rem;
  }
}
</style>
