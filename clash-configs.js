/**
 * ClashVerge 代理规则配置生成脚本
 * MIT License ~
 * author : Phantasia https://github.com/MarchPhantasia
 * editer : spocel https://github.com/spocel
 */

// ==================== 用户配置区（可自由修改） ====================

/**
 * 常用配置选项
 */
const CONFIG = {
    // 测试连接URL
    testUrl: "https://www.google.com",
    
    // 自动测试间隔 (秒)
    testInterval: 300,
    
    // 自动选择容差 (毫秒)
    tolerance: 20,
    
    // 负载均衡策略："round-robin" | "sticky-sessions" | "consistent-hashing"
    balanceStrategy: "sticky-sessions"
};

/**
 * 用户自定义规则（高优先级）
 * 这些规则会被放置在所有其他规则之前，确保不会被其他规则覆盖
 */
const USER_RULES = [
    "DOMAIN-SUFFIX,v2ex.com,国外网站",
    "DOMAIN-SUFFIX,nodeseek.com,国外网站",
    "DOMAIN-SUFFIX,mnapi.com,DIRECT",
    "DOMAIN-SUFFIX,ieee.org,DIRECT",
    "DOMAIN-SUFFIX,anrunnetwork.com,DIRECT",
    "DOMAIN-SUFFIX,apifox.com,DIRECT",
    "DOMAIN-SUFFIX,crond.dev,DIRECT",
    "IP-CIDR,223.113.52.0/22,DIRECT,no-resolve",
    "DOMAIN-SUFFIX,sogou.com,REJECT",
    "DOMAIN-SUFFIX,sec.sginput.qq.com,REJECT",
    "DOMAIN-SUFFIX,sor.html5.qq.com,REJECT",
    "DOMAIN-SUFFIX,hsbc.com.hk,DIRECT",
    "DOMAIN-SUFFIX,verykuai.com,DIRECT",
    "DOMAIN,clash.razord.top,DIRECT",
    "DOMAIN,yacd.haishan.me,DIRECT",
    "PROCESS-NAME,SGTool.exe,REJECT",
    "PROCESS-NAME,SGWebRender.exe,REJECT",
    "PROCESS-NAME,SogouImeBroker.exe,REJECT",
    "PROCESS-NAME,SGDownload.exe,REJECT",
    "PROCESS-NAME,SGBizLauncher.exe,REJECT",
    "PROCESS-NAME,PinyinUp.exe,REJECT",
    // 在此添加更多自定义规则...
];

const SAVED_RULES = [
    "RULE-SET,applications,国内网站",
    "RULE-SET,reject,广告拦截",
    "RULE-SET,icloud,国内网站",
    "RULE-SET,private,国内网站",
    "RULE-SET,apple,国内网站",
    "RULE-SET,tld_not_cn,国外网站",
    "RULE-SET,gfw,国外网站",
    "RULE-SET,greatfire,国外网站",
    "RULE-SET,telegramcidr,国外网站",
    "RULE-SET,lancidr,DIRECT",
    "RULE-SET,cncidr,DIRECT,no-resolve",
    "GEOSITE,gfw,国外网站",
    "GEOIP,CN,国内网站",
    "RULE-SET,direct,国内网站",
    "RULE-SET,proxy,国外网站",
    "MATCH,规则外"
]
/**
 * 高质量节点关键词列表
 * 用于筛选名称中包含这些关键词的节点作为高质量节点
 */
const HIGH_QUALITY_KEYWORDS = [
    // 线路类型关键词
    "IEPL", "Iepl", "iepl",
    "IPLC", "iplc", "Iplc", "专线", "高速",
    "深港", "沪日", "沪美", "夏港","x15",
    // 节点等级关键词
    "SVIP", "svip", 
    "Svip", "VIP", "vip", "Vip", "Premium", 
    "premium",
    
    // 特殊用途关键词
    "特殊", "特殊线路", "游戏", "Game", "game"
    
    // 在此添加更多关键词...
];

const LOW_QUALITY_KEYWORDS = [
    "无限", "x0.","低质","低价"
];
const LOW_QUALITY__PROVIDER_KEYWORDS = [
    "低质"
];
const NOT_PROXIES_KEYWORDS = [ "备用", "登录" , "商业" , "官网" , "渠道", "测试", "重置", "周期", "进群", "订阅", "车友", "编辑", "谢谢", "不通", "限制", "剩余", "公告", "套餐", "算法", "实测"
];
const HOUSEHOLE_KEYWORDS = ["家宽", "家庭宽带", "原生", "高级", "精品"]
const NEED_DIALER_KEYWORDS = [
    // 线路类型关键词
     "need-dialer"
];
/**
 * 国家或者地区节点关键词列表
 * 用于筛选名称中包含这些关键词的节点作为高质量节点
 */
const DIVIDE_KEYWORDS = "|-|";

const COUNTRY_OR_REGION_KEYWORDS = [
    {
        name : "香港",
        keywords : ["香港", "HK", "Hong", "ASYNCHRONOUS", "AnyPath®"],
        enable: true,
        enableAuto : true,
    },
    {
        name : "美国",
        keywords : ["美国", "US", "United States"],
        enable: true,
        enableAuto : true,
    },
    {
        name : "日本",
        keywords : ["日本", "JP", "Japan"],
        enable: true,
        enableAuto : true,
    },
    {
        name : "台湾",
        keywords : ["台湾", "TW", "Taiwan"],
        enable: true,
        enableAuto : true,
    },
    {
        name : "新加坡",
        keywords : ["新加坡", "SG", "Singapore"],
        enable: false,
        enableAuto : false,
    },
    {
        name : "韩国",
        keywords : ["韩国", "KR", "Korea"],
        enable: false,
        enableAuto : false,
    },
    {
        name : "欧洲系列",
        keywords: ["欧洲", "EU", "Europe", "法国", "FR", "France", "德国", "Germany", "英国", "GB", "United Kingdom", "Italy", "IT", "意大利", "西班牙", "ES", "Spain", "荷兰", "NL", "Netherlands", "爱尔兰"],
        enable: true,
        enableAuto : false,
    },
    {
        name : "加拿大",
        keywords : ["加拿大", "CA", "Canada"],
        enable: false,
        enableAuto : false,
    },
    {
        name :"澳大利亚",
        keywords : ["澳大利亚", "AU", "Australia"],
        enable: false,
        enableAuto : false,
    },
    {
        name : "俄罗斯",
        keywords : ["俄罗斯", "RU", "Russia"],
        enable: false,
        enableAuto : false,
    },
];
/**
 * 代理规则配置
 * name: 规则名称
 * gfw: 是否被墙 (true=默认走代理, false=默认直连)
 * urls: 规则集链接，可以是单个URL或URL数组
 * payload: 自定义规则内容，设置后urls将被忽略
 * extraProxies: 额外添加到此规则组的代理，例如REJECT用于广告拦截
 */
