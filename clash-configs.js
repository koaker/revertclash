/**
 * ClashVerge 代理规则配置生成脚本
 * MIT License ~
 * author : Phantasia https://github.com/MarchPhantasia
 * editer : spocel https://github.com/spocel
 */

// ==================== 用户配置区（可自由修改） ====================

/**
 * 用户自定义规则（高优先级）
 * 这些规则会被放置在所有其他规则之前，确保不会被其他规则覆盖
 */
const USER_RULES = [
    "DOMAIN-SUFFIX,mnapi.com,DIRECT",
    "DOMAIN-SUFFIX,7li7li.com,国外网站",
    "DOMAIN-SUFFIX,icmpmiao.cc,国外网站",
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
    "RULE-SET,tld-not-cn,国外网站",
    "RULE-SET,gfw,国外网站",
    "RULE-SET,greatfire,国外网站",
    "RULE-SET,telegramcidr,国外网站",
    "RULE-SET,lancidr,国内网站",
    "RULE-SET,cncidr,国内网站,no-resolve",
    "GEOSITE,gfw,国外网站",
    "GEOIP,CN,国内网站",
    "RULE-SET,direct,国内网站",
    "RULE-SET,proxy,国外网站",
    "MATCH,规则外"
]
// 高质量线路
const HIGH_QUALITY_KEYWORDS = [
    // 线路类型关键词
    "IEPL", "Iepl", "iepl",
    "IPLC", "iplc", "Iplc", "专线", "高速",
    "深港", "沪日", "沪美", "夏港","x15",
    // 节点等级关键词
    "SVIP", "svip", 
    "Svip", "VIP", "vip", "Vip", "Premium", 
    "premium",
];
// 非常低质量的节点，专门用多线程下载器下载，优先匹配0.01-0.09的节点。
const LOW_LOW_QUALITY_KEYWORDS = [
    "无限", "0\\.0\\d+","低质", "0\\.1"
];
// 稍微低一些质量但是稳定的节点，建议用来看视频
const LOW_QUALITY_KEYWORDS = [
    "0\\.[2-5]","低价"
];
// 过滤低质量提供商，低质量提供商的节点只会被放在极低质量的节点中
const LOW_QUALITY__PROVIDER_KEYWORDS = [
    "低质量提供商"
];
// 过滤不是节点的节点配置
const NOT_PROXIES_KEYWORDS = [ "备用", "登录" , "商业" , "官网" , "渠道", "测试", "重置", "周期", "进群", "订阅", "车友",
     "编辑", "谢谢", "不通", "限制", "剩余", "公告", "套餐", "算法", "实测", "已墙", "巴西"
];
// 过滤家宽节点
const HOUSEHOLE_KEYWORDS = ["家宽", "家庭宽带", "原生"]
// 必须要是链式中转的关键词
const MUST_DIALER_KEYWORDS = [
    "must-dialer"
]
// 可以用来被链式中转的关键词（家庭宽带之类的）
const NEED_DIALER_KEYWORDS = [
    // 线路类型关键词
     "need-dialer"
];
// 只能用来前置的节点关键词（机场、脏IP 好线路）
const CROSS_PROXY_KEYWORDS = [
    // 线路类型关键词
    "cross-proxy", "crossproxy", "cross","链式中转"
];
// 送中节点关键词
const IP_IN_CHINA_KEYWORDS = [
    // 线路类型关键词
    "送中"
];
// 提供商与节点名字之间的分隔符
const DIVIDE_KEYWORDS = "|-|";
// 国家或者区域过滤关键词，enable代表过滤这个地区， enableauto代表自动选择是否开启
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
        keywords: ["欧洲", "EU", "Europe", "法国", "FR",
            "France", "德国", "Germany", "英国", "UK", "United Kingdom", "Italy", "意大利", "西班牙", "ES", "Spain", "荷兰", "NL", "Netherlands", "爱尔兰", "波兰", "土耳其"],
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
    { 
        name: "禁止网站", 
        gfw : false,
        blocked : true,
        extraProxies: "REJECT", 
        payload : [
            "DOMAIN-SUFFIX,pincong.rocks",
            "DOMAIN-REGEX,(.*\\.)?(appledaily|dafahao|minghui|dongtaiwang|epochtimes|ntdtv|falundafa|wujieliulan|zhengjian|soundofhope|boastr|bettertouchtool|elplural)\\.(org|com|net|tw|hk|rocks|ai)$"
        ],
    },
    {
        name: "建议走低质量节点：IDM 、 ytdlp、包括各种游戏下载， 下载服务器列表",
        gfw : false,
        payload : [
            "PROCESS-NAME,IDMan.exe",
            "PROCESS-NAME,yt-dlp.exe",
            "DOMAIN-SUFFIX,eft-store.com",
            "DOMAIN-SUFFIX,dl.steam.clngaa.com",
            "DOMAIN-SUFFIX,st.dl.eccdnx.com",
            "DOMAIN-SUFFIX,steamcontent.com",
            "DOMAIN-SUFFIX,steamstatic.com",
            "DOMAIN-SUFFIX,xz.pphimalayanrt.com",
            "DOMAIN-SUFFIX,storage.live.com",
            "DOMAIN-SUFFIX,sharepoint.com",
            "DOMAIN-SUFFIX,cloudflarestorage.com",
        ],
        urls: ["https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Download/Download.yaml"]
    },
    { 
        name: "论坛：linux.do，nodeseek等", 
        gfw : true,
        payload: ["DOMAIN-SUFFIX,linux.do" ,
            "DOMAIN-SUFFIX,nodeseek.com",
            "DOMAIN-SUFFIX,v2ex.com"
        ]
    },
    { 
        name: "ip检测：ping0 speedtest ipdata speedcloudflare", 
        gfw : true,
        payload: [
            "DOMAIN-SUFFIX,ping0.cc",
            "DOMAIN-SUFFIX,speed.cloudflare.com",
            "DOMAIN-SUFFIX,speedtest.net",
            "DOMAIN-SUFFIX,ipdata.co",
        ]
    },
    { 
        name: "必须美国节点：exhentai、openai、claude", 
        gfw : true,
        payload: [
            "DOMAIN-SUFFIX,exhentai.org",
            "DOMAIN-SUFFIX,e-hentai.org",
            "DOMAIN,cdn.usefathom.com",
            "DOMAIN-SUFFIX,anthropic.com",
            "DOMAIN-SUFFIX,claude.ai",
        ],
        urls: ["https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/OpenAI/OpenAI_No_Resolve.yaml",
            "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/TikTok/TikTok_No_Resolve.yaml" ,
            "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Claude/Claude.yaml"
        ]
    },
    { 
        name: "代码编辑器：cursor、windsurf、vscode", 
        gfw : true,
        payload: [
            "DOMAIN-SUFFIX,cursor.com",
            "PROCESS-NAME,Cursor.exe",
            "DOMAIN-SUFFIX,windsurf.com",
            "PROCESS-NAME,Windsurf.exe",
            "PROCESS-NAME,Code.exe"
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
        name: "建议走低质量节点：youtube视频来源分流（不影响youtube本身）", 
        gfw : false,
        payload:  [
            "DOMAIN-SUFFIX,dl.google.com",
            "DOMAIN-SUFFIX,imput.net",
            "DOMAIN-SUFFIX,googlevideo.com",
        ]
    },
    { 
        name: "🎬国外媒体、netflix", 
        gfw : true,
        payload:  [
            "DOMAIN-SUFFIX,deezer.com",
            "DOMAIN-SUFFIX,dzcdn.net",
            "DOMAIN-SUFFIX,kkbox.com",
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
            "DOMAIN-SUFFIX,kktv.me",
            "DOMAIN,kktv-theater.kk.stream",
            "DOMAIN,d3c7rimkq79yfu.cloudfront.net",
            "DOMAIN-SUFFIX,litv.tv",
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
            "DOMAIN,hamifans.emome.net",
            "DOMAIN-SUFFIX,jtvnw.net",
            "DOMAIN-SUFFIX,viu.com",
            "DOMAIN-SUFFIX,viu.tv",
            "DOMAIN,api.viu.now.com",
            "DOMAIN,d1k2us671qcoau.cloudfront.net",
            "DOMAIN,d2anahhhmp1ffz.cloudfront.net",
            "DOMAIN,dfp6rglgjqszk.cloudfront.net",
        ],
        urls: [
            "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@release/rule/Clash/Netflix/Netflix.yaml",
            "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@release/rule/Clash/Netflix/Netflix_IP.yaml",
            "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@release/rule/Clash/Netflix/Netflix_Classical.yaml",
            "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@release/rule/Clash/Netflix/Netflix_IP.txt",
            "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Netflix/Netflix_No_Resolve.yaml",
            "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@release/rule/Clash/Twitch/Twitch.yaml"
        ]
    },
    { 
        name: "🎬台湾媒体，如巴哈姆特", 
        gfw : true,
        payload:  [
            "DOMAIN-SUFFIX,gamer.com.tw",
            "DOMAIN,gamer-cds.cdn.hinet.net",
            "DOMAIN,gamer2-cds.cdn.hinet.net",
            "DOMAIN-SUFFIX,linetv.tw",
            "DOMAIN-SUFFIX,skyking.com.tw",
            "DOMAIN-SUFFIX,kktv.com.tw",
            "DOMAIN-SUFFIX,bahamut.com.tw",
            "DOMAIN-SUFFIX,kkbox.com.tw",
            "DOMAIN,litvfreemobile-hichannel.cdn.hinet.net",
            "DOMAIN-SUFFIX,bahamut.akamaized.net",
        ]
    },
    { 
        name: "YouTube Music 、 spotify", 
        gfw : true,
        payload : [
            "DOMAIN-SUFFIX,music.youtube.com",
        ],
        urls: [
            "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@release/rule/Clash/Spotify/Spotify.yaml",
        ]
    },
    { 
        name: "💳 Paypal 、币安、欧易、infini", 
        gfw : true,
        payload:  [
            "DOMAIN-SUFFIX,binance.com",
            "DOMAIN-SUFFIX,okx.com",
            "DOMAIN-SUFFIX,infini.money"
        ],
        urls : ["https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@release/rule/Clash/PayPal/PayPal.yaml"]
    },
    { 
        name: "YouTube 如果使用送中节点可以免广告", 
        gfw : true,
        urls: [
            "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/YouTube/YouTube.yaml",
            "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/YouTubeMusic/YouTubeMusic.yaml"
        ]
    },
    { 
        name: "Google Gemini", 
        gfw : true,
        payload: [
            "DOMAIN-SUFFIX,aistudio.google.com",
            "DOMAIN-SUFFIX,ai.google.com",
            "DOMAIN-SUFFIX,ai.google.dev",
            "DOMAIN-SUFFIX,gvt2.com",
            "DOMAIN-SUFFIX,apis.google.com",
            "DOMAIN-SUFFIX,gstatic.com",
            "DOMAIN-SUFFIX,mtalk.google.com",
            "DOMAIN-SUFFIX,clients4.google.com",
        ],
        urls: [
            "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Gemini/Gemini.yaml",
            "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Google/Google_No_Resolve.yaml" 
        ]
    },
    { 
        name: "Microsoft与bing服务、OneDrive", 
        gfw : true,
        urls: ["https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Microsoft/Microsoft_No_Resolve.yaml",
            "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/OneDrive/OneDrive_No_Resolve.yaml" 
        ]
    },
    { 
        name: "📢Discord、Telegram、Twitter、Facebook", 
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
        ],
        urls: [
            "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Telegram/Telegram.yaml",
            "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Twitter/Twitter_No_Resolve.yaml",
            "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Facebook/Facebook_No_Resolve.yaml"
        ]
    },
    { 
        name: "程序员需要:github、huggingface、docker、civitai、linux系统", 
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
        name: "塔科夫、你画我猜、Steam、apex 不带有下载", 
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
        name: "Cloudflare", 
        gfw : true,
        urls: "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Cloudflare/Cloudflare_No_Resolve.yaml" 
    },
    { 
        name: "国内网站：🎬哔哩哔哩 和 deepseek", 
        gfw : false,
        payload:  [
            "DOMAIN-SUFFIX,biliapi.com",
            "DOMAIN-SUFFIX,biliapi.net",
            "DOMAIN-SUFFIX,bilibili.com",
            "DOMAIN-SUFFIX,bilibili.tv",
            "DOMAIN-SUFFIX,bilivideo.com",
            "DOMAIN-SUFFIX,deepseek.com",
        ]
    },
];

