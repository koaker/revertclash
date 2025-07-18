// 全局变量
let allNodes = [];
let filteredNodes = [];
let selectedNodes = new Set();
let nodeTypes = new Set();

// 分页相关变量
let currentPage = 1;
let nodesPerPage = 20; // 每页显示20个节点
let totalPages = 1;

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
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'flex';
    }
}

// 隐藏加载中遮罩
function hideLoading() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
}

// 加载节点列表
async function loadNodes() {
    showLoading();
    try {
        console.log('[前端] 开始加载节点数据...');
        
        const response = await fetch('/api/nodes');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: 加载节点失败`);
        }
        
        const responseData = await response.json();
        console.log('[前端] 接收到API响应:', responseData);
        
        // 兼容新旧API格式
        let nodes = [];

        if (!responseData.success || !responseData.nodes) {
            throw new Error('API返回了无效的数据格式');
        }

        nodes = responseData.nodes;
        console.log(`[前端] 使用新格式数据，数据源: ${responseData.metadata?.dataSource}, 节点数: ${nodes.length}`);

        
        // 验证数据有效性
        if (!Array.isArray(nodes)) {
            throw new Error('节点数据必须是数组格式');
        }
        
        allNodes = nodes;
        filteredNodes = [...allNodes];
        
        // 提取节点类型和选中状态
        nodeTypes.clear();
        selectedNodes.clear();
        
        allNodes.forEach(node => {
            if (node.type) {
                nodeTypes.add(node.type);
            }
            if (node.selected) {
                selectedNodes.add(node.name);
            }
        });
        
        console.log(`[前端] 节点加载完成: 总计 ${allNodes.length} 个，已选中 ${selectedNodes.size} 个，类型数 ${nodeTypes.size} 种`);
        
        // 更新UI
        updateTypeFilter();
        displayNodes(filteredNodes);
        updateNodeCount();
        
        // 显示数据源信息（如果有的话）
        if (responseData.metadata?.dataSource) {
            const statusMsg = `数据源: ${responseData.metadata.dataSource}`;
            console.log(`[前端] ${statusMsg}`);
            
            // 如果是降级数据源，显示提示
            if (responseData.metadata.dataSource === 'legacy' || responseData.metadata.dataSource === 'cached') {
                showDataSourceWarning(responseData.metadata.dataSource);
            }
        }
        
    } catch (error) {
        console.error('[前端] 加载节点失败:', error);
        
        // 尝试重试机制
        if (!loadNodes.retryCount) {
            loadNodes.retryCount = 0;
        }
        
        if (loadNodes.retryCount < 2) {
            loadNodes.retryCount++;
            console.log(`[前端] 第 ${loadNodes.retryCount} 次重试加载节点...`);
            
            setTimeout(() => {
                loadNodes();
            }, 2000);
            return;
        }
        
        // 重试失败，显示错误
        allNodes = [];
        filteredNodes = [];
        displayNodes([]);
        updateNodeCount();
        
        showErrorMessage('加载节点失败: ' + error.message + '\n\n请检查系统状态或刷新页面重试。');
    } finally {
        hideLoading();
    }
}

// 显示数据源警告
function showDataSourceWarning(dataSource) {
    const warningMap = {
        'legacy': '当前使用兼容模式数据，功能可能受限',
        'cached': '当前使用缓存数据，可能不是最新状态',
        'empty': '暂无节点数据，请检查配置'
    };
    
    const message = warningMap[dataSource] || '数据源异常';
    
    // 创建警告提示
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-warning alert-dismissible fade show mt-2';
    alertDiv.innerHTML = `
        <i class="bi bi-exclamation-triangle"></i> ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // 插入到页面顶部
    const container = document.querySelector('.rc-container');
    container.insertBefore(alertDiv, container.firstChild);
    
    // 5秒后自动消失
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// 显示错误消息
function showErrorMessage(message) {
    // 创建错误提示模态框
    const errorModal = document.createElement('div');
    errorModal.className = 'modal fade';
    errorModal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header bg-danger text-white">
                    <h5 class="modal-title">
                        <i class="bi bi-exclamation-triangle"></i> 加载失败
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                    <div class="d-grid gap-2">
                        <button class="btn btn-primary" onclick="reloadNodes()">重新加载</button>
                        <button class="btn btn-outline-secondary" onclick="location.reload()">刷新页面</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(errorModal);
    const modal = new bootstrap.Modal(errorModal);
    modal.show();
    
    // 模态框隐藏后移除DOM
    errorModal.addEventListener('hidden.bs.modal', () => {
        errorModal.remove();
    });
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

// 显示节点列表（支持分页）
function displayNodes(nodes) {
    const nodeList = document.getElementById('nodeList');
    nodeList.innerHTML = '';
    
    if (nodes.length === 0) {
        nodeList.innerHTML = '<tr><td colspan="6" class="text-center">没有找到节点</td></tr>';
        updatePagination(0);
        return;
    }
    
    // 计算分页
    totalPages = Math.ceil(nodes.length / nodesPerPage);
    const startIndex = (currentPage - 1) * nodesPerPage;
    const endIndex = Math.min(startIndex + nodesPerPage, nodes.length);
    const currentPageNodes = nodes.slice(startIndex, endIndex);
    
    // 渲染当前页的节点
    currentPageNodes.forEach(node => {
        const isSelected = selectedNodes.has(node.name);
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>
                <input type="checkbox" class="node-checkbox" 
                       data-node-name="${node.name}" 
                       ${isSelected ? 'checked' : ''} 
                       onchange="toggleNode('${node.name}', this.checked)">
            </td>
            <td title="${node.name}">${truncateText(node.name, 30)}</td>
            <td><span class="badge bg-secondary type-badge">${node.type || '未知'}</span></td>
            <td>${node.server || '未知'}</td>
            <td>${node.port || '未知'}</td>
            <td>
                <button class="rc-btn rc-btn-outline-primary rc-btn-sm" onclick="viewNodeDetails('${node.name}')">
                    <i class="bi bi-info-circle"></i> 详情
                </button>
            </td>
        `;
        
        nodeList.appendChild(row);
    });
    
    // 更新分页控件
    updatePagination(nodes.length);
    
    // 更新全选复选框状态
    updateSelectAllCheckbox();
}

// 文本截断工具函数
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

// 更新分页控件
function updatePagination(totalNodes) {
    let paginationContainer = document.getElementById('paginationContainer');
    
    // 如果不存在分页容器，创建一个
    if (!paginationContainer) {
        paginationContainer = document.createElement('div');
        paginationContainer.id = 'paginationContainer';
        paginationContainer.className = 'mt-3';
        
        // 插入到表格后面
        const tableContainer = document.querySelector('.table-responsive');
        tableContainer.parentNode.insertBefore(paginationContainer, tableContainer.nextSibling);
    }
    
    if (totalNodes <= nodesPerPage) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    // 分页信息
    const startItem = (currentPage - 1) * nodesPerPage + 1;
    const endItem = Math.min(currentPage * nodesPerPage, totalNodes);
    
    paginationContainer.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
            <span class="text-muted">显示 ${startItem}-${endItem} 共 ${totalNodes} 个节点</span>
            <nav aria-label="节点分页">
                <ul class="pagination pagination-sm mb-0">
                    <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                        <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">上一页</a>
                    </li>
                    ${generatePageNumbers()}
                    <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                        <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">下一页</a>
                    </li>
                </ul>
            </nav>
        </div>
    `;
}

// 生成页码
function generatePageNumbers() {
    let pages = '';
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // 调整起始页
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // 第一页和省略号
    if (startPage > 1) {
        pages += `<li class="page-item"><a class="page-link" href="#" onclick="changePage(1)">1</a></li>`;
        if (startPage > 2) {
            pages += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }
    
    // 页码范围
    for (let i = startPage; i <= endPage; i++) {
        pages += `<li class="page-item ${i === currentPage ? 'active' : ''}">
            <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
        </li>`;
    }
    
    // 最后一页和省略号
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            pages += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
        pages += `<li class="page-item"><a class="page-link" href="#" onclick="changePage(${totalPages})">${totalPages}</a></li>`;
    }
    
    return pages;
}

// 切换页面
function changePage(page) {
    if (page < 1 || page > totalPages || page === currentPage) {
        return;
    }
    
    currentPage = page;
    displayNodes(filteredNodes);
}

// 更新节点计数
function updateNodeCount() {
    document.getElementById('selectedCount').textContent = selectedNodes.size;
    document.getElementById('totalCount').textContent = allNodes.length;
}

// 节点操作队列和批处理
let nodeOperationQueue = [];
let operationTimer = null;

// 切换节点选择状态（优化版：支持批处理）
async function toggleNode(nodeName, checked) {
    // 立即更新前端状态，提升用户体验
    if (checked) {
        selectedNodes.add(nodeName);
    } else {
        selectedNodes.delete(nodeName);
    }
    
    // 更新UI
    updateNodeCount();
    updateSelectAllCheckbox();
    
    // 将操作加入队列
    nodeOperationQueue.push({ nodeName, checked });
    
    // 防抖处理：500ms内的操作合并为一次批处理
    if (operationTimer) {
        clearTimeout(operationTimer);
    }
    
    operationTimer = setTimeout(async () => {
        await processBatchNodeOperations();
    }, 500);
}

// 批处理节点操作
async function processBatchNodeOperations() {
    if (nodeOperationQueue.length === 0) return;
    
    const operations = [...nodeOperationQueue];
    nodeOperationQueue = [];
    
    try {
        // 分组操作：选中和取消选中
        const toSelect = operations.filter(op => op.checked).map(op => op.nodeName);
        const toDeselect = operations.filter(op => !op.checked).map(op => op.nodeName);
        
        const promises = [];
        
        if (toSelect.length > 0) {
            promises.push(
                fetch('/api/nodes/select-multiple', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nodeNames: toSelect })
                })
            );
        }
        
        if (toDeselect.length > 0) {
            promises.push(
                fetch('/api/nodes/deselect-multiple', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nodeNames: toDeselect })
                })
            );
        }
        
        const responses = await Promise.all(promises);
        
        // 检查响应状态
        for (const response of responses) {
            if (!response.ok) {
                throw new Error(`批量操作失败: ${response.status}`);
            }
        }
        
        console.log(`批量处理完成: 选中 ${toSelect.length} 个，取消 ${toDeselect.length} 个`);
        
    } catch (error) {
        console.error('批量节点操作失败:', error);
        
        // 错误恢复：重新同步状态
        await syncNodeSelectionState();
        
        showErrorMessage('节点操作失败，已恢复状态: ' + error.message);
    }
}

