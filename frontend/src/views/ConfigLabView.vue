<template>
  <div class="config-lab">
    <div class="rc-container">
      <!-- 页面标题 -->
      <div class="page-header mb-4">
        <h1 class="page-title">
          <i class="bi bi-gear-wide-connected"></i>
          配置实验室
        </h1>
        <p class="page-subtitle">高级配置管理与协议转换工具</p>
      </div>

      <!-- 顶部快速操作栏 -->
      <div class="rc-card modern-card mb-4">
        <div class="rc-card-body">
          <div class="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div class="quick-actions">
              <button class="rc-btn rc-btn-primary btn-icon" @click="handleUpdateConfig" :disabled="isUpdating">
                <i class="bi bi-arrow-clockwise"></i>
                <span>{{ isUpdating ? '更新中...' : '立即更新配置' }}</span>
              </button>
              <button class="rc-btn rc-btn-outline-primary btn-icon ms-2" @click="openCacheManagement">
                <i class="bi bi-database"></i>
                <span>缓存管理</span>
              </button>
            </div>
            <div class="status-info" v-if="systemStatus">
              <div class="status-badge">
                <i class="bi bi-hdd-stack"></i>
                <span>配置源: {{ systemStatus.enabledSources }}/{{ systemStatus.totalSources }} 已启用</span>
              </div>
              <div class="status-badge" v-if="systemStatus.lastUpdateTime">
                <i class="bi bi-clock"></i>
                <span>上次更新: {{ formatTime(systemStatus.lastUpdateTime) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 标签页导航 -->
      <div class="nav-tabs-container mb-4">
        <ul class="nav nav-tabs modern-tabs">
          <li class="nav-item">
            <a class="nav-link" :class="{ active: activeTab === 'urls' }" @click="activeTab = 'urls'">
              <i class="bi bi-link-45deg"></i>
              URL管理
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" :class="{ active: activeTab === 'configs' }" @click="activeTab = 'configs'">
              <i class="bi bi-file-code"></i>
              配置文件管理
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" :class="{ active: activeTab === 'converter' }" @click="activeTab = 'converter'">
              <i class="bi bi-arrow-repeat"></i>
              协议转换
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" :class="{ active: activeTab === 'debug' }" @click="activeTab = 'debug'">
              <i class="bi bi-bug"></i>
              调试工具
            </a>
          </li>
        </ul>
      </div>

      <!-- 标签页内容 -->
      <div class="tab-content">
        <!-- URL管理标签页 -->
        <div class="tab-pane" :class="{ active: activeTab === 'urls' }">
          <div class="rc-card modern-card">
            <div class="rc-card-header">
              <h5 class="card-title mb-0">
                <i class="bi bi-link-45deg"></i>
                订阅链接管理
              </h5>
              <button class="rc-btn rc-btn-primary btn-sm" @click="showUrlModal()">
                <i class="bi bi-plus-circle"></i>
                添加URL
              </button>
            </div>
            <div class="rc-card-body">
              <div class="table-responsive">
                <table class="table modern-table">
                  <thead>
                    <tr>
                      <th style="width: 180px;">名称</th>
                      <th>URL</th>
                      <th style="width: 180px;">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="url in urlList" :key="url.id">
                      <td class="name-cell">{{ url.name }}</td>
                      <td class="url-cell">
                        <div class="url-display" :title="url.url">{{ url.url }}</div>
                        <div v-if="url.userInfo" class="user-info">
                          <span class="info-item">{{ formatDataUsage(url.userInfo) }}</span>
                          <span class="info-separator">|</span>
                          <span class="info-item">{{ formatExpireDate(url.userInfo.expire) }}</span>
                        </div>
                        <div class="health-status">
                          <span class="status-dot" :class="getHealthStatusClass(url.name)"></span>
                          <span class="status-text" :class="getHealthStatusClass(url.name)">
                            {{ getHealthStatusText(url.name) }}
                          </span>
                        </div>
                      </td>
                      <td class="actions-cell">
                        <div class="btn-group">
                          <button class="rc-btn rc-btn-sm rc-btn-outline-primary" @click="editUrl(url)">
                            <i class="bi bi-pencil"></i>
                          </button>
                          <button class="rc-btn rc-btn-sm rc-btn-outline-danger" @click="deleteUrl(url)">
                            <i class="bi bi-trash"></i>
                          </button>
                          <button class="rc-btn rc-btn-sm rc-btn-outline-secondary" @click="debugUrl(url.name)" title="调试此订阅">
                            <i class="bi bi-bug"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-if="urlList.length === 0" class="empty-state">
                <i class="bi bi-link-45deg"></i>
                <p>暂无订阅链接</p>
                <button class="rc-btn rc-btn-primary" @click="showUrlModal()">添加第一个URL</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 配置文件管理标签页 -->
        <div class="tab-pane" :class="{ active: activeTab === 'configs' }">
          <div class="rc-card modern-card">
            <div class="rc-card-header">
              <h5 class="card-title mb-0">
                <i class="bi bi-file-code"></i>
                配置文件管理
              </h5>
              <div class="header-actions">
                <button class="rc-btn rc-btn-primary btn-sm me-2" @click="showConfigModal()">
                  <i class="bi bi-plus-circle"></i>
                  添加配置
                </button>
                <button class="rc-btn rc-btn-outline-primary btn-sm" @click="showUploadModal()">
                  <i class="bi bi-cloud-upload"></i>
                  上传文件
                </button>
              </div>
            </div>
            <div class="rc-card-body">
              <div class="table-responsive">
                <table class="table modern-table">
                  <thead>
                    <tr>
                      <th>名称</th>
                      <th style="width: 120px;">节点数量</th>
                      <th style="width: 180px;">修改时间</th>
                      <th style="width: 180px;">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="config in configList" :key="config.id">
                      <td class="name-cell">
                        <i class="bi bi-file-code me-2"></i>
                        {{ config.name }}
                      </td>
                      <td class="text-center">
                        <span class="badge bg-info">{{ config.proxyCount || 0 }}</span>
                      </td>
                      <td class="text-muted">{{ formatDate(config.updated_at) }}</td>
                      <td class="actions-cell">
                        <div class="btn-group">
                          <button class="rc-btn rc-btn-sm rc-btn-outline-primary" @click="editConfig(config)">
                            <i class="bi bi-pencil"></i>
                          </button>
                          <button class="rc-btn rc-btn-sm rc-btn-outline-danger" @click="deleteConfig(config)">
                            <i class="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-if="configList.length === 0" class="empty-state">
                <i class="bi bi-file-code"></i>
                <p>暂无配置文件</p>
                <button class="rc-btn rc-btn-primary" @click="showConfigModal()">添加第一个配置</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 协议转换标签页 -->
        <div class="tab-pane" :class="{ active: activeTab === 'converter' }">
          <div class="rc-card modern-card">
            <div class="rc-card-header">
              <h5 class="card-title mb-0">
                <i class="bi bi-arrow-repeat"></i>
                协议转换工具
              </h5>
            </div>
            <div class="rc-card-body">
              <div class="converter-info mb-4">
                <div class="alert alert-info">
                  <i class="bi bi-info-circle"></i>
                  支持将 SS、VLESS、Hysteria2 等协议的订阅链接转换为 Clash 配置文件
                </div>
              </div>
              <div class="row">
                <div class="col-lg-6">
                  <div class="input-section">
                    <label class="form-label">
                      <i class="bi bi-link"></i>
                      订阅链接 (每行一个)
                    </label>
                    <textarea
                      class="form-control modern-textarea"
                      rows="12"
                      v-model="linksToConvert"
                      placeholder="请粘贴订阅链接，每行一个..."
                    ></textarea>
                    <button
                      class="btn btn-primary btn-convert mt-3"
                      @click="handleConvert"
                      :disabled="labStore.isLoading || !linksToConvert.trim()"
                    >
                      <i class="bi bi-arrow-repeat"></i>
                      {{ labStore.isLoading ? '转换中...' : '开始转换' }}
                    </button>
                  </div>
                </div>
                <div class="col-lg-6">
                  <div class="output-section">
                    <label class="form-label">
                      <i class="bi bi-file-code"></i>
                      预览结果 (可编辑)
                    </label>
                    <textarea
                      class="form-control modern-textarea code-textarea"
                      rows="12"
                      v-model="labStore.convertedContent"
                      placeholder="转换结果将在此显示..."
                    ></textarea>
                    <div class="input-group mt-3">
                      <input
                        type="text"
                        class="form-control"
                        placeholder="输入配置文件名称"
                        v-model="convertedConfigName"
                      >
                      <button
                        class="btn btn-success"
                        @click="handleSave"
                        :disabled="!labStore.convertedContent || labStore.isLoading"
                      >
                        <i class="bi bi-check-circle"></i>
                        保存配置
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="labStore.error" class="alert alert-danger mt-3">
                <i class="bi bi-exclamation-triangle"></i>
                {{ labStore.error }}
              </div>
            </div>
          </div>
        </div>

        <!-- 调试工具标签页 -->
        <div class="tab-pane" :class="{ active: activeTab === 'debug' }">
          <div class="rc-card modern-card">
            <div class="rc-card-header">
              <h5 class="card-title mb-0">
                <i class="bi bi-bug"></i>
                订阅调试工具
              </h5>
            </div>
            <div class="rc-card-body">
              <div class="debug-input mb-4">
                <label class="form-label">订阅名称</label>
                <div class="input-group">
                  <input
                    type="text"
                    class="form-control"
                    placeholder="输入要调试的订阅名称"
                    v-model="debugSubName"
                  >
                  <button
                    class="btn btn-primary"
                    @click="handleDebug"
                    :disabled="labStore.isLoading || !debugSubName.trim()"
                  >
                    <i class="bi bi-search"></i>
                    {{ labStore.isLoading ? '调试中...' : '开始调试' }}
                  </button>
                </div>
              </div>
              <div v-if="labStore.debugResult" class="debug-results">
                <h6 class="mb-3">
                  <i class="bi bi-terminal"></i>
                  调试结果
                </h6>
                <div class="debug-content" v-html="formatDebugResult(labStore.debugResult)"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- URL模态框 -->
    <div class="modal fade" id="urlModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content modern-modal">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-link-45deg"></i>
              {{ urlEditMode ? '编辑URL' : '添加URL' }}
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveUrl">
              <div class="mb-3">
                <label class="form-label">名称</label>
                <input
                  type="text"
                  class="form-control"
                  v-model="urlForm.name"
                  required
                >
              </div>
              <div class="mb-3">
                <label class="form-label">URL</label>
                <input
                  type="url"
                  class="form-control"
                  v-model="urlForm.url"
                  required
                >
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
            <button type="button" class="btn btn-primary" @click="saveUrl">
              <i class="bi bi-check-circle"></i>
              保存
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 配置文件模态框 -->
    <div class="modal fade" id="configModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content modern-modal">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-file-code"></i>
              {{ configEditMode ? '编辑配置' : '添加配置' }}
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveConfig">
              <div class="mb-3">
                <label class="form-label">文件名 (.yaml)</label>
                <input
                  type="text"
                  class="form-control"
                  v-model="configForm.name"
                  required
                >
              </div>
              <div class="mb-3">
                <label class="form-label">配置内容</label>
                <textarea
                  class="form-control code-textarea"
                  rows="15"
                  v-model="configForm.content"
                  required
                ></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
            <button type="button" class="btn btn-primary" @click="saveConfig">
              <i class="bi bi-check-circle"></i>
              保存
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 上传文件模态框 -->
    <div class="modal fade" id="uploadModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content modern-modal">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-cloud-upload"></i>
              上传配置文件
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">配置文件名称</label>
              <input
                type="text"
                class="form-control"
                v-model="uploadForm.name"
                placeholder="输入文件名称（不需要添加.yaml后缀）"
                required
              >
            </div>
            <div class="mb-3">
              <label class="form-label">选择配置文件</label>
              <div class="upload-area" @click="$refs.fileInput.click()" @drop="handleFileDrop" @dragover.prevent @dragenter.prevent>
                <i class="bi bi-cloud-upload upload-icon"></i>
                <p class="upload-text">点击选择文件或拖拽 YAML/YML 文件到此处</p>
                <p class="upload-hint">支持 .yaml, .yml 格式，最大5MB</p>
                <input
                  ref="fileInput"
                  type="file"
                  accept=".yaml,.yml"
                  @change="handleFileSelect"
                  hidden
                >
              </div>
            </div>
            <div class="mb-3">
              <label class="form-label">配置内容预览 (可编辑)</label>
              <textarea
                class="form-control code-textarea"
                rows="10"
                v-model="uploadForm.content"
                placeholder="配置文件内容将在此显示..."
                required
              ></textarea>
            </div>
            <div v-if="validationResult" class="validation-result">
              <div class="alert" :class="validationResult.isValid ? 'alert-success' : 'alert-warning'">
                <div class="d-flex align-items-center mb-2">
                  <i class="bi" :class="validationResult.isValid ? 'bi-check-circle' : 'bi-exclamation-triangle'"></i>
                  <strong class="ms-2">{{ validationResult.isValid ? '配置有效' : '配置有问题' }}</strong>
                  <span v-if="validationResult.proxiesCount > 0" class="badge bg-info ms-2">
                    {{ validationResult.proxiesCount }} 个节点
                  </span>
                </div>
                <ul v-if="validationResult.warnings.length > 0" class="mb-0">
                  <li v-for="warning in validationResult.warnings.slice(0, 3)" :key="warning">{{ warning }}</li>
                </ul>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
            <button type="button" class="btn btn-outline-primary" @click="validateConfig">
              <i class="bi bi-check-circle"></i>
              验证配置
            </button>
            <button type="button" class="btn btn-primary" @click="uploadConfig" :disabled="!uploadForm.content">
              <i class="bi bi-upload"></i>
              上传配置
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue';
import { useConfigLabStore } from '@/stores/configLabStore';
import { Modal } from 'bootstrap';

const labStore = useConfigLabStore();

// 页面状态
const activeTab = ref('urls');
const isUpdating = ref(false);
const systemStatus = ref(null);

// URL管理
const urlList = ref([]);
const urlEditMode = ref(false);
const urlForm = reactive({ id: '', name: '', url: '' });
const healthStatus = ref(new Map());

// 配置文件管理
const configList = ref([]);
const configEditMode = ref(false);
const configForm = reactive({ id: '', name: '', content: '' });

// 上传功能
const uploadForm = reactive({ name: '', content: '' });
const validationResult = ref(null);

// 协议转换
const linksToConvert = ref('');
const convertedConfigName = ref('');

// 调试工具
const debugSubName = ref('');

// 生命周期
onMounted(async () => {
  await Promise.all([
    loadUrls(),
    loadConfigs(),
    loadSystemStatus()
  ]);
});

// 系统状态相关
const loadSystemStatus = async () => {
  try {
    const response = await fetch('/api/newconfig/manager/status');
    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        systemStatus.value = result.data;
      }
    }
  } catch (error) {
    console.error('加载系统状态失败:', error);
  }
};

