/**
 * CardCraft 思源映卡 (siyuan-cardcraft) v1.0.1 - 商用正式版
 * 100% 纯思源原生 · 零浏览器插件 · 零后端依赖
 * 视觉知识制卡工作台（小红书多图套卡 / 朋友圈金句长图 / 4:5 海报 / 公众号头图 / 公众号内联富文本 / 可选 AI 提纯）
 */

let siyuanModule = {};
try {
    siyuanModule = require("siyuan");
} catch (_) {
    siyuanModule = {
        Plugin: class {},
        Dialog: class {},
        Setting: class {},
        showMessage: () => {},
    };
}
const { Plugin, Dialog, Setting, showMessage } = siyuanModule;

const CONFIG_STORAGE = "config.json";

// ==================== Ed25519 官方离线验签公钥 ====================
const ED25519_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAZLwro3zTRoaqdkd+mW8YiiDXFQ+aB2v9imzjOLDvdGQ=
-----END PUBLIC KEY-----`;
const ED25519_PUBLIC_KEY_SPKI_B64 = "MCowBQYDK2VwAyEAZLwro3zTRoaqdkd+mW8YiiDXFQ+aB2v9imzjOLDvdGQ=";
const ED25519_PUBLIC_KEY_RAW_HEX = "64bc2ba37cd34686aa76477e996f188a20d7150f9a076bfd8a6ce338b0ef7464";

// ==================== 动态多渠道付费兜底配置 ====================
const DEFAULT_PRICING_CHANNELS = {
    version: "1.0.1",
    updated_at: "2026-11-13",
    currency: "CNY",
    plans: {
        pro: {
            id: "PRO",
            badge: "早鸟特惠 · 买断终身",
            title: "CardCraft 终身专业版",
            price: "29.9",
            original_price: "49",
            unit: "元 / 永久买断",
            highlights: [
                "解锁全部 12 套杂志级高定卡片主题 + 字号边距微调",
                "小红书长文无限张数分页 + 一键 .zip 批量打包下载",
                "去除右下角渲染水印，解锁「个人 IP 品牌底座」(头像/署名/二维码)",
                "不限次数 AI 智能提纯套卡、爆款标题与金句提取 (自备 API Key)",
                "解锁全部 Pro 专属公众号内联富文本高级排版主题",
            ],
        },
    },
    primary_url: "https://afdian.com/item/79927f0ee0b011f1a7a152540025c377",
    primary_label: "⚡ 立即前往爱发电购买终身专业版（微信 / 支付宝 24h 自动发卡）",
    afdian_url: "",
    afdian_label: "",
    xianyu_tip: "打开【爱发电】订单详情页或站内私信即可实时查看系统自动发放的 SYCC-PRO 终身激活码。",
    wechat_contact: "lsqingfeng_studio",
    wechat_tip: "如需团队批量采购或遇到激活问题，可添加作者微信备注「思源映卡」获取一对一协助。",
    announcement: "🎉 v1.0 首发早鸟价 ¥29.9 限时开放中（原价 ¥49），一次买断永久免费升级，纯离线激活不绑设备数！",
};

const REMOTE_PRICING_URLS = [
    "https://cdn.jsdelivr.net/gh/lsqingfeng/siyuan-cardcraft@main/pricing_channels.json",
    "https://raw.githubusercontent.com/lsqingfeng/siyuan-cardcraft/main/pricing_channels.json",
];

// ==================== AI 服务商预设 ====================
const AI_PROVIDERS = {
    siyuan_inherit: {
        name: "✨ 自动继承思源内置 AI 设置",
        baseUrl: "",
        defaultModel: "",
    },
    deepseek: {
        name: "DeepSeek 官方 (性价比首选)",
        baseUrl: "https://api.deepseek.com/v1",
        defaultModel: "deepseek-chat",
    },
    siliconflow: {
        name: "硅基流动 SiliconFlow",
        baseUrl: "https://api.siliconflow.cn/v1",
        defaultModel: "deepseek-ai/DeepSeek-V3",
    },
    qwen: {
        name: "阿里云 · 通义千问 DashScope",
        baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
        defaultModel: "qwen-plus",
    },
    kimi: {
        name: "Moonshot Kimi",
        baseUrl: "https://api.moonshot.cn/v1",
        defaultModel: "moonshot-v1-8k",
    },
    openai: {
        name: "OpenAI 官方",
        baseUrl: "https://api.openai.com/v1",
        defaultModel: "gpt-5-mini",
    },
    ollama: {
        name: "本地 Ollama (免 Key 离线)",
        baseUrl: "http://127.0.0.1:11434/v1",
        defaultModel: "qwen2.5:7b",
    },
    custom: {
        name: "自定义 OpenAI 兼容接口",
        baseUrl: "",
        defaultModel: "",
    },
};

// ==================== 12 套杂志级高定视觉主题 ====================
const THEME_REGISTRY = [
    // ---- 🆓 免费社区版开放 (3套) ----
    {
        id: "pure-ceramic",
        name: "极简瓷白",
        subtitle: "温润浅灰 · 悬浮白卡",
        pro: false,
        outerBg: "linear-gradient(145deg, #EEF2F6 0%, #E3E8F0 100%)",
        cardBg: "#FFFFFF",
        cardBorder: "1px solid rgba(15, 23, 42, 0.06)",
        cardRadius: "20px",
        cardShadow: "0 20px 48px rgba(15, 23, 42, 0.08)",
        textColor: "#1E293B",
        mutedColor: "#64748B",
        titleColor: "#0F172A",
        accentColor: "#2563EB",
        accentSoft: "rgba(37, 99, 235, 0.10)",
        highlightBg: "linear-gradient(transparent 58%, rgba(96, 165, 250, 0.35) 58%)",
        quoteBg: "#F8FAFC",
        quoteBorder: "#2563EB",
        codeBg: "#0F172A",
        codeText: "#E2E8F0",
        fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
        ornament: "minimal-dot",
    },
    {
        id: "apple-notes",
        name: "苹果备忘录",
        subtitle: "暖白纸纹 · 琥珀时间轴",
        pro: false,
        outerBg: "linear-gradient(150deg, #EFECE4 0%, #E6E0D3 100%)",
        cardBg: "#FFFDF8",
        cardBorder: "1px solid rgba(180, 155, 110, 0.22)",
        cardRadius: "18px",
        cardShadow: "0 18px 42px rgba(87, 70, 42, 0.10)",
        textColor: "#2C261E",
        mutedColor: "#8C7E6A",
        titleColor: "#1C1712",
        accentColor: "#D97706",
        accentSoft: "rgba(217, 119, 6, 0.12)",
        highlightBg: "linear-gradient(transparent 55%, rgba(251, 191, 36, 0.42) 55%)",
        quoteBg: "#FAF5E8",
        quoteBorder: "#F59E0B",
        codeBg: "#27221B",
        codeText: "#FDE68A",
        fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif',
        ornament: "notes-amber",
    },
    {
        id: "mac-dark",
        name: "极客暗夜终端",
        subtitle: "深空黑蓝 · Mac毛玻璃",
        pro: false,
        outerBg: "linear-gradient(140deg, #070B14 0%, #0F172A 52%, #1E1B4B 100%)",
        cardBg: "rgba(17, 25, 40, 0.90)",
        cardBorder: "1px solid rgba(148, 163, 184, 0.18)",
        cardRadius: "20px",
        cardShadow: "0 24px 56px rgba(0, 0, 0, 0.45)",
        textColor: "#E2E8F0",
        mutedColor: "#94A3B8",
        titleColor: "#F8FAFC",
        accentColor: "#38BDF8",
        accentSoft: "rgba(56, 189, 248, 0.15)",
        highlightBg: "linear-gradient(transparent 56%, rgba(56, 189, 248, 0.32) 56%)",
        quoteBg: "rgba(30, 41, 59, 0.78)",
        quoteBorder: "#38BDF8",
        codeBg: "#090D16",
        codeText: "#7DD3FC",
        fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "JetBrains Mono", sans-serif',
        ornament: "mac-traffic",
    },

    // ---- 💎 Pro 终身版专属 (9套) ----
    {
        id: "oriental-xuan",
        name: "东方宣纸松石",
        subtitle: "米金宣纸 · 新中式雅印",
        pro: true,
        outerBg: "linear-gradient(155deg, #F2EBD9 0%, #E6DCC5 100%)",
        cardBg: "#FAF6ED",
        cardBorder: "1.5px solid rgba(31, 111, 97, 0.28)",
        cardRadius: "14px",
        cardShadow: "0 18px 44px rgba(68, 56, 38, 0.11)",
        textColor: "#2B2620",
        mutedColor: "#786E5F",
        titleColor: "#193832",
        accentColor: "#1F6F61",
        accentSoft: "rgba(31, 111, 97, 0.11)",
        highlightBg: "linear-gradient(transparent 58%, rgba(45, 148, 130, 0.25) 58%)",
        quoteBg: "#F2ECE0",
        quoteBorder: "#1F6F61",
        codeBg: "#1D2927",
        codeText: "#D1FAE5",
        fontFamily: '"Songti SC", "STSong", "Noto Serif CJK SC", "PingFang SC", serif',
        ornament: "oriental-seal",
    },
    {
        id: "newyorker-serif",
        name: "纽约客刊头",
        subtitle: "象牙白底 · 经典评论风",
        pro: true,
        outerBg: "linear-gradient(160deg, #EAE6DF 0%, #DFD9CE 100%)",
        cardBg: "#FFFEFA",
        cardBorder: "1px solid rgba(17, 17, 17, 0.14)",
        cardRadius: "8px",
        cardShadow: "0 20px 46px rgba(20, 20, 20, 0.10)",
        textColor: "#1F1F1F",
        mutedColor: "#6B665E",
        titleColor: "#0A0A0A",
        accentColor: "#B91C1C",
        accentSoft: "rgba(185, 28, 28, 0.09)",
        highlightBg: "linear-gradient(transparent 60%, rgba(239, 68, 68, 0.24) 60%)",
        quoteBg: "#F7F4ED",
        quoteBorder: "#111111",
        codeBg: "#18181B",
        codeText: "#F4F4F5",
        fontFamily: 'Georgia, "Songti SC", "Noto Serif SC", "PingFang SC", serif',
        ornament: "newyorker-rule",
    },
    {
        id: "aurora-glass",
        name: "弥散极光毛玻璃",
        subtitle: "紫青柔光 · AI科技爆款",
        pro: true,
        outerBg: "radial-gradient(circle at 15% 18%, #C7D2FE 0%, transparent 48%), radial-gradient(circle at 88% 22%, #FBCFE8 0%, transparent 46%), radial-gradient(circle at 75% 85%, #A5F3FC 0%, transparent 50%), linear-gradient(135deg, #EEF2FF 0%, #FDF2F8 100%)",
        cardBg: "rgba(255, 255, 255, 0.86)",
        cardBorder: "1.5px solid rgba(255, 255, 255, 0.92)",
        cardRadius: "24px",
        cardShadow: "0 22px 50px rgba(99, 102, 241, 0.14)",
        textColor: "#1E293B",
        mutedColor: "#64748B",
        titleColor: "#1E1B4B",
        accentColor: "#6366F1",
        accentSoft: "rgba(99, 102, 241, 0.12)",
        highlightBg: "linear-gradient(90deg, rgba(129, 140, 248, 0.28), rgba(244, 114, 182, 0.28))",
        quoteBg: "rgba(238, 242, 255, 0.78)",
        quoteBorder: "#8B5CF6",
        codeBg: "#1E1B4B",
        codeText: "#E0E7FF",
        fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif',
        ornament: "aurora-pill",
    },
    {
        id: "pop-poster",
        name: "荧光波普大字报",
        subtitle: "暖黄撞色 · 高点击封面",
        pro: true,
        outerBg: "linear-gradient(145deg, #FFE44D 0%, #FFD426 100%)",
        cardBg: "#FFFFFF",
        cardBorder: "2.5px solid #111827",
        cardRadius: "18px",
        cardShadow: "7px 7px 0px #111827",
        textColor: "#111827",
        mutedColor: "#4B5563",
        titleColor: "#030712",
        accentColor: "#2563EB",
        accentSoft: "#DBEAFE",
        highlightBg: "linear-gradient(transparent 48%, #FDE047 48%)",
        quoteBg: "#FEF9C3",
        quoteBorder: "#111827",
        codeBg: "#111827",
        codeText: "#FDE047",
        fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif',
        ornament: "pop-tag",
    },
    {
        id: "mckinsey-blue",
        name: "商业研报深蓝",
        subtitle: "深海蓝刊 · 严谨金线",
        pro: true,
        outerBg: "linear-gradient(155deg, #0A192F 0%, #112240 100%)",
        cardBg: "#FFFFFF",
        cardBorder: "1px solid rgba(198, 151, 73, 0.35)",
        cardRadius: "12px",
        cardShadow: "0 24px 54px rgba(2, 12, 27, 0.42)",
        textColor: "#1E293B",
        mutedColor: "#64748B",
        titleColor: "#0A192F",
        accentColor: "#0F3460",
        accentSoft: "rgba(15, 52, 96, 0.09)",
        highlightBg: "linear-gradient(transparent 58%, rgba(198, 151, 73, 0.32) 58%)",
        quoteBg: "#F4F6F9",
        quoteBorder: "#C69749",
        codeBg: "#0A192F",
        codeText: "#E2E8F0",
        fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif',
        ornament: "mckinsey-bar",
    },
    {
        id: "film-memo",
        name: "复古胶片手账",
        subtitle: "暖棕暗角 · 奶油字色",
        pro: true,
        outerBg: "radial-gradient(circle at 50% 35%, #43352B 0%, #211A15 100%)",
        cardBg: "#2C231D",
        cardBorder: "1px solid rgba(224, 159, 103, 0.25)",
        cardRadius: "16px",
        cardShadow: "0 22px 50px rgba(0, 0, 0, 0.45)",
        textColor: "#EFE6DC",
        mutedColor: "#A89888",
        titleColor: "#FFF8F0",
        accentColor: "#E09F67",
        accentSoft: "rgba(224, 159, 103, 0.16)",
        highlightBg: "linear-gradient(transparent 58%, rgba(224, 159, 103, 0.34) 58%)",
        quoteBg: "rgba(255, 248, 240, 0.05)",
        quoteBorder: "#E09F67",
        codeBg: "#1B1511",
        codeText: "#F3C69F",
        fontFamily: '"Songti SC", Georgia, "PingFang SC", serif',
        ornament: "film-code",
    },
    {
        id: "forest-mint",
        name: "森系呼吸薄荷",
        subtitle: "鼠尾草绿 · 治愈系留白",
        pro: true,
        outerBg: "linear-gradient(145deg, #D8EAE0 0%, #E7F3EC 52%, #CBE2D6 100%)",
        cardBg: "#FBFEFC",
        cardBorder: "1px solid rgba(45, 106, 79, 0.14)",
        cardRadius: "22px",
        cardShadow: "0 18px 44px rgba(27, 67, 50, 0.09)",
        textColor: "#1F332A",
        mutedColor: "#648274",
        titleColor: "#132A1F",
        accentColor: "#2D6A4F",
        accentSoft: "rgba(45, 106, 79, 0.11)",
        highlightBg: "linear-gradient(transparent 56%, rgba(116, 198, 157, 0.42) 56%)",
        quoteBg: "#F1F8F4",
        quoteBorder: "#40916C",
        codeBg: "#1B3026",
        codeText: "#D8F3DC",
        fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif',
        ornament: "forest-leaf",
    },
    {
        id: "sunset-amber",
        name: "落日琥珀流光",
        subtitle: "暖橙杏色 · 黄昏漫射光",
        pro: true,
        outerBg: "linear-gradient(140deg, #FDE2CC 0%, #FAD1DF 55%, #FCD5CE 100%)",
        cardBg: "rgba(255, 252, 249, 0.94)",
        cardBorder: "1px solid rgba(234, 88, 12, 0.14)",
        cardRadius: "22px",
        cardShadow: "0 20px 46px rgba(194, 65, 12, 0.11)",
        textColor: "#33221B",
        mutedColor: "#8A6A5C",
        titleColor: "#431407",
        accentColor: "#EA580C",
        accentSoft: "rgba(234, 88, 12, 0.11)",
        highlightBg: "linear-gradient(transparent 56%, rgba(253, 186, 116, 0.48) 56%)",
        quoteBg: "#FFF5ED",
        quoteBorder: "#EA580C",
        codeBg: "#2B1810",
        codeText: "#FED7AA",
        fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif',
        ornament: "sunset-glow",
    },
    {
        id: "black-gold",
        name: "黑金私享名片",
        subtitle: "曜石黑底 · 香槟流光",
        pro: true,
        outerBg: "linear-gradient(150deg, #09090B 0%, #141417 55%, #1C1917 100%)",
        cardBg: "linear-gradient(165deg, #141417 0%, #0E0E11 100%)",
        cardBorder: "1px solid rgba(212, 175, 55, 0.42)",
        cardRadius: "16px",
        cardShadow: "0 24px 56px rgba(0, 0, 0, 0.55)",
        textColor: "#E7E5E4",
        mutedColor: "#A8A29E",
        titleColor: "#F5D77F",
        accentColor: "#D4AF37",
        accentSoft: "rgba(212, 175, 55, 0.15)",
        highlightBg: "linear-gradient(transparent 58%, rgba(212, 175, 55, 0.30) 58%)",
        quoteBg: "rgba(212, 175, 55, 0.07)",
        quoteBorder: "#D4AF37",
        codeBg: "#070709",
        codeText: "#F5D77F",
        fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif',
        ornament: "luxury-gold",
    },
];

// ==================== 画幅规格定义 ====================
const ASPECT_RATIOS = {
    xhs_3_4: {
        id: "xhs_3_4",
        name: "📱 小红书黄金竖版 (3:4)",
        desc: "1080×1440 · 智能多图套卡",
        baseW: 540,
        baseH: 720,
        exportScale: 2,
        paginated: true,
    },
    moments_auto: {
        id: "moments_auto",
        name: "🧧 朋友圈/金句长卡",
        desc: "1080w 自适应高度 · 不裁切",
        baseW: 540,
        baseH: null,
        exportScale: 2,
        paginated: false,
    },
    poster_4_5: {
        id: "poster_4_5",
        name: "🖼️ 经典海报 (4:5)",
        desc: "1080×1350 · 书摘干货",
        baseW: 540,
        baseH: 675,
        exportScale: 2,
        paginated: true,
    },
    cover_banner: {
        id: "cover_banner",
        name: "🖥️ 公众号/专栏封面图",
        desc: "2.35:1 微信头图 & 16:9 封面",
        baseW: 540,
        baseH: 230, // 2.35:1 -> 1080x460; when 16:9 -> 640x360 (1280x720)
        exportScale: 2,
        paginated: false,
        isCoverOnly: true,
    },
};

// ==================== 内联导出共享样式（保证预览与 SVG foreignObject 100% 像素一致） ====================
const CARD_SHARED_CSS = `
.sycc-render-canvas {
    box-sizing: border-box;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
}
.sycc-render-canvas * {
    box-sizing: border-box;
}
.sycc-inner-sheet {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
    overflow: hidden;
}
.sycc-sheet-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
    gap: 8px;
}
.sycc-kicker {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    padding: 4px 10px;
    border-radius: 999px;
}
.sycc-page-num {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    opacity: 0.68;
    font-variant-numeric: tabular-nums;
}
.sycc-cover-center {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 18px;
    padding: 12px 0;
}
.sycc-cover-h1 {
    margin: 0;
    font-size: 33px;
    font-weight: 800;
    line-height: 1.28;
    letter-spacing: -0.02em;
    word-break: break-word;
}
.sycc-cover-lead {
    margin: 0;
    font-size: 15.5px;
    line-height: 1.72;
    opacity: 0.86;
    word-break: break-word;
}
.sycc-cover-divider {
    width: 48px;
    height: 4px;
    border-radius: 2px;
}
.sycc-body-flow {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 11px;
}
.sycc-md-h2 {
    margin: 2px 0 4px;
    font-size: 20px;
    font-weight: 800;
    line-height: 1.36;
    letter-spacing: -0.01em;
    display: flex;
    align-items: center;
    gap: 8px;
}
.sycc-md-h2-bar {
    width: 4px;
    height: 18px;
    border-radius: 2px;
    flex-shrink: 0;
}
.sycc-md-h3 {
    margin: 2px 0 2px;
    font-size: 16px;
    font-weight: 700;
    line-height: 1.42;
}
.sycc-md-p {
    margin: 0;
    line-height: 1.74;
    word-break: break-word;
}
.sycc-md-quote {
    margin: 2px 0;
    padding: 11px 14px;
    border-left-width: 3.5px;
    border-left-style: solid;
    border-radius: 0 10px 10px 0;
    line-height: 1.68;
}
.sycc-md-list {
    margin: 0;
    padding-left: 20px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    line-height: 1.68;
}
.sycc-md-codewrap {
    margin: 3px 0;
    border-radius: 10px;
    overflow: hidden;
}
.sycc-md-codehead {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 7px 12px;
    background: rgba(255, 255, 255, 0.06);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.sycc-mac-dots {
    display: inline-flex;
    gap: 5px;
}
.sycc-mac-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
}
.sycc-md-pre {
    margin: 0;
    padding: 10px 13px;
    font-family: "SFMono-Regular", Consolas, Menlo, monospace;
    font-size: 12px;
    line-height: 1.55;
    white-space: pre-wrap;
    word-break: break-all;
}
.sycc-md-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12.5px;
    margin: 3px 0;
}
.sycc-md-table th,
.sycc-md-table td {
    padding: 6px 9px;
    border: 1px solid rgba(148, 163, 184, 0.28);
    text-align: left;
}
.sycc-md-img-wrap {
    margin: 4px 0;
    border-radius: 10px;
    overflow: hidden;
    display: flex;
    justify-content: center;
}
.sycc-md-img {
    max-width: 100%;
    max-height: 230px;
    object-fit: cover;
    border-radius: 8px;
    display: block;
}
.sycc-inline-code {
    padding: 1px 5px;
    border-radius: 4px;
    font-family: "SFMono-Regular", Consolas, monospace;
    font-size: 0.88em;
}
.sycc-sheet-footer {
    margin-top: 16px;
    padding-top: 11px;
    border-top: 1px solid rgba(148, 163, 184, 0.16);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
}
.sycc-brand-left {
    display: flex;
    align-items: center;
    gap: 9px;
    min-width: 0;
}
.sycc-brand-avatar {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
}
.sycc-brand-meta {
    display: flex;
    flex-direction: column;
    min-width: 0;
}
.sycc-brand-author {
    font-size: 12px;
    font-weight: 700;
    line-height: 1.25;
}
.sycc-brand-slogan {
    font-size: 10.5px;
    opacity: 0.68;
    line-height: 1.25;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.sycc-brand-qr {
    width: 38px;
    height: 38px;
    border-radius: 6px;
    object-fit: contain;
    background: #ffffff;
    padding: 2px;
    flex-shrink: 0;
}
.sycc-watermark-free {
    font-size: 10.5px;
    opacity: 0.52;
    letter-spacing: 0.03em;
    margin-left: auto;
}
`;

// ==================== 纯 JS RFC 8032 Ed25519 + SHA-512 离线验签兜底（兼容无 WebCrypto 的局域网 Docker HTTP 环境） ====================
const PureEd25519 = (() => {
    const MASK64 = 0xffffffffffffffffn;
    const SHA512_H0 = [
        0x6a09e667f3bcc908n, 0xbb67ae8584caa73bn, 0x3c6ef372fe94f82bn, 0xa54ff53a5f1d36f1n,
        0x510e527fade682d1n, 0x9b05688c2b3e6c1fn, 0x1f83d9abfb41bd6bn, 0x5be0cd19137e2179n,
    ];
    const SHA512_K = [
        0x428a2f98d728ae22n, 0x7137449123ef65cdn, 0xb5c0fbcfec4d3b2fn, 0xe9b5dba58189dbbcn,
        0x3956c25bf348b538n, 0x59f111f1b605d019n, 0x923f82a4af194f9bn, 0xab1c5ed5da6d8118n,
        0xd807aa98a3030242n, 0x12835b0145706fben, 0x243185be4ee4b28cn, 0x550c7dc3d5ffb4e2n,
        0x72be5d74f27b896fn, 0x80deb1fe3b1696b1n, 0x9bdc06a725c71235n, 0xc19bf174cf692694n,
        0xe49b69c19ef14ad2n, 0xefbe4786384f25e3n, 0x0fc19dc68b8cd5b5n, 0x240ca1cc77ac9c65n,
        0x2de92c6f592b0275n, 0x4a7484aa6ea6e483n, 0x5cb0a9dcbd41fbd4n, 0x76f988da831153b5n,
        0x983e5152ee66dfabn, 0xa831c66d2db43210n, 0xb00327c898fb213fn, 0xbf597fc7beef0ee4n,
        0xc6e00bf33da88fc2n, 0xd5a79147930aa725n, 0x06ca6351e003826fn, 0x142929670a0e6e70n,
        0x27b70a8546d22ffcn, 0x2e1b21385c26c926n, 0x4d2c6dfc5ac42aedn, 0x53380d139d95b3dfn,
        0x650a73548baf63den, 0x766a0abb3c77b2a8n, 0x81c2c92e47edaee6n, 0x92722c851482353bn,
        0xa2bfe8a14cf10364n, 0xa81a664bbc423001n, 0xc24b8b70d0f89791n, 0xc76c51a30654be30n,
        0xd192e819d6ef5218n, 0xd69906245565a910n, 0xf40e35855771202an, 0x106aa07032bbd1b8n,
        0x19a4c116b8d2d0c8n, 0x1e376c085141ab53n, 0x2748774cdf8eeb99n, 0x34b0bcb5e19b48a8n,
        0x391c0cb3c5c95a63n, 0x4ed8aa4ae3418acbn, 0x5b9cca4f7763e373n, 0x682e6ff3d6b2b8a3n,
        0x748f82ee5defb2fcn, 0x78a5636f43172f60n, 0x84c87814a1f0ab72n, 0x8cc702081a6439ecn,
        0x90befffa23631e28n, 0xa4506cebde82bde9n, 0xbef9a3f7b2c67915n, 0xc67178f2e372532bn,
        0xca273eceea26619cn, 0xd186b8c721c0c207n, 0xeada7dd6cde0eb1en, 0xf57d4f7fee6ed178n,
        0x06f067aa72176fban, 0x0a637dc5a2c898a6n, 0x113f9804bef90daen, 0x1b710b35131c471bn,
        0x28db77f523047d84n, 0x32caab7b40c72493n, 0x3c9ebe0a15c9bebcn, 0x431d67c49c100d4cn,
        0x4cc5d4becb3e42b6n, 0x597f299cfc657e2an, 0x5fcb6fab3ad6faecn, 0x6c44198c4a475817n,
    ];

    function rotr64(x, n) {
        return ((x >> n) | ((x << (64n - n)) & MASK64)) & MASK64;
    }

    function sha512(msgBytes) {
        const bitLen = BigInt(msgBytes.length) * 8n;
        const padZeroes = (112 - ((msgBytes.length + 1) % 128) + 128) % 128;
        const totalLen = msgBytes.length + 1 + padZeroes + 16;
        const buf = new Uint8Array(totalLen);
        buf.set(msgBytes, 0);
        buf[msgBytes.length] = 0x80;
        let lenTmp = bitLen;
        for (let i = 0; i < 16; i++) {
            buf[totalLen - 1 - i] = Number(lenTmp & 0xffn);
            lenTmp >>= 8n;
        }
        const H = SHA512_H0.slice();
        const W = new Array(80).fill(0n);
        for (let offset = 0; offset < totalLen; offset += 128) {
            for (let i = 0; i < 16; i++) {
                let w = 0n;
                for (let b = 0; b < 8; b++) {
                    w = (w << 8n) | BigInt(buf[offset + i * 8 + b]);
                }
                W[i] = w;
            }
            for (let i = 16; i < 80; i++) {
                const s0 = rotr64(W[i - 15], 1n) ^ rotr64(W[i - 15], 8n) ^ (W[i - 15] >> 7n);
                const s1 = rotr64(W[i - 2], 19n) ^ rotr64(W[i - 2], 61n) ^ (W[i - 2] >> 6n);
                W[i] = (W[i - 16] + s0 + W[i - 7] + s1) & MASK64;
            }
            let [a, b, c, d, e, f, g, h] = H;
            for (let i = 0; i < 80; i++) {
                const S1 = rotr64(e, 14n) ^ rotr64(e, 18n) ^ rotr64(e, 41n);
                const ch = (e & f) ^ ((~e & MASK64) & g);
                const temp1 = (h + S1 + ch + SHA512_K[i] + W[i]) & MASK64;
                const S0 = rotr64(a, 28n) ^ rotr64(a, 34n) ^ rotr64(a, 39n);
                const maj = (a & b) ^ (a & c) ^ (b & c);
                const temp2 = (S0 + maj) & MASK64;
                h = g; g = f; f = e;
                e = (d + temp1) & MASK64;
                d = c; c = b; b = a;
                a = (temp1 + temp2) & MASK64;
            }
            H[0] = (H[0] + a) & MASK64;
            H[1] = (H[1] + b) & MASK64;
            H[2] = (H[2] + c) & MASK64;
            H[3] = (H[3] + d) & MASK64;
            H[4] = (H[4] + e) & MASK64;
            H[5] = (H[5] + f) & MASK64;
            H[6] = (H[6] + g) & MASK64;
            H[7] = (H[7] + h) & MASK64;
        }
        const out = new Uint8Array(64);
        for (let i = 0; i < 8; i++) {
            let v = H[i];
            for (let b = 7; b >= 0; b--) {
                out[i * 8 + b] = Number(v & 0xffn);
                v >>= 8n;
            }
        }
        return out;
    }

    const P = (1n << 255n) - 19n;
    const L = (1n << 252n) + 27742317777372353535851937790883648493n;

    function mod(a, m = P) {
        const r = a % m;
        return r >= 0n ? r : r + m;
    }

    function modPow(base, exp, m = P) {
        let res = 1n;
        let b = mod(base, m);
        let e = exp;
        while (e > 0n) {
            if (e & 1n) res = mod(res * b, m);
            b = mod(b * b, m);
            e >>= 1n;
        }
        return res;
    }

    function modInv(a, m = P) {
        return modPow(a, m - 2n, m);
    }

    const D = mod(-121665n * modInv(121666n));
    const SQRT_M1 = modPow(2n, (P - 1n) / 4n);

    function recoverX(y, sign) {
        if (y >= P) return null;
        const y2 = mod(y * y);
        const u = mod(y2 - 1n);
        const v = mod(D * y2 + 1n);
        const v3 = mod(v * v * v);
        const v7 = mod(v3 * v3 * v);
        let x = mod(mod(u * v3) * modPow(mod(u * v7), (P - 5n) / 8n));
        const vx2 = mod(v * mod(x * x));
        if (vx2 === u) {
            // valid root
        } else if (vx2 === mod(-u)) {
            x = mod(x * SQRT_M1);
        } else {
            return null;
        }
        if (x === 0n && sign === 1) return null;
        if ((x & 1n) !== BigInt(sign)) x = P - x;
        return x;
    }

    const BY = mod(4n * modInv(5n));
    const BX = recoverX(BY, 0);
    const BASE_POINT = [BX, BY, 1n, mod(BX * BY)];
    const ZERO_POINT = [0n, 1n, 1n, 0n];

    function pointAdd(p1, p2) {
        const [X1, Y1, Z1, T1] = p1;
        const [X2, Y2, Z2, T2] = p2;
        const A = mod((Y1 - X1) * (Y2 - X2));
        const B = mod((Y1 + X1) * (Y2 + X2));
        const C = mod(T1 * 2n * D * T2);
        const DD = mod(Z1 * 2n * Z2);
        const E = mod(B - A);
        const F = mod(DD - C);
        const G = mod(DD + C);
        const H = mod(B + A);
        return [mod(E * F), mod(G * H), mod(F * G), mod(E * H)];
    }

    function scalarMult(pt, scalar) {
        let res = ZERO_POINT;
        let cur = pt;
        let k = scalar;
        while (k > 0n) {
            if (k & 1n) res = pointAdd(res, cur);
            cur = pointAdd(cur, cur);
            k >>= 1n;
        }
        return res;
    }

    function decodeLittleEndian(bytes) {
        let b = 0n;
        for (let i = bytes.length - 1; i >= 0; i--) {
            b = (b << 8n) | BigInt(bytes[i]);
        }
        return b;
    }

    function decodePoint(bytes32) {
        if (!bytes32 || bytes32.length !== 32) return null;
        const copy = new Uint8Array(bytes32);
        const sign = (copy[31] >> 7) & 1;
        copy[31] &= 0x7f;
        const y = decodeLittleEndian(copy);
        const x = recoverX(y, sign);
        if (x === null) return null;
        return [x, y, 1n, mod(x * y)];
    }

    function pointsEqual(p1, p2) {
        return mod(p1[0] * p2[2]) === mod(p2[0] * p1[2]) &&
               mod(p1[1] * p2[2]) === mod(p2[1] * p1[2]);
    }

    function hexToBytes(hex) {
        const out = new Uint8Array(hex.length / 2);
        for (let i = 0; i < out.length; i++) {
            out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
        }
        return out;
    }

    function verify(msgBytes, sigBytes, pubKeyHex = ED25519_PUBLIC_KEY_RAW_HEX) {
        if (!sigBytes || sigBytes.length !== 64) return false;
        const pubBytes = hexToBytes(pubKeyHex);
        const RBytes = sigBytes.subarray(0, 32);
        const SBytes = sigBytes.subarray(32, 64);
        const S = decodeLittleEndian(SBytes);
        if (S >= L) return false;
        const R = decodePoint(RBytes);
        const A = decodePoint(pubBytes);
        if (!R || !A) return false;

        const hashInput = new Uint8Array(64 + msgBytes.length);
        hashInput.set(RBytes, 0);
        hashInput.set(pubBytes, 32);
        hashInput.set(msgBytes, 64);
        const k = decodeLittleEndian(sha512(hashInput)) % L;

        const lhs = scalarMult(BASE_POINT, S);
        const rhs = pointAdd(R, scalarMult(A, k));
        return pointsEqual(lhs, rhs);
    }

    return { verify, sha512, hexToBytes };
})();

// ==================== 离线授权校验器（支持 Node Crypto / WebCrypto / PureJS 三通道） ====================
const LicenseVerifier = {
    base64UrlToBytes(b64url) {
        const base64 = String(b64url || "").trim().replace(/=+$/, "").replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
        if (typeof atob === "function") {
            const bin = atob(padded);
            const arr = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
            return arr;
        }
        return new Uint8Array(Buffer.from(padded, "base64"));
    },

    parseKey(rawKey) {
        const clean = String(rawKey || "").trim();
        const m = clean.match(/^SYCC-(PRO|BUNDLE)-([A-Z0-9]{6,16})-([A-Za-z0-9_-]{80,92})$/);
        if (!m) return null;
        const edition = m[1];
        const serial = m[2];
        const sigBytes = this.base64UrlToBytes(m[3]);
        if (sigBytes.length !== 64) return null;
        const msgStr = `SYCC_V1|${edition}|${serial}`;
        const msgBytes = typeof TextEncoder !== "undefined"
            ? new TextEncoder().encode(msgStr)
            : new Uint8Array(Buffer.from(msgStr, "utf8"));
        return { edition, serial, sigBytes, msgBytes, raw: clean };
    },

    async verify(rawKey, forceChannel = "") {
        const parsed = this.parseKey(rawKey);
        if (!parsed) return { valid: false, reason: "格式无效，应以 SYCC-PRO- 或 SYCC-BUNDLE- 开头" };

        // 通道 1: Electron / Node 内置 crypto
        if (!forceChannel || forceChannel === "node") {
            try {
                const nodeCrypto = (typeof window !== "undefined" && window.require)
                    ? window.require("crypto")
                    : (typeof require === "function" ? require("crypto") : null);
                if (nodeCrypto && typeof nodeCrypto.verify === "function") {
                    const ok = nodeCrypto.verify(
                        null,
                        Buffer.from(parsed.msgBytes),
                        ED25519_PUBLIC_KEY_PEM,
                        Buffer.from(parsed.sigBytes)
                    );
                    return ok
                        ? { valid: true, edition: parsed.edition, serial: parsed.serial, channel: "node" }
                        : { valid: false, reason: "签名不匹配，请检查激活码是否完整" };
                }
            } catch (_) {
                if (forceChannel === "node") return { valid: false, reason: "Node crypto unavailable" };
            }
        }

        // 通道 2: 标准浏览器 WebCrypto Ed25519
        if (!forceChannel || forceChannel === "webcrypto") {
            try {
                const subtle = globalThis.crypto?.subtle;
                if (subtle) {
                    const spkiBytes = this.base64UrlToBytes(ED25519_PUBLIC_KEY_SPKI_B64);
                    const pubKey = await subtle.importKey("spki", spkiBytes, { name: "Ed25519" }, false, ["verify"]);
                    const ok = await subtle.verify("Ed25519", pubKey, parsed.sigBytes, parsed.msgBytes);
                    return ok
                        ? { valid: true, edition: parsed.edition, serial: parsed.serial, channel: "webcrypto" }
                        : { valid: false, reason: "签名校验未通过" };
                }
            } catch (_) {
                if (forceChannel === "webcrypto") return { valid: false, reason: "WebCrypto Ed25519 unavailable" };
            }
        }

        // 通道 3: 纯前端零依赖 RFC 8032 Ed25519 数学验签（兼容局域网 HTTP Docker 思源）
        try {
            const ok = PureEd25519.verify(parsed.msgBytes, parsed.sigBytes, ED25519_PUBLIC_KEY_RAW_HEX);
            return ok
                ? { valid: true, edition: parsed.edition, serial: parsed.serial, channel: "purejs" }
                : { valid: false, reason: "离线数学验签未通过，激活码无效" };
        } catch (err) {
            return { valid: false, reason: err.message };
        }
    },
};

// ==================== 纯前端零依赖 PKZIP 打包器（UTF-8 文件名 + CRC32） ====================
const ZipBuilder = (() => {
    const crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
            c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
        }
        crcTable[n] = c >>> 0;
    }

    function crc32(bytes) {
        let crc = 0xffffffff;
        for (let i = 0; i < bytes.length; i++) {
            crc = crcTable[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
        }
        return (crc ^ 0xffffffff) >>> 0;
    }

    function buildZip(files) {
        // files: Array<{ name: string, data: Uint8Array }>
        const encoder = new TextEncoder();
        const localParts = [];
        const centralParts = [];
        let offset = 0;

        const now = new Date();
        const dosTime = ((now.getHours() & 0x1f) << 11) | ((now.getMinutes() & 0x3f) << 5) | ((now.getSeconds() >> 1) & 0x1f);
        const dosDate = (((now.getFullYear() - 1980) & 0x7f) << 9) | (((now.getMonth() + 1) & 0x0f) << 5) | (now.getDate() & 0x1f);

        for (const file of files) {
            const nameBytes = encoder.encode(file.name);
            const data = file.data instanceof Uint8Array ? file.data : new Uint8Array(file.data);
            const crc = crc32(data);

            const localHeader = new Uint8Array(30 + nameBytes.length);
            const lv = new DataView(localHeader.buffer);
            lv.setUint32(0, 0x04034b50, true);
            lv.setUint16(4, 20, true);
            lv.setUint16(6, 0x0800, true); // UTF-8 filename flag
            lv.setUint16(8, 0, true);      // STORE (PNGs are already compressed)
            lv.setUint16(10, dosTime, true);
            lv.setUint16(12, dosDate, true);
            lv.setUint32(14, crc, true);
            lv.setUint32(18, data.length, true);
            lv.setUint32(22, data.length, true);
            lv.setUint16(26, nameBytes.length, true);
            lv.setUint16(28, 0, true);
            localHeader.set(nameBytes, 30);

            const centralHeader = new Uint8Array(46 + nameBytes.length);
            const cv = new DataView(centralHeader.buffer);
            cv.setUint32(0, 0x02014b50, true);
            cv.setUint16(4, 20, true);
            cv.setUint16(6, 20, true);
            cv.setUint16(8, 0x0800, true);
            cv.setUint16(10, 0, true);
            cv.setUint16(12, dosTime, true);
            cv.setUint16(14, dosDate, true);
            cv.setUint32(16, crc, true);
            cv.setUint32(20, data.length, true);
            cv.setUint32(24, data.length, true);
            cv.setUint16(28, nameBytes.length, true);
            cv.setUint16(30, 0, true);
            cv.setUint16(32, 0, true);
            cv.setUint16(34, 0, true);
            cv.setUint16(36, 0, true);
            cv.setUint32(38, 0, true);
            cv.setUint32(42, offset, true);
            centralHeader.set(nameBytes, 46);

            localParts.push(localHeader, data);
            centralParts.push(centralHeader);
            offset += localHeader.length + data.length;
        }

        let centralSize = 0;
        for (const cp of centralParts) centralSize += cp.length;

        const eocd = new Uint8Array(22);
        const ev = new DataView(eocd.buffer);
        ev.setUint32(0, 0x06054b50, true);
        ev.setUint16(4, 0, true);
        ev.setUint16(6, 0, true);
        ev.setUint16(8, files.length, true);
        ev.setUint16(10, files.length, true);
        ev.setUint32(12, centralSize, true);
        ev.setUint32(16, offset, true);
        ev.setUint16(20, 0, true);

        const total = offset + centralSize + 22;
        const out = new Uint8Array(total);
        let pos = 0;
        for (const p of localParts) { out.set(p, pos); pos += p.length; }
        for (const p of centralParts) { out.set(p, pos); pos += p.length; }
        out.set(eocd, pos);
        return out;
    }

    return { buildZip, crc32 };
})();

// ==================== Markdown AST 解析与长文智能分页引擎 ====================
function escapeHtml(str) {
    return String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function cleanKramdownIAL(md) {
    return String(md || "")
        .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "")
        .replace(/\{:\s*[^}\n]+\}/g, "")
        .replace(/\r\n/g, "\n")
        .trim();
}

const SmartPaginationEngine = {
    parseMarkdownBlocks(rawMd, fallbackTitle = "") {
        const cleaned = cleanKramdownIAL(rawMd);
        const lines = cleaned.split("\n");
        const blocks = [];
        let docTitle = fallbackTitle || "";
        let i = 0;

        while (i < lines.length) {
            const line = lines[i];
            const trimmed = line.trim();

            if (!trimmed) {
                i++;
                continue;
            }

            // Code block
            if (trimmed.startsWith("```")) {
                const lang = trimmed.slice(3).trim() || "code";
                const codeLines = [];
                i++;
                while (i < lines.length && !lines[i].trim().startsWith("```")) {
                    codeLines.push(lines[i]);
                    i++;
                }
                i++; // skip closing ```
                blocks.push({ type: "code", lang, text: codeLines.join("\n") });
                continue;
            }

            // Headings
            const hMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
            if (hMatch) {
                const level = hMatch[1].length;
                const text = hMatch[2].trim();
                if (level === 1 && !docTitle) {
                    docTitle = text;
                    blocks.push({ type: "h1", text });
                } else if (level <= 2) {
                    blocks.push({ type: "h2", text });
                } else {
                    blocks.push({ type: "h3", text });
                }
                i++;
                continue;
            }

            // Horizontal rule
            if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
                blocks.push({ type: "hr" });
                i++;
                continue;
            }

            // Standalone image
            const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)$/);
            if (imgMatch) {
                blocks.push({ type: "image", alt: imgMatch[1] || "", src: imgMatch[2] });
                i++;
                continue;
            }

            // Blockquote
            if (trimmed.startsWith(">")) {
                const qLines = [];
                while (i < lines.length && lines[i].trim().startsWith(">")) {
                    qLines.push(lines[i].trim().replace(/^>\s?/, ""));
                    i++;
                }
                blocks.push({ type: "quote", text: qLines.join("\n") });
                continue;
            }

            // Markdown table
            if (trimmed.includes("|") && i + 1 < lines.length && /^\s*\|?[\s:-]+\|[\s|:-]*$/.test(lines[i + 1])) {
                const parseRow = (r) => r.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
                const headers = parseRow(lines[i]);
                i += 2; // skip separator
                const rows = [];
                while (i < lines.length && lines[i].trim().includes("|")) {
                    rows.push(parseRow(lines[i]));
                    i++;
                }
                blocks.push({ type: "table", headers, rows });
                continue;
            }

            // Lists (ul / ol)
            if (/^([-*+]|\d+\.)\s+/.test(trimmed)) {
                const ordered = /^\d+\.\s+/.test(trimmed);
                const items = [];
                while (i < lines.length && /^\s*([-*+]|\d+\.)\s+/.test(lines[i])) {
                    items.push(lines[i].trim().replace(/^([-*+]|\d+\.)\s+/, ""));
                    i++;
                }
                blocks.push({ type: ordered ? "ol" : "ul", items });
                continue;
            }

            // Normal paragraph
            const pLines = [];
            while (
                i < lines.length &&
                lines[i].trim() &&
                !lines[i].trim().startsWith("#") &&
                !lines[i].trim().startsWith("```") &&
                !lines[i].trim().startsWith(">") &&
                !/^([-*+]|\d+\.)\s+/.test(lines[i].trim()) &&
                !/^!\[([^\]]*)\]\(([^)]+)\)$/.test(lines[i].trim())
            ) {
                pLines.push(lines[i].trim());
                i++;
            }
            const pText = pLines.join(" ");
            if (pText) {
                blocks.push({ type: "p", text: pText });
            } else {
                i++;
            }
        }

        if (!docTitle) {
            const firstH2 = blocks.find((b) => b.type === "h2");
            const firstP = blocks.find((b) => b.type === "p" || b.type === "quote");
            docTitle = firstH2?.text || (firstP ? firstP.text.slice(0, 26) : "思源映卡 · 灵感笔记");
        }

        return { title: docTitle, blocks };
    },

    estimateBlockHeight(block, fontSize = 15) {
        const scale = fontSize / 15;
        const charsPerLine = Math.max(16, Math.floor(24 / scale));
        switch (block.type) {
            case "h2":
                return Math.ceil((block.text.length || 1) / 16) * 30 * scale + 18;
            case "h3":
                return Math.ceil((block.text.length || 1) / 20) * 25 * scale + 12;
            case "p":
                return Math.ceil((block.text.length || 1) / charsPerLine) * 26 * scale + 12;
            case "quote":
                return Math.ceil((block.text.length || 1) / (charsPerLine - 2)) * 26 * scale + 30;
            case "ul":
            case "ol":
                return block.items.reduce(
                    (sum, it) => sum + Math.ceil((it.length || 1) / (charsPerLine - 2)) * 25 * scale + 8,
                    10
                );
            case "code": {
                const lineCount = Math.min(14, block.text.split("\n").length);
                return lineCount * 20 + 48;
            }
            case "table":
                return (block.rows.length + 1) * 30 + 16;
            case "image":
                return 205;
            case "hr":
                return 18;
            default:
                return 36;
        }
    },

    splitOversizedBlock(block, maxUnits, fontSize) {
        if (this.estimateBlockHeight(block, fontSize) <= maxUnits) {
            return [block];
        }
        if (block.type === "ul" || block.type === "ol") {
            const chunks = [];
            let cur = [];
            for (const item of block.items) {
                const candidate = { type: block.type, items: [...cur, item] };
                if (cur.length > 0 && this.estimateBlockHeight(candidate, fontSize) > maxUnits) {
                    chunks.push({ type: block.type, items: cur });
                    cur = [item];
                } else {
                    cur.push(item);
                }
            }
            if (cur.length) chunks.push({ type: block.type, items: cur });
            return chunks;
        }
        if (block.type === "p" || block.type === "quote") {
            const sentences = block.text.split(/(?<=[。！？；.!?\n])/);
            const chunks = [];
            let buf = "";
            for (const s of sentences) {
                const next = buf + s;
                const cand = { type: block.type, text: next };
                if (buf && this.estimateBlockHeight(cand, fontSize) > maxUnits) {
                    chunks.push({ type: block.type, text: buf.trim() });
                    buf = s;
                } else {
                    buf = next;
                }
            }
            if (buf.trim()) chunks.push({ type: block.type, text: buf.trim() });
            return chunks.length ? chunks : [block];
        }
        return [block];
    },

    paginate(rawMd, options = {}) {
        const {
            fallbackTitle = "",
            ratioId = "xhs_3_4",
            fontSize = 15,
            padding = 34,
            multiCard = true,
            kicker = "",
        } = options;

        const ratio = ASPECT_RATIOS[ratioId] || ASPECT_RATIOS.xhs_3_4;
        const parsed = this.parseMarkdownBlocks(rawMd, fallbackTitle);
        const nonH1Blocks = parsed.blocks.filter((b) => b.type !== "h1");

        // Cover-only mode (2.35:1 WeChat header & 16:9 article cover)
        if (ratio.isCoverOnly) {
            const firstLead = nonH1Blocks.find((b) => b.type === "p" || b.type === "quote");
            return [
                {
                    kind: "banner-cover",
                    index: 1,
                    total: 1,
                    title: parsed.title,
                    lead: firstLead ? firstLead.text.slice(0, 72) : "",
                    kicker: kicker || "深度剖析 · 思源映卡",
                    blocks: [],
                },
            ];
        }

        // Single auto-height card (Moments / Jike long card) or user toggled off multiCard
        if (!ratio.paginated || !multiCard) {
            return [
                {
                    kind: "long-single",
                    index: 1,
                    total: 1,
                    title: parsed.title,
                    kicker: kicker || "灵感摘录",
                    blocks: nonH1Blocks.length ? nonH1Blocks : [{ type: "p", text: parsed.title }],
                },
            ];
        }

        // Paginated Suite (3:4 Xiaohongshu or 4:5 Classic Poster)
        // If content is very short (e.g., single quote or <= 2 short blocks without H2), keep as 1 crisp card!
        const hasH2 = nonH1Blocks.some((b) => b.type === "h2");
        const totalEst = nonH1Blocks.reduce((s, b) => s + this.estimateBlockHeight(b, fontSize), 0);
        const bodyBudget = Math.max(260, (ratio.baseH || 720) - padding * 2 - 145);

        if (!hasH2 && totalEst <= bodyBudget * 0.85 && nonH1Blocks.length <= 3) {
            return [
                {
                    kind: "body",
                    index: 1,
                    total: 1,
                    title: parsed.title,
                    showHeroTitle: true,
                    kicker: kicker || "灵感卡片",
                    blocks: nonH1Blocks,
                },
            ];
        }

        // Extract lead intro paragraph/quote before first H2 for 01 Hero Cover Card
        let bodyStartIdx = 0;
        let coverLead = "";
        if (nonH1Blocks.length > 0 && (nonH1Blocks[0].type === "p" || nonH1Blocks[0].type === "quote")) {
            if (nonH1Blocks[0].text.length <= 130 || hasH2) {
                coverLead = nonH1Blocks[0].text.slice(0, 120);
                if (nonH1Blocks.length > 1) {
                    bodyStartIdx = 1;
                }
            }
        }
        if (!coverLead) {
            const h2Titles = nonH1Blocks.filter((b) => b.type === "h2").slice(0, 4).map((b) => `· ${b.text}`);
            coverLead = h2Titles.length ? h2Titles.join("\n") : "滑动查看完整核心干货拆解 →";
        }

        const cards = [
            {
                kind: "hero-cover",
                title: parsed.title,
                lead: coverLead,
                kicker: kicker || "干货精粹 · 建议收藏",
                blocks: [],
            },
        ];

        const remaining = [];
        for (let i = bodyStartIdx; i < nonH1Blocks.length; i++) {
            remaining.push(...this.splitOversizedBlock(nonH1Blocks[i], bodyBudget - 20, fontSize));
        }

        let currentBlocks = [];
        let currentHeight = 0;

        for (const blk of remaining) {
            const h = this.estimateBlockHeight(blk, fontSize);
            const forceNewForH2 = blk.type === "h2" && currentBlocks.length > 0 && currentHeight > bodyBudget * 0.32;

            if ((currentBlocks.length > 0 && currentHeight + h > bodyBudget) || forceNewForH2) {
                cards.push({
                    kind: "body",
                    title: parsed.title,
                    kicker: kicker || parsed.title.slice(0, 14),
                    blocks: currentBlocks,
                });
                currentBlocks = [blk];
                currentHeight = h;
            } else {
                currentBlocks.push(blk);
                currentHeight += h;
            }
        }

        if (currentBlocks.length > 0) {
            cards.push({
                kind: "body",
                title: parsed.title,
                kicker: kicker || parsed.title.slice(0, 14),
                blocks: currentBlocks,
            });
        }

        const total = cards.length;
        cards.forEach((c, idx) => {
            c.index = idx + 1;
            c.total = total;
        });

        return cards;
    },
};

