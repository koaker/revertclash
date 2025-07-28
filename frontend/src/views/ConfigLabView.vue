<template>
  <div class="rc-content">
    <div class="rc-container">
      <!-- 顶部操作栏 -->
      <div class="rc-card mb-4">
        <div class="rc-card-body d-flex justify-content-between align-items-center">
          <div>
            <button class="rc-btn rc-btn-primary">
              <i class="bi bi-arrow-clockwise"></i> 立即更新配置 (待实现)
            </button>
            <button class="rc-btn rc-btn-outline-primary ms-2">
              <i class="bi bi-database"></i> 缓存管理 (待实现)
            </button>
          </div>
        </div>
      </div>

      <!-- 数据源管理 -->
      <div class="rc-card mb-4">
        <div class="rc-card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0"><i class="bi bi-database-gear"></i> 数据源管理</h5>
          <button class="rc-btn rc-btn-info" data-bs-toggle="modal" data-bs-target="#sourceManagerModal">
            打开管理器
          </button>
        </div>
        <div class="rc-card-body">
          在这里管理您的订阅链接和自定义配置文件。
        </div>
      </div>

      <!-- 协议转换 -->
      <div class="rc-card mb-4">
        <div class="rc-card-header">
          <h5 class="mb-0"><i class="bi bi-arrow-repeat"></i> 协议转换</h5>
        </div>
        <div class="rc-card-body">
          <p>将非Clash格式的订阅链接 (SS, VLESS, Hysteria2等) 转换为Clash配置文件。</p>
          <div class="row">
            <div class="col-md-6">
              <label class="form-label">订阅链接 (每行一个)</label>
              <textarea class="form-control" rows="8" v-model="linksToConvert" placeholder="粘贴链接..."></textarea>
              <button class="btn btn-primary mt-2" @click="handleConvert" :disabled="labStore.isLoading">
                {{ labStore.isLoading ? '转换中...' : '转换' }}
              </button>
            </div>
            <div class="col-md-6">
              <label class="form-label">预览结果 (可编辑)</label>
              <textarea class="form-control" rows="8" v-model="labStore.convertedContent"></textarea>
              <div class="input-group mt-2">
                <input type="text" class="form-control" placeholder="输入新配置名称" v-model="convertedConfigName">
                <button class="btn btn-success" @click="handleSave" :disabled="!labStore.convertedContent || labStore.isLoading">
                  保存为配置
                </button>
              </div>
            </div>
          </div>
          <div v-if="labStore.error" class="alert alert-danger mt-3">{{ labStore.error }}</div>
        </div>
      </div>

      <!-- 订阅调试 -->
      <div class="rc-card">
        <div class="rc-card-header">
          <h5 class="mb-0"><i class="bi bi-bug"></i> 订阅调试</h5>
        </div>
        <div class="rc-card-body">
          <div class="input-group">
            <input type="text" class="form-control" placeholder="输入要调试的订阅名称" v-model="debugSubName">
            <button class="btn btn-primary" @click="handleDebug" :disabled="labStore.isLoading">
              {{ labStore.isLoading ? '调试中...' : '开始调试' }}
            </button>
          </div>
          <div v-if="labStore.debugResult" class="mt-3 p-3 bg-light border rounded">
            <h6>调试结果:</h6>
            <pre>{{ JSON.stringify(labStore.debugResult, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>

  <SourceManager modal-id="sourceManagerModal" />
</template>

<script setup>
import { ref } from 'vue';
import { useConfigLabStore } from '@/stores/configLabStore';
import SourceManager from '@/components/SourceManager.vue';

const labStore = useConfigLabStore();

const linksToConvert = ref('');
const convertedConfigName = ref('');
const debugSubName = ref('');

const handleConvert = () => {
  labStore.convertLinks(linksToConvert.value);
};

const handleSave = async () => {
  try {
    await labStore.saveConvertedConfig(convertedConfigName.value);
    alert('保存成功！');
    convertedConfigName.value = '';
  } catch (error) {
    alert('保存失败: ' + error.message);
  }
};

const handleDebug = () => {
  labStore.debugSubscription(debugSubName.value);
};
</script>
