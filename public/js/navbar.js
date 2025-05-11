/**
 * RevertClash 导航栏组件
 * 这个文件提供了一个统一的导航栏组件，可以在所有页面中使用
 */

class NavbarComponent {
    constructor() {
        this.currentPath = window.location.pathname;
    }

    /**
     * 获取当前页面的路径
     * @returns {string} 当前页面路径
     */
    getCurrentPage() {
        const path = this.currentPath;
        if (path.endsWith('/')) return path.slice(0, -1);
        return path;
    }

    /**
     * 判断导航项是否应该高亮
     * @param {string} path 导航项路径
     * @returns {boolean} 是否高亮
     */
    isActive(path) {
        const currentPage = this.getCurrentPage();
        
        // 首页特殊处理
        if (path === '/home' && (currentPage === '' || currentPage === '/' || currentPage === '/home')) {
            return true;
        }
        
        return currentPage === path;
    }

    /**
     * 生成导航栏HTML
     * @returns {string} 导航栏HTML
     */
    render() {
        const navItems = [
            { path: '/home', icon: 'bi-house', text: '首页' },
            { path: '/nodes', icon: 'bi-diagram-3', text: '节点管理' },
            { path: '/manage', icon: 'bi-gear-wide-connected', text: '配置管理' },
            { path: '/subscription', icon: 'bi-link', text: '订阅链接' },
            { path: '/account', icon: 'bi-person', text: '账号设置' }
        ];

        // 构建导航项HTML
        const navItemsHtml = navItems.map(item => {
            const activeClass = this.isActive(item.path) ? 'active' : '';
            return `
                <li class="nav-item">
                    <a class="nav-link ${activeClass}" href="${item.path}" data-navlink="${item.path}">
                        <i class="bi ${item.icon} me-1"></i>${item.text}
                    </a>
                </li>
            `;
        }).join('');

        // 构建完整导航栏HTML
        return `
            <nav class="rc-navbar">
                <div class="rc-container rc-d-flex rc-justify-between rc-align-center">
                    <div class="rc-d-flex rc-align-center">
                        <a class="rc-navbar-brand" href="/home">RevertClash</a>
                        
                        <!-- 汉堡菜单按钮 (移动端) -->
                        <button class="rc-navbar-toggle d-md-none" type="button" id="navbarToggler">
                            <i class="bi bi-list"></i>
                        </button>
                    </div>
                    
                    <!-- 导航菜单 -->
                    <div class="rc-navbar-collapse" id="navbarContent">
                        <div class="rc-navbar-menu">
                            <ul class="rc-navbar-nav">
                                ${navItemsHtml}
                            </ul>
                        </div>
                        
                        <!-- 导航栏右侧操作区 -->
                        <div class="rc-navbar-actions">
                            <span class="rc-navbar-user me-3 d-none d-md-flex">
                                <i class="bi bi-person-circle me-1"></i>
                                <span id="username-display">用户名</span>
                            </span>
                            <button onclick="rcNavbar.logout()" class="rc-btn rc-btn-outline-danger rc-btn-sm">
                                <i class="bi bi-box-arrow-right me-1"></i>退出登录
                            </button>
                        </div>
                    </div>
                </div>
            </nav>
        `;
    }

    /**
     * 初始化导航栏
     * @param {string} containerId 容器元素ID
     */
    init(containerId = 'navbar-container') {
        // 检查容器是否存在
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`导航栏容器 #${containerId} 不存在`);
            return;
        }

        // 渲染导航栏
        container.innerHTML = this.render();
        
        // 加载用户信息
        this.loadUserInfo();
        
        // 初始化响应式功能
        this.initResponsive();
        
        // 增强导航链接点击事件
        this.enhanceNavLinks();
    }

    /**
     * 加载用户信息
     */
    async loadUserInfo() {
        try {
            const response = await fetch('/auth/status');
            const data = await response.json();
            
            if (data.loggedIn) {
                const usernameDisplay = document.getElementById('username-display');
                if (usernameDisplay) {
                    usernameDisplay.textContent = data.user.username || '用户';
                }
            } else {
                // 未登录，重定向到登录页
                window.location.href = '/login';
            }
        } catch (error) {
            console.error('获取用户状态失败:', error);
        }
    }

    /**
     * 初始化响应式功能
     */
    initResponsive() {
        const toggler = document.getElementById('navbarToggler');
        const navbarContent = document.getElementById('navbarContent');
        
        if (toggler && navbarContent) {
            toggler.addEventListener('click', function() {
                navbarContent.classList.toggle('show');
            });
            
            // 点击页面其他地方时收起菜单
            document.addEventListener('click', (event) => {
                if (window.innerWidth < 768 && 
                    !toggler.contains(event.target) && 
                    !navbarContent.contains(event.target) &&
                    navbarContent.classList.contains('show')) {
                    navbarContent.classList.remove('show');
                }
            });
        }
    }
    
    /**
     * 增强导航链接点击事件
     * 解决三个界面粘在一起的问题
     */
    enhanceNavLinks() {
        const navLinks = document.querySelectorAll('.nav-link');
        const navbarContent = document.getElementById('navbarContent');
        
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                // 获取目标页面路径
                const targetPath = this.getAttribute('data-navlink');
                
                // 如果是当前页面，则不做任何操作
                if (targetPath === window.location.pathname) {
                    e.preventDefault();
                    return;
                }
                
                // 在移动设备上，先收起菜单
                if (window.innerWidth < 768 && navbarContent) {
                    navbarContent.classList.remove('show');
                }
                
                // 添加页面切换效果
                document.body.style.opacity = '0.8';
                
                // 延迟跳转，确保UI效果和菜单关闭
                if (targetPath && targetPath !== window.location.pathname) {
                    e.preventDefault();
                    setTimeout(() => {
                        window.location.href = targetPath;
                    }, 100);
                }
            });
        });
    }

    /**
     * 退出登录
     */
    async logout() {
        try {
            const response = await fetch('/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // 添加过渡效果
                document.body.style.opacity = '0.8';
                setTimeout(() => {
                    window.location.href = data.redirect || '/login';
                }, 100);
            } else {
                alert('退出登录失败: ' + (data.error || '未知错误'));
            }
        } catch (error) {
            console.error('退出登录请求失败:', error);
            alert('退出登录请求失败，请稍后重试');
        }
    }
}

// 创建全局导航栏组件实例
const rcNavbar = new NavbarComponent();

// 当DOM加载完成时初始化导航栏
document.addEventListener('DOMContentLoaded', function() {
    // 检查是否需要自动初始化导航栏
    const autoInit = document.querySelector('[data-rc-navbar-auto-init]');
    if (autoInit) {
        const containerId = autoInit.getAttribute('data-rc-navbar-container') || 'navbar-container';
        rcNavbar.init(containerId);
    }
    
    // 添加页面过渡效果
    document.body.style.transition = 'opacity 0.2s ease';
    document.body.style.opacity = '1';
}); 