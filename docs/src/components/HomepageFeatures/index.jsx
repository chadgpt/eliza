import React from "react";
import clsx from "clsx";
import Heading from "@theme/Heading";
import styles from "./styles.module.css";

const FeatureList = [
  {
    icon: "🤖",
    title: "多代理框架",
    description: (
      <>
        构建和部署具有一致个性的<strong>自主AI代理</strong>，支持Discord、Twitter和Telegram。全面支持语音、文本和媒体交互。
      </>
    ),
  },
  {
    icon: "🧠",
    title: "高级功能",
    description: (
      <>
        内置RAG记忆系统、文档处理、媒体分析和自主交易功能。支持包括Llama、GPT-4和Claude在内的多种AI模型。
      </>
    ),
  },
  {
    icon: "🔌",
    title: "可扩展设计",
    description: (
      <>
        通过<b>模块化插件系统</b>创建自定义操作、添加新平台集成并扩展功能。全面支持TypeScript。
      </>
    ),
  },
];

function Feature({ icon, title, description }) {
  return (
    <div className={clsx("col")}>
      <div
        className="margin--md"
        style={{
          height: "100%",
        }}
      >
        <div className="card__body text--left padding--md">
          <icon className={styles.featureIcon}>{icon}</icon>
          <Heading
            as="h3"
            style={{
              color: "var(--ifm-heading-color)",
            }}
          >
            {title}
          </Heading>
          <p>{description}</p>
        </div>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          <div className={styles.featureGrid}>
            {FeatureList.map((props, idx) => (
              <Feature key={idx} {...props} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}