const handleUpdateConfig = async () => {
  isUpdating.value = true;
  try {
    await Promise.all([
      loadUrls(),
      loadConfigs(),
      loadSystemStatus()
    ]);
    // 这里可以添加实际的更新配置逻辑
    alert('配置更新成功！');
  } catch (error) {
    alert('更新失败: ' + error.message);
  } finally {
    isUpdating.value = false;
  }
};

const openCacheManagement = () => {
  window.open('/cache-management.html', '_blank');
};

// URL管理相关
const loadUrls = async () => {
  try {
    const [urlResponse, healthResponse] = await Promise.all([
      fetch('/api/urls'),
      fetch('/api/newconfig/manager/health').catch(() => ({ ok: false }))
    ]);

    if (urlResponse.ok) {
      urlList.value = await urlResponse.json();
    }

    // 加载健康状态
    const healthMap = new Map();
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      if (healthData.success && healthData.data.failedDetails) {
        healthData.data.failedDetails.forEach(failed => {
          healthMap.set(failed.name, failed);
        });
      }
    }
    healthStatus.value = healthMap;
  } catch (error) {
    console.error('加载URL列表失败:', error);
  }
};

const showUrlModal = (url = null) => {
  urlEditMode.value = !!url;
  if (url) {
    Object.assign(urlForm, url);
  } else {
    Object.assign(urlForm, { id: '', name: '', url: '' });
  }
  new Modal(document.getElementById('urlModal')).show();
};