// ==================== 卡片视觉 HTML 渲染器 ====================
const CardRenderer = {
    formatInline(text, theme, assetMap = {}) {
        let html = escapeHtml(text);
        // Inline images ![alt](src)
        html = html.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, src) => {
            const resolved = assetMap[src] || src;
            return `<img src="${escapeHtml(resolved)}" alt="${escapeHtml(alt)}" style="max-width:100%;max-height:180px;border-radius:6px;vertical-align:middle;" />`;
        });
        // Highlight ==text==
        html = html.replace(/==(.+?)==/g, `<span style="background:${theme.highlightBg};padding:0 3px;border-radius:3px;font-weight:600;">$1</span>`);
        // Bold **text**
        html = html.replace(/\*\*(.+?)\*\*/g, `<strong style="color:${theme.titleColor};font-weight:750;background:${theme.highlightBg};padding:0 2px;">$1</strong>`);
        // Italic *text*
        html = html.replace(/(^|[^*])\*([^*]+)\*/g, `$1<em>$2</em>`);
        // Inline code `code`
        html = html.replace(/`([^`]+)`/g, `<code class="sycc-inline-code" style="background:${theme.accentSoft};color:${theme.accentColor};">$1</code>`);
        // Markdown links [label](url)
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<span style="color:${theme.accentColor};text-decoration:underline;text-underline-offset:3px;">$1</span>`);
        return html;
    },

    renderOrnamentTop(card, theme) {
        const pageStr = card.total > 1
            ? `${String(card.index).padStart(2, "0")} / ${String(card.total).padStart(2, "0")}`
            : "CARDCRAFT";

        if (theme.ornament === "mac-traffic") {
            return `
            <div class="sycc-sheet-top">
                <div class="sycc-mac-dots">
                    <span class="sycc-mac-dot" style="background:#FF5F56;"></span>
                    <span class="sycc-mac-dot" style="background:#FFBD2E;"></span>
                    <span class="sycc-mac-dot" style="background:#27C93F;"></span>
                    <span style="font-size:11px;color:${theme.mutedColor};margin-left:6px;font-family:monospace;">~/siyuan/notes.md</span>
                </div>
                <span class="sycc-page-num" style="color:${theme.accentColor};">${pageStr}</span>
            </div>`;
        }

        if (theme.ornament === "notes-amber") {
            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, " · ");
            return `
            <div style="margin:-8px -8px 12px -8px;padding:0 8px 10px;border-bottom:1px solid rgba(217,119,6,0.18);display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:11px;font-weight:700;color:#D97706;">● 备忘录 · ${dateStr}</span>
                <span class="sycc-page-num" style="color:${theme.mutedColor};">${pageStr}</span>
            </div>`;
        }

        if (theme.ornament === "newyorker-rule") {
            return `
            <div style="margin-bottom:14px;">
                <div style="border-top:3px solid #111111;border-bottom:1px solid #111111;height:6px;margin-bottom:8px;"></div>
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-size:10.5px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:${theme.accentColor};">${escapeHtml(card.kicker || "THE EDITORIAL")}</span>
                    <span class="sycc-page-num" style="color:${theme.mutedColor};">${pageStr}</span>
                </div>
            </div>`;
        }

        if (theme.ornament === "oriental-seal") {
            return `
            <div class="sycc-sheet-top">
                <span style="display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:700;color:${theme.accentColor};letter-spacing:0.12em;">
                    <span style="display:inline-block;padding:2px 6px;border:1.2px solid ${theme.accentColor};border-radius:3px;font-size:10px;">雅集</span>
                    ${escapeHtml(card.kicker || "东方书摘")}
                </span>
                <span class="sycc-page-num" style="color:${theme.mutedColor};">${pageStr}</span>
            </div>`;
        }

        if (theme.ornament === "mckinsey-bar") {
            return `
            <div style="margin-bottom:14px;padding-bottom:9px;border-bottom:2px solid #0A192F;display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:11px;font-weight:800;letter-spacing:0.08em;color:#0A192F;border-left:3.5px solid #C69749;padding-left:8px;">INSIGHT BRIEF · ${escapeHtml(card.kicker || "深度洞察")}</span>
                <span class="sycc-page-num" style="color:#C69749;font-weight:800;">${pageStr}</span>
            </div>`;
        }

        if (theme.ornament === "film-code") {
            return `
            <div class="sycc-sheet-top">
                <span style="font-family:monospace;font-size:10.5px;letter-spacing:0.14em;color:${theme.accentColor};">◀ PORTRA 400 · FRAME ${String(card.index).padStart(2, "0")}A</span>
                <span class="sycc-page-num" style="color:${theme.mutedColor};">${pageStr}</span>
            </div>`;
        }

        return `
        <div class="sycc-sheet-top">
            <span class="sycc-kicker" style="background:${theme.accentSoft};color:${theme.accentColor};">
                ✦ ${escapeHtml(card.kicker || "精选笔记")}
            </span>
            <span class="sycc-page-num" style="color:${theme.mutedColor};">${pageStr}</span>
        </div>`;
    },

    renderBlock(b, theme, fontSize, assetMap) {
        switch (b.type) {
            case "h2":
                return `<h2 class="sycc-md-h2" style="color:${theme.titleColor};font-size:${Math.round(fontSize * 1.28)}px;">
                    <span class="sycc-md-h2-bar" style="background:${theme.accentColor};"></span>
                    <span>${this.formatInline(b.text, theme, assetMap)}</span>
                </h2>`;
            case "h3":
                return `<h3 class="sycc-md-h3" style="color:${theme.titleColor};font-size:${Math.round(fontSize * 1.1)}px;">${this.formatInline(b.text, theme, assetMap)}</h3>`;
            case "p":
                return `<p class="sycc-md-p" style="color:${theme.textColor};font-size:${fontSize}px;">${this.formatInline(b.text, theme, assetMap)}</p>`;
            case "quote":
                return `<blockquote class="sycc-md-quote" style="background:${theme.quoteBg};border-left-color:${theme.quoteBorder};color:${theme.textColor};font-size:${Math.max(13, fontSize - 0.5)}px;">
                    ${b.text.split("\n").map((l) => this.formatInline(l, theme, assetMap)).join("<br/>")}
                </blockquote>`;
            case "ul":
            case "ol": {
                const tag = b.type;
                const lis = b.items
                    .map((it) => `<li style="color:${theme.textColor};font-size:${fontSize}px;">${this.formatInline(it, theme, assetMap)}</li>`)
                    .join("");
                return `<${tag} class="sycc-md-list">${lis}</${tag}>`;
            }
            case "code": {
                const clipped = b.text.split("\n").slice(0, 14).join("\n");
                return `<div class="sycc-md-codewrap" style="background:${theme.codeBg};">
                    <div class="sycc-md-codehead">
                        <span class="sycc-mac-dots">
                            <span class="sycc-mac-dot" style="background:#FF5F56;"></span>
                            <span class="sycc-mac-dot" style="background:#FFBD2E;"></span>
                            <span class="sycc-mac-dot" style="background:#27C93F;"></span>
                        </span>
                        <span style="font-size:10px;color:rgba(255,255,255,0.55);font-family:monospace;text-transform:uppercase;">${escapeHtml(b.lang)}</span>
                    </div>
                    <pre class="sycc-md-pre" style="color:${theme.codeText};">${escapeHtml(clipped)}</pre>
                </div>`;
            }
            case "table": {
                const ths = b.headers.map((h) => `<th style="background:${theme.accentSoft};color:${theme.titleColor};">${this.formatInline(h, theme, assetMap)}</th>`).join("");
                const trs = b.rows
                    .slice(0, 8)
                    .map((r) => `<tr>${r.map((c) => `<td style="color:${theme.textColor};">${this.formatInline(c, theme, assetMap)}</td>`).join("")}</tr>`)
                    .join("");
                return `<table class="sycc-md-table"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
            }
            case "image": {
                const src = assetMap[b.src] || b.src;
                if (!src || (!src.startsWith("data:") && !src.startsWith("http"))) {
                    return "";
                }
                return `<div class="sycc-md-img-wrap"><img class="sycc-md-img" src="${escapeHtml(src)}" alt="${escapeHtml(b.alt)}" /></div>`;
            }
            case "hr":
                return `<div style="height:1px;background:rgba(148,163,184,0.22);margin:4px 0;"></div>`;
            default:
                return "";
        }
    },

    renderFooter(theme, isPro, brandConfig = {}) {
        if (!isPro) {
            return `
            <div class="sycc-sheet-footer">
                <span style="font-size:10.5px;color:${theme.mutedColor};opacity:0.75;">✦ 知识卡片</span>
                <span class="sycc-watermark-free" style="color:${theme.mutedColor};">由 思源映卡 渲染</span>
            </div>`;
        }
        if (brandConfig.enabled === false) {
            return "";
        }
        const author = brandConfig.author || "思源创作者";
        const slogan = brandConfig.slogan || "持续记录与沉淀长期价值";
        const avatarHtml = brandConfig.avatarDataUrl
            ? `<img class="sycc-brand-avatar" src="${escapeHtml(brandConfig.avatarDataUrl)}" alt="avatar" />`
            : `<div class="sycc-brand-avatar" style="background:${theme.accentSoft};color:${theme.accentColor};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;">${escapeHtml(author.slice(0, 1))}</div>`;
        const qrHtml = brandConfig.qrDataUrl
            ? `<img class="sycc-brand-qr" src="${escapeHtml(brandConfig.qrDataUrl)}" alt="qr" />`
            : "";

        return `
        <div class="sycc-sheet-footer">
            <div class="sycc-brand-left">
                ${avatarHtml}
                <div class="sycc-brand-meta">
                    <span class="sycc-brand-author" style="color:${theme.titleColor};">${escapeHtml(author)}</span>
                    <span class="sycc-brand-slogan" style="color:${theme.mutedColor};">${escapeHtml(slogan)}</span>
                </div>
            </div>
            ${qrHtml}
        </div>`;
    },

    renderCardHTML(card, options = {}) {
        const {
            theme = THEME_REGISTRY[0],
            ratioId = "xhs_3_4",
            coverSubMode = "2.35:1",
            fontSize = 15,
            padding = 32,
            isPro = false,
            brand = {},
            assetMap = {},
        } = options;

        const ratio = ASPECT_RATIOS[ratioId] || ASPECT_RATIOS.xhs_3_4;
        let width = ratio.baseW;
        let height = ratio.baseH;
        if (ratioId === "cover_banner" && coverSubMode === "16:9") {
            width = 640;
            height = 360;
        }

        const sizeStyle = height
            ? `width:${width}px;height:${height}px;`
            : `width:${width}px;min-height:420px;height:auto;`;

        // Banner Cover Layout (2.35:1 WeChat Header & 16:9 Bilibili/Column Cover)
        if (card.kind === "banner-cover") {
            const is169 = coverSubMode === "16:9";
            const titleSize = is169 ? 34 : 25;
            const pad = is169 ? "30px 42px" : "20px 32px";
            return `
            <div class="sycc-render-canvas" data-base-w="${width}" data-base-h="${height}" style="${sizeStyle}background:${theme.outerBg};padding:${is169 ? 22 : 14}px;font-family:${theme.fontFamily};">
                <div class="sycc-inner-sheet" style="background:${theme.cardBg};border:${theme.cardBorder};border-radius:${theme.cardRadius};box-shadow:${theme.cardShadow};padding:${pad};justify-content:center;gap:${is169 ? 14 : 8}px;">
                    <div>
                        <span class="sycc-kicker" style="background:${theme.accentSoft};color:${theme.accentColor};font-size:${is169 ? 12 : 10.5}px;">
                            【 ${escapeHtml(card.kicker || "深度剖析 · 实战指南")} 】
                        </span>
                    </div>
                    <h1 style="margin:0;color:${theme.titleColor};font-size:${titleSize}px;font-weight:850;line-height:1.28;letter-spacing:-0.02em;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
                        ${escapeHtml(card.title)}
                    </h1>
                    ${is169 && card.lead ? `<p style="margin:0;color:${theme.mutedColor};font-size:14px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${escapeHtml(card.lead)}</p>` : ""}
                </div>
            </div>`;
        }

        // 01 Hero Cover Card for Multi-Card Suite
        if (card.kind === "hero-cover") {
            const leadLines = String(card.lead || "")
                .split("\n")
                .map((l) => escapeHtml(l))
                .join("<br/>");
            return `
            <div class="sycc-render-canvas" data-base-w="${width}" data-base-h="${height}" style="${sizeStyle}background:${theme.outerBg};padding:22px;font-family:${theme.fontFamily};">
                <div class="sycc-inner-sheet" style="background:${theme.cardBg};border:${theme.cardBorder};border-radius:${theme.cardRadius};box-shadow:${theme.cardShadow};padding:${padding}px;">
                    ${this.renderOrnamentTop(card, theme)}
                    <div class="sycc-cover-center">
                        <div class="sycc-cover-divider" style="background:${theme.accentColor};"></div>
                        <h1 class="sycc-cover-h1" style="color:${theme.titleColor};">${escapeHtml(card.title)}</h1>
                        <p class="sycc-cover-lead" style="color:${theme.mutedColor};">${leadLines}</p>
                    </div>
                    <div style="margin-top:auto;">
                        <div style="display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:${theme.accentColor};margin-bottom:4px;">
                            <span>左滑解锁 ${Math.max(1, card.total - 1)} 张核心图谱</span>
                            <span>→</span>
                        </div>
                        ${this.renderFooter(theme, isPro, brand)}
                    </div>
                </div>
            </div>`;
        }

        // Standard Body Card or Single Long Card
        const heroHeading = (card.kind === "long-single" || card.showHeroTitle)
            ? `<h1 style="margin:0 0 10px 0;color:${theme.titleColor};font-size:${Math.round(fontSize * 1.62)}px;font-weight:850;line-height:1.32;letter-spacing:-0.015em;">${escapeHtml(card.title)}</h1>`
            : "";

        const bodyHtml = card.blocks.map((b) => this.renderBlock(b, theme, fontSize, assetMap)).join("\n");

        return `
        <div class="sycc-render-canvas" data-base-w="${width}" ${height ? `data-base-h="${height}"` : ""} style="${sizeStyle}background:${theme.outerBg};padding:22px;font-family:${theme.fontFamily};">
            <div class="sycc-inner-sheet" style="background:${theme.cardBg};border:${theme.cardBorder};border-radius:${theme.cardRadius};box-shadow:${theme.cardShadow};padding:${padding}px;">
                <div>
                    ${this.renderOrnamentTop(card, theme)}
                    ${heroHeading}
                    <div class="sycc-body-flow">
                        ${bodyHtml}
                    </div>
                </div>
                ${this.renderFooter(theme, isPro, brand)}
            </div>
        </div>`;
    },
};

// ==================== 微信公众号 100% 兼容内联样式富文本生成器 ====================
const WeChatFormatter = {
    toInlineHTML(rawMd, fallbackTitle = "", theme = THEME_REGISTRY[0], assetMap = {}) {
        const parsed = SmartPaginationEngine.parseMarkdownBlocks(rawMd, fallbackTitle);
        const accent = theme.accentColor || "#2563EB";
        const textCol = "#262626";
        const quoteBg = "#F7F9FC";

        const formatSpan = (txt) => {
            let s = escapeHtml(txt);
            s = s.replace(/==(.+?)==/g, `<span style="background:rgba(250,204,21,0.35);padding:1px 4px;border-radius:3px;">$1</span>`);
            s = s.replace(/\*\*(.+?)\*\*/g, `<strong style="color:${accent};font-weight:700;">$1</strong>`);
            s = s.replace(/`([^`]+)`/g, `<code style="background:#F1F5F9;color:#E11D48;padding:2px 5px;border-radius:4px;font-size:14px;font-family:Menlo,Consolas,monospace;">$1</code>`);
            s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<span style="color:${accent};border-bottom:1px solid ${accent};">$1</span>`);
            return s;
        };

        const parts = [];
        parts.push(`<section style="font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif;font-size:15.5px;line-height:1.85;color:${textCol};letter-spacing:0.02em;padding:6px 2px;">`);
        parts.push(`<h1 style="font-size:22px;font-weight:800;color:#111827;line-height:1.4;margin:0 0 20px 0;padding-bottom:12px;border-bottom:2px solid ${accent};">${escapeHtml(parsed.title)}</h1>`);

        for (const b of parsed.blocks) {
            if (b.type === "h1") continue;
            if (b.type === "h2") {
                parts.push(`<h2 style="margin:28px 0 14px;font-size:18px;font-weight:700;color:#111827;display:flex;align-items:center;"><span style="display:inline-block;width:4px;height:18px;background:${accent};border-radius:2px;margin-right:10px;"></span><span>${formatSpan(b.text)}</span></h2>`);
            } else if (b.type === "h3") {
                parts.push(`<h3 style="margin:20px 0 10px;font-size:16px;font-weight:700;color:${accent};">${formatSpan(b.text)}</h3>`);
            } else if (b.type === "p") {
                parts.push(`<p style="margin:0 0 16px 0;line-height:1.85;color:${textCol};">${formatSpan(b.text)}</p>`);
            } else if (b.type === "quote") {
                parts.push(`<blockquote style="margin:18px 0;padding:14px 16px;background:${quoteBg};border-left:4px solid ${accent};border-radius:0 8px 8px 0;color:#475569;font-size:14.5px;line-height:1.75;">${b.text.split("\n").map(formatSpan).join("<br/>")}</blockquote>`);
            } else if (b.type === "ul" || b.type === "ol") {
                const tag = b.type;
                const items = b.items.map((it) => `<li style="margin:6px 0;line-height:1.8;color:${textCol};">${formatSpan(it)}</li>`).join("");
                parts.push(`<${tag} style="margin:0 0 16px 0;padding-left:22px;">${items}</${tag}>`);
            } else if (b.type === "code") {
                parts.push(`<section style="margin:18px 0;background:#0F172A;border-radius:10px;overflow:hidden;"><section style="padding:8px 14px;background:#1E293B;display:flex;align-items:center;"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#FF5F56;margin-right:6px;"></span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#FFBD2E;margin-right:6px;"></span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#27C93F;margin-right:10px;"></span><span style="font-size:11px;color:#94A3B8;font-family:monospace;">${escapeHtml(b.lang)}</span></section><pre style="margin:0;padding:14px 16px;color:#E2E8F0;font-family:Menlo,Consolas,monospace;font-size:13px;line-height:1.6;overflow-x:auto;white-space:pre;">${escapeHtml(b.text)}</pre></section>`);
            } else if (b.type === "table") {
                const ths = b.headers.map((h) => `<th style="padding:8px 10px;border:1px solid #CBD5E1;background:#F1F5F9;font-weight:700;font-size:13.5px;text-align:left;">${formatSpan(h)}</th>`).join("");
                const trs = b.rows.map((r) => `<tr>${r.map((c) => `<td style="padding:8px 10px;border:1px solid #CBD5E1;font-size:13.5px;">${formatSpan(c)}</td>`).join("")}</tr>`).join("");
                parts.push(`<table style="width:100%;border-collapse:collapse;margin:16px 0;"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`);
            } else if (b.type === "image") {
                const src = assetMap[b.src] || b.src;
                if (src && (src.startsWith("data:") || src.startsWith("http"))) {
                    parts.push(`<p style="margin:16px 0;text-align:center;"><img src="${escapeHtml(src)}" alt="${escapeHtml(b.alt)}" style="max-width:100%;border-radius:8px;" /></p>`);
                }
            }
        }

        parts.push(`</section>`);
        return parts.join("\n");
    },
};

