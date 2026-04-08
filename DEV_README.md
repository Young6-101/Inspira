# Inspira 开发指南（内部文档，上线前删除）

## 🎯 项目是什么？

**Inspira** 是一个基于云端部署的多模态 AI 灵感引擎。

**核心理念**：用户在日常生活中会无意识地积累大量素材（截图、PDF、PPT、录音、笔记等），但自己说不清楚为什么喜欢这些。Inspira 的工作就是分析用户无意识聚合的这些素材，**发现隐藏的模式（Pattern）和潜意识偏好**，然后以此为基础提供具有启发性的灵感建议。

**一句话定位**：NotebookLM 是帮你找答案，Inspira 是帮你**发现你自己都没意识到的审美/思维偏好**。

---

## 💡 和市面产品的区别

| 功能 | NotebookLM | ChatGPT | Inspira |
|------|-----------|---------|---------|
| 核心功能 | 文档问答检索 | 通用聊天 | **潜意识模式发现 + 灵感生成** |
| 跨模态检索（图搜文 / 文搜图） | ❌ | ❌ | ✅ |
| 推理过程透明可视化 | ❌ | ❌ | ✅ |
| 自动检测并拒绝无用/幻觉回复 | ❌ | ❌ | ✅ |
| 推理流程可自定义 | ❌ | ❌ | ✅ |
| 支持私有化部署（不传数据给第三方） | ❌ | ❌ | ✅ |

---

## 🏗️ 系统架构总览

```
用户浏览器
    │
    ▼
[inspira.你的域名.com]  ← DNS 子域名解析
    │
    ▼
┌────────────────────────────────────────────────────────┐
│              AWS 云端基础设施                              │
│                                                        │
│   ┌──────────────┐                                     │
│   │  CloudFront  │ ← CDN 加速（全球边缘节点分发前端）       │
│   └──────┬───────┘                                     │
│          │                                             │
│   ┌──────▼───────┐                                     │
│   │   S3 Bucket  │ ← 存储 React 编译后的静态文件            │
│   └──────────────┘                                     │
│                                                        │
│   ┌──────────────┐     ┌──────────────┐                │
│   │   ECS        │     │ ElastiCache  │                │
│   │  (Fargate)   │────▶│   (Redis)    │                │
│   │  FastAPI     │     │ Embedding缓存 │                │
│   │  容器化后端   │     └──────────────┘                │
│   └──────┬───────┘                                     │
│          │                                             │
│   ┌──────▼───────┐                                     │
│   │  EFS 持久卷   │ ← ChromaDB 向量数据库存储             │
│   └──────────────┘                                     │
└────────────────────────────────────────────────────────┘
           │
           │ API 调用（不需要 GPU）
           ▼
    ┌──────────────┐
    │  OpenAI API  │  LLM 推理 / Embedding / Whisper
    │  / Gemini    │
    └──────────────┘
```

---

## 🔧 AWS 微服务分工表

> 每个成员认领对应模块即可。

| AWS 服务 | 做什么 | 对应代码 | 负责人 |
|----------|-------|---------|--------|
| **Amazon S3** | 存放前端打包后的静态文件（HTML/CSS/JS） | `frontend v2/dist/` | |
| **Amazon CloudFront** | CDN 分发前端资源，全球加速 + 自带 DDoS 防护 | 配置项，不涉及代码 | |
| **Amazon Route 53** | 管理子域名 `inspira.xxx.com` 指向 CloudFront | 配置项 | |
| **AWS Certificate Manager (ACM)** | 自动签发 HTTPS SSL 证书 | 配置项 | |
| **Amazon ECR** | 存放 Docker 镜像（后端打包好的容器） | `backend/Dockerfile` | |
| **Amazon ECS (Fargate)** | 运行后端 FastAPI 容器（Serverless，不需要管服务器） | `backend/main.py` | |
| **Amazon EFS** | 给 ECS 容器挂载持久化存储（ChromaDB 数据不丢失） | `backend/rag_engine/vector_store.py` | |
| **Amazon ElastiCache (Redis)** | 缓存 Embedding 结果，避免重复调 API 浪费钱 | `backend/rag_engine/embedder.py`（待改造） | |

---

## 🧠 核心推理流程（LangGraph 状态机）

这是我们项目最核心的技术亮点，一个**带自省循环的多模态洞察引擎**：