const editUrl = (url) => {
  showUrlModal(url);
};

const saveUrl = async () => {
  try {
    const method = urlEditMode.value ? 'PUT' : 'POST';
    const url = urlEditMode.value ? `/api/urls/${urlForm.id}` : '/api/urls';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: urlForm.name,
        url: urlForm.url
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '保存失败');
    }

    Modal.getInstance(document.getElementById('urlModal')).hide();
    await loadUrls();
    alert('保存成功！');
  } catch (error) {
    alert('保存失败: ' + error.message);
  }
};

const deleteUrl = async (url) => {
  if (!confirm(`确定要删除 ${url.name} 吗？`)) return;

  try {
    const response = await fetch(`/api/urls/${url.id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('删除失败');

    await loadUrls();
    alert('删除成功！');
  } catch (error) {
    alert('删除失败: ' + error.message);
  }
};

const debugUrl = (name) => {
  debugSubName.value = name;
  activeTab.value = 'debug';
};

// 配置文件管理相关
const loadConfigs = async () => {
  try {
    const response = await fetch('/api/configs');
    if (response.ok) {
      const configs = await response.json();
      configList.value = configs.map(config => ({
        ...config,
        proxyCount: countProxies(config.config)
      }));
    }
  } catch (error) {
    console.error('加载配置列表失败:', error);
  }
};

const countProxies = (configContent) => {
  if (!configContent) return 0;
  return (configContent.match(/- name:/g) || []).length;
};

const showConfigModal = (config = null) => {
  configEditMode.value = !!config;
  if (config) {
    Object.assign(configForm, {
      id: config.id,
      name: config.name,
      content: config.config
    });
  } else {
    Object.assign(configForm, { id: '', name: '', content: '' });
  }
  new Modal(document.getElementById('configModal')).show();
};

const editConfig = (config) => {
  showConfigModal(config);
};

const saveConfig = async () => {
  try {
    const method = configEditMode.value ? 'PUT' : 'POST';
    const url = configEditMode.value ? `/api/configs/${configForm.id}` : '/api/configs';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: configForm.name,
        content: configForm.content
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '保存失败');
    }

    Modal.getInstance(document.getElementById('configModal')).hide();
    await loadConfigs();
    alert('保存成功！');
  } catch (error) {
    alert('保存失败: ' + error.message);
  }
};

const deleteConfig = async (config) => {
  if (!confirm(`确定要删除 ${config.name} 吗？`)) return;

  try {
    const response = await fetch(`/api/configs/${config.id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('删除失败');

    await loadConfigs();
    alert('删除成功！');
  } catch (error) {
    alert('删除失败: ' + error.message);
  }
};

// 上传功能相关
const showUploadModal = () => {
  Object.assign(uploadForm, { name: '', content: '' });
  validationResult.value = null;
  new Modal(document.getElementById('uploadModal')).show();
};

const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (file) processFile(file);
};

const handleFileDrop = (event) => {
  event.preventDefault();
  const file = event.dataTransfer.files[0];
  if (file) processFile(file);
};

const processFile = (file) => {
  if (file.size > 5 * 1024 * 1024) {
    alert('文件大小不能超过5MB');
    return;
  }

  const fileName = file.name.replace(/\.(yaml|yml)$/i, '');
  uploadForm.name = fileName;

  const reader = new FileReader();
  reader.onload = (e) => {
    uploadForm.content = e.target.result;
  };
  reader.readAsText(file);
};

const validateConfig = () => {
  if (!uploadForm.content.trim()) {
    alert('请输入配置内容');
    return;
  }

  try {
    // 简单的YAML验证和分析
    const warnings = [];
    let proxiesCount = 0;

    const lines = uploadForm.content.split('\n');
    let hasProxies = false;
    let hasRules = false;

    for (const line of lines) {
      if (line.trim().startsWith('proxies:')) hasProxies = true;
      if (line.trim().startsWith('rules:')) hasRules = true;
      if (line.trim().startsWith('- name:')) proxiesCount++;
    }

    if (!hasProxies) warnings.push('配置中缺少proxies部分');
    if (!hasRules) warnings.push('建议添加rules规则');
    if (proxiesCount === 0) warnings.push('配置中没有代理节点');

    validationResult.value = {
      isValid: hasProxies && proxiesCount > 0,
      proxiesCount,
      warnings
    };

  } catch (error) {
    validationResult.value = {
      isValid: false,
      proxiesCount: 0,
      warnings: ['YAML格式错误: ' + error.message]
    };
  }
};

const uploadConfig = async () => {
  try {
    const finalName = uploadForm.name.endsWith('.yaml') || uploadForm.name.endsWith('.yml')
      ? uploadForm.name
      : uploadForm.name + '.yaml';

    const response = await fetch('/api/configs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: finalName,
        content: uploadForm.content
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '上传失败');
    }

    Modal.getInstance(document.getElementById('uploadModal')).hide();
    await loadConfigs();
    alert('上传成功！');
  } catch (error) {
    alert('上传失败: ' + error.message);
  }
};

