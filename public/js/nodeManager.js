// 全局变量
let allNodes = [];
let filteredNodes = [];
let selectedNodes = new Set();
let nodeTypes = new Set();

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
    // 初始加载节点
    loadNodes();
    
    // 绑定搜索框回车事件
    document.getElementById('searchInput').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            searchNodes();
        }
    });
});

// 显示加载中遮罩
function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

// 隐藏加载中遮罩
function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

// 加载节点列表
async function loadNodes() {
    showLoading();
    try {
        const response = await fetch('/api/nodes');
        if (!response.ok) {
            throw new Error('加载节点失败');
        }
        
        allNodes = await response.json();
        filteredNodes = [...allNodes];
        
        // 提取节点类型
        nodeTypes.clear();
        allNodes.forEach(node => {
            if (node.type) {
                nodeTypes.add(node.type);
            }
            if (node.selected) {
                selectedNodes.add(node.name);
            }
        });
        
        // 更新类型筛选下拉框
        updateTypeFilter();
        
        // 显示节点列表
        displayNodes(filteredNodes);
        
        // 更新节点计数
        updateNodeCount();
    } catch (error) {
        console.error('加载节点失败:', error);
        alert('加载节点失败: ' + error.message);
    } finally {
        hideLoading();
    }
}

// 更新类型筛选下拉框
function updateTypeFilter() {
    const typeFilter = document.getElementById('typeFilter');
    
    // 清空现有选项（保留"全部"选项）
    while (typeFilter.options.length > 1) {
        typeFilter.remove(1);
    }
    
    // 添加类型选项
    nodeTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        typeFilter.appendChild(option);
    });
}