```
用户素材库（无意识聚合的图片/笔记/PDF/音频）
                    │
           用户请求灵感
                    ▼
        ┌───────────────────────┐
        │  Cross-Modal Retriever │  ← 跨模态检索（文搜图、图搜文）
        │  (jina-clip-v1)        │    把文字和图片映射到同一个向量空间
        └───────────┬───────────┘
                    │ 抓取 5-10 个高度相关的异构碎片
                    ▼
  ┌─── [幻觉?回退] ─── Pattern Synthesis Agent ───┐
  │                  │                              │
  │                  │ 提炼共性："极简几何"/"复古暖色"   │
  │                  ▼                              │
  │  ┌─ [太无聊?重来] ── Insight Generator ──┐      │
  │  │               │                       │      │
  │  │               ▼                       │      │
  │  │        Inspiration Grader             │      │
  │  │         (自省评估节点)                  │      │
  │  │               │                       │      │
  │  │    ┌──────────┼──────────┐            │      │
  │  │    │          │          │            │      │
  │  │ [太无聊]   [幻觉]    [新颖且有依据]    │      │
  │  │    │          │          │            │      │
  │  └────┘          │       输出给用户       │      │
  │                  │      （灵感建议）       │      │
  └──────────────────┘                       │      │
         LangGraph 循环反馈                          │
```

**关键技术点：**
1. **Cross-Modal Retriever**：不是简单的文字搜文字，而是用 `jina-clip-v1` 把图片和文字嵌入到同一个向量空间，实现"用文字搜到相关图片"或"用图片搜到相关文字"。
2. **Pattern Synthesis Agent**：LLM 节点，任务不是回答问题，而是分析这堆碎片的"共同特征"——审美、情绪、逻辑上的潜意识偏好。
3. **Inspiration Grader（自省循环）**：生成的灵感如果太普通（比如"你喜欢好看的东西"）会被打回重新生成（调高 Temperature 增加随机性）；如果是幻觉（瞎编的）会打回到更上一级重新分析 Pattern。这个循环就是 **LangGraph StateGraph 的条件边（Conditional Edge）+ 循环**。
4. **Streaming + 可视化**：前端实时展示推理链的每个步骤 `🔍检索中... → 📊提炼模式... → 🧠生成灵感... → ✅验证通过`，用户能看到 AI 是怎么"想"的。

---

## 📁 后端代码结构

```
backend/
├── main.py                    # FastAPI 入口，所有 API endpoint
├── requirements.txt           # Python 依赖
├── settings.py                # 环境变量配置
├── config/                    # 配置文件
├── file_processor/            # 文件处理模块
│   ├── pdf_handler.py         # PDF 文本提取
│   ├── ppt_handler.py         # PPT 文本提取
│   ├── audio_handler.py       # 音频转文字（Whisper）
│   ├── image_handler.py       # 图片描述生成（Vision模型）
│   └── text_splitter.py       # 文本分块
├── rag_engine/                # RAG 引擎
│   ├── embedder.py            # 文本和图片向量化
│   ├── retriever.py           # 统一检索器（文本+图片）
│   └── vector_store.py        # ChromaDB 向量数据库
├── reasoning/                 # LangGraph 推理引擎（核心）
│   ├── graph.py               # 状态机定义（节点 + 边 + 条件分支）
│   ├── nodes.py               # 各个推理节点的实现
│   ├── model_client.py        # LLM 客户端（可切换 OpenAI/Gemini/Ollama）
│   └── state.py               # 图状态定义
└── training/                  # 模型微调（预留）
    ├── sft_train.py
    └── dataset/
```

---

## ⚡ 开发注意事项

### 模型调用方式
- **本地开发**：可以用 Ollama 跑本地模型（llama3, moondream），免费但需要 GPU
- **云端部署**：全部换成 API 调用（OpenAI / Gemini），不需要 GPU
- 切换方式：只需改 `model_client.py` 和 `embedder.py` 里的几行代码

### 部署路径
1. 前端：`npm run build` → 产物丢进 S3 → CloudFront 分发
2. 后端：写 Dockerfile → push 到 ECR → ECS Fargate 拉取运行
3. 域名：Route 53 加一条 CNAME 记录 `inspira.xxx.com` → CloudFront 域名

### 开发分工建议
| 模块 | 工作内容 | 预估时间 |
|------|---------|---------|
| **LangGraph 推理引擎改造** | 把 graph.py 从线性改成带自省循环的状态机 | 2-3 天 |
| **前端 Streaming UI** | 接入 SSE，实时展示推理链步骤 | 2-3 天 |
| **AWS 基础设施搭建** | S3 + CloudFront + ECS + Route53 配置 | 1-2 天 |
| **Docker 容器化** | 写 Dockerfile + docker-compose | 1 天 |
| **Embedding 缓存** | 接入 Redis，重复内容不重复调 API | 1 天 |
| **RAGAS 评估** | 跑评估指标，收集数据写报告 | 1-2 天 |

---

## 🔗 参考资料（开发时可以看）
- [LangGraph 官方文档](https://langchain-ai.github.io/langgraph/)
- [Corrective RAG 论文 (CRAG)](https://arxiv.org/abs/2401.15884)
- [RAGAS 评估框架](https://docs.ragas.io/)
- [AWS ECS Fargate 入门](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html)
- [jina-clip-v1 模型](https://huggingface.co/jinaai/jina-clip-v1)