// 协议转换相关
const handleConvert = () => {
  labStore.convertLinks(linksToConvert.value);
};

const handleSave = async () => {
  try {
    await labStore.saveConvertedConfig(convertedConfigName.value);
    await loadConfigs();
    alert('保存成功！');
    convertedConfigName.value = '';
  } catch (error) {
    alert('保存失败: ' + error.message);
  }
};

// 调试相关
const handleDebug = () => {
  labStore.debugSubscription(debugSubName.value);
};

// 工具函数
const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString();
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString();
};

const formatDataUsage = (userInfo) => {
  if (!userInfo || typeof userInfo.download !== 'number' || typeof userInfo.upload !== 'number') {
    return '流量信息不完整';
  }

  const format = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const used = userInfo.download + userInfo.upload;
  if (!userInfo.total || userInfo.total === 0) {
    return `已用: ${format(used)} / 无限`;
  }

  const percentage = ((used / userInfo.total) * 100).toFixed(1);
  return `已用: ${format(used)} / ${format(userInfo.total)} (${percentage}%)`;
};

const formatExpireDate = (timestamp) => {
  if (!timestamp || timestamp <= 0) return '过期时间未知';

  const date = new Date(timestamp * 1000);
  if (isNaN(date.getTime())) return '过期时间无效';

  const now = new Date();
  const isExpired = date < now;
  return `过期: ${date.toLocaleDateString()} ${isExpired ? '(已过期)' : ''}`;
};