// 规则越往前越优先级越高，规则组内的规则会被合并到一起
const PROXY_RULES = [
    // 广告拦截
    { 
        name: "广告拦截", 
        gfw : false,
        extraProxies: "REJECT", 
        urls: "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/AdvertisingLite/AdvertisingLite_Classical.yaml" 
    },
    
    // 自定义规则示例
    { 
        name: "linux.do", 
        gfw : true,
        payload: "DOMAIN-SUFFIX,linux.do" 
    },
    { 
        name: "ip检测", 
        gfw : true,
        payload: [
            "DOMAIN-SUFFIX,ping0.cc",
            "DOMAIN-SUFFIX,speed.cloudflare.com",
            "DOMAIN-SUFFIX,speedtest.net",
            "DOMAIN-SUFFIX,ipdata.co",
        ]
    },
    { 
        name: "必须美国节点：exhentai、openai、claude、gemini", 
        gfw : true,
        payload: [
            "DOMAIN-SUFFIX,exhentai.org",
            "DOMAIN-SUFFIX,e-hentai.org",
            "DOMAIN,cdn.usefathom.com",
            "DOMAIN-SUFFIX,anthropic.com",
            "DOMAIN-SUFFIX,claude.ai"
        ],
        urls: ["https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/OpenAI/OpenAI_No_Resolve.yaml",
            "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/TikTok/TikTok_No_Resolve.yaml" ,
            "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@release/rule/Clash/Gemini/Gemini.yaml"
        ]
    },
    { 
        name: "pixiv与18comic", 
        gfw : true,
        payload:  [
            "DOMAIN-SUFFIX,pixiv.net",
            "DOMAIN-SUFFIX,i.pximg.net",
            "DOMAIN-SUFFIX,18comic.vip",
        ]
    },
    { 
        name: "塔科夫、你画我猜、Steam、apex", 
        gfw : true,
        payload:  [
            "DOMAIN-SUFFIX,eft-project.com",
            "DOMAIN-SUFFIX,escapefromtarkov.com",
            "DOMAIN,b47db.playfabapi.com",
            "IP-CIDR,8.218.91.138/22",
            "PROCESS-NAME,r5apex_dx12.exe"
        ],
        urls: "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@release/rule/Clash/Steam/Steam_No_Resolve.yaml" 
    },
    { 
        name: "建议走低质量节点：下载服务器列表", 
        gfw : false,
        payload:  [
            "DOMAIN-SUFFIX,eft-store.com",
            "DOMAIN-SUFFIX,dl.steam.clngaa.com",
            "DOMAIN-SUFFIX,st.dl.eccdnx.com",
            "DOMAIN-SUFFIX,steamcontent.com",
            "DOMAIN-SUFFIX,steamstatic.com",
            "DOMAIN-SUFFIX,xz.pphimalayanrt.com",
            "DOMAIN-SUFFIX,storage.live.com",
            "DOMAIN-SUFFIX,sharepoint.com",
            "DOMAIN-SUFFIX,cloudflarestorage.com",
            "DOMAIN-SUFFIX,dl.google.com",
            "DOMAIN-SUFFIX,imput.net",
            "DOMAIN-SUFFIX,googlevideo.com",
        ]
    },
    {
        name: "IDM",
        gfw : false,
        payload : [
            "PROCESS-NAME,IDMan.exe"
        ]
    },
    { 
        name: "🎬国外媒体、spotift、netflix", 
        gfw : true,
        payload:  [
            "DOMAIN-SUFFIX,deezer.com",
            "DOMAIN-SUFFIX,dzcdn.net",
            "DOMAIN-SUFFIX,kkbox.com",
            "DOMAIN-SUFFIX,kkbox.com.tw",
            "DOMAIN-SUFFIX,kfs.io",
            "DOMAIN-SUFFIX,joox.com",
            "DOMAIN-SUFFIX,pandora.com",
            "DOMAIN-SUFFIX,p-cdn.us",
            "DOMAIN-SUFFIX,sndcdn.com",
            "DOMAIN-SUFFIX,soundcloud.com",
            "DOMAIN-SUFFIX,pscdn.co",
            "DOMAIN-SUFFIX,scdn.co",
            "DOMAIN-SUFFIX,tidal.com",
            "DOMAIN-SUFFIX,c4assets.com",
            "DOMAIN-SUFFIX,channel4.com",
            "DOMAIN-SUFFIX,abema.io",
            "DOMAIN-SUFFIX,ameba.jp",
            "DOMAIN-SUFFIX,abema.tv",
            "DOMAIN-SUFFIX,hayabusa.io",
            "DOMAIN,abematv.akamaized.net",
            "DOMAIN,ds-linear-abematv.akamaized.net",
            "DOMAIN,ds-vod-abematv.akamaized.net",
            "DOMAIN,linear-abematv.akamaized.net",
            "DOMAIN-SUFFIX,aiv-cdn.net",
            "DOMAIN-SUFFIX,aiv-delivery.net",
            "DOMAIN-SUFFIX,amazonvideo.com",
            "DOMAIN-SUFFIX,primevideo.com",
            "DOMAIN,avodmp4s3ww-a.akamaihd.net",
            "DOMAIN,d25xi40x97liuc.cloudfront.net",
            "DOMAIN,dmqdd6hw24ucf.cloudfront.net",
            "DOMAIN,d22qjgkvxw22r6.cloudfront.net",
            "DOMAIN,d1v5ir2lpwr8os.cloudfront.net",
            "DOMAIN-KEYWORD,avoddashs",
            "DOMAIN-SUFFIX,bahamut.com.tw",
            "DOMAIN-SUFFIX,gamer.com.tw",
            "DOMAIN,gamer-cds.cdn.hinet.net",
            "DOMAIN,gamer2-cds.cdn.hinet.net",
            "DOMAIN-SUFFIX,bbc.co.uk",
            "DOMAIN-SUFFIX,bbci.co.uk",
            "DOMAIN-KEYWORD,bbcfmt",
            "DOMAIN-KEYWORD,uk-live",
            "DOMAIN-SUFFIX,dazn.com",
            "DOMAIN-SUFFIX,dazn-api.com",
            "DOMAIN,d151l6v8er5bdm.cloudfront.net",
            "DOMAIN-KEYWORD,voddazn",
            "DOMAIN-SUFFIX,bamgrid.com",
            "DOMAIN-SUFFIX,disney-plus.net",
            "DOMAIN-SUFFIX,disneyplus.com",
            "DOMAIN-SUFFIX,dssott.com",
            "DOMAIN,cdn.registerdisney.go.com",
            "DOMAIN-SUFFIX,encoretvb.com",
            "DOMAIN,edge.api.brightcove.com",
            "DOMAIN,bcbolt446c5271-a.akamaihd.net",
            "DOMAIN-SUFFIX,fox.com",
            "DOMAIN-SUFFIX,foxdcg.com",
            "DOMAIN-SUFFIX,theplatform.com",
            "DOMAIN-SUFFIX,uplynk.com",
            "DOMAIN-SUFFIX,hbo.com",
            "DOMAIN-SUFFIX,hbogo.com",
            "DOMAIN-SUFFIX,hbonow.com",
            "DOMAIN-SUFFIX,hbogoasia.com",
            "DOMAIN-SUFFIX,hbogoasia.hk",
            "DOMAIN,bcbolthboa-a.akamaihd.net",
            "DOMAIN,players.brightcove.net",
            "DOMAIN,s3-ap-southeast-1.amazonaws.com",
            "DOMAIN,dai3fd1oh325y.cloudfront.net",
            "DOMAIN,44wilhpljf.execute-api.ap-southeast-1.amazonaws.com",
            "DOMAIN,hboasia1-i.akamaihd.net",
            "DOMAIN,hboasia2-i.akamaihd.net",
            "DOMAIN,hboasia3-i.akamaihd.net",
            "DOMAIN,hboasia4-i.akamaihd.net",
            "DOMAIN,hboasia5-i.akamaihd.net",
            "DOMAIN,cf-images.ap-southeast-1.prod.boltdns.net",
            "DOMAIN-SUFFIX,5itv.tv",
            "DOMAIN-SUFFIX,ocnttv.com",
            "DOMAIN-SUFFIX,hulu.com",
            "DOMAIN-SUFFIX,huluim.com",
            "DOMAIN-SUFFIX,hulustream.com",
            "DOMAIN-SUFFIX,happyon.jp",
            "DOMAIN-SUFFIX,hulu.jp",
            "DOMAIN-SUFFIX,itv.com",
            "DOMAIN-SUFFIX,itvstatic.com",
            "DOMAIN,itvpnpmobile-a.akamaihd.net",
            "DOMAIN-SUFFIX,kktv.com.tw",
            "DOMAIN-SUFFIX,kktv.me",
            "DOMAIN,kktv-theater.kk.stream",
            "DOMAIN-SUFFIX,linetv.tw",
            "DOMAIN,d3c7rimkq79yfu.cloudfront.net",
            "DOMAIN-SUFFIX,litv.tv",
            "DOMAIN,litvfreemobile-hichannel.cdn.hinet.net",
            "DOMAIN-SUFFIX,channel5.com",
            "DOMAIN-SUFFIX,my5.tv",
            "DOMAIN,d349g9zuie06uo.cloudfront.net",
            "DOMAIN-SUFFIX,mytvsuper.com",
            "DOMAIN-SUFFIX,tvb.com",
            "DOMAIN-SUFFIX,dmc.nico",
            "DOMAIN-SUFFIX,nicovideo.jp",
            "DOMAIN-SUFFIX,nimg.jp",
            "DOMAIN-SUFFIX,socdm.com",
            "DOMAIN-SUFFIX,pbs.org",
            "DOMAIN-SUFFIX,phncdn.com",
            "DOMAIN-SUFFIX,pornhub.com",
            "DOMAIN-SUFFIX,pornhubpremium.com",
            "DOMAIN-SUFFIX,skyking.com.tw",
            "DOMAIN,hamifans.emome.net",
            "DOMAIN-SUFFIX,jtvnw.net",
            "DOMAIN-SUFFIX,viu.com",
            "DOMAIN-SUFFIX,viu.tv",
            "DOMAIN,api.viu.now.com",
            "DOMAIN,d1k2us671qcoau.cloudfront.net",
            "DOMAIN,d2anahhhmp1ffz.cloudfront.net",
            "DOMAIN,dfp6rglgjqszk.cloudfront.net",
            "DOMAIN,pincong.rocks",
        ],
        urls: [
            "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@release/rule/Clash/Netflix/Netflix.yaml",
            "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@release/rule/Clash/Netflix/Netflix_IP.yaml",
            "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@release/rule/Clash/Netflix/Netflix_Classical.yaml",
            "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@release/rule/Clash/Netflix/Netflix_IP.txt",
            "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Netflix/Netflix_No_Resolve.yaml",
            "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@release/rule/Clash/Spotify/Spotify.yaml",
            "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@release/rule/Clash/Twitch/Twitch.yaml"
        ]
    },
    { 
        name: "💳 Paypal", 
        gfw : true,
        urls : ["https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@release/rule/Clash/PayPal/PayPal.yaml"]
    },
    { 
        name: "📢 Discord", 
        gfw : true,
        payload:  [
            "DOMAIN-SUFFIX,airhorn.solutions",
            "DOMAIN-SUFFIX,airhornbot.com",
            "DOMAIN-SUFFIX,bigbeans.solutions",
            "DOMAIN-SUFFIX,dis.gd",
            "DOMAIN-SUFFIX,discord-activities.com",
            "DOMAIN-SUFFIX,discord.co",
            "DOMAIN-SUFFIX,discord.com",
            "DOMAIN-SUFFIX,discord.design",
            "DOMAIN-SUFFIX,discord.dev",
            "DOMAIN-SUFFIX,discord.gg",
            "DOMAIN-SUFFIX,discord.gift",
            "DOMAIN-SUFFIX,discord.gifts",
            "DOMAIN-SUFFIX,discord.media",
            "DOMAIN-SUFFIX,discord.new",
            "DOMAIN-SUFFIX,discord.store",
            "DOMAIN-SUFFIX,discord.tools",
            "DOMAIN-SUFFIX,discordactivities.com",
            "DOMAIN-SUFFIX,discordapp.com",
            "DOMAIN-SUFFIX,discordapp.io",
            "DOMAIN-SUFFIX,discordapp.net",
            "DOMAIN-SUFFIX,discordapp.page.link",
            "DOMAIN-SUFFIX,discordcdn.com",
            "DOMAIN-SUFFIX,discordmerch.com",
            "DOMAIN-SUFFIX,discordpartygames.com",
            "DOMAIN-SUFFIX,discordsays.com",
            "DOMAIN-SUFFIX,discordstatus.com",
            "DOMAIN-SUFFIX,hammerandchisel.ssl.zendesk.com",
            "DOMAIN-SUFFIX,watchanimeattheoffice.com",
        ]
    },
    { 
        name: "🎬哔哩哔哩", 
        gfw : false,
        payload:  [
            "DOMAIN-SUFFIX,biliapi.com",
            "DOMAIN-SUFFIX,biliapi.net",
            "DOMAIN-SUFFIX,bilibili.com",
            "DOMAIN-SUFFIX,bilibili.tv",
            "DOMAIN-SUFFIX,bilivideo.com",
        ]
    },
    { 
        name: "deepseek", 
        gfw : false,
        payload:  [
            "DOMAIN-SUFFIX,deepseek.com",
        ]
    },

    // 常用网站分组
    { 
        name: "程序员需要:github、huggingface、docker、civitai", 
        gfw : true,
        payload: [
            "DOMAIN-SUFFIX,huggingface.co",
            "DOMAIN-SUFFIX,jsdelivr.net",
            "DOMAIN-SUFFIX,githubusercontent.com",
            "DOMAIN-SUFFIX,gitlab.com",
            "DOMAIN-SUFFIX,github.com",
            "DOMAIN-SUFFIX,docker.com",
            "DOMAIN-SUFFIX,debian.org",
            "DOMAIN-SUFFIX,dribbble.com",
            "DOMAIN-SUFFIX,ubuntu.com",
            "DOMAIN-SUFFIX,centos.org",
            "DOMAIN-SUFFIX,fedoraproject.org",
            "DOMAIN-SUFFIX,almalinux.org",
            "DOMAIN-SUFFIX,stackoverflow.com",
            "DOMAIN-SUFFIX,reddit.com",
            "DOMAIN-SUFFIX,regexr.com",
            "DOMAIN-SUFFIX,v2ex.com",
            "DOMAIN-SUFFIX,ideone.com",
            "DOMAIN-SUFFIX,jsfiddle.net",
            "DOMAIN-SUFFIX,codepen.io",
            "DOMAIN-SUFFIX,geeksforgeeks.org",
            "DOMAIN-SUFFIX,coursera.org",
            "DOMAIN-SUFFIX,topcoder.com",
            "DOMAIN-SUFFIX,civitai.com"
        ],
        urls: "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/GitHub/GitHub.yaml" 
    },
    { 
        name: "YouTube", 
        gfw : true,
        urls: [
            "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/YouTube/YouTube.yaml",
            "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/YouTubeMusic/YouTubeMusic.yaml"
        ]
    },
    { 
        name: "Google", 
        gfw : true,
        urls: "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Google/Google_No_Resolve.yaml" 
    },
    { 
        name: "Twitter与Facebook", 
        gfw : true,
        urls: [
            "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Twitter/Twitter_No_Resolve.yaml",
            "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Facebook/Facebook_No_Resolve.yaml"
        ]
    },
    { 
        name: "Telegram", 
        gfw : true,
        urls: [
            "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Telegram/Telegram.yaml",
        ]
    },
    { 
        name: "OneDrive", 
        gfw : true,
        urls: "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/OneDrive/OneDrive_No_Resolve.yaml" 
    },
    { 
        name: "Microsoft与bing服务", 
        gfw : true,
        urls: "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Microsoft/Microsoft_No_Resolve.yaml" 
    },
    { 
        name: "Cloudflare", 
        gfw : true,
        urls: "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Cloudflare/Cloudflare_No_Resolve.yaml" 
    },
];