/**
 * 常用配置选项
 */
const CONFIG = {
    // 测试连接URL
    testUrl: "https://www.google.com",
    // 自动测试间隔 (秒)
    testInterval: 3000,
    // 自动选择容差 (毫秒)
    tolerance: 20,
    // 负载均衡策略："round-robin" | "sticky-sessions" | "consistent-hashing"
    balanceStrategy: "round-robin",
    // 所有关键词集合
    KEYWORDS: {
        high: HIGH_QUALITY_KEYWORDS,
        low: LOW_QUALITY_KEYWORDS,
        veryLow: LOW_LOW_QUALITY_KEYWORDS,
        household: HOUSEHOLE_KEYWORDS,
        providerLow: LOW_QUALITY__PROVIDER_KEYWORDS,
        needDialer: NEED_DIALER_KEYWORDS,
        mustDialer: MUST_DIALER_KEYWORDS,
        cross: CROSS_PROXY_KEYWORDS,
        notProxy: NOT_PROXIES_KEYWORDS,
        ipInChina:IP_IN_CHINA_KEYWORDS
    },
    // 是否过滤不是节点的节点
    EnableFilterNoProxies: true,
    // 是否进行链式代理
    EnableDialerProxy: true,
    // 是否过滤极低质量节点
    EnableFilterVeryLowQualityProxies: true,
    // 是否过滤低质量节点
    EnableFilterLowQualityProxies: true,
    // 是否过滤高质量节点
    EnableFilterHighQualityProxies: true,
    // 是否过滤家庭宽带
    EnableFilterHouseholdProxies: true,
    // 是否过滤送中节点
    EnableFilterIpInChinaProxies: true,
    // 是否按照国家过滤节点
    EnableFilterCountryProxies: true,
};

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

