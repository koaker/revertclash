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
    "家宽", "家庭宽带", "IEPL", "Iepl", "iepl",
    "IPLC", "iplc", "Iplc", "专线", "高速",
    
    // 节点等级关键词
    "高级", "精品", "原生", "SVIP", "svip", 
    "Svip", "VIP", "vip", "Vip", "Premium", 
    "premium",
    
    // 特殊用途关键词
    "特殊", "特殊线路", "游戏", "Game", "game"
    
    // 在此添加更多关键词...
];

const LOW_QUALITY_KEYWORDS = [
    "无限", "x0."
];

const NOT_PROXIES_KEYWORDS = [ "备用", "登录" , "商业" , "官网" , "渠道", "测试"
];

const NEED_DIALER_KEYWORDS = [
    // 线路类型关键词
    "家宽", "家庭宽带", 
];
/**
 * 国家或者地区节点关键词列表
 * 用于筛选名称中包含这些关键词的节点作为高质量节点
 */
const COUNTRY_OR_REGION_KEYWORDS = [
    // 国家或地区
    ["香港", "HK", "Hong", "ASYNCHRONOUS", "AnyPath®"],
    ["台湾", "Taiwan"],
    ["日本", "JP", "Japan"],
    ["美国", "American", "United States"],
    ["新加坡", "SG", "Singapore"],
    ["韩国", "KR", "Korea"],
    ["欧洲", "EU", "Europe", "法国", "FR", "France", "德国", "Germany", "英国", "GB", "United Kingdom", "Italy", "IT", "意大利", "西班牙", "ES", "Spain", "荷兰", "NL", "Netherlands", "爱尔兰"],
    ["加拿大", "CA", "Canada"],
    ["澳大利亚", "AU", "Australia"],
    ["俄罗斯", "RU", "Russia"],
];
/**
 * 代理规则配置
 * name: 规则名称
 * gfw: 是否被墙 (true=默认走代理, false=默认直连)
 * urls: 规则集链接，可以是单个URL或URL数组
 * payload: 自定义规则内容，设置后urls将被忽略
 * extraProxies: 额外添加到此规则组的代理，例如REJECT用于广告拦截
 */
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
        gfw : false,
        payload: "DOMAIN-SUFFIX,linux.do" 
    },
    { 
        name: "梯子官网", 
        gfw : true,
        payload: [
            "DOMAIN-SUFFIX,管人痴.com",
            "DOMAIN-SUFFIX,ssr.wtf",
            "DOMAIN-SUFFIX,aws-cisco-delltechnologies-fujitsu-hewlettpackardenterprise-ibm.com",
            "DOMAIN-SUFFIX,lycorisrecoil.org",
         ]
    },
    { 
        name: "exhentai", 
        gfw : true,
        payload: [
            "DOMAIN-SUFFIX,exhentai.org",
            "DOMAIN-SUFFIX,e-hentai.org",
        ]
    },
    { 
        name: "gov", 
        gfw : false,
        payload: [
            "DOMAIN-SUFFIX,gov.hk",
            "DOMAIN-SUFFIX,gov.tw",
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
        name: "塔科夫", 
        gfw : true,
        payload:  [
            "DOMAIN-SUFFIX,eft-project.com",
            "DOMAIN-SUFFIX,escapefromtarkov.com"
        ]
    },
    { 
        name: "塔科夫下载", 
        gfw : false,
        payload:  [
            "DOMAIN-SUFFIX,eft-store.com",
        ]
    },
    { 
        name: "🎮 Steam下载选择", 
        gfw : false,
        payload:  [
            "DOMAIN-SUFFIX,dl.steam.clngaa.com",
            "DOMAIN-SUFFIX,st.dl.eccdnx.com",
            "DOMAIN-SUFFIX,steamcontent.com",
            "DOMAIN-SUFFIX,steamstatic.com",
            "DOMAIN-SUFFIX,xz.pphimalayanrt.com",
        ]
    },
    { 
        name: "🎬国外媒体", 
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
            "DOMAIN-SUFFIX,spotify.com",
            "DOMAIN-SUFFIX,spoti.fi",
            "DOMAIN-KEYWORD,spotify.com",
            "DOMAIN-KEYWORD,-spotify-com",
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
            "DOMAIN-SUFFIX,netflix.com",
            "DOMAIN-SUFFIX,netflix.net",
            "DOMAIN-SUFFIX,nflxext.com",
            "DOMAIN-SUFFIX,nflximg.com",
            "DOMAIN-SUFFIX,nflximg.net",
            "DOMAIN-SUFFIX,nflxso.net",
            "DOMAIN-SUFFIX,nflxvideo.net",
            "DOMAIN-SUFFIX,netflixdnstest0.com",
            "DOMAIN-SUFFIX,netflixdnstest1.com",
            "DOMAIN-SUFFIX,netflixdnstest2.com",
            "DOMAIN-SUFFIX,netflixdnstest3.com",
            "DOMAIN-SUFFIX,netflixdnstest4.com",
            "DOMAIN-SUFFIX,netflixdnstest5.com",
            "DOMAIN-SUFFIX,netflixdnstest6.com",
            "DOMAIN-SUFFIX,netflixdnstest7.com",
            "DOMAIN-SUFFIX,netflixdnstest8.com",
            "DOMAIN-SUFFIX,netflixdnstest9.com",
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
            "DOMAIN-SUFFIX,twitch.tv",
            "DOMAIN-SUFFIX,twitchcdn.net",
            "DOMAIN-SUFFIX,ttvnw.net",
            "DOMAIN-SUFFIX,jtvnw.net",
            "DOMAIN-SUFFIX,viu.com",
            "DOMAIN-SUFFIX,viu.tv",
            "DOMAIN,api.viu.now.com",
            "DOMAIN,d1k2us671qcoau.cloudfront.net",
            "DOMAIN,d2anahhhmp1ffz.cloudfront.net",
            "DOMAIN,dfp6rglgjqszk.cloudfront.net",
            "DOMAIN-SUFFIX,googlevideo.com",
            "DOMAIN-SUFFIX,youtube.com",
            "DOMAIN,youtubei.googleapis.com",
            "DOMAIN,pincong.rocks",
        ]
    },
    { 
        name: "💳 Paypal", 
        gfw : true,
        payload:  [
            "DOMAIN-SUFFIX,account-paypal.info",
            "DOMAIN-SUFFIX,account-paypal.net",
            "DOMAIN-SUFFIX,account-paypal.org",
            "DOMAIN-SUFFIX,accountpaypal.com",
            "DOMAIN-SUFFIX,accountpaypal.net",
            "DOMAIN-SUFFIX,accountpaypal.org",
            "DOMAIN-SUFFIX,anfutong.cn",
            "DOMAIN-SUFFIX,anfutong.com",
            "DOMAIN-SUFFIX,anfutong.com.cn",
            "DOMAIN-SUFFIX,beibao.cn",
            "DOMAIN-SUFFIX,beibao.com",
            "DOMAIN-SUFFIX,beibao.com.cn",
            "DOMAIN-SUFFIX,bill-safe.com",
            "DOMAIN-SUFFIX,billmelater.com",
            "DOMAIN-SUFFIX,billmelater.info",
            "DOMAIN-SUFFIX,billmelater.net",
            "DOMAIN-SUFFIX,bml.info",
            "DOMAIN-SUFFIX,braintreegateway.com",
            "DOMAIN-SUFFIX,braintreegateway.tv",
            "DOMAIN-SUFFIX,braintreepayments.com",
            "DOMAIN-SUFFIX,braintreepayments.info",
            "DOMAIN-SUFFIX,braintreepayments.org",
            "DOMAIN-SUFFIX,braintreepayments.tv",
            "DOMAIN-SUFFIX,braintreepaymentsolutions.com",
            "DOMAIN-SUFFIX,braintreeps.com",
            "DOMAIN-SUFFIX,briantreepayments.net",
            "DOMAIN-SUFFIX,briantreepayments.tv",
            "DOMAIN-SUFFIX,buyfast-paysmart.net",
            "DOMAIN-SUFFIX,card.io",
            "DOMAIN-SUFFIX,cash2.com",
            "DOMAIN-SUFFIX,cashify.com",
            "DOMAIN-SUFFIX,cashify.net",
            "DOMAIN-SUFFIX,devtools-paypal.com",
            "DOMAIN-SUFFIX,experiencebillmelater.com",
            "DOMAIN-SUFFIX,filipino-music.net",
            "DOMAIN-SUFFIX,fundpaypal.com",
            "DOMAIN-SUFFIX,getbraintree.com",
            "DOMAIN-SUFFIX,gmoney.org",
            "DOMAIN-SUFFIX,i-o-u.info",
            "DOMAIN-SUFFIX,krakenjs.com",
            "DOMAIN-SUFFIX,loanbuilder.com",
            "DOMAIN-SUFFIX,login-paypal.com",
            "DOMAIN-SUFFIX,login-paypal.info",
            "DOMAIN-SUFFIX,mywaytopay.info",
            "DOMAIN-SUFFIX,mywaytopay.net",
            "DOMAIN-SUFFIX,pa9pal.com",
            "DOMAIN-SUFFIX,paaypal.com",
            "DOMAIN-SUFFIX,paily.net",
            "DOMAIN-SUFFIX,paily.org",
            "DOMAIN-SUFFIX,paipal.com",
            "DOMAIN-SUFFIX,pavpal.com",
            "DOMAIN-SUFFIX,paydiant.com",
            "DOMAIN-SUFFIX,paylike.com",
            "DOMAIN-SUFFIX,paypa1.com",
            "DOMAIN-SUFFIX,paypa1.org",
            "DOMAIN-SUFFIX,paypaal.com",
            "DOMAIN-SUFFIX,paypal-activate.com",
            "DOMAIN-SUFFIX,paypal-activate.info",
            "DOMAIN-SUFFIX,paypal-activate.org",
            "DOMAIN-SUFFIX,paypal-apac.com",
            "DOMAIN-SUFFIX,paypal-apps.com",
            "DOMAIN-SUFFIX,paypal-biz.com",
            "DOMAIN-SUFFIX,paypal-brandcentral.com",
            "DOMAIN-SUFFIX,paypal-business.com",
            "DOMAIN-SUFFIX,paypal-business.net",
            "DOMAIN-SUFFIX,paypal-business.org",
            "DOMAIN-SUFFIX,paypal-cardcash.com",
            "DOMAIN-SUFFIX,paypal-cash.com",
            "DOMAIN-SUFFIX,paypal-center.com",
            "DOMAIN-SUFFIX,paypal-center.info",
            "DOMAIN-SUFFIX,paypal-center.net",
            "DOMAIN-SUFFIX,paypal-center.org",
            "DOMAIN-SUFFIX,paypal-communication.com",
            "DOMAIN-SUFFIX,paypal-communications.com",
            "DOMAIN-SUFFIX,paypal-communications.net",
            "DOMAIN-SUFFIX,paypal-community.com",
            "DOMAIN-SUFFIX,paypal-community.net",
            "DOMAIN-SUFFIX,paypal-comunidad.com",
            "DOMAIN-SUFFIX,paypal-corp.com",
            "DOMAIN-SUFFIX,paypal-database.com",
            "DOMAIN-SUFFIX,paypal-database.us",
            "DOMAIN-SUFFIX,paypal-donations.com",
            "DOMAIN-SUFFIX,paypal-dynamic.com",
            "DOMAIN-SUFFIX,paypal-engineering.com",
            "DOMAIN-SUFFIX,paypal-europe.com",
            "DOMAIN-SUFFIX,paypal-excelinvoicing.com",
            "DOMAIN-SUFFIX,paypal-exchanges.com",
            "DOMAIN-SUFFIX,paypal-forward.com",
            "DOMAIN-SUFFIX,paypal-galactic.com",
            "DOMAIN-SUFFIX,paypal-gift.com",
            "DOMAIN-SUFFIX,paypal-gifts.com",
            "DOMAIN-SUFFIX,paypal-gpplus.com",
            "DOMAIN-SUFFIX,paypal-here.com",
            "DOMAIN-SUFFIX,paypal-hrsystem.com",
            "DOMAIN-SUFFIX,paypal-innovationlab.com",
            "DOMAIN-SUFFIX,paypal-integration.com",
            "DOMAIN-SUFFIX,paypal-japan.com",
            "DOMAIN-SUFFIX,paypal-knowledge.com",
            "DOMAIN-SUFFIX,paypal-labs.com",
            "DOMAIN-SUFFIX,paypal-latam.com",
            "DOMAIN-SUFFIX,paypal-learning.com",
            "DOMAIN-SUFFIX,paypal-login.com",
            "DOMAIN-SUFFIX,paypal-login.info",
            "DOMAIN-SUFFIX,paypal-login.org",
            "DOMAIN-SUFFIX,paypal-login.us",
            "DOMAIN-SUFFIX,paypal-luxury.com",
            "DOMAIN-SUFFIX,paypal-mainstreet.net",
            "DOMAIN-SUFFIX,paypal-marketing.com",
            "DOMAIN-SUFFIX,paypal-media.com",
            "DOMAIN-SUFFIX,paypal-merchantloyalty.com",
            "DOMAIN-SUFFIX,paypal-mktg.com",
            "DOMAIN-SUFFIX,paypal-mobilemoney.com",
            "DOMAIN-SUFFIX,paypal-network.org",
            "DOMAIN-SUFFIX,paypal-notice.com",
            "DOMAIN-SUFFIX,paypal-notify.com",
            "DOMAIN-SUFFIX,paypal-online.info",
            "DOMAIN-SUFFIX,paypal-online.net",
            "DOMAIN-SUFFIX,paypal-online.org",
            "DOMAIN-SUFFIX,paypal-optimizer.com",
            "DOMAIN-SUFFIX,paypal-pages.com",
            "DOMAIN-SUFFIX,paypal-photocard.com",
            "DOMAIN-SUFFIX,paypal-plaza.com",
            "DOMAIN-SUFFIX,paypal-portal.com",
            "DOMAIN-SUFFIX,paypal-prepagata.com",
            "DOMAIN-SUFFIX,paypal-prepagata.net",
            "DOMAIN-SUFFIX,paypal-prepaid.com",
            "DOMAIN-SUFFIX,paypal-profile.com",
            "DOMAIN-SUFFIX,paypal-proserv.com",
            "DOMAIN-SUFFIX,paypal-qrshopping.org",
            "DOMAIN-SUFFIX,paypal-recargacelular.com",
            "DOMAIN-SUFFIX,paypal-redeem.com",
            "DOMAIN-SUFFIX,paypal-referral.com",
            "DOMAIN-SUFFIX,paypal-retail.com",
            "DOMAIN-SUFFIX,paypal-scoop.com",
            "DOMAIN-SUFFIX,paypal-search.com",
            "DOMAIN-SUFFIX,paypal-secure.net",
            "DOMAIN-SUFFIX,paypal-secure.org",
            "DOMAIN-SUFFIX,paypal-security.net",
            "DOMAIN-SUFFIX,paypal-security.org",
            "DOMAIN-SUFFIX,paypal-service.org",
            "DOMAIN-SUFFIX,paypal-signin.com",
            "DOMAIN-SUFFIX,paypal-signin.us",
            "DOMAIN-SUFFIX,paypal-special.com",
            "DOMAIN-SUFFIX,paypal-specialoffers.com",
            "DOMAIN-SUFFIX,paypal-sptam.com",
            "DOMAIN-SUFFIX,paypal-status.com",
            "DOMAIN-SUFFIX,paypal-support.com",
            "DOMAIN-SUFFIX,paypal-survey.com",
            "DOMAIN-SUFFIX,paypal-survey.org",
            "DOMAIN-SUFFIX,paypal-team.com",
            "DOMAIN-SUFFIX,paypal-viewpoints.net",
            "DOMAIN-SUFFIX,paypal.ca",
            "DOMAIN-SUFFIX,paypal.com",
            "DOMAIN-SUFFIX,paypal.com.cn",
            "DOMAIN-SUFFIX,paypal.com.hk",
            "DOMAIN-SUFFIX,paypal.com.sg",
            "DOMAIN-SUFFIX,paypal.hk",
            "DOMAIN-SUFFIX,paypal.info",
            "DOMAIN-SUFFIX,paypal.jp",
            "DOMAIN-SUFFIX,paypal.me",
            "DOMAIN-SUFFIX,paypal.net.cn",
            "DOMAIN-SUFFIX,paypal.org.cn",
            "DOMAIN-SUFFIX,paypal.so",
            "DOMAIN-SUFFIX,paypal.us",
            "DOMAIN-SUFFIX,paypalbeacon.com",
            "DOMAIN-SUFFIX,paypalbenefits.com",
            "DOMAIN-SUFFIX,paypalbrasil.com",
            "DOMAIN-SUFFIX,paypalcommunity.cn",
            "DOMAIN-SUFFIX,paypalcommunity.com",
            "DOMAIN-SUFFIX,paypalcommunity.net",
            "DOMAIN-SUFFIX,paypalcommunity.org",
            "DOMAIN-SUFFIX,paypalcorp.com",
            "DOMAIN-SUFFIX,paypalcredit.com",
            "DOMAIN-SUFFIX,paypalcreditcard.com",
            "DOMAIN-SUFFIX,paypalgivingfund.org",
            "DOMAIN-SUFFIX,paypalhere.cn",
            "DOMAIN-SUFFIX,paypalhere.com",
            "DOMAIN-SUFFIX,paypalhere.com.cn",
            "DOMAIN-SUFFIX,paypalhere.info",
            "DOMAIN-SUFFIX,paypalhere.net",
            "DOMAIN-SUFFIX,paypalhere.org",
            "DOMAIN-SUFFIX,paypalhere.tv",
            "DOMAIN-SUFFIX,paypali.net",
            "DOMAIN-SUFFIX,paypalinc.com",
            "DOMAIN-SUFFIX,paypalindia.com",
            "DOMAIN-SUFFIX,paypalinsuranceservices.org",
            "DOMAIN-SUFFIX,paypall.com",
            "DOMAIN-SUFFIX,paypallabs.com",
            "DOMAIN-SUFFIX,paypalme.com",
            "DOMAIN-SUFFIX,paypalnet.net",
            "DOMAIN-SUFFIX,paypalnet.org",
            "DOMAIN-SUFFIX,paypalnetwork.info",
            "DOMAIN-SUFFIX,paypalnetwork.net",
            "DOMAIN-SUFFIX,paypalnetwork.org",
            "DOMAIN-SUFFIX,paypalobjects.com",
            "DOMAIN-SUFFIX,paypalonline.net",
            "DOMAIN-SUFFIX,paypalonline.org",
            "DOMAIN-SUFFIX,paypalprepagata.com",
            "DOMAIN-SUFFIX,paypalprepagata.net",
            "DOMAIN-SUFFIX,paypalservice.com",
            "DOMAIN-SUFFIX,paypalshopping.com",
            "DOMAIN-SUFFIX,paypalshopping.net",
            "DOMAIN-SUFFIX,paypalsurvey.com",
            "DOMAIN-SUFFIX,paypalx.com",
            "DOMAIN-SUFFIX,paypaly.com",
            "DOMAIN-SUFFIX,payppal.com",
            "DOMAIN-SUFFIX,payypal.com",
            "DOMAIN-SUFFIX,pdncommunity.com",
            "DOMAIN-SUFFIX,pp-soc.com",
            "DOMAIN-SUFFIX,ppaypal.com",
            "DOMAIN-SUFFIX,pppds.com",
            "DOMAIN-SUFFIX,pypl.com",
            "DOMAIN-SUFFIX,pypl.info",
            "DOMAIN-SUFFIX,pypl.net",
            "DOMAIN-SUFFIX,pypl.tv",
            "DOMAIN-SUFFIX,s-xoom.com",
            "DOMAIN-SUFFIX,secure-paypal.info",
            "DOMAIN-SUFFIX,securepaypal.info",
            "DOMAIN-SUFFIX,simility.com",
            "DOMAIN-SUFFIX,sslpaypal.org",
            "DOMAIN-SUFFIX,swiftbank.info",
            "DOMAIN-SUFFIX,swiftbank.us",
            "DOMAIN-SUFFIX,swiftcapital.com",
            "DOMAIN-SUFFIX,swiftfinancial.com",
            "DOMAIN-SUFFIX,swiftfinancial.info",
            "DOMAIN-SUFFIX,swiftfinancial.net",
            "DOMAIN-SUFFIX,thepaypalshop.com",
            "DOMAIN-SUFFIX,theshoppingexpresslane.net",
            "DOMAIN-SUFFIX,venmo-touch.com",
            "DOMAIN-SUFFIX,venmo.com",
            "DOMAIN-SUFFIX,venmo.info",
            "DOMAIN-SUFFIX,venmo.net",
            "DOMAIN-SUFFIX,venmo.org",
            "DOMAIN-SUFFIX,venmo.s3.amazonaws.com",
            "DOMAIN-SUFFIX,webmoneyinfo.com",
            "DOMAIN-SUFFIX,wiremoneytoirelandwithxoomeasierandcheaper.com",
            "DOMAIN-SUFFIX,www-paypal.info",
            "DOMAIN-SUFFIX,www-paypal.us",
            "DOMAIN-SUFFIX,wwwxoom.com",
            "DOMAIN-SUFFIX,xn--bnq297cix3a.cn",
            "DOMAIN-SUFFIX,xoom-experience.com",
            "DOMAIN-SUFFIX,xoom.com",
            "DOMAIN-SUFFIX,xoom.io",
            "DOMAIN-SUFFIX,xoom.net.cn",
            "DOMAIN-SUFFIX,xoom.us",
            "DOMAIN-SUFFIX,xoomcom.com",
            "DOMAIN-KEYWORD,paypal",
        ]
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
    { 
        name: "draw&guess", 
        gfw : true,
        payload:  [
            "DOMAIN,b47db.playfabapi.com",
            "IP-CIDR,8.218.91.138/22"
        ]
    },

    // 常用网站分组
    { 
        name: "程序员需要:github、huggingface、docker", 
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
        name: "openAi", 
        gfw : true,
        urls: "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/OpenAI/OpenAI_No_Resolve.yaml" 
    },
    { 
        name: "Netflix", 
        gfw : true,
        urls: "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Netflix/Netflix_No_Resolve.yaml" 
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
        name: "TikTok", 
        gfw : true,
        urls: "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/TikTok/TikTok_No_Resolve.yaml" 
    },
    { 
        name: "OneDrive下载", 
        gfw : false,
        payload: ["DOMAIN-SUFFIX,storage.live.com", "DOMAIN-SUFFIX,sharepoint.com"]
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
        name: "Steam", 
        gfw : true,
        urls: "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@release/rule/Clash/Steam/Steam_No_Resolve.yaml" 
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

function filterProxiesByRules(proxies, rules = null, inverse = false) {
    if (!proxies || !Array.isArray(proxies)) {
        return [];
    }
    
    if (!rules) {
        return proxies.map(proxy => proxy.name || "");
    }
    
    return proxies.filter(proxy => 
        inverse !== rules.test(proxy.name || "")
    );
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
    if (!proxies || !Array.isArray(proxies)) {
        return [];
    }
    
    const countryRegex = REGEX_CACHE.notProxy;
    proxies = proxies.filter(proxy => {
        const proxyName = proxy.name || "";
        return !countryRegex.test(proxyName);
    });
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
    
    return COUNTRY_OR_REGION_KEYWORDS.map(keywords => {
        const countryRegex = new RegExp(keywords.join("|"));
        const filteredProxiesName = proxies
            .map(proxy => proxy.name || "")
            .filter(proxyName => countryRegex.test(proxyName));
            
        return filteredProxiesName.length > 0 ? filteredProxiesName : ["NULL"];
    });
}
const findByName1 = (array, name) => {
    return array.find(item => item.name === name);
}

/**
 * 构建基本代理组
 * @param {string} testUrl "测试URL
 * @param {Array} highQualityProxies "高质量节点列表
 * @returns {Array} 基本代理组配置
 */
function buildBaseProxyGroups(testUrl, proxies) {
    // 筛选所有节点
    const filteredProxiesName = filterNameByRules(proxies, null)

    // 筛选高质量节点
    const highQualityProxiesName = filterNameByRules(proxies, REGEX_CACHE.highQuality);

    // 筛选低质量下载节点
    const lowQualityProxiesName = filterNameByRules(proxies, REGEX_CACHE.lowQuality);

    // 获取socks5代理节点
    const socks5ProxiesName = filtersocks5ProxiesName(proxies)

    // 获取除socks5之外需要dialer节点
    const needDialerProxiesName = filterNameByRules(proxies, REGEX_CACHE.needDialer);
    // 筛选国家或者地区节点 
    const countryOrRegionProxiesGroups = filterCountryOrRegionProxies(proxies);
    const countryOrRegionGroupNames = getCountryOrRegionGroupNames(countryOrRegionProxiesGroups);
    const countryOrRegionLen = countryOrRegionProxiesGroups.length;


    const finalBaseProxyGroups = [];
    
    for (let i = 0; i < countryOrRegionLen; i++) {
        const countryOrRegionProxies = countryOrRegionProxiesGroups[i];

        if (countryOrRegionProxies[0] === "NULL") {
            continue;
        }
        const groupName = "手动选择"+COUNTRY_OR_REGION_KEYWORDS[i][0]+"节点";
        
        
        finalBaseProxyGroups.push({
            "name": groupName,
            "type": "select",
            "proxies": [
                ...(countryOrRegionProxies !== "NULL" ? countryOrRegionProxies : []),
                "DIRECT",
            ]
        });

        const autoGroupName = "自动选择"+COUNTRY_OR_REGION_KEYWORDS[i][0]+"节点";
        
        finalBaseProxyGroups.push({
            "name": autoGroupName,
            "type": "url-test",
            "tolerance": CONFIG.tolerance,
            "url": testUrl,
            "interval": CONFIG.testInterval,
            "proxies": [
                ...(countryOrRegionProxies !== "NULL" ? countryOrRegionProxies : []),
                "DIRECT",
            ]
        });
    }

    // 将最基本的放在最后
    const baseProxyGroups = [
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
            "type": "select",
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
            "proxies": ["DIRECT", "自动选择(最低延迟)", "负载均衡", "HighQuality", ...countryOrRegionGroupNames, "低质量下载节点", "手动选择所有节点"],
            "url": "https://www.baidu.com/favicon.ico"
        },
        {
            "name": "国外网站",
            "type": "select",
            "proxies": ["自动选择(最低延迟)", "负载均衡",  "HighQuality","DIRECT", ...countryOrRegionGroupNames, "低质量下载节点", "手动选择所有节点"],
            "url": "https://www.bing.com/favicon.ico"
        },
        // 高质量节点组
        {
            "name": "HighQuality",
            "type": "select",
            "proxies": [
                "自动选择(最低延迟)",
                "负载均衡",
                "DIRECT",
                ...(highQualityProxiesName.length > 0 ? highQualityProxiesName : [])
            ]
        },
        // 自动选择和负载均衡
        {
            "name": "自动选择(最低延迟)",
            "type": "url-test",
            "tolerance": CONFIG.tolerance,
            "include-all": true,
            "url": testUrl,
            "interval": CONFIG.testInterval
        },
        {
            "name": "负载均衡",
            "type": "load-balance",
            "include-all": true,
            "strategy": CONFIG.balanceStrategy,
            "url": testUrl,
            "interval": CONFIG.testInterval
        },
    ];
    

    if (socks5ProxiesName.length > 0 || needDialerProxiesName.length > 0) {
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

        // sock5接近明文传输，全部前置
        for (let i = 0; i < socks5ProxiesName.length; i++) {
            const proxyName = socks5ProxiesName[i];
            for (let j = 0; j < proxies.length; j++) {
                if (proxies[j].name === proxyName) {
                    proxies[j]["dialerProxy"] = "前置机场";
                }
            }
        }

        baseProxyGroups.push(
            {
            "name": "前置机场",
            "type": "select",
            "include-all": true,
            "url": testUrl,
            "interval": CONFIG.testInterval
            },
            {
                "name": "dialer-proxy的节点",
                "type": "select",
                "url": testUrl,
                "interval": CONFIG.testInterval,
                "proxies": [
                    ...socks5ProxiesName,
                    ...needDialerProxiesNewName,
                ]
            }
        )
    }
    finalBaseProxyGroups.push(...baseProxyGroups);
    return finalBaseProxyGroups;
}

/* 获得国家或者区域组的名称并处理输出 输入国家区域组 输出名称组*/
function getCountryOrRegionGroupNames(countryOrRegionProxiesGroups) {
    const countryOrRegionGroupNames = [];
    const countryOrRegionLen = countryOrRegionProxiesGroups.length;

    
    for (let i = 0; i < countryOrRegionLen; i++) {

        if (countryOrRegionProxiesGroups[i][0] === "NULL") {
            continue;
        }
        
        const groupName = "手动选择"+COUNTRY_OR_REGION_KEYWORDS[i][0]+"节点";
        
        countryOrRegionGroupNames.push(groupName);

        const autoGroupName = "自动选择"+COUNTRY_OR_REGION_KEYWORDS[i][0]+"节点";
        countryOrRegionGroupNames.push(autoGroupName);
        
    }
    return countryOrRegionGroupNames
}

/*主函数：生成完整的Clash配置 @param {Object} config "输入配置 @returns {Object} 完整的Clash配置*/
function main(config) {
    let { proxies } = config;
    const testUrl = CONFIG.testUrl;
    // 过滤不是正常节点的节点
    proxies = filterNotProxies(proxies)

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


    // 构建基本代理组
    const baseProxyGroups = buildBaseProxyGroups(testUrl, proxies);


    const configLen = PROXY_RULES.length;
    for (let i = 0; i < configLen; i++) {
        const { name, gfw, urls, payload, extraProxies } = PROXY_RULES[i];

        const dialerGroup = findByName1(baseProxyGroups, "dialer-proxy的节点");

        proxyGroups.push(createProxyGroup(name, extraProxies, testUrl, gfw, baseProxyGroups, dialerGroup !== undefined));

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