/**
 * DNS 配置
 * 可根据需要修改DNS服务器
 */
const DNS_CONFIG = {
    // 国际可信DNS (加密)
    trustDnsList: [
        "tls://8.8.8.8", "tls://1.1.1.1", "tls://9.9.9.9",
        "https://8.8.8.8/dns-query", "https://1.1.1.1/dns-query"
    ],
    
    // 默认DNS (用于解析域名服务器，必须为IP，可加密)
    defaultDNS: ["tls://1.12.12.12", "tls://223.5.5.5"],
    
    // 中国大陆DNS服务器
    cnDnsList: [
        '119.29.29.29',                    // Tencent Dnspod
        '223.5.5.5',                       // Ali DNS
        '1.12.12.12',                      // China Telecom
        "114.114.114.114",
    ],
    
    // DNS隐私保护过滤器
    fakeIpFilter: [
        "+.lan", "+.local",
        // Windows网络连接检测
        "+.msftconnecttest.com", "+.msftncsi.com",
        // QQ/微信快速登录检测
        "localhost.ptlogin2.qq.com", "localhost.sec.qq.com",
        "localhost.work.weixin.qq.com",
    ],
    
    // 指定域名使用的DNS服务器
    // 格式: "域名或geosite": DNS服务器
    nameserverPolicy: {
        "geosite:private": "system",
        "geosite:cn,steam@cn,category-games@cn,microsoft@cn,apple@cn": 'cnDnsList'
    },
    
    // 需要指定使用国外DNS的域名
    fallbackDomains: [
        "+.azure.com", "+.bing.com", "+.bingapis.com",
        "+.cloudflare.net", "+.docker.com", "+.docker.io",
        "+.facebook.com", "+.github.com", "+.githubusercontent.com",
        "+.google.com", "+.gstatic.com", "+.google.dev",
        "+.googleapis.cn", "+.googleapis.com", "+.googlevideo.com",
        "+.instagram.com", "+.meta.ai", "+.microsoft.com",
        "+.microsoftapp.net", "+.msn.com", "+.openai.com",
        "+.poe.com", "+.t.me", "+.twitter.com",
        "+.x.com", "+.youtube.com"
    ]
};