// 同步节点选择状态（错误恢复机制）
async function syncNodeSelectionState() {
    try {
        const response = await fetch('/api/nodes/selected');
        if (response.ok) {
            const serverSelectedNodes = await response.json();
            const serverSelectedNames = new Set(serverSelectedNodes.map(node => node.name));
            
            // 更新前端状态与服务器同步
            selectedNodes.clear();
            serverSelectedNames.forEach(name => selectedNodes.add(name));
            
            // 更新复选框状态
            document.querySelectorAll('.node-checkbox').forEach(checkbox => {
                const nodeName = checkbox.getAttribute('data-node-name');
                checkbox.checked = selectedNodes.has(nodeName);
            });
            
            updateNodeCount();
            updateSelectAllCheckbox();
        }
    } catch (error) {
        console.error('同步节点状态失败:', error);
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
        const response = await fetch(`/api/nodes/${nodeName}`);
        if (!response.ok) {
            throw new Error('获取节点详情失败');
        }
        
        const node = await response.json();
        const detailBody = document.getElementById('nodeDetailBody');
        
        // 格式化节点详情显示
        let detailHtml = '<div class="node-details">';
        
        // 基本信息部分
        detailHtml += '<h6>基本信息</h6>';
        detailHtml += `<div class="mb-3">`;
        detailHtml += `<p><strong>名称:</strong> ${node.name}</p>`;
        detailHtml += `<p><strong>类型:</strong> ${node.type || '未知'}</p>`;
        detailHtml += `<p><strong>服务器:</strong> ${node.server || '未知'}</p>`;
        detailHtml += `<p><strong>端口:</strong> ${node.port || '未知'}</p>`;
        
        // 如果有协议特定的配置，显示详细配置
        if (node.config && typeof node.config === 'object') {
            detailHtml += '<h6 class="mt-4">详细配置</h6>';
            detailHtml += '<div class="table-responsive"><table class="table table-sm">';
            detailHtml += '<thead><tr><th>属性</th><th>值</th></tr></thead><tbody>';
            
            for (const [key, value] of Object.entries(node.config)) {
                if (key !== 'name' && key !== 'type' && key !== 'server' && key !== 'port') {
                    detailHtml += `<tr><td>${key}</td><td>${value}</td></tr>`;
                }
            }
            
            detailHtml += '</tbody></table></div>';
        }
        
        // 如果有原始URI，显示URI
        if (node.uri) {
            detailHtml += '<h6 class="mt-4">原始URI</h6>';
            detailHtml += `<div class="border p-2 bg-light" style="word-break: break-all;"><code>${node.uri}</code></div>`;
        }
        
        detailHtml += '</div>';
        
        detailBody.innerHTML = detailHtml;
        
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
        console.log('[前端] 触发节点重新加载...');
        
        // 清空重试计数
        loadNodes.retryCount = 0;
        
        // 步骤1: 调用后端重新加载API
        await loadNodes();

        showSuccessMessage('节点重新加载成功！');
        console.log('[前端] 节点重新加载完成');
        
    } catch (err) {
        console.error('[前端] 重新加载节点失败:', err);
        showErrorMessage('重新加载失败: ' + err.message);
    } finally {
        hideLoading();
    }
}

