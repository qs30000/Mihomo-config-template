// 地区与排除正则定义
const HK_REGEX = /香港|HK|🇭🇰/i;
const JP_TW_SG_REGEX = /日本|台湾|新加坡|JP|TW|SG|新北|台北|狮城|🇯🇵|🇹🇼|🇸🇬/i;
const EXCLUDE_REGEX = /3x|5x|流量|官网|过期/i;

function main(config) {
  const rawProxies = config.proxies || [];
  if (rawProxies.length === 0) return config;

  // 1. 节点名称去重函数（防止机场订阅本身存在重名节点报错）
  const uniqueProxies = [];
  const seenNames = new Set();
  
  for (const p of rawProxies) {
    let name = p.name;
    if (seenNames.has(name)) {
      let counter = 1;
      while (seenNames.has(`${name} (${counter})`)) {
        counter++;
      }
      name = `${name} (${counter})`;
      p.name = name;
    }
    seenNames.add(name);
    uniqueProxies.push(p);
  }

  // 2. 筛选目标地区有效节点
  const hkProxies = uniqueProxies.filter(p => HK_REGEX.test(p.name) && !EXCLUDE_REGEX.test(p.name));
  const jpTwSgProxies = uniqueProxies.filter(p => JP_TW_SG_REGEX.test(p.name) && !EXCLUDE_REGEX.test(p.name));

  const hkNames = hkProxies.map(p => p.name);
  const jpTwSgNames = jpTwSgProxies.map(p => p.name);

  // 合并筛选后的节点列表
  const filteredProxies = [...hkProxies, ...jpTwSgProxies];

  // 覆盖原节点列表（若筛选为空则保留去重后的全量节点防崩溃）
  config.proxies = filteredProxies.length > 0 ? filteredProxies : uniqueProxies;
  const activeProxyNames = config.proxies.map(p => p.name);

  // 3. 彻底重写代理组
  const proxyGroups = [];

  // 主手动选择组
  proxyGroups.push({
    name: "节点选择",
    type: "select",
    proxies: ["港日台新-全自动测速", "香港-自动测速", "日台新-自动测速", ...activeProxyNames]
  });

  // 全自动测速组
  proxyGroups.push({
    name: "港日台新-全自动测速",
    type: "url-test",
    url: "http://www.gstatic.com/generate_204",
    interval: 300,
    tolerance: 50,
    proxies: activeProxyNames
  });

  // 香港独立自动测速组
  if (hkNames.length > 0) {
    proxyGroups.push({
      name: "香港-自动测速",
      type: "url-test",
      url: "http://www.gstatic.com/generate_204",
      interval: 300,
      tolerance: 50,
      proxies: hkNames
    });
  }

  // 日台新独立自动测速组
  if (jpTwSgNames.length > 0) {
    proxyGroups.push({
      name: "日台新-自动测速",
      type: "url-test",
      url: "http://www.gstatic.com/generate_204",
      interval: 300,
      tolerance: 50,
      proxies: jpTwSgNames
    });
  }

  // 统一的【AI】聚合策略组（默认采用日台新自动测速）
  proxyGroups.push({
    name: "AI",
    type: "select",
    proxies: ["日台新-自动测速", "节点选择", ...jpTwSgNames]
  });

  config['proxy-groups'] = proxyGroups;

  // 4. 重构匹配规则（整合主流大陆无法使用的海外 AI 平台）
config.rules = [
    // 1. 核心基础设施：确保 GeoData 数据库与 GitHub 正常更新
    "DOMAIN-SUFFIX,github.com,节点选择",
    "DOMAIN-SUFFIX,githubusercontent.com,节点选择",
    "DOMAIN-SUFFIX,jsdelivr.net,节点选择",
    "DOMAIN-KEYWORD,github,节点选择",

    // 坚果云与 Obsidian WebDAV 专项（绕过公司内网解析）
    // "DOMAIN,dav.jianguoyun.com,节点选择",
    // "DOMAIN-KEYWORD,jianguoyun,节点选择",
    // "DOMAIN-SUFFIX,nutstore.net,节点选择",

    // 3. AI 专项规则（全部集中走 AI 组 -> 日台新节点）
    // OpenAI / ChatGPT
    "GEOSITE,openai,AI",
    "DOMAIN-KEYWORD,openai,AI",

    // Google Gemini / AI Studio（补全关联域名，防止页面加载异常）
    "GEOSITE,google-gemini,AI",
    "DOMAIN-SUFFIX,gemini.google.com,AI",
    "DOMAIN-SUFFIX,aistudio.google.com,AI",
    "DOMAIN-SUFFIX,ai.google.dev,AI",
    "DOMAIN-SUFFIX,generativelanguage.googleapis.com,AI",
    "DOMAIN-KEYWORD,gemini,AI",

    // Anthropic Claude
    "GEOSITE,anthropic,AI",
    "DOMAIN-KEYWORD,anthropic,AI",
    "DOMAIN-KEYWORD,claude,AI",

    // Perplexity & Copilot
    "DOMAIN-SUFFIX,perplexity.ai,AI",
    "DOMAIN-SUFFIX,copilot.microsoft.com,AI",

    // 4. 国内域名直连（纯域名匹配，不触发 DNS 解析）
    "GEOSITE,CN,DIRECT",

    // 5. IP 规则放在最后，避免提前触发 DNS 解析干扰上面的域名分流
    "GEOIP,LAN,DIRECT",
    "GEOIP,CN,DIRECT",

    // 6. 兜底规则
    "MATCH,节点选择"
  ];

  return config;
}