const getHealthStatusClass = (name) => {
  const status = healthStatus.value.get(name);
  return status ? 'status-error' : 'status-success';
};

const getHealthStatusText = (name) => {
  const status = healthStatus.value.get(name);
  return status ? '更新失败' : '正常';
};

const formatDebugResult = (result) => {
  if (!result) return '';

  let html = `<div class="debug-info">`;
  html += `<div class="debug-item"><strong>订阅名称:</strong> ${result.subscriptionName}</div>`;
  html += `<div class="debug-item"><strong>检查时间:</strong> ${result.timestamp}</div>`;

  // URL检查
  html += `<div class="debug-section">`;
  html += `<h6><i class="bi bi-link"></i> URL列表检查</h6>`;
  if (result.urlList?.error) {
    html += `<div class="status-error">❌ ${result.urlList.error}</div>`;
  } else if (result.urlList?.found) {
    html += `<div class="status-success">✅ 在URL列表中找到</div>`;
    html += `<div class="debug-details">名称: ${result.urlList.name}<br>URL: ${result.urlList.url}</div>`;
  } else {
    html += `<div class="status-warning">⚠️ 不在URL列表中</div>`;
  }
  html += `</div>`;

  // 缓存检查
  html += `<div class="debug-section">`;
  html += `<h6><i class="bi bi-database"></i> 缓存检查</h6>`;
  if (result.cache?.error) {
    html += `<div class="status-error">❌ ${result.cache.error}</div>`;
  } else if (result.cache?.found) {
    html += `<div class="status-success">✅ 找到缓存</div>`;
    html += `<div class="debug-details">`;
    html += `内容长度: ${result.cache.contentLength} 字符<br>`;
    html += `最后更新: ${result.cache.lastUpdated || '未知'}<br>`;
    html += `成功次数: ${result.cache.fetchSuccessCount}<br>`;
    html += `失败次数: ${result.cache.fetchFailureCount}`;
    html += `</div>`;

    if (result.cache.contentPreview) {
      html += `<div class="content-preview"><strong>内容预览:</strong><pre>${result.cache.contentPreview}</pre></div>`;
    }
  } else {
    html += `<div class="status-error">❌ 缓存不存在</div>`;
  }
  html += `</div>`;
  html += `</div>`;

  return html;
};
</script>

