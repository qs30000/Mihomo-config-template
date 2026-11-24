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

  // 3. 极简分流规则（不依赖 GeoData，零额外内存开销）
  config["rules"] = [
    "DOMAIN-REGEX,^(.+\\.)?(openai|chatgpt|oaistatic|oaiusercontent|sora|gemini|aistudio|anthropic|claude|perplexity|copilot)\\.(com|ai|dev|net|org)$,AI",
    "DOMAIN-SUFFIX,generativelanguage.googleapis.com,AI",
    "MATCH,节点选择"
  ];

  return config;
}