// ==================== 系统实现区（一般不需要修改） ====================

const REGEX_CACHE = {
    highQuality: new RegExp(HIGH_QUALITY_KEYWORDS.join("|"), "i"),
    lowQuality: new RegExp(LOW_QUALITY_KEYWORDS.join("|"), "i"),
    notProxy: new RegExp(NOT_PROXIES_KEYWORDS.join("|"), "i"),
    needDialer: new RegExp(NEED_DIALER_KEYWORDS.join("|"), "i"),
    lowQualityProvider: new RegExp(LOW_QUALITY__PROVIDER_KEYWORDS.join("|"), "i"),
    householdProxy: new RegExp(HOUSEHOLE_KEYWORDS.join("|"), "i"),
};

// 构建DNS配置对象
const dns = buildDnsConfig(DNS_CONFIG);

// ==================== 辅助函数部分 ====================

/**
 * 构建DNS配置对象
 * @param {Object} config "DNS配置参数
 * @returns {Object} 完整的DNS配置对象
 */
function buildDnsConfig(config) {
    return {
        enable: true,
        listen: ":53",
        ipv6: true,
        "prefer-h3": true,
        "use-hosts": true,
        "use-system-hosts": true,
        "respect-rules": true,
        "enhanced-mode": "fake-ip",
        "fake-ip-range": "198.18.0.1/16",
        "fake-ip-filter": config.fakeIpFilter,
        "default-nameserver": config.defaultDNS,
        nameserver: config.trustDnsList,
        "proxy-server-nameserver": config.cnDnsList, // 直接引用以避免数组复制
        "nameserver-policy": {
            "geosite:private": "system",
            "geosite:cn,steam@cn,category-games@cn,microsoft@cn,apple@cn": config.cnDnsList,
        },
        fallback: config.trustDnsList,
        "fallback-filter": {
            geoip: true,
            "geoip-code": "CN",
            geosite: ["gfw"],
            ipcidr: ["240.0.0.0/4"],
            domain: config.fallbackDomains
        }
    };
}