// 一次性编译所有正则表达式
const RX = Object.fromEntries(
  Object.entries(CONFIG.KEYWORDS).map(
    ([k, v]) => [k, new RegExp(v.join('|'), 'i')]
  )
);

// 为COUNTRY_OR_REGION_KEYWORDS添加正则表达式
for (const r of COUNTRY_OR_REGION_KEYWORDS) {
  r._rx = new RegExp(r.keywords.join('|'));
}

// 构建DNS配置对象
const dns = buildDnsConfig(DNS_CONFIG);

// ==================== 辅助函数部分 ====================

/* ---------- 组装 Proxy-Group ---------- */
function makeSelect(name, proxies, extraOptions = {}) {
  return {
    name,
    type: 'select',
    proxies,
    ...extraOptions
  };
}

function makeUrlTest(name, proxies, extraOptions = {}) {
    return {
    name,
    type: 'url-test',
    url: extraOptions.url || CONFIG.testUrl,
    interval: extraOptions.interval || CONFIG.testInterval,
    tolerance: extraOptions.tolerance || CONFIG.tolerance,
    proxies,
    ...extraOptions
  };
}

function makeLoadBalance(name, proxies, extraOptions = {}) {
  return {
    name,
    type: 'load-balance',
    url: extraOptions.url || CONFIG.testUrl,
    interval: extraOptions.interval || CONFIG.testInterval,
    strategy: extraOptions.strategy || CONFIG.balanceStrategy,
    proxies,
    ...extraOptions
  };
}

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
        "proxy-server-nameserver": [...config.cnDnsList], // 创建副本
        "nameserver-policy": {
            "geosite:private": "system",
            "geosite:cn,steam@cn,category-games@cn,microsoft@cn,apple@cn": [...config.cnDnsList], // 创建副本
        },
        fallback: [...config.trustDnsList], // 创建副本
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
function createProxyGroup(name, addProxies, testUrl, gfw, baseProxyGroups, blocked) {
    if (blocked) {
        const proxy = ["REJECT"];
        return {
            name: name,
            type: "select",
            proxies: proxy.filter(Boolean), // 过滤undefined/null值
            url: testUrl
        };
    }

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
    
    // 直接使用 classifyProxies 返回的 socks5Names，避免重复遍历
    const { socks5Names } = classifyProxies(proxies);
    return socks5Names;
}

