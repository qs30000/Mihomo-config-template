function main(config) {
  // 1. 筛选有效节点
  const generalRegex = /香港|日本|台湾|新加坡|HK|JP|TW|SG|狮城/i;
  const hkRegex = /香港|HK|🇭🇰/i;
  const aiRegex = /日本|台湾|新加坡|JP|TW|SG|狮城/i;
  const excludeRegex = /倍率|剩余|到期|官网|流量|3x|5x|Traffic|Expire/i;

  const validProxies = (config.proxies || []).filter(
    (p) => generalRegex.test(p.name) && !excludeRegex.test(p.name)
  );
  config.proxies = validProxies;

  const allNames = validProxies.map((p) => p.name);
  const hkNames = validProxies
    .filter((p) => hkRegex.test(p.name))
    .map((p) => p.name);
  const aiNames = validProxies
    .filter((p) => aiRegex.test(p.name))
    .map((p) => p.name);

  // 2. 建立策略组：香港自动测速 + 日常节点选择 + AI 自动测速 + AI 专用节点
  config["proxy-groups"] = [
    {
      name: "节点选择",
      type: "select",
      proxies: hkNames.length > 0 ? ["香港-自动测速", ...allNames] : allNames
    },
    {
      name: "香港-自动测速",
      type: "url-test",
      url: "https://cp.cloudflare.com/generate_204",
      interval: 300,
      tolerance: 50,
      proxies: hkNames.length > 0 ? hkNames : allNames
    },
    {
      name: "AI",
      type: "select",
      proxies: aiNames.length > 0 ? ["AI-自动测速", ...aiNames] : allNames
    },
    {
      name: "AI-自动测速",
      type: "url-test",
      url: "https://cp.cloudflare.com/generate_204",
      interval: 300,
      tolerance: 50,
      proxies: aiNames.length > 0 ? aiNames : allNames
    }
  ];

  // 3. 完整分流规则（适配系统代理全局接管模式）
  config["rules"] = [
    // 基础设施与规则库更新（防止 GitHub 无法访问导致 GeoData 更新失败）
    "DOMAIN-SUFFIX,github.com,节点选择",
    "DOMAIN-SUFFIX,githubusercontent.com,节点选择",
    "DOMAIN-SUFFIX,jsdelivr.net,节点选择",
    "DOMAIN-KEYWORD,github,节点选择",

    // 海外 AI 专项分流（走 AI 组 -> 日台新自动测速）
    "DOMAIN-REGEX,^(.+\\.)?(openai|chatgpt|oaistatic|oaiusercontent|sora|gemini|aistudio|anthropic|claude|perplexity|copilot)\\.(com|ai|dev|net|org)$,AI",
    "DOMAIN-SUFFIX,generativelanguage.googleapis.com,AI",

    // 国内域名与局域网/国内 IP 直连（开启系统代理后必须保留）
    "GEOSITE,CN,DIRECT",
    "GEOIP,LAN,DIRECT",
    "GEOIP,CN,DIRECT",

    // 其余海外站点兜底走日常节点
    "MATCH,节点选择"
  ];

  return config;
}