/**
 * 创建规则提供器配置 "使用对象复用优化性能
 * @param {string} url "规则集URL
 * @returns {Object} 规则提供器配置对象
 */
function createRuleProviderUrl(url) {
    return {
        type: "http",
        interval: 86400,
        behavior: "classical",
        format: "yaml",
        url
    };
}

/**
 * 创建payload对应的规则 "优化数组操作
 * @param {string|string[]} payload "规则内容
 * @param {string} name "规则名称
 * @returns {string[]} 处理后的规则列表
 */
function createPayloadRules(payload, name) {
    const payloads = Array.isArray(payload) ? payload : [payload];
    const len = payloads.length;
    const rules = new Array(len);
    // 直接调用 replace 而非 replaceAll（多数环境中效果相似且高效）
    const normalizedName = name.split(",").join("-");
    
    for (let i = 0; i < len; i++) {
        const item = payloads[i];
        const p = item.split(",");
        let insertPos = p.length;
        
        // 比较时避免转换大小写
        const last = p[p.length - 1];
        if (last === "no-resolve" || last === "NO-RESOLVE") {
            insertPos--;
        }
        
        p.splice(insertPos, 0, normalizedName);
        rules[i] = p.join(",");
    }
    
    return rules;
}

/**
 * 创建普通（非GFW）代理组
 * @param {string} name "代理组名称
 * @param {string|string[]} addProxies "额外代理
 * @param {string} testUrl "测试链接
 * @returns {Object} 代理组配置
 */
function createProxyGroup(name, addProxies, testUrl, gfw, baseProxyGroups) {
    // 确保addProxies是数组，如果为空则使用空数组
    const proxyList = addProxies ? (Array.isArray(addProxies) ? addProxies : [addProxies]) : [];
    
    // 收集代理组名称
    const groupNames = baseProxyGroups.map(group => group.name);
    
    
    // 根据gfw标志构建不同顺序的代理列表
    const proxies = gfw
        ? [...proxyList, ...groupNames, "DIRECT"]
        : [...proxyList, "DIRECT", ...groupNames];

    // 过滤掉可能的undefined值并返回配置
    return {
        name: name,
        type: "select",
        proxies: proxies.filter(Boolean), // 过滤undefined/null值
        url: testUrl
    };
}

/*
 * 获取按照规则的名称
 * @param {Array} 列表
 * @returns {Array} 按照规则的名称列表
 */
function filterNameByRules(proxies, rules = null, inverse = false) {
    if (!proxies || !Array.isArray(proxies)) {
        return [];
    }
    
    if (!rules) {
        return proxies.map(proxy => proxy.name || "");
    }
    
    return proxies.filter(proxy => 
        inverse !== rules.test(proxy.name || "")
    ).map(proxy => proxy.name || "");
}

function filtersocks5ProxiesName(proxies) {
    if (!proxies || !Array.isArray(proxies)) {
        return [];
    }
    
    return proxies.filter(proxy => {
        const typeName = proxy.type || "";
        return typeName.includes("socks5") || typeName.includes("SOCKS5") ;
    }).map(proxy => proxy.name || "");
}
/**
 * 删除非节点 "使用正则表达式优化性能
 * @param {Array} proxies "所有代理节点
 * @returns {Array} 符合条件的节点名称列表
 */
