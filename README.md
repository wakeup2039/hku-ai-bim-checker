# 🏗️ HKU AI+BIM 智能合规审查 Agent (Design Rule Checker)

这是一个基于 Streamlit 与 Plotly 构建的轻量级 BIM/CAD 语义合规审查 Agent 微原型 (MVP)。

---

## 🌐 项目链接 (Project Links)
- **Live Demo (Replit)**: [https://replit.com/@intonly1/Design-Rule-Checker](https://replit.com/@intonly1/Design-Rule-Checker)
- **GitHub Repository**: [https://github.com/wakeup2039/hku-ai-bim-checker](https://github.com/wakeup2039/hku-ai-bim-checker)

---

## 💬 核心提示词 (System & Development Prompts)

### 1. 业务逻辑与法规审查 Prompt (Compliance Engine)
> "请帮我设计一个基于 Streamlit 的轻量化 BIM/CAD 语义合规审查 Agent。读取包含楼层、房间（rooms）和门（doors）属性的 JSON 文件，自动根据国家《GB 50016 建筑设计防火规范》检查疏散门净宽（≥900mm）以及房间疏散距离（≤30m）。若违规，需输出具可解释性的整改建议和法规依据。"

### 2. 可视化与 HCI 交互 Prompt (Topology Tree View)
> "请在 Streamlit 中使用 Plotly 库增加一个 2D 拓扑关系图（Topology Tree View）。考虑到输入的 JSON 可能缺乏物理空间坐标，请通过 Building -> Floor -> Elements 的层级逻辑绘制网络节点。合规节点标记为绿/蓝色，违规节点（如门宽不足或距离超标）标红高亮。"

### 3. 系统健壮性与防崩溃 Prompt (Defensive Engineering)
> "请重构代码中的 JSON 解析和错误处理逻辑，要求兼容 `{ building: { name }, floors: [...] }` 标准结构。若用户上传了非标准文件或解析失败，请自动降级加载内置的默认数据，确保 UI 页面绝不崩溃。"

---

## ✨ 项目核心亮点 (Key Features)
1. **轻量语义化（Semantic-First）**：无需依赖复杂 3D 引擎，通过 pure JSON 提取秒级完成逻辑判定。
2. **创新拓扑图高亮（Topology Mapping）**：解决了工程数据常缺失空间坐标的痛点，通过树状关系实现图文双向联动。
3. **精准可解释性（Explainable Compliance）**：精准对齐《GB 50016-2014》规范，并给出量化的整改建议（如“建议至少拓宽 100mm”）。