// 显示成功消息
function showSuccessMessage(message) {
    // 创建成功提示
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success alert-dismissible fade show mt-2';
    alertDiv.innerHTML = `
        <i class="bi bi-check-circle"></i> ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // 插入到页面顶部
    const container = document.querySelector('.rc-container');
    container.insertBefore(alertDiv, container.firstChild);
    
    // 3秒后自动消失
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 3000);
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
            const errorData = await response.json().catch(() => ({ error: response.statusText }));
            throw new Error(`导出链接失败: ${response.status} ${errorData.error || response.statusText}`);
        }

        // 正确处理JSON响应
        const responseData = await response.json();
        
        if (!responseData.success) {
            throw new Error(responseData.error || '导出失败');
        }

        // 构建链接文本内容
        const linksContent = [];
        linksContent.push(`# 导出时间: ${new Date().toLocaleString()}`);
        linksContent.push(`# 总计节点: ${responseData.total}`);
        linksContent.push(`# 成功导出: ${responseData.exported}`);
        linksContent.push(`# 失败数量: ${responseData.failed}`);
        linksContent.push('');

        // 添加成功导出的链接
        if (responseData.links && responseData.links.length > 0) {
            linksContent.push('# 成功导出的节点链接:');
            responseData.links.forEach(link => {
                linksContent.push(`# ${link.name} (${link.type})`);
                linksContent.push(link.uri);
                linksContent.push('');
            });
        }

        // 添加失败信息
        if (responseData.errors && responseData.errors.length > 0) {
            linksContent.push('# 导出失败的节点:');
            responseData.errors.forEach(error => {
                linksContent.push(`# ${error.name}: ${error.error}`);
            });
        }

        const linksText = linksContent.join('\n');

        // 创建并下载文本文件
        const blob = new Blob([linksText], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `selected_node_links_${new Date().getTime()}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        // 显示导出结果摘要
        if (responseData.failed > 0) {
            showSuccessMessage(`导出完成！成功: ${responseData.exported}个，失败: ${responseData.failed}个`);
        } else {
            showSuccessMessage(`成功导出 ${responseData.exported} 个节点链接！`);
        }

    } catch (error) {
        console.error('导出节点链接失败:', error);
        alert('导出节点链接失败: ' + error.message);
    } finally {
        hideLoading();
    }
}