function filterNotProxies(proxies) {
    console.log("传入的节点", proxies)
    if (!proxies || !Array.isArray(proxies)) {
        console.log("空节点")
        return [];
    }
    console.log("非空节点")
    const countryRegex = REGEX_CACHE.notProxy;
    proxies = proxies.filter(proxy => {
        const proxyName = proxy.name || "";
        return !countryRegex.test(proxyName);
    });
    console.log("筛选后的节点", proxies)
    return proxies;
}

/**
 * 筛选地区节点 "使用正则表达式优化性能
 * @param {Array} proxies "所有代理节点
 * @returns {Array} 符合条件的高质量节点名称列表
 */
function filterCountryOrRegionProxies(proxies) {
    if (!proxies || !Array.isArray(proxies)) {
        return [];
    }
    const COUNTRY_OR_REGION_KEYWORDS_FILTERED = COUNTRY_OR_REGION_KEYWORDS.filter(item => item.enable);
    if (COUNTRY_OR_REGION_KEYWORDS_FILTERED.length === 0) {
        return [];
    }
    return COUNTRY_OR_REGION_KEYWORDS_FILTERED.map(countryRegion => {
        const countryRegex = new RegExp(countryRegion.keywords.join("|"));
        const filteredProxiesName = proxies
            .map(proxy => proxy.name || "")
            .filter(proxyName => countryRegex.test(proxyName));
            
        return filteredProxiesName.length > 0 ? {name :countryRegion.name, enableAuto: countryRegion.enableAuto, proxies: [...filteredProxiesName]} 
        : {name:countryRegion.name, enableAuto: countryRegion.enableAuto,proxies: ["NULL"]};
    });
}

// 按提供商分类代理节点
function filterLowQualityProviderProxies(proxies, flag) {
    if (flag) {
        return proxies;
    }
    // 使用Map存储按提供商分类的节点
    const filteredLowQualityProvidersProxies = {
        lowQualityProviderProxies: [],
        otherProxies: [],
    };
    proxies.forEach(proxy => {
        const parts = proxy.name.split(DIVIDE_KEYWORDS);
        if (parts.length >= 2) {
            const provider = parts[0].trim();
            if (!REGEX_CACHE.lowQualityProvider.test(provider)) {
                filteredLowQualityProvidersProxies.otherProxies.push(proxy)
            } else {
                filteredLowQualityProvidersProxies.lowQualityProviderProxies.push(proxy);
            }
        } else {
            filteredLowQualityProvidersProxies.otherProxies.push(proxy)
        }
    });
    
    return filteredLowQualityProvidersProxies;
}
// 此函数用来返回将代理组分类之后的代理组
/*返回的格式应该是
{
    lowQuailtyProxies : [...proxies], 
    highQuailtyProxies : [...proxies],
    householdProxies : [...proxies],
    otherProxioes: [...proxies],
    lowQualityProviderProxies : [...proxies]
}
*/
function filterAllProxies(proxies) {
    // 过滤掉低质量提供商的节点，只存到下载节点和所有节点中 true代表不需要过滤
    const filteredProvidersProxies = filterLowQualityProviderProxies(proxies, false)
    // proxies已经去除低质量提供商节点
    proxies = filteredProvidersProxies.otherProxies;
    //console.log(proxies)
    const returnedProxies = {
        lowQualityProxies: [...filteredProvidersProxies.lowQualityProviderProxies],
        highQualityProxies: [],
        householdProxies: [],
        otherProxies: [],
    }
    // 暂时不进行判断是否有节点
    for (let i = 0; i < proxies.length; i++) {
        const proxy = proxies[i];
        const proxyName = proxy.name || "";
        var flag = false;
        if (REGEX_CACHE.lowQuality.test(proxyName)) {
            returnedProxies.lowQualityProxies.push(proxy);
            //console.log(proxyName+"low")
            flag = true;
        } else if (REGEX_CACHE.highQuality.test(proxyName)) {
            returnedProxies.highQualityProxies.push(proxy);
            //console.log(proxyName+"high")
            flag = true;
        } else if (REGEX_CACHE.householdProxy.test(proxyName)) {
            returnedProxies.householdProxies.push(proxy);
           // console.log(proxyName+"household")
            flag = true;
        } else if (!flag) {
            returnedProxies.otherProxies.push(proxy);
           // console.log(proxyName+"other")
        }
    }

    return returnedProxies;
}

// iepl 高级线路 流量贵 延迟低、ip质量差
// 普通线路 流量中等，延迟中等、ip质量差
// 低质量线路 流量便宜，延迟高、ip质量差
// 家宽 流量不定，延迟不定、ip质量好
// socks或者need_dialer 没有办法直接连接或者连接质量差 需要中转 ip质量好
//处理思路 ： 


var DIALERPROXY = false;

/**
 * 构建基本代理组
 * @param {string} testUrl "测试URL
 * @param {Array} highQualityProxies "高质量节点列表
 * @returns {Array} 基本代理组配置
 */
