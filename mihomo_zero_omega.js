function main(config) {
  // 1. 筛选有效节点
  const generalRegex = /香港|日本|台湾|新加坡|HK|JP|TW|SG|狮城|🇭🇰|🇯🇵|🇹🇼|🇸🇬/i;
  const hkRegex = /香港|HK|🇭🇰/i;
  const aiRegex = /日本|台湾|新加坡|JP|TW|SG|狮城|🇯🇵|🇹🇼|🇸🇬/i;
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

  // 2. 建立策略组
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

  // 3. 配置远程规则集
  config["rule-providers"] = {
    openai: {
      type: "http",
      behavior: "domain",
      format: "mrs",
      url: "https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/openai.mrs",
      path: "./ruleset/openai.mrs",
      interval: 86400
    },
    gemini: {
      type: "http",
      behavior: "domain",
      format: "mrs",
      url: "https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/google-gemini.mrs",
      path: "./ruleset/google-gemini.mrs",
      interval: 86400
    }
  };

  // 4. 分流规则（Windows 纯浏览器插件模可去掉中间 3 条 CN/LAN 直连规则）
  config["rules"] = [
    "DOMAIN-KEYWORD,github,节点选择",
    "DOMAIN-SUFFIX,jsdelivr.net,节点选择",

    "RULE-SET,openai,AI",
    "RULE-SET,gemini,AI",
    "DOMAIN-SUFFIX,generativelanguage.googleapis.com,AI",
    "DOMAIN-SUFFIX,perplexity.ai,AI",
    
    "MATCH,节点选择"
  ];

  return config;
}

  return config;
}
