<template>
  <div class="modal fade" :id="modalId" tabindex="-1">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">数据源管理</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <!-- Nav tabs -->
          <ul class="nav nav-tabs">
            <li class="nav-item">
              <a class="nav-link" :class="{ active: activeTab === 'urls' }" @click="activeTab = 'urls'" href="#">订阅链接</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" :class="{ active: activeTab === 'configs' }" @click="activeTab = 'configs'" href="#">自定义配置</a>
            </li>
          </ul>

          <!-- Tab panes -->
          <div class="tab-content pt-3">
            <!-- URLs Tab -->
            <div class="tab-pane" :class="{ active: activeTab === 'urls' }">
              <h6>添加新订阅链接</h6>
              <form @submit.prevent="handleAddUrl" class="row g-3 mb-3">
                <div class="col-md-4">
                  <input type="text" class="form-control" placeholder="名称" v-model="newUrl.name" required>
                </div>
                <div class="col-md-6">
                  <input type="url" class="form-control" placeholder="URL" v-model="newUrl.url" required>
                </div>
                <div class="col-md-2">
                  <button type="submit" class="btn btn-primary w-100">添加</button>
                </div>
              </form>
              <h6>现有订阅链接</h6>
              <ul class="list-group">
                <li v-for="url in store.urls" :key="url.name" class="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <strong>{{ url.name }}</strong>
                    <p class="mb-0 text-muted">{{ url.url }}</p>
                  </div>
                  <button class="btn btn-sm btn-outline-danger" @click="store.deleteUrl(url.name)">删除</button>
                </li>
              </ul>
            </div>

            <!-- Custom Configs Tab -->
            <div class="tab-pane" :class="{ active: activeTab === 'configs' }">
              <h6>添加新自定义配置</h6>
              <form @submit.prevent="handleAddConfig" class="mb-3">
                <div class="mb-2">
                  <input type="text" class="form-control" placeholder="配置名称" v-model="newConfig.name" required>
                </div>
                <div class="mb-2">
                  <textarea class="form-control" rows="5" placeholder="粘贴Clash配置内容..." v-model="newConfig.content" required></textarea>
                </div>
                <button type="submit" class="btn btn-primary">添加配置</button>
              </form>
              <h6>现有自定义配置</h6>
              <ul class="list-group">
                <li v-for="config in store.customConfigs" :key="config.id" class="list-group-item d-flex justify-content-between align-items-center">
                  <span>{{ config.name }}</span>
                  <button class="btn btn-sm btn-outline-danger" @click="store.deleteCustomConfig(config.id)">删除</button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { useSourceStore } from '@/stores/sourceStore';

defineProps({
  modalId: {
    type: String,
    required: true
  }
});

const store = useSourceStore();
const activeTab = ref('urls');

const newUrl = reactive({ name: '', url: '' });
const newConfig = reactive({ name: '', content: '' });

onMounted(() => {
  store.fetchSources();
});

const handleAddUrl = async () => {
  if (!newUrl.name || !newUrl.url) return;
  try {
    await store.addUrl({ ...newUrl });
    newUrl.name = '';
    newUrl.url = '';
  } catch (error) {
    alert('添加失败: ' + error.message);
  }
};

const handleAddConfig = async () => {
  if (!newConfig.name || !newConfig.content) return;
  try {
    await store.addCustomConfig({ ...newConfig });
    newConfig.name = '';
    newConfig.content = '';
  } catch (error) {
    alert('添加失败: ' + error.message);
  }
};
</script>