function buildBaseProxyGroups(testUrl, proxies) {
    
    // 获取socks5代理节点
    const socks5ProxiesName = filtersocks5ProxiesName(proxies)
    if (socks5ProxiesName.length > 0) {
        DIALERPROXY = true;
        // sock5接近明文传输，全部前置
        for (let i = 0; i < socks5ProxiesName.length; i++) {
            const proxyName = socks5ProxiesName[i];
            for (let j = 0; j < proxies.length; j++) {
                if (proxies[j].name === proxyName) {
                    proxies[j]["dialer-proxy"] = "前置机场";
                }
            }
        }
    }
    // 获取除socks5之外需要dialer节点
    const needDialerProxiesName = filterNameByRules(proxies, REGEX_CACHE.needDialer);
    if (needDialerProxiesName.length > 0) {
        DIALERPROXY = true;
        const needDialerProxiesNewName = []
        // 将低质量下载节点复制一份，存入到proxies后面
        for (let i = 0; i < needDialerProxiesName.length; i++) {
            const proxyName = needDialerProxiesName[i];
            const proxyIndex = proxies.findIndex(p => p.name === proxyName);
            
            if (proxyIndex !== -1) {
                // 深拷贝原始代理节点
                const newProxy = JSON.parse(JSON.stringify(proxies[proxyIndex]));;
                
                // 修改新节点的名称和属性
                newProxy.name = proxyName + "_dialer";
                newProxy["dialer-proxy"] = "前置机场";
                newProxy["skip-cert-verify"] = true;
                if (newProxy["type"] === "vless" && newProxy["udp"] === true) {
                    delete(newProxy.udp)
                }
                // 将新节点添加到数组
                proxies.push(newProxy);
                needDialerProxiesNewName.push(newProxy.name);
            }
        }
    }
    const baseProxyGroups = []
    if (DIALERPROXY) {
        baseProxyGroups.push(
            {
            "name": "前置机场",
            "type": "select",
            "include-all": true,
            "url": testUrl,
            "interval": CONFIG.testInterval
            }
        )
    }
    // 筛选所有节点
    const filteredProxiesName = filterNameByRules(proxies, null)
    console.log(proxies)
    const typedProxies = filterAllProxies(proxies);
    console.log(typedProxies)
    // 过滤掉低质量提供商的节点，只存到下载节点和所有节点中 true代表不需要过滤
    // 筛选低质量下载节点
    const lowQualityProxiesName = filterNameByRules(typedProxies.lowQualityProxies, REGEX_CACHE.lowQuality);

    // 这里需要保证剩余的节点线路质量很高
    // 筛选高质量节点
    const highQualityProxiesName = filterNameByRules(typedProxies.highQualityProxies);
    
    // 筛选家庭宽带节点
    const householdProxiesName = filterNameByRules(typedProxies.householdProxies);
    // 筛选国家或者地区节点 
    const countryOrRegionProxiesGroups = filterCountryOrRegionProxies([...typedProxies.otherProxies, ...typedProxies.householdProxies,...typedProxies.highQualityProxies]);
    const MiddleQualitycountryOrRegionProxiesGroups = filterCountryOrRegionProxies([...typedProxies.otherProxies, ...typedProxies.householdProxies]);
    console.log(countryOrRegionProxiesGroups)
    const countryOrRegionGroupNames = getCountryOrRegionGroupNames(countryOrRegionProxiesGroups, MiddleQualitycountryOrRegionProxiesGroups);
    const countryOrRegionLen = countryOrRegionProxiesGroups.length;
    const MiddleQualitycountryOrRegionLen = MiddleQualitycountryOrRegionProxiesGroups.length;


    const finalBaseProxyGroups = [];
    
    for (let i = 0; i < countryOrRegionLen; i++) {
        const countryOrRegionProxies = countryOrRegionProxiesGroups[i];

        if (countryOrRegionProxies.proxies[0] === "NULL") {
            continue;
        }
        const groupName = "手动选择"+countryOrRegionProxies.name+"节点，节点质量中等偏上";
        
        
        finalBaseProxyGroups.push({
            "name": groupName,
            "type": "select",
            "proxies": [
                ...(countryOrRegionProxies.proxies[0] !== "NULL" ? countryOrRegionProxies.proxies : []),
                "DIRECT",
            ]
        });
    }
    for (let i = 0; i < MiddleQualitycountryOrRegionLen; i++) {
        const countryOrRegionProxies = MiddleQualitycountryOrRegionProxiesGroups[i];

        if (countryOrRegionProxies.proxies[0] === "NULL") {
            continue;
        }
        // 当enableAuto为true时，添加自动选择节点组
        if (countryOrRegionProxies.enableAuto) 
        {
            const autoGroupName = "自动选择"+countryOrRegionProxies.name+"节点，节点质量中等";
        
            finalBaseProxyGroups.push({
                "name": autoGroupName,
                "type": "url-test",
                "tolerance": CONFIG.tolerance,
                "url": testUrl,
                "interval": CONFIG.testInterval,
                "proxies": [
                    ...(countryOrRegionProxies.proxies[0] !== "NULL" ? countryOrRegionProxies.proxies : []),
                    "DIRECT",
                ]
            });
        }
    }

    // 将最基本的放在最后
    baseProxyGroups.push(...[
        // 基本代理组
        {
            "name": "手动选择所有节点",
            "type": "select",
            "proxies": [
                ...(filteredProxiesName.length > 0 ? filteredProxiesName : []),
                "DIRECT"
            ]
        },
        {
            "name": "低质量下载节点",
            "type": "url-test",
            "tolerance": CONFIG.tolerance,
            "url": testUrl,
            "interval": CONFIG.testInterval,
            "proxies": [
                ...(lowQualityProxiesName.length > 0 ? lowQualityProxiesName : []),
                "DIRECT"
            ]
        },
        {
            "name": "低质量下载节点-负载均衡测试",
            "type": "load-balance",
            "strategy": "round-robin",
            "url": testUrl,
            "interval": CONFIG.testInterval,
            "proxies": [
                ...(lowQualityProxiesName.length > 0 ? lowQualityProxiesName : []),
                "DIRECT"
            ]
        },
        {
            "name": "规则外",
            "type": "select",
            "proxies": ["国内网站", "国外网站"],
            "url": "https://www.baidu.com/favicon.ico"
        },
        {
            "name": "国内网站",
            "type": "select",
            "proxies": ["DIRECT", "负载均衡", "HighQuality Country 1", "HighQuality Country 2", ...countryOrRegionGroupNames, "低质量下载节点", "低质量下载节点-负载均衡测试", "手动选择所有节点"],
            "url": "https://www.baidu.com/favicon.ico"
        },
        {
            "name": "国外网站",
            "type": "select",
            "proxies": ["负载均衡",  "HighQuality Country 1", "HighQuality Country 2", ...countryOrRegionGroupNames, "低质量下载节点", "低质量下载节点-负载均衡测试", "手动选择所有节点"],
            "url": "https://www.bing.com/favicon.ico"
        },
        // 高质量节点组
        {
            "name": "HighQuality Country 1",
            "type": "select",
            "proxies": [
                ...(highQualityProxiesName.length > 0 ? highQualityProxiesName : []),
                "DIRECT",
            ]
        },
        {
            "name": "HighQuality Country 2",
            "type": "select",
            "proxies": [
                ...(highQualityProxiesName.length > 0 ? highQualityProxiesName : []),
                "DIRECT",
            ]
        },
        {
            "name": "家庭宽带",
            "type": "select",
            "proxies": [
                "DIRECT",
                ...(householdProxiesName.length > 0 ? householdProxiesName : [])
            ]
        },
        {
            "name": "负载均衡",
            "type": "load-balance",
            "include-all": true,
            "strategy": CONFIG.balanceStrategy,
            "url": testUrl,
            "interval": CONFIG.testInterval
        },
    ]);
    
    finalBaseProxyGroups.push(...baseProxyGroups);
    return finalBaseProxyGroups;
}

