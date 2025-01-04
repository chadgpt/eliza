/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  tutorialSidebar: [
    {
      type: "doc",
      id: "intro",
      label: "🚀 简介",
    },
    {
      type: "category",
      label: "🏁 入门指南",
      items: [
        {
          type: "doc",
          id: "quickstart",
          label: "⭐ 快速开始",
        },
        {
          type: "doc",
          id: "faq",
          label: "❓ 常见问题",
        },
      ],
      collapsed: false,
    },
    {
      type: "category",
      label: "🧠 核心概念",
      collapsed: false,
      items: [
        {
          type: "doc",
          id: "core/characterfile",
          label: "角色文件",
        },
        {
          type: "doc",
          id: "core/agents",
          label: "代理",
        },
        {
          type: "doc",
          id: "core/providers",
          label: "提供者",
        },
        {
          type: "doc",
          id: "core/actions",
          label: "操作",
        },
        {
          type: "doc",
          id: "core/evaluators",
          label: "评估者",
        },
      ],
    },
    {
      type: "category",
      label: "📘 指南",
      collapsed: false,
      items: [
        {
          type: "doc",
          id: "guides/configuration",
          label: "配置",
        },
        {
          type: "doc",
          id: "guides/advanced",
          label: "高级用法",
        },
        {
          type: "doc",
          id: "guides/secrets-management",
          label: "秘密管理",
        },
        {
          type: "doc",
          id: "guides/local-development",
          label: "本地开发",
        },
        {
            type: "doc",
            id: "guides/wsl",
            label: "WSL 设置",
        },
      ],
    },
    {
      type: "category",
      label: "🎓 高级主题",
      collapsed: false,
      items: [
        {
          type: "doc",
          id: "advanced/fine-tuning",
          label: "微调",
        },
        {
          type: "doc",
          id: "advanced/infrastructure",
          label: "基础设施",
        },
        {
          type: "doc",
          id: "advanced/trust-engine",
          label: "信任引擎",
        },
        {
          type: "doc",
          id: "advanced/autonomous-trading",
          label: "自主交易",
        },
        {
            type: "doc",
            id: "advanced/eliza-in-tee",
            label: "TEE 中的 Eliza",
          },
      ],
    },
    {
      type: "category",
      label: "📦 软件包",
      collapsed: false,
      items: [
        {
          type: "doc",
          id: "packages/packages",
          label: "概述",
        },
        {
          type: "doc",
          id: "packages/core",
          label: "核心包",
        },
        {
          type: "doc",
          id: "packages/adapters",
          label: "数据库适配器",
        },
        {
          type: "doc",
          id: "packages/clients",
          label: "客户端包",
        },
        {
          type: "doc",
          id: "packages/agent",
          label: "代理包",
        },
        {
          type: "doc",
          id: "packages/plugins",
          label: "插件系统",
        },
      ],
    }
  ],
};

export default sidebars;