// ==================== 插件主类 ====================
class CardCraftPlugin extends Plugin {
    async onload() {
        this.config = Object.assign(
            {
                themeId: "pure-ceramic",
                ratioId: "xhs_3_4",
                coverSubMode: "2.35:1",
                exportScale: 2,
                fontSize: 15,
                padding: 32,
                multiCard: true,
                customKicker: "",
                // Pro License
                licenseKey: "",
                licenseEdition: "", // "" | "PRO" | "BUNDLE"
                licenseSerial: "",
                // Free AI Trial Counter (3 free trials)
                freeAiUsedCount: 0,
                // AI Config
                aiProvider: "siyuan_inherit",
                aiBaseUrl: "",
                aiApiKey: "",
                aiModel: "",
                // Personal IP Brand Dock (Pro)
                brand: {
                    enabled: true,
                    author: "",
                    slogan: "",
                    avatarDataUrl: "",
                    qrDataUrl: "",
                },
            },
            (await this.loadData(CONFIG_STORAGE)) || {}
        );

        // Re-verify persisted license silently on startup
        if (this.config.licenseKey) {
            const check = await LicenseVerifier.verify(this.config.licenseKey);
            if (check.valid) {
                this.config.licenseEdition = check.edition;
                this.config.licenseSerial = check.serial;
            } else {
                this.config.licenseEdition = "";
                this.config.licenseSerial = "";
            }
        }

        this.lastDocId = "";
        this._activeDialogs = new Set();
        this._assetCache = {};

        // 1. 顶栏图标入口
        const iconSvg = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="14" height="18" rx="2.5"/><path d="M17 7h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9"/><path d="M7 8h6"/><path d="M7 12h6"/><path d="M7 16h4"/></svg>`;
        this.addTopBar({
            icon: iconSvg,
            title: this.i18n?.topBarTitle || "思源映卡 · 视觉制卡工作台 (⌥⇧C)",
            position: "right",
            callback: () => this.openStudioFromActiveDoc(),
        });

        // 2. 全局快捷键入口 (⌥⇧C / Alt+Shift+C)
        this.addCommand({
            langKey: "openStudioCmd",
            hotkey: "⌥⇧C",
            callback: () => this.openStudioFromActiveDoc(),
        });
        this.addCommand({
            langKey: "openAiConfigCmd",
            hotkey: "",
            callback: () => this.openAiConfigModal(),
        });
        this.addCommand({
            langKey: "openProModalCmd",
            hotkey: "",
            callback: () => this.openUpgradeModal(),
        });

        // 3. 块标右键菜单监听 ("click-blockicon") & 当前文档追踪
        this._onSwitchProtyle = (e) => {
            const docId = e?.detail?.protyle?.block?.rootID || e?.detail?.protyle?.block?.id;
            if (docId) this.lastDocId = docId;
        };
        this._onBlockIconClick = (e) => this.handleBlockIconMenu(e);

        if (this.eventBus) {
            this.eventBus.on("switch-protyle", this._onSwitchProtyle);
            this.eventBus.on("loaded-protyle-static", this._onSwitchProtyle);
            this.eventBus.on("click-blockicon", this._onBlockIconClick);
        }

        // 4. 思源插件设置面板入口
        this.initPluginSettingPanel();
    }

    onunload() {
        if (this.eventBus) {
            if (this._onSwitchProtyle) {
                this.eventBus.off("switch-protyle", this._onSwitchProtyle);
                this.eventBus.off("loaded-protyle-static", this._onSwitchProtyle);
            }
            if (this._onBlockIconClick) {
                this.eventBus.off("click-blockicon", this._onBlockIconClick);
            }
        }
        for (const dlg of this._activeDialogs) {
            try { dlg.destroy(); } catch (_) {}
        }
        this._activeDialogs.clear();
        this._assetCache = {};
    }

    isPro() {
        return this.config.licenseEdition === "PRO" || this.config.licenseEdition === "BUNDLE";
    }

    async persistConfig() {
        await this.saveData(CONFIG_STORAGE, this.config);
    }

    initPluginSettingPanel() {
        if (typeof Setting !== "function") return;
        this.setting = new Setting({ confirmCallback: () => this.persistConfig() });

        const btnStudio = document.createElement("button");
        btnStudio.className = "b3-button b3-button--outline fn__flex-center fn__size200";
        btnStudio.textContent = "🎨 打开思源映卡工作台";
        btnStudio.onclick = () => this.openStudioFromActiveDoc();
        this.setting.addItem({
            title: "视觉制卡工作台",
            description: "快捷键 ⌥⇧C / Alt+Shift+C，或点击任意笔记块左侧图标选择「🎨 转为思源映卡」",
            actionElement: btnStudio,
        });

        const btnAi = document.createElement("button");
        btnAi.className = "b3-button b3-button--outline fn__flex-center fn__size200";
        btnAi.textContent = "⚙️ 配置 AI 接口";
        btnAi.onclick = () => this.openAiConfigModal();
        this.setting.addItem({
            title: "AI 智能提纯引擎 (可选)",
            description: "默认自动继承思源内置 AI，也可单独配置 DeepSeek / 硅基流动 / 通义千问 / Ollama",
            actionElement: btnAi,
        });

        const btnPro = document.createElement("button");
        btnPro.className = "b3-button b3-button--text fn__flex-center fn__size200";
        btnPro.textContent = this.isPro() ? `💎 已激活 (${this.config.licenseEdition})` : "💎 激活 / 升级 Pro 终身版";
        btnPro.onclick = () => this.openUpgradeModal();
        this.setting.addItem({
            title: "终身专业版授权",
            description: "Ed25519 纯离线公钥验签，解锁全部 12 套杂志主题、无限分页 .zip 导出与个人 IP 品牌底座",
            actionElement: btnPro,
        });
    }

    // ==================== 思源块菜单与文档提取 + 本地 assets 转 Base64 ====================
    handleBlockIconMenu(event) {
        const detail = event?.detail;
        if (!detail || !detail.menu || !Array.isArray(detail.blockElements) || !detail.blockElements.length) {
            return;
        }
        detail.menu.addItem({
            iconHTML: `<span style="font-size:14px;margin-right:6px;">🎨</span>`,
            label: this.i18n?.blockMenuLabel || "🎨 转为思源映卡",
            click: async () => {
                const { markdown, title } = await this.extractBlocksMarkdown(detail.blockElements);
                await this.openStudio({ markdown, title, sourceLabel: `选中 ${detail.blockElements.length} 个内容块` });
            },
        });
    }

    async siyuanPost(url, body = {}) {
        const resp = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        return await resp.json();
    }

    async extractBlocksMarkdown(blockElements) {
        const parts = [];
        let docTitle = "";

        // Try reading parent document title for context
        try {
            const firstEl = blockElements[0];
            const protyleEl = firstEl?.closest?.(".protyle");
            const titleInput = protyleEl?.querySelector?.(".protyle-title__input");
            if (titleInput?.textContent?.trim()) {
                docTitle = titleInput.textContent.trim();
            }
        } catch (_) {}

        for (const el of blockElements) {
            const blockId = el?.getAttribute?.("data-node-id");
            if (!blockId) continue;
            try {
                const res = await this.siyuanPost("/api/block/getBlockKramdown", { id: blockId });
                if (res?.code === 0 && res?.data?.kramdown) {
                    parts.push(cleanKramdownIAL(res.data.kramdown));
                    continue;
                }
            } catch (_) {}
            try {
                const exp = await this.siyuanPost("/api/export/exportMdContent", { id: blockId });
                if (exp?.code === 0 && exp?.data?.content) {
                    parts.push(cleanKramdownIAL(exp.data.content));
                    continue;
                }
            } catch (_) {}
            if (el.innerText?.trim()) {
                parts.push(el.innerText.trim());
            }
        }

        return {
            markdown: parts.join("\n\n").trim() || "暂无选中文本内容",
            title: docTitle || "思源片段映卡",
        };
    }

    detectActiveDocId() {
        const selectors = [
            ".layout__wnd--active .protyle:not(.fn__none) .protyle-title",
            ".protyle:not(.fn__none) .protyle-title",
        ];
        for (const sel of selectors) {
            const el = document.querySelector(sel);
            const id = el?.getAttribute("data-node-id");
            if (id) return id;
        }
        return this.lastDocId || "";
    }

    async fetchActiveDocument() {
        const docId = this.detectActiveDocId();
        if (!docId) {
            return {
                title: "思源映卡 · 10秒把笔记变成杂志级小红书套卡",
                sourceLabel: "内置示例文档",
                markdown: `# 为什么顶尖创作者都在用「卡片化思维」做输出？\n\n真正的知识内化，从来不是把几万字长文丢在收藏夹吃灰，而是提炼出能一眼击穿痛点的高密度视觉卡片。\n\n## 01 告别排版内耗：写完笔记即出片\n- **零割裂感**：无需切换到第三方作图软件反复复制粘贴\n- **智能分页**：自动识别一级标题做封面、二级标题拆正文套卡\n- **超清防裂**：思源本地 \`assets/\` 插图自动内联 Base64 无损渲染\n\n## 02 12 套杂志级高定视觉主题\n> 好的审美不是堆砌花哨边框，而是克制的留白、恰到好处的字重对比与呼吸感。\n\n无论你是写 **AI 前沿拆解**、**人文读书笔记**，还是 **职场商业方法论**，都能一键切换匹配的刊物气质。\n\n\`\`\`javascript\n// 纯离线 Ed25519 验签 + 2x/3x 超采样光栅化\nconst suite = CardCraft.renderSuite(noteMarkdown, {\n  ratio: "3:4",\n  resolution: "1080x1440"\n});\n\`\`\``,
            };
        }

        try {
            const exp = await this.siyuanPost("/api/export/exportMdContent", { id: docId });
            if (exp?.code === 0 && exp?.data) {
                const title = (exp.data.hPath || "").split("/").filter(Boolean).pop() || "未命名笔记";
                const md = cleanKramdownIAL(exp.data.content || "");
                return {
                    title,
                    sourceLabel: `当前文档：${title}`,
                    markdown: md.startsWith("# ") ? md : `# ${title}\n\n${md}`,
                };
            }
        } catch (_) {}

        return {
            title: "未命名思源文档",
            sourceLabel: "当前文档",
            markdown: "# 未命名思源文档\n\n请在左侧编辑框输入或从思源文档打开制卡工作台。",
        };
    }

    async resolveMarkdownAssets(markdown) {
        const regex = /!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
        const urls = new Set();
        let m;
        while ((m = regex.exec(markdown)) !== null) {
            const rawSrc = m[1];
            if (rawSrc && !rawSrc.startsWith("data:")) {
                urls.add(rawSrc);
            }
        }

        for (const src of urls) {
            if (this._assetCache[src]) continue;
            try {
                let fetchUrl = src;
                if (src.startsWith("assets/")) {
                    fetchUrl = "/" + src;
                }
                const resp = await fetch(fetchUrl);
                if (!resp.ok && src.includes("assets/")) {
                    // Fallback to SiYuan kernel /api/file/getFile
                    const cleanAsset = src.slice(src.indexOf("assets/"));
                    const kResp = await fetch("/api/file/getFile", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ path: `/data/${cleanAsset}` }),
                    });
                    if (kResp.ok) {
                        const blob = await kResp.blob();
                        this._assetCache[src] = await this.blobToCompressedDataUrl(blob);
                    }
                    continue;
                }
                if (resp.ok) {
                    const blob = await resp.blob();
                    this._assetCache[src] = await this.blobToCompressedDataUrl(blob);
                }
            } catch (_) {
                // Keep original if offline external URL fails
            }
        }
        return this._assetCache;
    }

    blobToCompressedDataUrl(blob, maxDim = 1080) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
                const rawDataUrl = reader.result;
                if (typeof Image === "undefined") {
                    resolve(rawDataUrl);
                    return;
                }
                const img = new Image();
                img.onload = () => {
                    if (img.naturalWidth <= maxDim && img.naturalHeight <= maxDim) {
                        resolve(rawDataUrl);
                        return;
                    }
                    const ratio = Math.min(maxDim / img.naturalWidth, maxDim / img.naturalHeight);
                    const w = Math.round(img.naturalWidth * ratio);
                    const h = Math.round(img.naturalHeight * ratio);
                    const cvs = document.createElement("canvas");
                    cvs.width = w;
                    cvs.height = h;
                    const ctx = cvs.getContext("2d");
                    ctx.drawImage(img, 0, 0, w, h);
                    resolve(cvs.toDataURL("image/jpeg", 0.9));
                };
                img.onerror = () => resolve(rawDataUrl);
                img.src = rawDataUrl;
            };
            reader.onerror = () => resolve("");
            reader.readAsDataURL(blob);
        });
    }

    // ==================== 打开主制卡工作台 ====================
    async openStudioFromActiveDoc() {
        const doc = await this.fetchActiveDocument();
        await this.openStudio(doc);
    }

    async openStudio({ markdown, title, sourceLabel }) {
        await this.resolveMarkdownAssets(markdown);

        const state = {
            markdown,
            title: title || "思源映卡",
            sourceLabel: sourceLabel || "当前笔记",
            activeTab: "cards", // "cards" | "wechat"
            selectedCardIdx: 0,
            cards: [],
            aiCandidates: [], // clickable title/quote suggestions
            xhsCompanionCopy: "", // generated Xiaohongshu caption + #tags
            busyText: "",
        };

        const dlg = new Dialog({
            title: "",
            content: `<div class="sycc-root" id="syccStudioRoot"></div>`,
            width: "1360px",
            height: "880px",
            destroyCallback: () => {
                this._activeDialogs.delete(dlg);
            },
        });
        if (dlg.element) {
            dlg.element.classList.add("sycc-studio-dialog");
            const headerEl = dlg.element.querySelector(".b3-dialog__header");
            if (headerEl) headerEl.style.display = "none";
        }
        this._activeDialogs.add(dlg);

        const root = dlg.element.querySelector("#syccStudioRoot");
        this.mountStudioUI(root, state, dlg);
    }

    mountStudioUI(root, state, dlg) {
        const getActiveTheme = () => THEME_REGISTRY.find((t) => t.id === this.config.themeId) || THEME_REGISTRY[0];

        const recomputeCards = () => {
            state.cards = SmartPaginationEngine.paginate(state.markdown, {
                fallbackTitle: state.title,
                ratioId: this.config.ratioId,
                fontSize: this.config.fontSize,
                padding: this.config.padding,
                multiCard: this.config.multiCard,
                kicker: this.config.customKicker,
            });
            if (state.selectedCardIdx >= state.cards.length) {
                state.selectedCardIdx = 0;
            }
        };

        recomputeCards();

        const renderFullStudio = () => {
            const pro = this.isPro();
            const theme = getActiveTheme();
            const freeAiLeft = Math.max(0, 3 - (this.config.freeAiUsedCount || 0));

            root.innerHTML = `
                <style>${CARD_SHARED_CSS}</style>
                <!-- 顶部栏 -->
                <div class="sycc-topbar">
                    <div class="sycc-topbar-left">
                        <div class="sycc-logo-mark">映</div>
                        <span class="sycc-brand-title">思源映卡 CardCraft</span>
                        <span class="sycc-doc-pill" title="${escapeHtml(state.sourceLabel)}">${escapeHtml(state.sourceLabel)}</span>
                        ${
                            pro
                                ? `<span class="sycc-badge-pro" id="syccProBadgeBtn">💎 ${this.config.licenseEdition === "BUNDLE" ? "旗舰联名终身版" : "PRO 终身版"}</span>`
                                : `<span class="sycc-badge-free" id="syccProBadgeBtn">🆓 社区免费版 · 点击解锁 Pro</span>`
                        }
                    </div>
                    <div class="sycc-topbar-actions">
                        <button class="sycc-btn" id="syccReloadDocBtn">🔄 重载当前文档</button>
                        <button class="sycc-btn" id="syccAiSettingBtn">⚙️ AI 接口设置</button>
                        ${!pro ? `<button class="sycc-btn sycc-btn-gold" id="syccOpenProBtn">💎 升级终身版 ¥29.9</button>` : ""}
                        <button class="sycc-btn" id="syccCloseStudioBtn" title="关闭工作台">✕</button>
                    </div>
                </div>

                <!-- 左右双栏工作台 -->
                <div class="sycc-workspace">
                    <!-- 左侧控制面板 -->
                    <div class="sycc-sidebar">
                        <!-- 1. AI 智能提纯微操作 -->
                        <div class="sycc-panel sycc-ai-panel">
                            <div class="sycc-panel-header">
                                <span class="sycc-panel-title">✨ AI 智能提纯引擎</span>
                                <span class="sycc-panel-sub">${pro ? "💎 无限畅享" : `免费体验余 ${freeAiLeft}/3 次`}</span>
                            </div>
                            <div class="sycc-ai-grid">
                                <button class="sycc-ai-btn-main" id="syccAiSuiteBtn" ${state.busyText ? "disabled" : ""}>
                                    ${state.busyText || "✨ AI 提纯为小红书黄金 6 图套卡"}
                                </button>
                                <button class="sycc-btn" id="syccAiTitleBtn" ${state.busyText ? "disabled" : ""}>🎯 AI 爆款标题改写</button>
                                <button class="sycc-btn" id="syccAiQuoteBtn" ${state.busyText ? "disabled" : ""}>💡 AI 提取 3 大金句</button>
                            </div>
                            <div id="syccAiCandMount"></div>
                        </div>

                        <!-- 2. 画幅比例 -->
                        <div class="sycc-panel">
                            <div class="sycc-panel-header">
                                <span class="sycc-panel-title">📐 画幅比例与分页</span>
                                <span class="sycc-panel-sub">${this.config.exportScale}x 超采样导出</span>
                            </div>
                            <div class="sycc-ratio-grid">
                                ${Object.values(ASPECT_RATIOS)
                                    .map(
                                        (r) => `
                                    <div class="sycc-ratio-card ${this.config.ratioId === r.id ? "is-active" : ""}" data-ratio="${r.id}">
                                        <span class="sycc-ratio-name">${r.name}</span>
                                        <span class="sycc-ratio-desc">${r.desc}</span>
                                    </div>`
                                    )
                                    .join("")}
                            </div>
                            ${
                                this.config.ratioId === "cover_banner"
                                    ? `<div class="sycc-field-row" style="margin-top:10px;">
                                        <span>封面规格切换</span>
                                        <select class="sycc-select" id="syccCoverSubSelect" style="width:195px;">
                                            <option value="2.35:1" ${this.config.coverSubMode === "2.35:1" ? "selected" : ""}>公众号头图 2.35:1 (1080×460)</option>
                                            <option value="16:9" ${this.config.coverSubMode === "16:9" ? "selected" : ""}>B站/专栏封面 16:9 (1280×720)</option>
                                        </select>
                                    </div>`
                                    : ""
                            }
                            ${
                                ASPECT_RATIOS[this.config.ratioId]?.paginated
                                    ? `<div class="sycc-field-row" style="margin-top:10px;">
                                        <span>长文智能拆分为多张套卡</span>
                                        <input type="checkbox" id="syccMultiCardToggle" class="b3-switch" ${this.config.multiCard ? "checked" : ""} />
                                    </div>`
                                    : ""
                            }
                            <div class="sycc-field-row">
                                <span style="white-space:nowrap;">顶部胶囊角标</span>
                                <input class="sycc-input" id="syccKickerInput" style="width:210px;" placeholder="如：深度剖析 · 建议收藏" value="${escapeHtml(this.config.customKicker)}" />
                            </div>
                        </div>

                        <!-- 3. 12 套杂志高定主题 -->
                        <div class="sycc-panel">
                            <div class="sycc-panel-header">
                                <span class="sycc-panel-title">🎨 12 套杂志级高定主题</span>
                                <span class="sycc-panel-sub">当前：${theme.name}</span>
                            </div>
                            <div class="sycc-theme-grid">
                                ${THEME_REGISTRY.map(
                                    (t) => `
                                    <div class="sycc-theme-item ${this.config.themeId === t.id ? "is-active" : ""}" data-theme="${t.id}" title="${t.name} · ${t.subtitle}">
                                        ${t.pro && !pro ? `<span class="sycc-pro-tag">PRO</span>` : ""}
                                        <div class="sycc-theme-swatch" style="background:${t.outerBg};">
                                            <div class="sycc-theme-swatch-inner" style="background:${t.cardBg};border:${t.cardBorder};">
                                                <div class="sycc-theme-swatch-bar1" style="background:${t.accentColor};"></div>
                                                <div class="sycc-theme-swatch-bar2" style="background:${t.textColor};"></div>
                                            </div>
                                        </div>
                                        <span class="sycc-theme-label">${t.name}</span>
                                    </div>`
                                ).join("")}
                            </div>
                        </div>

                        <!-- 4. 排版微调 & 个人 IP 品牌底座 -->
                        <div class="sycc-panel">
                            <div class="sycc-panel-header">
                                <span class="sycc-panel-title">✒️ 细节微调 & 个人 IP 底座</span>
                                ${!pro ? `<span class="sycc-panel-sub" style="color:#d97706;cursor:pointer;" id="syccUnlockBrandLink">🔒 Pro 专属</span>` : `<span class="sycc-panel-sub">已解锁</span>`}
                            </div>
                            <div class="sycc-field-row">
                                <span>正文字号 (${this.config.fontSize}px)</span>
                                <input type="range" id="syccFontSlider" min="13" max="19" step="1" value="${this.config.fontSize}" style="width:150px;" />
                            </div>
                            <div class="sycc-field-row">
                                <span>卡片留白 (${this.config.padding}px)</span>
                                <input type="range" id="syccPadSlider" min="22" max="48" step="2" value="${this.config.padding}" style="width:150px;" />
                            </div>
                            <div class="sycc-field-row">
                                <span>导出超清倍率</span>
                                <select class="sycc-select" id="syccScaleSelect" style="width:150px;">
                                    <option value="2" ${this.config.exportScale === 2 ? "selected" : ""}>2x 超清 (1080P 推荐)</option>
                                    <option value="3" ${this.config.exportScale === 3 ? "selected" : ""}>3x 印刷级 (1620P)</option>
                                </select>
                            </div>
                            <div style="height:1px;background:rgba(148,163,184,0.2);margin:10px 0;"></div>
                            <div class="sycc-field-row">
                                <span>展示个人 IP 品牌底座</span>
                                <input type="checkbox" id="syccBrandToggle" class="b3-switch" ${this.config.brand?.enabled !== false ? "checked" : ""} />
                            </div>
                            <div class="sycc-field-row">
                                <input class="sycc-input" id="syccBrandAuthor" placeholder="作者署名 (Pro 专属)" value="${escapeHtml(this.config.brand?.author || "")}" />
                            </div>
                            <div class="sycc-field-row">
                                <input class="sycc-input" id="syccBrandSlogan" placeholder="个人 Slogan / 公众号同名" value="${escapeHtml(this.config.brand?.slogan || "")}" />
                            </div>
                            <div class="sycc-field-row" style="gap:6px;">
                                <button class="sycc-btn" id="syccUploadAvatarBtn" style="flex:1;font-size:11.5px;">🖼️ 上传头像</button>
                                <button class="sycc-btn" id="syccUploadQrBtn" style="flex:1;font-size:11.5px;">📱 上传二维码</button>
                                <input type="file" id="syccAvatarFile" accept="image/*" style="display:none;" />
                                <input type="file" id="syccQrFile" accept="image/*" style="display:none;" />
                            </div>
                        </div>

                        <!-- 5. Markdown 内容实时微调 -->
                        <div class="sycc-panel">
                            <div class="sycc-panel-header">
                                <span class="sycc-panel-title">📝 Markdown 实时内容微调</span>
                                <span class="sycc-panel-sub">不改动原笔记</span>
                            </div>
                            <input class="sycc-input" id="syccTitleInput" style="margin-bottom:7px;font-weight:700;" value="${escapeHtml(state.title)}" placeholder="卡片主标题" />
                            <textarea class="sycc-textarea" id="syccMdTextarea" placeholder="支持标题、列表、引用、代码块、表格...">${escapeHtml(state.markdown)}</textarea>
                        </div>
                    </div>

                    <!-- 右侧实时高清预览画布 -->
                    <div class="sycc-stage-col">
                        <div class="sycc-stage-toolbar">
                            <div class="sycc-tab-group">
                                <button class="sycc-tab-btn ${state.activeTab === "cards" ? "is-active" : ""}" data-tab="cards">
                                    🎨 视觉卡片预览 (${state.cards.length} 张)
                                </button>
                                <button class="sycc-tab-btn ${state.activeTab === "wechat" ? "is-active" : ""}" data-tab="wechat">
                                    💚 公众号内联排版预览
                                </button>
                            </div>
                            <div class="sycc-page-pills" id="syccPagePillsMount"></div>
                        </div>

                        <div class="sycc-stage-viewport" id="syccStageViewport"></div>

                        <div class="sycc-bottombar">
                            <div class="sycc-bottom-status" id="syccBottomStatus"></div>
                            <div class="sycc-bottom-btns" id="syccBottomBtns"></div>
                        </div>
                    </div>
                </div>
            `;

            this.renderAiCandidates(root, state, recomputeCards, () => renderStageOnly());
            renderStageOnly();
            bindEvents();
        };

        const renderStageOnly = () => {
            const pro = this.isPro();
            const theme = getActiveTheme();
            const viewport = root.querySelector("#syccStageViewport");
            const pillsMount = root.querySelector("#syccPagePillsMount");
            const bottomStatus = root.querySelector("#syccBottomStatus");
            const bottomBtns = root.querySelector("#syccBottomBtns");
            if (!viewport) return;

            // Update card count in tab button
            const cardTabBtn = root.querySelector('[data-tab="cards"]');
            if (cardTabBtn) {
                cardTabBtn.textContent = `🎨 视觉卡片预览 (${state.cards.length} 张)`;
            }

            if (state.activeTab === "wechat") {
                pillsMount.innerHTML = `<span style="font-size:12px;color:#059669;font-weight:600;">✓ 100% 兼容微信公众号后台直接粘贴</span>`;
                const wechatHtml = WeChatFormatter.toInlineHTML(state.markdown, state.title, theme, this._assetCache);
                viewport.innerHTML = `<div class="sycc-wechat-preview-shell" id="syccWechatDom">${wechatHtml}</div>`;
                bottomStatus.innerHTML = `当前配色体系：<strong>${escapeHtml(theme.name)}</strong> ${theme.pro && !pro ? `<span style="color:#d97706;">(🔒 Pro 专属公众号配色)</span>` : ""}`;
                bottomBtns.innerHTML = `
                    <button class="sycc-btn sycc-btn-wechat" id="syccCopyWechatBtn">💚 一键复制公众号内联排版富文本</button>
                `;
                root.querySelector("#syccCopyWechatBtn")?.addEventListener("click", async () => {
                    if (theme.pro && !pro) {
                        showMessage("当前主题为 Pro 专属公众号配色，升级终身版即可一键解锁全部 12 套主题！", 4000, "info");
                        this.openUpgradeModal(() => renderFullStudio());
                        return;
                    }
                    await this.copyRichHtmlToClipboard(wechatHtml);
                    showMessage("💚 已复制公众号富文本！可直接前往 mp.weixin.qq.com 编辑器粘贴", 3500);
                });
                return;
            }

            // Cards Preview Mode
            pillsMount.innerHTML = state.cards
                .map(
                    (c, idx) =>
                        `<button class="sycc-page-pill ${idx === state.selectedCardIdx ? "is-active" : ""}" data-card-idx="${idx}">
                            ${String(idx + 1).padStart(2, "0")}${c.kind === "hero-cover" ? " 封面" : ""}
                        </button>`
                )
                .join("");

            pillsMount.querySelectorAll("[data-card-idx]").forEach((btn) => {
                btn.onclick = () => {
                    state.selectedCardIdx = parseInt(btn.getAttribute("data-card-idx"), 10) || 0;
                    renderStageOnly();
                    const slotEl = viewport.querySelector(`[data-slot-idx="${state.selectedCardIdx}"]`);
                    slotEl?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                };
            });

            const xhsBoxHtml = state.xhsCompanionCopy
                ? `<div class="sycc-xhs-copybox">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                        <span style="font-size:12.5px;font-weight:700;color:#db2777;">📕 AI 配套小红书爆款发布文案 & 话题标签</span>
                        <button class="sycc-btn" id="syccCopyXhsPostBtn" style="height:28px;font-size:11.5px;">📋 一键复制文案与标签</button>
                    </div>
                    <div style="font-size:12.5px;line-height:1.65;white-space:pre-wrap;color:var(--b3-theme-on-background);">${escapeHtml(state.xhsCompanionCopy)}</div>
                </div>`
                : "";

            const cardsHtml = state.cards
                .map((card, idx) => {
                    const html = CardRenderer.renderCardHTML(card, {
                        theme,
                        ratioId: this.config.ratioId,
                        coverSubMode: this.config.coverSubMode,
                        fontSize: this.config.fontSize,
                        padding: this.config.padding,
                        isPro: pro,
                        brand: this.config.brand,
                        assetMap: this._assetCache,
                    });
                    const freeLockedOver3 = !pro && idx >= 3;
                    return `
                    <div class="sycc-card-slot ${idx === state.selectedCardIdx ? "is-selected" : ""}" data-slot-idx="${idx}">
                        <div class="sycc-card-frame" id="syccCardFrame_${idx}">${html}</div>
                        <div class="sycc-slot-caption">
                            <span>第 ${String(idx + 1).padStart(2, "0")} / ${String(state.cards.length).padStart(2, "0")} 张</span>
                            ${freeLockedOver3 ? `<span style="color:#d97706;">🔒 超出免费 3 张上限 (升级 Pro 解锁整套导出)</span>` : ""}
                        </div>
                    </div>`;
                })
                .join("");

            viewport.innerHTML = `${xhsBoxHtml}<div class="sycc-cards-carousel">${cardsHtml}</div>`;

            viewport.querySelector("#syccCopyXhsPostBtn")?.addEventListener("click", async () => {
                await navigator.clipboard.writeText(state.xhsCompanionCopy);
                showMessage("📋 小红书配套文案与标签已复制到剪贴板！", 3000);
            });

            viewport.querySelectorAll("[data-slot-idx]").forEach((slot) => {
                slot.addEventListener("click", () => {
                    const idx = parseInt(slot.getAttribute("data-slot-idx"), 10) || 0;
                    if (state.selectedCardIdx !== idx) {
                        state.selectedCardIdx = idx;
                        viewport.querySelectorAll(".sycc-card-slot").forEach((s, i) => s.classList.toggle("is-selected", i === idx));
                        pillsMount.querySelectorAll(".sycc-page-pill").forEach((p, i) => p.classList.toggle("is-active", i === idx));
                    }
                });
            });

            const lockHint = theme.pro && !pro
                ? `<span style="color:#d97706;font-weight:600;">🔒 当前正在预览 Pro 专属主题「${theme.name}」，解锁后可导出无水印超清图</span>`
                : `<span>已选第 <strong>${state.selectedCardIdx + 1}</strong> 张 · 输出分辨率 <strong>${this.getExportResolutionLabel()}</strong></span>`;
            bottomStatus.innerHTML = lockHint;

            bottomBtns.innerHTML = `
                <button class="sycc-btn" id="syccCopyPngBtn">📋 复制当前卡片到剪贴板</button>
                <button class="sycc-btn" id="syccDownloadOneBtn">💾 下载单张高清 PNG</button>
                ${
                    state.cards.length > 1
                        ? `<button class="sycc-btn sycc-btn-primary" id="syccBatchZipBtn">📦 批量导出整套小红书 PNG (.zip)</button>`
                        : `<button class="sycc-btn sycc-btn-primary" id="syccDownloadPrimaryBtn">💾 导出超清 PNG</button>`
                }
            `;

            const guardExportPermission = (targetIdx = 0) => {
                if (theme.pro && !pro) {
                    showMessage(`「${theme.name}」为 Pro 终身版专属高定主题，升级即可永久解锁全部 12 套主题！`, 4000, "info");
                    this.openUpgradeModal(() => renderFullStudio());
                    return false;
                }
                if (!pro && targetIdx >= 3) {
                    showMessage("免费版多图套卡支持导出前 3 张，升级 Pro 终身版即可解锁无限分页与一键 .zip 批量打包！", 4500, "info");
                    this.openUpgradeModal(() => renderFullStudio());
                    return false;
                }
                return true;
            };

            root.querySelector("#syccCopyPngBtn")?.addEventListener("click", async () => {
                if (!guardExportPermission(state.selectedCardIdx)) return;
                await this.handleCopyCurrentCard(viewport, state.selectedCardIdx);
            });

            const dlSingleHandler = async () => {
                if (!guardExportPermission(state.selectedCardIdx)) return;
                await this.handleDownloadSingleCard(viewport, state.selectedCardIdx, state.title);
            };
            root.querySelector("#syccDownloadOneBtn")?.addEventListener("click", dlSingleHandler);
            root.querySelector("#syccDownloadPrimaryBtn")?.addEventListener("click", dlSingleHandler);

            root.querySelector("#syccBatchZipBtn")?.addEventListener("click", async () => {
                if (theme.pro && !pro) {
                    guardExportPermission(0);
                    return;
                }
                await this.handleBatchExportZip(viewport, state, () => renderFullStudio());
            });
        };

        const bindEvents = () => {
            root.querySelector("#syccCloseStudioBtn")?.addEventListener("click", () => dlg.destroy());
            root.querySelector("#syccProBadgeBtn")?.addEventListener("click", () => this.openUpgradeModal(() => renderFullStudio()));
            root.querySelector("#syccOpenProBtn")?.addEventListener("click", () => this.openUpgradeModal(() => renderFullStudio()));
            root.querySelector("#syccUnlockBrandLink")?.addEventListener("click", () => this.openUpgradeModal(() => renderFullStudio()));
            root.querySelector("#syccAiSettingBtn")?.addEventListener("click", () => this.openAiConfigModal());

            root.querySelector("#syccReloadDocBtn")?.addEventListener("click", async () => {
                const fresh = await this.fetchActiveDocument();
                await this.resolveMarkdownAssets(fresh.markdown);
                state.markdown = fresh.markdown;
                state.title = fresh.title;
                state.sourceLabel = fresh.sourceLabel;
                state.selectedCardIdx = 0;
                recomputeCards();
                renderFullStudio();
                showMessage("🔄 已重新载入当前思源文档", 2200);
            });

            // Tabs
            root.querySelectorAll("[data-tab]").forEach((btn) => {
                btn.addEventListener("click", () => {
                    state.activeTab = btn.getAttribute("data-tab");
                    root.querySelectorAll("[data-tab]").forEach((b) => b.classList.toggle("is-active", b === btn));
                    renderStageOnly();
                });
            });

            // Aspect Ratio
            root.querySelectorAll("[data-ratio]").forEach((el) => {
                el.addEventListener("click", async () => {
                    this.config.ratioId = el.getAttribute("data-ratio");
                    state.selectedCardIdx = 0;
                    await this.persistConfig();
                    recomputeCards();
                    renderFullStudio();
                });
            });

            root.querySelector("#syccCoverSubSelect")?.addEventListener("change", async (e) => {
                this.config.coverSubMode = e.target.value;
                await this.persistConfig();
                renderStageOnly();
            });

            root.querySelector("#syccMultiCardToggle")?.addEventListener("change", async (e) => {
                this.config.multiCard = e.target.checked;
                state.selectedCardIdx = 0;
                await this.persistConfig();
                recomputeCards();
                renderStageOnly();
            });

            root.querySelector("#syccKickerInput")?.addEventListener("input", (e) => {
                this.config.customKicker = e.target.value;
                this.persistConfig();
                recomputeCards();
                renderStageOnly();
            });

            // Themes
            root.querySelectorAll("[data-theme]").forEach((el) => {
                el.addEventListener("click", async () => {
                    this.config.themeId = el.getAttribute("data-theme");
                    await this.persistConfig();
                    renderFullStudio();
                });
            });

            // Pro Typography & Brand Dock Sliders
            const requireProForTuning = () => {
                if (!this.isPro()) {
                    showMessage("字号边距微调与个人 IP 品牌底座为 Pro 专属权益，升级即可永久解锁！", 3500, "info");
                    this.openUpgradeModal(() => renderFullStudio());
                    return false;
                }
                return true;
            };

            root.querySelector("#syccFontSlider")?.addEventListener("input", (e) => {
                if (!requireProForTuning()) {
                    e.target.value = this.config.fontSize;
                    return;
                }
                this.config.fontSize = parseInt(e.target.value, 10) || 15;
                this.persistConfig();
                recomputeCards();
                renderStageOnly();
            });

            root.querySelector("#syccPadSlider")?.addEventListener("input", (e) => {
                if (!requireProForTuning()) {
                    e.target.value = this.config.padding;
                    return;
                }
                this.config.padding = parseInt(e.target.value, 10) || 32;
                this.persistConfig();
                recomputeCards();
                renderStageOnly();
            });

            root.querySelector("#syccScaleSelect")?.addEventListener("change", async (e) => {
                const val = parseInt(e.target.value, 10) || 2;
                if (val === 3 && !this.isPro()) {
                    e.target.value = "2";
                    requireProForTuning();
                    return;
                }
                this.config.exportScale = val;
                await this.persistConfig();
                renderStageOnly();
            });

            root.querySelector("#syccBrandToggle")?.addEventListener("change", async (e) => {
                if (!requireProForTuning()) {
                    e.target.checked = true;
                    return;
                }
                this.config.brand.enabled = e.target.checked;
                await this.persistConfig();
                renderStageOnly();
            });

            root.querySelector("#syccBrandAuthor")?.addEventListener("input", (e) => {
                if (!this.isPro()) return;
                this.config.brand.author = e.target.value;
                this.persistConfig();
                renderStageOnly();
            });
            root.querySelector("#syccBrandAuthor")?.addEventListener("focus", (e) => {
                if (!this.isPro()) { e.target.blur(); requireProForTuning(); }
            });

            root.querySelector("#syccBrandSlogan")?.addEventListener("input", (e) => {
                if (!this.isPro()) return;
                this.config.brand.slogan = e.target.value;
                this.persistConfig();
                renderStageOnly();
            });
            root.querySelector("#syccBrandSlogan")?.addEventListener("focus", (e) => {
                if (!this.isPro()) { e.target.blur(); requireProForTuning(); }
            });

            const bindImageUpload = (btnSel, inputSel, fieldKey, maxDim) => {
                const btn = root.querySelector(btnSel);
                const fileIn = root.querySelector(inputSel);
                btn?.addEventListener("click", () => {
                    if (!requireProForTuning()) return;
                    fileIn?.click();
                });
                fileIn?.addEventListener("change", async () => {
                    const file = fileIn.files?.[0];
                    if (!file) return;
                    const dataUrl = await this.blobToCompressedDataUrl(file, maxDim);
                    this.config.brand[fieldKey] = dataUrl;
                    await this.persistConfig();
                    renderStageOnly();
                    showMessage("✅ 品牌图片已持久化保存", 2200);
                });
            };
            bindImageUpload("#syccUploadAvatarBtn", "#syccAvatarFile", "avatarDataUrl", 240);
            bindImageUpload("#syccUploadQrBtn", "#syccQrFile", "qrDataUrl", 320);

            // Live Markdown & Title Editing
            root.querySelector("#syccTitleInput")?.addEventListener("input", (e) => {
                state.title = e.target.value;
                recomputeCards();
                renderStageOnly();
            });

            let mdTimer = null;
            root.querySelector("#syccMdTextarea")?.addEventListener("input", (e) => {
                state.markdown = e.target.value;
                clearTimeout(mdTimer);
                mdTimer = setTimeout(async () => {
                    await this.resolveMarkdownAssets(state.markdown);
                    recomputeCards();
                    renderStageOnly();
                }, 180);
            });

            // 3 AI Micro-Actions
            root.querySelector("#syccAiSuiteBtn")?.addEventListener("click", () =>
                this.runAiDistillAction("suite", state, recomputeCards, renderFullStudio)
            );
            root.querySelector("#syccAiTitleBtn")?.addEventListener("click", () =>
                this.runAiDistillAction("titles", state, recomputeCards, renderFullStudio)
            );
            root.querySelector("#syccAiQuoteBtn")?.addEventListener("click", () =>
                this.runAiDistillAction("quotes", state, recomputeCards, renderFullStudio)
            );
        };

        renderFullStudio();
    }

    renderAiCandidates(root, state, recomputeCards, refreshStage) {
        const mount = root.querySelector("#syccAiCandMount");
        if (!mount) return;
        if (!state.aiCandidates || !state.aiCandidates.length) {
            mount.innerHTML = "";
            return;
        }
        mount.innerHTML = `<div class="sycc-ai-candidates">
            ${state.aiCandidates
                .map(
                    (c, idx) => `
                <div class="sycc-ai-cand-item" data-cand-idx="${idx}">
                    <div style="font-weight:700;color:#4f46e5;">${escapeHtml(c.label)}</div>
                    <div style="color:var(--b3-theme-on-surface);margin-top:2px;">${escapeHtml(c.preview)}</div>
                </div>`
                )
                .join("")}
        </div>`;

        mount.querySelectorAll("[data-cand-idx]").forEach((el) => {
            el.addEventListener("click", () => {
                const item = state.aiCandidates[parseInt(el.getAttribute("data-cand-idx"), 10)];
                if (!item) return;
                if (item.mode === "title") {
                    state.title = item.title;
                    this.config.customKicker = item.subtitle || this.config.customKicker;
                    const titleIn = root.querySelector("#syccTitleInput");
                    if (titleIn) titleIn.value = state.title;
                    recomputeCards();
                    refreshStage();
                    showMessage("🎯 已应用爆款封面主副标题！", 2200);
                } else if (item.mode === "quote") {
                    this.config.ratioId = "moments_auto";
                    state.markdown = `> ${item.quote}\n\n—— 摘自《${state.title}》`;
                    const mdArea = root.querySelector("#syccMdTextarea");
                    if (mdArea) mdArea.value = state.markdown;
                    recomputeCards();
                    refreshStage();
                    showMessage("💡 已切换为金句长卡模式！", 2200);
                }
            });
        });
    }

    getExportResolutionLabel() {
        const scale = this.config.exportScale || 2;
        if (this.config.ratioId === "cover_banner") {
            return this.config.coverSubMode === "16:9"
                ? `${640 * scale}×${360 * scale}`
                : `${540 * scale}×${230 * scale}`;
        }
        const r = ASPECT_RATIOS[this.config.ratioId] || ASPECT_RATIOS.xhs_3_4;
        return r.baseH ? `${r.baseW * scale}×${r.baseH * scale}` : `${r.baseW * scale}×自适应`;
    }

    // ==================== SVG foreignObject + Canvas 2D 超清光栅化导出 ====================
    async rasterizeCardElementToBlob(cardFrameEl) {
        const activeTheme = THEME_REGISTRY.find((t) => t.id === this.config.themeId) || THEME_REGISTRY[0];
        if (activeTheme.pro && !this.isPro()) {
            throw new Error(`「${activeTheme.name}」为 Pro 专属高定主题，请先升级解锁`);
        }

        const canvasNode = cardFrameEl?.querySelector?.(".sycc-render-canvas");
        if (!canvasNode) throw new Error("未找到卡片渲染节点");

        const rect = canvasNode.getBoundingClientRect();
        const baseW = Math.max(240, Math.min(2400, parseInt(canvasNode.getAttribute("data-base-w"), 10) || Math.round(rect.width) || 540));
        const attrH = parseInt(canvasNode.getAttribute("data-base-h"), 10);
        const rawH = attrH || Math.max(320, Math.ceil(canvasNode.scrollHeight || rect.height));
        const baseH = Math.min(14000, Math.max(200, rawH));
        // 防超长自适应卡片触发 Chromium Canvas 16384px / 像素面积上限空白崩溃，自动动态降采样保底清晰导出
        const reqScale = Math.max(1, Math.min(3, Number(this.config.exportScale) || 2));
        const maxSafeScale = Math.max(1, Math.min(reqScale, 15000 / baseH, Math.sqrt(64000000 / (baseW * baseH))));
        const targetW = Math.round(baseW * maxSafeScale);
        const targetH = Math.round(baseH * maxSafeScale);

        const cloned = canvasNode.cloneNode(true);
        cloned.style.width = `${baseW}px`;
        cloned.style.height = `${baseH}px`;
        cloned.style.margin = "0";

        const serializer = new XMLSerializer();
        const xhtmlContent = serializer
            .serializeToString(cloned)
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");

        const svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" width="${targetW}" height="${targetH}" viewBox="0 0 ${baseW} ${baseH}">
            <foreignObject x="0" y="0" width="${baseW}" height="${baseH}">
                <div xmlns="http://www.w3.org/1999/xhtml" style="width:${baseW}px;height:${baseH}px;margin:0;padding:0;">
                    <style>${CARD_SHARED_CSS}</style>
                    ${xhtmlContent}
                </div>
            </foreignObject>
        </svg>`;

        const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`;

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                try {
                    const cvs = document.createElement("canvas");
                    cvs.width = targetW;
                    cvs.height = targetH;
                    const ctx = cvs.getContext("2d");
                    if (!ctx) throw new Error("画布上下文分配失败，请切换多图分页模式导出");
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = "high";
                    ctx.drawImage(img, 0, 0, targetW, targetH);
                    cvs.toBlob(
                        (blob) => {
                            cvs.width = 1;
                            cvs.height = 1;
                            if (blob) resolve(blob);
                            else reject(new Error("Canvas 生成 PNG Blob 失败"));
                        },
                        "image/png",
                        1.0
                    );
                } catch (err) {
                    reject(err);
                }
            };
            img.onerror = () => reject(new Error("SVG 图像光栅化解码失败"));
            img.src = svgDataUrl;
        });
    }

    triggerBlobDownload(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
    }

    sanitizeFileName(name) {
        return String(name || "思源映卡")
            .replace(/[\\/:*?"<>|]/g, "_")
            .replace(/\s+/g, "_")
            .slice(0, 32);
    }

    async handleCopyCurrentCard(viewport, idx) {
        try {
            showMessage("⏳ 正在渲染超清卡片...", 1500);
            const frame = viewport.querySelector(`#syccCardFrame_${idx}`);
            const blob = await this.rasterizeCardElementToBlob(frame);
            if (navigator.clipboard && typeof ClipboardItem !== "undefined") {
                await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
                showMessage("✅ 超清卡片已复制到剪贴板！可直接 Ctrl/⌘+V 粘贴发送", 3200);
            } else {
                this.triggerBlobDownload(blob, `${String(idx + 1).padStart(2, "0")}_思源映卡.png`);
                showMessage("当前环境不支持剪贴板写图，已自动为您下载高清 PNG", 3200);
            }
        } catch (err) {
            showMessage(`复制失败: ${err.message}`, 4000, "error");
        }
    }

    async handleDownloadSingleCard(viewport, idx, title) {
        try {
            const frame = viewport.querySelector(`#syccCardFrame_${idx}`);
            const blob = await this.rasterizeCardElementToBlob(frame);
            const cleanTitle = this.sanitizeFileName(title);
            const prefix = String(idx + 1).padStart(2, "0");
            this.triggerBlobDownload(blob, `${prefix}_${cleanTitle}.png`);
            showMessage(`💾 已导出高清图片：${prefix}_${cleanTitle}.png`, 2800);
        } catch (err) {
            showMessage(`导出失败: ${err.message}`, 4000, "error");
        }
    }

    async handleBatchExportZip(viewport, state, onUpgraded) {
        const pro = this.isPro();
        const total = state.cards.length;
        const maxCount = pro ? total : Math.min(3, total);

        if (!pro && total > 3) {
            showMessage(`免费版每次最多批量导出前 3 张（当前共 ${total} 张），已为您打包前 3 张。升级 Pro 解锁全套无限导出！`, 5000, "info");
        } else {
            showMessage(`⏳ 正在超清渲染并打包全部 ${maxCount} 张小红书套卡...`, 2500);
        }

        try {
            const cleanTitle = this.sanitizeFileName(state.title);
            const zipEntries = [];
            for (let i = 0; i < maxCount; i++) {
                const frame = viewport.querySelector(`#syccCardFrame_${i}`);
                const blob = await this.rasterizeCardElementToBlob(frame);
                const bytes = new Uint8Array(await blob.arrayBuffer());
                const tag = i === 0 && state.cards[0].kind === "hero-cover" ? "封面" : "正文";
                zipEntries.push({
                    name: `${String(i + 1).padStart(2, "0")}_${tag}_${cleanTitle}.png`,
                    data: bytes,
                });
            }
            const zipBytes = ZipBuilder.buildZip(zipEntries);
            const zipBlob = new Blob([zipBytes], { type: "application/zip" });
            this.triggerBlobDownload(zipBlob, `思源映卡_${cleanTitle}_${maxCount}图套卡.zip`);
            showMessage(`📦 已成功导出 ${maxCount} 张超清套卡压缩包 (.zip)！`, 3500);

            if (!pro && total > 3) {
                this.openUpgradeModal(onUpgraded);
            }
        } catch (err) {
            showMessage(`批量导出失败: ${err.message}`, 4500, "error");
        }
    }

    async copyRichHtmlToClipboard(htmlString) {
        if (navigator.clipboard && typeof ClipboardItem !== "undefined") {
            const htmlBlob = new Blob([htmlString], { type: "text/html" });
            const textBlob = new Blob([htmlString.replace(/<[^>]+>/g, "")], { type: "text/plain" });
            await navigator.clipboard.write([
                new ClipboardItem({ "text/html": htmlBlob, "text/plain": textBlob }),
            ]);
            return;
        }
        const temp = document.createElement("div");
        temp.innerHTML = htmlString;
        temp.style.position = "fixed";
        temp.style.left = "-9999px";
        document.body.appendChild(temp);
        const range = document.createRange();
        range.selectNodeContents(temp);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        document.execCommand("copy");
        sel.removeAllRanges();
        temp.remove();
    }

    // ==================== AI 智能提纯双模引擎 (继承思源 AI + 独立配置) ====================
    resolveAiEndpointConfig() {
        const sysOpenAI = (typeof window !== "undefined" && window.siyuan?.config?.ai?.openAI) || {};
        const sysKey = (sysOpenAI.apiKey || "").trim();
        const sysBase = (sysOpenAI.apiBaseURL || "").trim();
        const sysModel = (sysOpenAI.apiModel || "").trim();

        const providerKey = this.config.aiProvider || "siyuan_inherit";
        if (providerKey === "siyuan_inherit") {
            if (sysKey || sysBase.includes("11434")) {
                return {
                    inherited: true,
                    baseUrl: (sysBase || "https://api.openai.com/v1").replace(/\/+$/, ""),
                    apiKey: sysKey,
                    model: sysModel || "deepseek-chat",
                };
            }
            // Fallback to custom fields if user filled them previously
            if (this.config.aiApiKey) {
                return {
                    inherited: false,
                    baseUrl: (this.config.aiBaseUrl || "https://api.deepseek.com/v1").replace(/\/+$/, ""),
                    apiKey: this.config.aiApiKey.trim(),
                    model: this.config.aiModel || "deepseek-chat",
                };
            }
            return null;
        }

        const preset = AI_PROVIDERS[providerKey] || AI_PROVIDERS.deepseek;
        const baseUrl = (this.config.aiBaseUrl || preset.baseUrl || "").trim().replace(/\/+$/, "");
        const apiKey = (this.config.aiApiKey || "").trim();
        const model = (this.config.aiModel || preset.defaultModel || "deepseek-chat").trim();

        if (!baseUrl || (!apiKey && providerKey !== "ollama")) {
            // Automatic fallback to SiYuan system AI if available
            if (sysKey) {
                return {
                    inherited: true,
                    baseUrl: (sysBase || "https://api.openai.com/v1").replace(/\/+$/, ""),
                    apiKey: sysKey,
                    model: sysModel || "deepseek-chat",
                };
            }
            return null;
        }

        return { inherited: false, baseUrl, apiKey, model };
    }

    async callAiChat(systemPrompt, userPrompt) {
        const cfg = this.resolveAiEndpointConfig();
        if (!cfg) {
            throw new Error("NO_AI_CONFIG");
        }
        const endpoint = cfg.baseUrl.endsWith("/chat/completions")
            ? cfg.baseUrl
            : `${cfg.baseUrl}/chat/completions`;

        const headers = { "Content-Type": "application/json" };
        if (cfg.apiKey) {
            headers.Authorization = `Bearer ${cfg.apiKey}`;
        }

        const resp = await fetch(endpoint, {
            method: "POST",
            headers,
            body: JSON.stringify({
                model: cfg.model,
                temperature: 0.65,
                stream: false,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt },
                ],
            }),
        });

        if (!resp.ok) {
            const errTxt = await resp.text().catch(() => "");
            throw new Error(`API HTTP ${resp.status}: ${errTxt.slice(0, 140)}`);
        }
        const data = await resp.json();
        const content = data?.choices?.[0]?.message?.content;
        if (!content) throw new Error("AI 返回内容为空");
        return content.trim();
    }

    extractJsonFromText(raw) {
        const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
        const target = fenced ? fenced[1].trim() : raw.trim();
        const startObj = target.indexOf("{");
        const endObj = target.lastIndexOf("}");
        if (startObj !== -1 && endObj > startObj) {
            return JSON.parse(target.slice(startObj, endObj + 1));
        }
        throw new Error("未能解析 AI 结构化结果");
    }

    async runAiDistillAction(actionType, state, recomputeCards, renderFullStudio) {
        const pro = this.isPro();
        if (!pro && (this.config.freeAiUsedCount || 0) >= 3) {
            showMessage("免费版赠送的 3 次 AI 智能提纯额度已用完，升级 Pro 终身版即可不限次数畅享！", 4500, "info");
            this.openUpgradeModal(() => renderFullStudio());
            return;
        }

        if (!this.resolveAiEndpointConfig()) {
            showMessage("请先配置 AI 接口 Key（或在思源设置->AI 中填入 Key 自动继承）", 3800, "info");
            this.openAiConfigModal();
            return;
        }

        const clippedInput = state.markdown.slice(0, 9000);
        state.busyText = "⏳ AI 正在深度提纯中...";
        renderFullStudio();

        try {
            if (actionType === "suite") {
                const sys = `你是一位百万粉小红书知识博主与视觉卡片主编。请将用户的长笔记提纯为一套「小红书黄金 6 图套卡」结构，并撰写配套爆款小红书发布正文与标签。
严格只输出合法 JSON，格式如下：
{
  "cover_title": "极具吸引力的封面大标题（10~20字）",
  "cover_lead": "一句话痛点或核心收获导语（22~45字）",
  "kicker": "4~8字顶部胶囊标语",
  "cards": [
    { "heading": "01 核心观点小标题", "points": ["精炼要点1（25字内）", "精炼要点2（25字内）"], "highlight": "一句总结金句" }
  ],
  "xhs_post": "小红书配套发布正文（180~300字，分段清晰、真诚有干货）\\n\\n#标签1 #标签2 #标签3 #标签4 #标签5"
}
要求 cards 数组包含 5 张卡片（4 张核心干货拆解卡 + 最后 1 张行动清单/总结卡），每张卡字数控制在 60~95 字以内，干脆利落！`;
                const raw = await this.callAiChat(sys, `原笔记标题：${state.title}\n\n原笔记正文：\n${clippedInput}`);
                const data = this.extractJsonFromText(raw);

                const mdParts = [`# ${data.cover_title || state.title}`, "", data.cover_lead || ""];
                for (const c of data.cards || []) {
                    mdParts.push("", `## ${c.heading || "核心洞察"}`);
                    if (Array.isArray(c.points)) {
                        for (const pt of c.points) mdParts.push(`- ${pt}`);
                    }
                    if (c.highlight) {
                        mdParts.push("", `> ${c.highlight}`);
                    }
                }

                this.config.ratioId = "xhs_3_4";
                this.config.multiCard = true;
                if (data.kicker) this.config.customKicker = data.kicker;
                state.title = data.cover_title || state.title;
                state.markdown = mdParts.join("\n");
                state.xhsCompanionCopy = data.xhs_post || "";
                state.selectedCardIdx = 0;
                state.aiCandidates = [];
                showMessage("✨ 已提纯生成小红书黄金套卡与配套发布文案！", 3500);
            } else if (actionType === "titles") {
                const sys = `你是爆款新媒体主编。根据用户笔记内容，给出 3 组高点击率、不说套话的封面主副标题方案。严格输出 JSON：
{"candidates": [{"title": "主标题（12~20字）", "subtitle": "胶囊副标（5~10字）"}]}`;
                const raw = await this.callAiChat(sys, `标题：${state.title}\n内容：\n${clippedInput.slice(0, 4000)}`);
                const data = this.extractJsonFromText(raw);
                state.aiCandidates = (data.candidates || []).slice(0, 3).map((c, i) => ({
                    mode: "title",
                    label: `🎯 方案 ${i + 1}（点击即刻应用）`,
                    preview: `${c.title}  ·  【${c.subtitle || "深度干货"}】`,
                    title: c.title,
                    subtitle: c.subtitle || "",
                }));
                showMessage("🎯 已生成 3 组封面标题方案，点击左侧卡片即可应用！", 3000);
            } else if (actionType === "quotes") {
                const sys = `请从用户笔记中提炼或润色出最具洞察力、适合发朋友圈与即刻的 3 大金句（每句 25~65 字）。严格输出 JSON：
{"quotes": ["金句1", "金句2", "金句3"]}`;
                const raw = await this.callAiChat(sys, `标题：${state.title}\n内容：\n${clippedInput.slice(0, 5000)}`);
                const data = this.extractJsonFromText(raw);
                state.aiCandidates = (data.quotes || []).slice(0, 3).map((q, i) => ({
                    mode: "quote",
                    label: `💡 金句 ${i + 1}（点击切换金句卡）`,
                    preview: q,
                    quote: q,
                }));
                showMessage("💡 已提取 3 大核心金句，点击任意一条即可生成金句长卡！", 3000);
            }

            if (!pro) {
                this.config.freeAiUsedCount = (this.config.freeAiUsedCount || 0) + 1;
            }
            await this.persistConfig();
        } catch (err) {
            showMessage(`AI 提纯失败：${err.message}`, 4500, "error");
        } finally {
            state.busyText = "";
            recomputeCards();
            renderFullStudio();
        }
    }

    // ==================== 独立 AI 接口设置弹窗 ====================
    openAiConfigModal() {
        const sysOpenAI = (typeof window !== "undefined" && window.siyuan?.config?.ai?.openAI) || {};
        const hasSysAi = Boolean((sysOpenAI.apiKey || "").trim());

        const dlg = new Dialog({
            title: "⚙️ 思源映卡 · AI 接口设置 (BYOK 自备 Key / 自动继承)",
            width: "560px",
            content: `
            <div class="sycc-modal-body">
                ${
                    hasSysAi
                        ? `<div class="sycc-inherit-banner">✨ 已检测到思源系统内置 AI 配置（${escapeHtml(sysOpenAI.apiModel || "默认模型")}），默认可直接免填复用！也可在下方单独指定 DeepSeek / 硅基流动等高性价比接口覆盖。</div>`
                        : `<div style="font-size:12px;color:var(--b3-theme-on-surface);margin-bottom:12px;">💡 提示：不配置 AI 也可 100% 离线使用全部 Markdown 智能分页与 12 套主题制卡；配置后可解锁一键浓缩 6 图小红书套卡与爆款文案生成。</div>`
                }
                <div style="display:flex;flex-direction:column;gap:11px;">
                    <div>
                        <div style="font-size:12px;font-weight:700;margin-bottom:4px;">AI 服务商预设</div>
                        <select class="sycc-select" id="syccModalAiProvider">
                            ${Object.entries(AI_PROVIDERS)
                                .map(
                                    ([k, v]) =>
                                        `<option value="${k}" ${this.config.aiProvider === k ? "selected" : ""}>${escapeHtml(v.name)}</option>`
                                )
                                .join("")}
                        </select>
                    </div>
                    <div id="syccCustomAiFields">
                        <div style="margin-bottom:9px;">
                            <div style="font-size:12px;font-weight:700;margin-bottom:4px;">API Base URL</div>
                            <input class="sycc-input" id="syccModalAiBase" placeholder="https://api.deepseek.com/v1" value="${escapeHtml(this.config.aiBaseUrl)}" />
                        </div>
                        <div style="margin-bottom:9px;">
                            <div style="font-size:12px;font-weight:700;margin-bottom:4px;">API Key（仅加密存储在您本地思源目录）</div>
                            <input class="sycc-input" type="password" id="syccModalAiKey" placeholder="sk-..." value="${escapeHtml(this.config.aiApiKey)}" />
                        </div>
                        <div>
                            <div style="font-size:12px;font-weight:700;margin-bottom:4px;">模型名称 (Model)</div>
                            <input class="sycc-input" id="syccModalAiModel" placeholder="deepseek-chat" value="${escapeHtml(this.config.aiModel)}" />
                        </div>
                    </div>
                    <div id="syccAiTestResult" style="font-size:12px;min-height:18px;"></div>
                    <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:6px;">
                        <button class="sycc-btn" id="syccModalAiTestBtn">🔌 测试连接</button>
                        <button class="sycc-btn sycc-btn-primary" id="syccModalAiSaveBtn">💾 保存配置</button>
                    </div>
                </div>
            </div>`,
            destroyCallback: () => this._activeDialogs.delete(dlg),
        });
        this._activeDialogs.add(dlg);

        const el = dlg.element;
        const provSel = el.querySelector("#syccModalAiProvider");
        const customBox = el.querySelector("#syccCustomAiFields");
        const baseIn = el.querySelector("#syccModalAiBase");
        const keyIn = el.querySelector("#syccModalAiKey");
        const modelIn = el.querySelector("#syccModalAiModel");
        const testMsg = el.querySelector("#syccAiTestResult");

        const syncVisibility = () => {
            const p = provSel.value;
            customBox.style.display = p === "siyuan_inherit" ? "none" : "block";
            if (p !== "siyuan_inherit" && AI_PROVIDERS[p]) {
                if (!baseIn.value || Object.values(AI_PROVIDERS).some((x) => x.baseUrl === baseIn.value)) {
                    baseIn.value = AI_PROVIDERS[p].baseUrl;
                }
                if (!modelIn.value || Object.values(AI_PROVIDERS).some((x) => x.defaultModel === modelIn.value)) {
                    modelIn.value = AI_PROVIDERS[p].defaultModel;
                }
            }
        };
        syncVisibility();
        provSel.addEventListener("change", syncVisibility);

        const applyForm = () => {
            this.config.aiProvider = provSel.value;
            this.config.aiBaseUrl = baseIn.value.trim();
            this.config.aiApiKey = keyIn.value.trim();
            this.config.aiModel = modelIn.value.trim();
        };

        el.querySelector("#syccModalAiTestBtn")?.addEventListener("click", async () => {
            applyForm();
            testMsg.style.color = "#6366f1";
            testMsg.textContent = "⏳ 正在向模型发送握手测试...";
            try {
                const reply = await this.callAiChat("Reply briefly in 10 words.", "Say CardCraft AI Ready");
                testMsg.style.color = "#059669";
                testMsg.textContent = `✅ 连接成功！模型响应：${reply.slice(0, 50)}`;
            } catch (err) {
                testMsg.style.color = "#dc2626";
                testMsg.textContent = err.message === "NO_AI_CONFIG"
                    ? "❌ 未检测到可用 API Key，请填写 Key 或在思源设置中启用 AI"
                    : `❌ 连接失败：${err.message}`;
            }
        });

        el.querySelector("#syccModalAiSaveBtn")?.addEventListener("click", async () => {
            applyForm();
            await this.persistConfig();
            showMessage("✅ AI 接口设置已保存", 2400);
            dlg.destroy();
        });
    }

    // ==================== 动态渠道拉取 + 升级与离线激活弹窗 ====================
    async loadPricingChannels() {
        // 1. Try remote dynamic config with 2000ms timeout
        for (const url of REMOTE_PRICING_URLS) {
            try {
                const ctrl = new AbortController();
                const timer = setTimeout(() => ctrl.abort(), 2000);
                const resp = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
                clearTimeout(timer);
                if (resp.ok) {
                    const remote = await resp.json();
                    if (remote && remote.plans) {
                        return Object.assign({}, DEFAULT_PRICING_CHANNELS, remote);
                    }
                }
            } catch (_) {}
        }
        // 2. Fallback to local bundled pricing_channels.json inside plugin folder
        try {
            const localResp = await fetch("/plugins/siyuan-cardcraft/pricing_channels.json");
            if (localResp.ok) {
                const localJson = await localResp.json();
                if (localJson && localJson.plans) {
                    return Object.assign({}, DEFAULT_PRICING_CHANNELS, localJson);
                }
            }
        } catch (_) {}
        return DEFAULT_PRICING_CHANNELS;
    }

    async openUpgradeModal(onActivatedCallback = null) {
        const channels = await this.loadPricingChannels();
        const proPlan = channels.plans?.pro || DEFAULT_PRICING_CHANNELS.plans.pro;
        const bundlePlan = channels.plans?.bundle || null;
        const activePro = this.isPro();

        const dlg = new Dialog({
            title: "💎 思源映卡 CardCraft · 升级终身专业版 (纯离线永久授权)",
            width: bundlePlan ? "700px" : "580px",
            content: `
            <div class="sycc-modal-body">
                <div style="padding:9px 13px;border-radius:10px;background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.3);font-size:12.5px;font-weight:600;color:#b45309;">
                    ${escapeHtml(channels.announcement || DEFAULT_PRICING_CHANNELS.announcement)}
                </div>

                <div class="sycc-plan-grid" style="${bundlePlan ? "" : "grid-template-columns:1fr;"}">
                    <div class="sycc-plan-card is-featured">
                        <span class="sycc-plan-badge">${escapeHtml(proPlan.badge)}</span>
                        <div style="font-size:15px;font-weight:800;margin-bottom:4px;">${escapeHtml(proPlan.title)}</div>
                        <div>
                            <span class="sycc-price-num">¥${escapeHtml(proPlan.price)}</span>
                            <span class="sycc-price-orig">¥${escapeHtml(proPlan.original_price)}</span>
                            <span style="font-size:11.5px;color:#64748b;"> ${escapeHtml(proPlan.unit)}</span>
                        </div>
                        <ul class="sycc-plan-list">
                            ${(proPlan.highlights || []).map((h) => `<li>${escapeHtml(h)}</li>`).join("")}
                        </ul>
                    </div>
                    ${
                        bundlePlan
                            ? `<div class="sycc-plan-card">
                        <span class="sycc-plan-badge">${escapeHtml(bundlePlan.badge)}</span>
                        <div style="font-size:15px;font-weight:800;margin-bottom:4px;">${escapeHtml(bundlePlan.title)}</div>
                        <div>
                            <span class="sycc-price-num">¥${escapeHtml(bundlePlan.price)}</span>
                            <span class="sycc-price-orig">¥${escapeHtml(bundlePlan.original_price)}</span>
                            <span style="font-size:11.5px;color:#64748b;"> ${escapeHtml(bundlePlan.unit)}</span>
                        </div>
                        <ul class="sycc-plan-list">
                            ${(bundlePlan.highlights || []).map((h) => `<li>${escapeHtml(h)}</li>`).join("")}
                        </ul>
                    </div>`
                            : ""
                    }
                </div>

                <div class="sycc-channel-box">
                    <div style="font-size:12.5px;font-weight:700;">🛒 官方自助购买通道（24h 全自动秒发激活码）：</div>
                    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px;">
                        ${
                            channels.primary_url
                                ? `<a class="sycc-btn sycc-btn-gold" href="${escapeHtml(channels.primary_url)}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;width:100%;justify-content:center;">
                                    ${escapeHtml(channels.primary_label || "⚡ 立即前往爱发电获取激活码")}
                                </a>`
                                : ""
                        }
                        ${
                            channels.afdian_url
                                ? `<a class="sycc-btn sycc-btn-primary" href="${escapeHtml(channels.afdian_url)}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">
                                    ${escapeHtml(channels.afdian_label || "⚡ 备用通道：爱发电自动发卡")}
                                </a>`
                                : ""
                        }
                    </div>
                    <div style="font-size:11.5px;color:var(--b3-theme-on-surface);line-height:1.55;margin-top:6px;">
                        📦 <strong>自动取码说明：</strong>${escapeHtml(channels.xianyu_tip || "")}<br/>
                        💬 <strong>售后联系微信：</strong><code>${escapeHtml(channels.wechat_contact || "")}</code>（${escapeHtml(channels.wechat_tip || "")}）
                    </div>
                </div>

                <div style="margin-top:12px;">
                    <div style="font-size:12.5px;font-weight:700;margin-bottom:6px;">
                        🔐 输入离线激活码（粘贴 <code>SYCC-PRO-...</code> 正版激活码）
                    </div>
                    <div style="display:flex;gap:8px;">
                        <input class="sycc-input" id="syccLicenseInput" placeholder="粘贴您的 SYCC-PRO-XXXXXXXX-... 激活码" value="${escapeHtml(this.config.licenseKey || "")}" />
                        <button class="sycc-btn sycc-btn-primary" id="syccVerifyLicenseBtn" style="padding:0 18px;">立即离线激活</button>
                    </div>
                    <div id="syccLicenseMsg" style="font-size:12px;margin-top:8px;min-height:18px;color:${activePro ? "#059669" : "#64748b"};">
                        ${
                            activePro
                                ? `✅ 当前已激活【${this.config.licenseEdition}】终身授权（序列号：${escapeHtml(this.config.licenseSerial)}）`
                                : "采用 Ed25519 非对称加密离线验签，无需联网、不限设备台数，重装永久有效。"
                        }
                    </div>
                </div>
            </div>`,
            destroyCallback: () => this._activeDialogs.delete(dlg),
        });
        this._activeDialogs.add(dlg);

        const el = dlg.element;
        const licInput = el.querySelector("#syccLicenseInput");
        const licMsg = el.querySelector("#syccLicenseMsg");

        el.querySelector("#syccVerifyLicenseBtn")?.addEventListener("click", async () => {
            const raw = licInput.value.trim();
            if (!raw) {
                licMsg.style.color = "#dc2626";
                licMsg.textContent = "❌ 请先粘贴激活码";
                return;
            }
            const res = await LicenseVerifier.verify(raw);
            if (res.valid) {
                this.config.licenseKey = raw;
                this.config.licenseEdition = res.edition;
                this.config.licenseSerial = res.serial;
                await this.persistConfig();
                licMsg.style.color = "#059669";
                licMsg.textContent = `🎉 激活成功！已永久解锁【${res.edition === "BUNDLE" ? "旗舰联名终身版" : "PRO 终身专业版"}】（序列号：${res.serial}）`;
                showMessage("🎉 恭喜！思源映卡 Pro 终身专业版已激活！", 4000);
                if (typeof onActivatedCallback === "function") {
                    onActivatedCallback();
                }
                setTimeout(() => dlg.destroy(), 1100);
            } else {
                licMsg.style.color = "#dc2626";
                licMsg.textContent = `❌ 激活失败：${res.reason}`;
            }
        });
    }
}

CardCraftPlugin._internals = {
    LicenseVerifier,
    PureEd25519,
    ZipBuilder,
    SmartPaginationEngine,
    CardRenderer,
    WeChatFormatter,
    THEME_REGISTRY,
    ASPECT_RATIOS,
    DEFAULT_PRICING_CHANNELS,
};

module.exports = CardCraftPlugin;