/* 获得国家或者区域组的名称并处理输出 输入国家区域组 输出名称组*/
function getCountryOrRegionGroupNames(countryOrRegionProxiesGroups, MiddleQualitycountryOrRegionProxiesGroups) {
    const countryOrRegionGroupNames = [];
    const countryOrRegionLen = countryOrRegionProxiesGroups.length;

    
    for (let i = 0; i < countryOrRegionLen; i++) {

        if (countryOrRegionProxiesGroups[i].proxies[0] === "NULL") {
            continue;
        }
        
        const groupName = "手动选择"+countryOrRegionProxiesGroups[i].name+"节点，节点质量中等偏上";
        
        countryOrRegionGroupNames.push(groupName);

        // 当enableAuto为true时，添加自动选择节点组
        if (MiddleQualitycountryOrRegionProxiesGroups[i].enableAuto) {
            const autoGroupName = "自动选择"+MiddleQualitycountryOrRegionProxiesGroups[i].name+"节点，节点质量中等";
            countryOrRegionGroupNames.push(autoGroupName);
        }
        
    }
    return countryOrRegionGroupNames
}

/*主函数：生成完整的Clash配置 @param {Object} config "输入配置 @returns {Object} 完整的Clash配置*/
function main(config) {
    let { proxies } = config;
    //console.log(proxies)
    const testUrl = CONFIG.testUrl;
    // 过滤不是正常节点的节点
    proxies = filterNotProxies(proxies)
    console.log("过滤后的节点", proxies)
    // 初始化规则和代理组
    const rules = USER_RULES.slice();
    const proxyGroups = [];
    
    // 规则集通用配置
    const ruleProviderCommon = {
        type: "http",
        format: "yaml",
        interval: 86400
    };

    // 初始化规则提供器
    const ruleProviders = {
        reject: {
            ...ruleProviderCommon,
            behavior: "domain",
            url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/reject.txt",
            path: "./providers/rule/reject.yaml"
        },
        icloud: {
            ...ruleProviderCommon,
            behavior: "domain",
            url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/icloud.txt",
            path: "./providers/rule/icloud.yaml"
        },
        apple: {
            ...ruleProviderCommon,
            behavior: "domain",
            url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/apple.txt",
            path: "./providers/rule/apple.yaml"
        },
        proxy: {
            ...ruleProviderCommon,
            behavior: "domain",
            url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/proxy.txt",
            path: "./providers/rule/proxy.yaml"
        },
        direct: {
            ...ruleProviderCommon,
            behavior: "domain",
            url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/direct.txt",
            path: "./providers/rule/direct.yaml"
        },
        private: {
            ...ruleProviderCommon,
            behavior: "domain",
            url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/private.txt",
            path: "./providers/rule/private.yaml"
        },
        gfw: {
            ...ruleProviderCommon,
            behavior: "domain",
            url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/gfw.txt",
            path: "./providers/rule/gfw.yaml"
        },
        greatfire: {
            ...ruleProviderCommon,
            behavior: "domain",
            url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/greatfire.txt",
            path: "./providers/rule/greatfire.yaml"
        },
        tld_not_cn: {
            ...ruleProviderCommon,
            behavior: "domain",
            url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/tld-not-cn.txt",
            path: "./providers/rule/tld-not-cn.yaml"
        },
        telegramcidr: {
            ...ruleProviderCommon,
            behavior: "ipcidr",
            url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/telegramcidr.txt",
            path: "./providers/rule/telegramcidr.yaml"
        },
        cncidr: {
            ...ruleProviderCommon,
            behavior: "ipcidr",
            url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/cncidr.txt",
            path: "./providers/rule/cncidr.yaml"
        },
        lancidr: {
            ...ruleProviderCommon,
            behavior: "ipcidr",
            url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/lancidr.txt",
            path: "./providers/rule/lancidr.yaml"
        },
        applications: {
            ...ruleProviderCommon,
            behavior: "classical",
            url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/applications.txt",
            path: "./providers/rule/applications.yaml"
        }
    };

    console.log(testUrl,proxies)
    // 构建基本代理组
    const baseProxyGroups = buildBaseProxyGroups(testUrl, proxies);


    const configLen = PROXY_RULES.length;
    for (let i = 0; i < configLen; i++) {
        const { name, gfw, urls, payload, extraProxies, programs} = PROXY_RULES[i];

        proxyGroups.push(createProxyGroup(name, extraProxies, testUrl, gfw, baseProxyGroups));

        // 处理规则
        if (payload) {
            rules.push(...createPayloadRules(payload, name));
        }
        if (urls) {
            const urlList = Array.isArray(urls) ? urls : [urls];
            const urlLen = urlList.length;
            for (let j = 0; j < urlLen; j++) {
                const theUrl = urlList[j];
                const iName = `${name}-rule${j !== 0 ? `-${j}` : ''}`;
                ruleProviders[iName] = createRuleProviderUrl(theUrl);
                rules.push(`RULE-SET,${iName},${name}`);
            }
        }
    }

    // 构建最终配置
    return {
        mode: "rule",
        "find-process-mode": "strict",
        "global-client-fingerprint": "chrome",
        "unified-delay": true,
        "tcp-concurrent": true,
        "geox-url": {
            geoip: "https://ghgo.xyz/https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geoip-lite.dat",
            geosite: "https://ghgo.xyz/https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geosite.dat",
        },
        dns,
        proxies,
        "proxy-groups": [
            ...proxyGroups,
            ...baseProxyGroups,
        ],
        "rule-providers": ruleProviders,
        rules: [
            ...rules,
            ...SAVED_RULES
        ]
    };
}

// 导出main函数供其他模块使用
module.exports = { main };
