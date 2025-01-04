import React from "react";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Heading from "@theme/Heading";

import styles from "./styles.module.css";

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={styles.heroBanner}>
      <div className="container">
        <div className={styles.heroSection}>
          <div>
            <h1 className={styles.heroTitle}>
              eliza 是一个简单、快速且{" "}
              <span className={styles.headerTextGradient}>
                轻量级的 AI 代理
              </span>{" "}
              框架
            </h1>
            <p className={styles.heroSubtitle}>{siteConfig.tagline}</p>
            <div className={styles.buttonGroup}>
              <a
                className="button button--primary button--lg"
                href="./docs/intro/#"
              >
                开始使用
              </a>
              <div className={styles.githubButton}>
                <iframe
                  src="https://ghbtns.com/github-btn.html?user=elizaos&repo=eliza&type=star&count=true&size=large"
                  frameborder="0"
                  scrolling="0"
                  width="135"
                  height="30"
                  title="GitHub"
                ></iframe>
              </div>
            </div>
          </div>
          <div className={styles.heroRight}>
            <img
              src="/eliza/img/blurback.png"
              className={styles.blurPhoto}
              alt="模糊背景"
            />
            <pre className={styles.codeBlock}>
              <code className="language-bash">{`npm install @elizaos/core`}</code>
            </pre>
          </div>
        </div>
      </div>
    </header>
  );
}

export default HomepageHeader;