// 过滤非代理节点并且将带有cross标记的节点放入cross数组
function filterCrossProxies(proxies) {
    if (!proxies || !Array.isArray(proxies)) {
        //console.log("空节点")
        return {valid: [], cross: []};
    }
    const valid = [];
    const cross = [];
    
    for (const proxy of proxies) {
        // 添加空值检查，防止null/undefined导致的错误
        if (!proxy || typeof proxy !== 'object') {
            console.warn('发现无效的代理节点对象:', proxy);
            continue;
        }
        
        const proxyName = proxy.name || "";
        
        // 如果是非代理节点，直接跳过
        if (RX.notProxy.test(proxyName)) {
            continue;
        }
        
        // 如果是前置节点放入cross数组，否则放入valid数组
        (RX.cross.test(proxyName) ? cross : valid).push(proxy);
    }
    
    return {validAll: valid.concat(cross), valid};
}

// 为了保持向后兼容，保留filterNotProxies函数
function filterNotProxies(proxies) {
    return filterCrossProxies(proxies).validAll;
}
/* ---------- 国家/地区分组 ---------- */
function filterCountryOrRegionProxies(nodes) {
    if (!nodes || !Array.isArray(nodes)) {
        return [];
    }
    const regionsEnabled = COUNTRY_OR_REGION_KEYWORDS.filter(r => r.enable);
    if (regionsEnabled.length === 0) {
        return [];
    }
    
    return regionsEnabled.map(r => {
        // 使用预先创建的正则表达式
        const rx = r._rx;
        const names = nodes.filter(n => rx.test(n.name || "")).map(n => n.name || "");
        return {
            name: r.name,
            enableAuto: r.enableAuto,
            proxies: names.length ? names : ["NULL"]
        };
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
            if (!RX.providerLow.test(provider)) {
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
/* ---------- 一次遍历对节点做完整归类 ---------- */
function classifyProxies(nodes) {
  const buckets = {
    high: [], low: [], veryLow: [], household: [],
    providerLow: [], needDialer: [], mustDialer: [], socks5: [], cross: [], other: [],
    ipInChina:[],
  };
  // 预先创建 socks5Names 数组，同时收集节点信息避免二次遍历
  const socks5Names = [];
  

  for (const p of nodes) {
    const n = p.name || "";
    if (RX.notProxy.test(n)) continue;
    if (RX.cross.test(n)) { buckets.cross.push(p); continue; }
    
    // 检测 socks5 类型的代理，并同时收集其名称
    if (/socks5/i.test(p.type || "")) {
      buckets.socks5.push(p);
      socks5Names.push(n);
    }

    if (RX.mustDialer.test(n)) buckets.mustDialer.push(p)
    else if (RX.needDialer.test(n)) buckets.needDialer.push(p);
    if (RX.ipInChina.test(n)) buckets.ipInChina.push(p);
    if (RX.household.test(n)) buckets.household.push(p);
    else if (RX.high.test(n)) buckets.high.push(p);
    else if (RX.veryLow.test(n)||RX.low.test(n)) {
        if (RX.veryLow.test(n)) {
            buckets.veryLow.push(p)
        }
        if (RX.low.test(n)) {
            buckets.low.push(p)
        }
    }
    else buckets.other.push(p);
  }
  return { buckets, socks5Names };
}

function filterAllProxies(proxies) {
    // 过滤掉低质量提供商的节点
    const filteredProvidersProxies = filterLowQualityProviderProxies(proxies, false);
    
    // 使用一次遍历对节点做完整归类
    const { buckets } = classifyProxies(filteredProvidersProxies.otherProxies);
    
    //console.log(buckets.low)
    const returnedProxies = {
        lowQualityProxies: buckets.low,
        lowLowQualityProxies: [...buckets.veryLow, ...filteredProvidersProxies.lowQualityProviderProxies],
        highQualityProxies: buckets.high,
        householdProxies: buckets.household,
        otherProxies: [...buckets.other],
        ipInChinaProxies: buckets.ipInChina,
    };
    
    return returnedProxies;
}

// iepl 高级线路 流量贵 延迟低、ip质量差
// 普通线路 流量中等，延迟中等、ip质量差
// 低质量线路 流量便宜，延迟高、ip质量差
// 家宽 流量不定，延迟不定、ip质量好
// socks或者need_dialer 没有办法直接连接或者连接质量差 需要中转 ip质量好
/**
 * 构建基本代理组
 * @param {string} testUrl "测试URL
 * @param {Array} highQualityProxies "高质量节点列表
 * @returns {Array} 基本代理组配置
 */
function buildBaseProxyGroups(testUrl, processed_Proxies, origProxies) {
    
    
    const baseProxyGroups = []
    
    const originProxiesName = origProxies.map(p => p.name);
    baseProxyGroups.push(
        makeSelect("手动选择所有节点", [], {"include-all": true})
    )
    const typedProxies = filterAllProxies(processed_Proxies);
    // 过滤掉低质量提供商的节点，只存到下载节点和所有节点中 true代表不需要过滤
    // 筛选低质量下载节点
    
    const finalBaseProxyGroupName = []
    
    // 筛选高质量节点
    if (CONFIG.EnableFilterHighQualityProxies && typedProxies.highQualityProxies.length > 0) {
        const highQualityProxiesName = typedProxies.highQualityProxies.map(p => p.name);
        baseProxyGroups.push(...[
            makeSelect("HighQuality Country 1", [
                ...(highQualityProxiesName.length > 0 ? highQualityProxiesName : []),
                "DIRECT"
            ]),
            makeUrlTest("HighQuality Country 2 Auto", [
                ...(highQualityProxiesName.length > 0 ? highQualityProxiesName : []),
                "DIRECT"
            ]),
        ]);
        finalBaseProxyGroupName.push("HighQuality Country 1")
        finalBaseProxyGroupName.push("HighQuality Country 2 Auto")
    }
    

    if (CONFIG.EnableFilterLowQualityProxies && typedProxies.lowQualityProxies.length > 0) {
        const lowQualityProxiesName = typedProxies.lowQualityProxies.map(p => p.name);
        baseProxyGroups.push(
            makeUrlTest("低质量下载节点", [
                ...(lowQualityProxiesName.length > 0 ? lowQualityProxiesName : []),
                "DIRECT"
            ]),
        )
        finalBaseProxyGroupName.push("低质量下载节点")
    }

    if (CONFIG.EnableFilterVeryLowQualityProxies && typedProxies.lowLowQualityProxies.length > 0) {
        const lowLowQualityProxiesName = typedProxies.lowLowQualityProxies.map(p => p.name);
        baseProxyGroups.push(
            makeLoadBalance("极低质量下载节点-负载均衡测试", [
                ...(lowLowQualityProxiesName.length > 0 ? lowLowQualityProxiesName : []),
                "DIRECT"
            ]),
        )
        finalBaseProxyGroupName.push("极低质量下载节点-负载均衡测试")
    }

    if (CONFIG.EnableFilterIpInChinaProxies && typedProxies.ipInChinaProxies.length > 0) {
        const ipInChinaProxiesName = typedProxies.ipInChinaProxies.map(p => p.name)
        baseProxyGroups.push(
            makeSelect("送中", [
                ...(ipInChinaProxiesName.length > 0 ? ipInChinaProxiesName : []),
                "DIRECT"
            ])
        )
        finalBaseProxyGroupName.push("送中")
    }
    

    // 筛选家庭宽带节点
    if (CONFIG.EnableFilterHouseholdProxies && typedProxies.householdProxies.length > 0) {
        const householdProxiesName = typedProxies.householdProxies.map(p => p.name);
        baseProxyGroups.push(...[
            makeSelect("家庭宽带", [
                ...(householdProxiesName.length > 0 ? householdProxiesName : []),
                "DIRECT"
            ]),
            makeSelect("家庭宽带2", [
                ...(householdProxiesName.length > 0 ? householdProxiesName : []),
                "DIRECT"
            ])
        ]);
        finalBaseProxyGroupName.push("家庭宽带")
        finalBaseProxyGroupName.push("家庭宽带2")
    }

    const finalBaseProxyGroups = [];
    if (CONFIG.EnableFilterCountryProxies) {
        // 筛选国家或者地区节点
        const countryOrRegionProxiesGroups = filterCountryOrRegionProxies([...typedProxies.otherProxies, ...typedProxies.lowQualityProxies, ...typedProxies.householdProxies, ...typedProxies.highQualityProxies]);
        // 自动不希望筛选贵的线路
        const MiddleQualitycountryOrRegionProxiesGroups = filterCountryOrRegionProxies([...typedProxies.otherProxies, ...typedProxies.lowQualityProxies, ...typedProxies.householdProxies]);

        const countryOrRegionLen = countryOrRegionProxiesGroups.length;
        const MiddleQualitycountryOrRegionLen = MiddleQualitycountryOrRegionProxiesGroups.length;

        const countryOrRegionGroupNames = []
        
        for (let i = 0; i < countryOrRegionLen; i++) {
            const countryOrRegionProxies = countryOrRegionProxiesGroups[i];

            if (countryOrRegionProxies.proxies[0] === "NULL") {
                continue;
            }
            const groupName = "手动选择"+countryOrRegionProxies.name+"节点，节点质量中等偏上";
            countryOrRegionGroupNames.push(groupName);
            
            finalBaseProxyGroups.push(makeSelect(groupName, [
                ...(countryOrRegionProxies.proxies[0] !== "NULL" ? countryOrRegionProxies.proxies : []),
                "DIRECT"
            ]));
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
                countryOrRegionGroupNames.push(autoGroupName);
                finalBaseProxyGroups.push(makeUrlTest(autoGroupName, [
                    ...(countryOrRegionProxies.proxies[0] !== "NULL" ? countryOrRegionProxies.proxies : []),
                    "DIRECT"
                ]));
            }
        }
        finalBaseProxyGroupName.push(...countryOrRegionGroupNames)
    }
    
    // 将最基本的放在最后
    baseProxyGroups.push(...[
        // 基本代理组
        makeSelect("规则外", ["国外网站", "国内网站"]),
        makeSelect("国内网站", ["DIRECT", ...finalBaseProxyGroupName, "手动选择所有节点"]),
        makeSelect("国外网站", [...finalBaseProxyGroupName, "手动选择所有节点", "DIRECT"])
    ]);
    
    baseProxyGroups.push(
        makeSelect("前置机场", originProxiesName, {
            url: testUrl,
            interval: CONFIG.testInterval
        })
    )
    finalBaseProxyGroups.push(...baseProxyGroups);
    return finalBaseProxyGroups;
}

// 添加链式代理节点
function addDialerProxy(proxies) {
    // 获取socks5代理节点
    const socks5ProxiesName = filtersocks5ProxiesName(proxies)
    if (socks5ProxiesName.length > 0) {
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

    // 获取必须dialer节点
    const mustDialerProxiesName = filterNameByRules(proxies, RX.mustDialer);
    if (mustDialerProxiesName.length > 0) {
        for (let i = 0; i < mustDialerProxiesName.length; i++) {
            const proxyName = mustDialerProxiesName[i];
            const proxyIndex = proxies.findIndex(p => p.name === proxyName);
            if (proxyIndex !== -1) {
                proxies[proxyIndex]["dialer-proxy"] = "前置机场";
            }
        }
    }
    
    // 获取除socks5之外需要dialer节点
    const needDialerProxiesName = filterNameByRules(proxies, RX.needDialer);
    if (needDialerProxiesName.length > 0) {
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
            }
        }
    }

    return proxies;
}

/*主函数：生成完整的Clash配置 @param {Object} config "输入配置 @returns {Object} 完整的Clash配置*/
function main(config) {
    let { proxies } = config;
    //console.log(proxies)
    const testUrl = CONFIG.testUrl;

    // 过滤不是正常节点的节点, 由CONFIG中的EnableFilterNoProxies决定
    if (CONFIG.EnableFilterNoProxies) {
        proxies = filterNotProxies(proxies)
    }

    // 初始化规则和代理组
    const rules = USER_RULES.slice();
    const proxyGroups = [];

    const providerDefinitions = [
        { name: "reject", behavior: "domain"},
        { name: "icloud", behavior: "domain"},
        { name: "apple", behavior: "domain"},
        { name: "proxy", behavior: "domain"},
        { name: "direct", behavior: "domain"},
        { name: "private", behavior: "domain"},
        { name: "gfw", behavior: "domain"},
        { name: "greatfire", behavior: "domain"},
        { name: "tld-not-cn", behavior: "domain"},
        { name: "telegramcidr", behavior: "ipcidr"},
        { name: "cncidr", behavior: "ipcidr"},
        { name: "lancidr", behavior: "ipcidr"},
        { name: "applications", behavior: "classical"}
    ]
    const ruleProviders = {};
    const baseRuleUrl = "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/";
    for (const def of providerDefinitions) {
        ruleProviders[def.name] = {
            type: "http",
            format: "yaml",
            interval: 86400,
            behavior: def.behavior,
            url: `${baseRuleUrl}${def.name}.txt`,
            path: `./providers/rule/${def.name}.yaml`
        };
    }
    if (CONFIG.EnableDialerProxy) {
        processed_Proxies = addDialerProxy(proxies);
    }
    // 构建基本代理组（使用valid数组，即非cross代理节点）
    const baseProxyGroups = buildBaseProxyGroups(testUrl, filterCrossProxies(processed_Proxies).valid, proxies);
    
    // 注意：cross数组可以在这里用于其他目的，目前代码中没有使用到


    const configLen = PROXY_RULES.length;
    for (let i = 0; i < configLen; i++) {
        const {name, gfw, urls, payload, extraProxies, blocked} = PROXY_RULES[i];

        proxyGroups.push(createProxyGroup(name, extraProxies, testUrl, gfw, baseProxyGroups, blocked));

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
            geoip: "https://ghfast.top/https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geoip-lite.dat",
            geosite: "https://ghfast.top/https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geosite.dat",
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