<style scoped>
.config-lab {
  min-height: 100vh;
  position: relative;
  padding: 2rem;
}

.page-header {
  text-align: center;
  margin-bottom: 2rem;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.page-title i {
  color: #3498db;
  margin-right: 0.5rem;
}

.page-subtitle {
  color: #7f8c8d;
  font-size: 1.1rem;
  margin: 0;
}

.modern-card {
  border: none;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  background: white;
  overflow: hidden;
  transition: all 0.3s ease;
}

.modern-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
}

.rc-card-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  border: none;
  display: flex;
  justify-content: between;
  align-items: center;
}

.card-title {
  font-weight: 600;
  margin: 0;
}

.card-title i {
  margin-right: 0.5rem;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-icon:hover {
  transform: translateY(-1px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.quick-actions {
  display: flex;
  align-items: center;
}

.status-info {
  display: flex;
  gap: 1rem;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(52, 152, 219, 0.1);
  border-radius: 20px;
  color: #3498db;
  font-size: 0.9rem;
}

.nav-tabs-container {
  background: white;
  border-radius: 15px;
  padding: 0.5rem;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
}

.modern-tabs {
  border: none;
}

.modern-tabs .nav-link {
  border: none;
  border-radius: 10px;
  padding: 1rem 1.5rem;
  color: #7f8c8d;
  font-weight: 500;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modern-tabs .nav-link:hover {
  background: #f8f9fa;
  color: #3498db;
}

.modern-tabs .nav-link.active {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  box-shadow: 0 5px 15px rgba(52, 152, 219, 0.3);
}

.tab-pane {
  display: none;
}

.tab-pane.active {
  display: block;
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.modern-table {
  border: none;
}

.modern-table th {
  background: #f8f9fa;
  border: none;
  padding: 1rem;
  font-weight: 600;
  color: #2c3e50;
}

.modern-table td {
  border: none;
  padding: 1rem;
  vertical-align: middle;
  border-bottom: 1px solid #ecf0f1;
}

.name-cell {
  font-weight: 500;
  color: #2c3e50;
}

.url-cell {
  position: relative;
}

.url-display {
  max-width: 400px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #7f8c8d;
}

.user-info {
  font-size: 0.8rem;
  color: #95a5a6;
  margin-top: 0.25rem;
}

.info-item {
  margin-right: 0.5rem;
}

.info-separator {
  margin: 0 0.5rem;
}

.health-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
  font-size: 0.8rem;
}

.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-success .status-dot,
.status-success {
  background-color: #27ae60;
  color: #27ae60;
}

.status-error .status-dot,
.status-error {
  background-color: #e74c3c;
  color: #e74c3c;
}

.actions-cell .btn-group {
  display: flex;
  gap: 0.25rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #95a5a6;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.converter-info .alert {
  border: none;
  border-radius: 10px;
  padding: 1rem 1.5rem;
}

.input-section,
.output-section {
  height: 100%;
}

.modern-textarea {
  border-radius: 10px;
  border: 2px solid #ecf0f1;
  transition: all 0.3s ease;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
}

.modern-textarea:focus {
  border-color: #3498db;
  box-shadow: 0 0 0 0.2rem rgba(52, 152, 219, 0.25);
}

.code-textarea {
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-size: 0.9rem;
  line-height: 1.5;
}

.btn-convert {
  width: 100%;
  border-radius: 10px;
  padding: 0.75rem;
  font-weight: 500;
}

.debug-input .input-group {
  max-width: 500px;
}

.debug-results {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 1.5rem;
}

.debug-content {
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-size: 0.9rem;
  line-height: 1.6;
}

.debug-info {
  color: #2c3e50;
}

.debug-item {
  margin-bottom: 0.5rem;
}

.debug-section {
  margin: 1rem 0;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  border-left: 4px solid #3498db;
}

.debug-section h6 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.debug-details {
  font-size: 0.9rem;
  color: #7f8c8d;
  margin-top: 0.5rem;
  padding-left: 1rem;
}

.content-preview {
  margin-top: 1rem;
  padding: 1rem;
  background: #2c3e50;
  border-radius: 5px;
  color: #ecf0f1;
}

.content-preview pre {
  color: #ecf0f1;
  margin: 0;
  font-size: 0.8rem;
}

.modern-modal .modal-content {
  border: none;
  border-radius: 15px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modern-modal .modal-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 15px 15px 0 0;
}

.upload-area {
  border: 2px dashed #bdc3c7;
  border-radius: 10px;
  padding: 2rem;
  text-align: center;
  background: #f9f9f9;
  cursor: pointer;
  transition: all 0.3s ease;
}

.upload-area:hover {
  border-color: #3498db;
  background: #ebf3fd;
}

.upload-icon {
  font-size: 2rem;
  color: #95a5a6;
  margin-bottom: 1rem;
}

.upload-text {
  margin-bottom: 0.5rem;
  color: #2c3e50;
  font-weight: 500;
}

.upload-hint {
  color: #95a5a6;
  font-size: 0.9rem;
  margin: 0;
}

.validation-result {
  margin-top: 1rem;
}

.validation-result .alert {
  border-radius: 10px;
  border: none;
}

@media (max-width: 768px) {
  .config-lab {
    padding: 1rem;
  }

  .page-title {
    font-size: 2rem;
  }

  .status-info {
    flex-direction: column;
    gap: 0.5rem;
  }

  .quick-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }

  .modern-tabs .nav-link {
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
  }
}
</style>