// 显示节点列表
function displayNodes(nodes) {
    const nodeList = document.getElementById('nodeList');
    nodeList.innerHTML = '';
    
    if (nodes.length === 0) {
        nodeList.innerHTML = '<tr><td colspan="6" class="text-center">没有找到节点</td></tr>';
        return;
    }
    
    nodes.forEach(node => {
        const isSelected = selectedNodes.has(node.name);
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>
                <input type="checkbox" class="node-checkbox" 
                       data-node-name="${node.name}" 
                       ${isSelected ? 'checked' : ''} 
                       onchange="toggleNode('${node.name}', this.checked)">
            </td>
            <td>${node.name}</td>
            <td><span class="badge bg-secondary type-badge">${node.type || '未知'}</span></td>
            <td>${node.server || '未知'}</td>
            <td>${node.port || '未知'}</td>
            <td>
                <button class="btn btn-outline-primary btn-sm" onclick="viewNodeDetails('${node.name}')">
                    <i class="bi bi-info-circle"></i> 详情
                </button>
            </td>
        `;
        
        nodeList.appendChild(row);
    });
    
    // 更新全选复选框状态
    updateSelectAllCheckbox();
}

// 更新节点计数
function updateNodeCount() {
    document.getElementById('selectedCount').textContent = selectedNodes.size;
    document.getElementById('totalCount').textContent = allNodes.length;
}

// 切换节点选择状态
async function toggleNode(nodeName, checked) {
    showLoading();
    try {
        const response = await fetch('/api/nodes/select', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nodeName })
        });
        
        if (!response.ok) {
            throw new Error('操作失败');
        }
        
        const result = await response.json();
        
        if (result.success) {
            if (checked) {
                selectedNodes.add(nodeName);
            } else {
                selectedNodes.delete(nodeName);
            }
            
            // 更新节点计数
            updateNodeCount();
            
            // 更新全选复选框状态
            updateSelectAllCheckbox();
        }
    } catch (error) {
        console.error('切换节点状态失败:', error);
        alert('操作失败: ' + error.message);
    } finally {
        hideLoading();
    }
}

// 更新全选复选框状态
function updateSelectAllCheckbox() {
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const nodeCheckboxes = document.querySelectorAll('.node-checkbox');
    
    if (nodeCheckboxes.length === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
        return;
    }
    
    const checkedCount = document.querySelectorAll('.node-checkbox:checked').length;
    
    if (checkedCount === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    } else if (checkedCount === nodeCheckboxes.length) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
    } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = true;
    }
}

// 全选/取消全选切换
function toggleSelectAll() {
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const isChecked = selectAllCheckbox.checked;
    
    if (isChecked) {
        selectAll();
    } else {
        deselectAll();
    }
}

// 全选所有节点
async function selectAll() {
    showLoading();
    try {
        const response = await fetch('/api/nodes/select-all', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('全选操作失败');
        }
        
        const result = await response.json();
        
        if (result.success) {
            // 更新选中状态
            filteredNodes.forEach(node => {
                selectedNodes.add(node.name);
            });
            
            // 更新复选框
            document.querySelectorAll('.node-checkbox').forEach(checkbox => {
                checkbox.checked = true;
            });
            
            // 更新全选复选框
            document.getElementById('selectAllCheckbox').checked = true;
            document.getElementById('selectAllCheckbox').indeterminate = false;
            
            // 更新节点计数
            updateNodeCount();
        }
    } catch (error) {
        console.error('全选操作失败:', error);
        alert('全选操作失败: ' + error.message);
    } finally {
        hideLoading();
    }
}

// 取消全选
async function deselectAll() {
    showLoading();
    try {
        const response = await fetch('/api/nodes/deselect-all', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('取消全选操作失败');
        }
        
        const result = await response.json();
        
        if (result.success) {
            // 更新选中状态
            selectedNodes.clear();
            
            // 更新复选框
            document.querySelectorAll('.node-checkbox').forEach(checkbox => {
                checkbox.checked = false;
            });
            
            // 更新全选复选框
            document.getElementById('selectAllCheckbox').checked = false;
            document.getElementById('selectAllCheckbox').indeterminate = false;
            
            // 更新节点计数
            updateNodeCount();
        }
    } catch (error) {
        console.error('取消全选操作失败:', error);
        alert('取消全选操作失败: ' + error.message);
    } finally {
        hideLoading();
    }
}

// 按类型筛选节点
function filterByType() {
    const typeFilter = document.getElementById('typeFilter');
    const selectedType = typeFilter.value;
    
    if (selectedType === 'all') {
        filteredNodes = [...allNodes];
    } else {
        filteredNodes = allNodes.filter(node => node.type === selectedType);
    }
    
    displayNodes(filteredNodes);
}

// 搜索节点
function searchNodes() {
    const searchInput = document.getElementById('searchInput');
    const keyword = searchInput.value.trim().toLowerCase();
    
    if (keyword === '') {
        filteredNodes = [...allNodes];
    } else {
        filteredNodes = allNodes.filter(node => 
            node.name.toLowerCase().includes(keyword) ||
            (node.server && node.server.toLowerCase().includes(keyword))
        );
    }
    
    displayNodes(filteredNodes);
}

// 查看节点详情
async function viewNodeDetails(nodeName) {
    showLoading();
    try {
        const response = await fetch(`/api/nodes/${encodeURIComponent(nodeName)}`);
        
        if (!response.ok) {
            throw new Error('获取节点详情失败');
        }
        
        const nodeDetails = await response.json();
        
        // 显示节点详情
        const detailContent = document.getElementById('nodeDetailContent');
        detailContent.textContent = JSON.stringify(nodeDetails, null, 2);
        
        // 显示模态框
        const modal = new bootstrap.Modal(document.getElementById('nodeDetailModal'));
        modal.show();
    } catch (error) {
        console.error('获取节点详情失败:', error);
        alert('获取节点详情失败: ' + error.message);
    } finally {
        hideLoading();
    }
}

// 重新加载节点
async function reloadNodes() {
    showLoading();
    try {
        const response = await fetch('/api/nodes/reload', {
            method: 'POST'
        });
        
        if (!response.ok) {
            throw new Error('重新加载节点失败');
        }
        
        const result = await response.json();
        
        if (result.success) {
            alert(`节点重新加载成功，共加载 ${result.count} 个节点`);
            await loadNodes();
        }
    } catch (error) {
        console.error('重新加载节点失败:', error);
        alert('重新加载节点失败: ' + error.message);
    } finally {
        hideLoading();
    }
}

// 下载选中节点配置
function downloadSelectedConfig() {
    if (selectedNodes.size === 0) {
        alert('请至少选择一个节点');
        return;
    }
    
    window.location.href = '/api/nodes/config/selected';
}

// 下载处理后配置
function downloadProcessedConfig() {
    if (selectedNodes.size === 0) {
        alert('请至少选择一个节点');
        return;
    }
    
    window.location.href = '/api/nodes/config/processed';
}

// 导出选中节点的协议链接
async function exportSelectedNodeLinks() {
    if (selectedNodes.size === 0) {
        alert('请至少选择一个节点');
        return;
    }

    showLoading();
    try {
        const selectedNodeNames = Array.from(selectedNodes);

        const response = await fetch('/api/nodes/export-links', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nodeNames: selectedNodeNames })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`导出链接失败: ${response.status} ${errorText || response.statusText}`);
        }

        const linksText = await response.text();

        // 创建并下载文本文件
        const blob = new Blob([linksText], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'selected_node_links.txt'; // 下载的文件名
        document.body.appendChild(link); // 需要添加到DOM才能在某些浏览器中工作
        link.click();
        document.body.removeChild(link); // 点击后移除
        URL.revokeObjectURL(link.href); // 释放内存

    } catch (error) {
        console.error('导出节点链接失败:', error);
        alert('导出节点链接失败: ' + error.message);
    } finally {
        hideLoading();
    }
}
