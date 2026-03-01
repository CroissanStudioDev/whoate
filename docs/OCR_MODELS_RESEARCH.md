# OCR Models Research for Receipt Parsing

> Research conducted: March 2026
> Purpose: Finding the best vision-language models for multilingual receipt OCR

## Executive Summary

For WhoAte's receipt OCR, we recommend a **tiered approach**:

| Tier | Model | Cost | Best For |
|------|-------|------|----------|
| **Free** | Qwen2.5-VL 7B | $0 | Development, low volume |
| **Budget** | Qwen2.5-VL 7B (paid) | $0.20/M | Production, cost-sensitive |
| **Balanced** | Gemini 2.5 Flash | $0.10/M | High accuracy + speed |
| **Premium** | GPT-4o | $5.00/M | Maximum accuracy |

---

## Open Source Models (Self-Hosted)

### Tier 1: Specialized OCR Models (0.9B-3B)

#### GLM-OCR (0.9B) - **TOP PICK for Self-Hosting**
- **Score**: #1 on OmniDocBench V1.5 (94.62)
- **Languages**: 100+
- **License**: Apache 2.0 / MIT
- **Speed**: 1.86 PDF pages/sec
- **Output**: Markdown, JSON, LaTeX
- **Strengths**: Tables, formulas, seals, handwriting
- **Deployment**: vLLM, SGLang, Ollama, llama.cpp
- **VRAM**: ~2GB (quantized)
- **GitHub**: https://github.com/zai-org/GLM-OCR

```bash
# Ollama
ollama run glm-ocr

# llama.cpp
./llama-cli -m glm-ocr-q4_k_m.gguf --image receipt.jpg
```

#### PaddleOCR-VL 1.5 (0.9B)
- **Score**: 94.5% on OmniDocBench V1.5
- **Languages**: 109
- **License**: Apache 2.0
- **Strengths**: Real-world robustness, distortion handling
- **Size**: ~300MB (Q4_K_M)
- **Note**: Merged into llama.cpp (b8110, Feb 2026)

#### DeepSeek-OCR-2 (3B)
- **Architecture**: Visual causal flow for token compression
- **Tokens per page**: 256-1,120 (efficient)
- **Strengths**: Complex layouts, mixed content
- **License**: MIT

### Tier 2: General Vision-Language Models (7B+)

#### Qwen2.5-VL 7B - **Best Open VLM for OCR**
- **Benchmarks**: State-of-the-art on DocVQA, MathVista, RealWorldQA
- **Languages**: 20+ (including CJK, Arabic, Cyrillic)
- **Context**: 32K tokens
- **Video**: Up to 20 minutes
- **VRAM**: ~14GB (FP16), ~7GB (INT4)
- **License**: Apache 2.0

#### Qwen2.5-VL 32B
- **Better accuracy** than 7B on complex documents
- **VRAM**: ~64GB (FP16), ~20GB (INT4)

#### Qwen3-VL 30B/235B (MoE)
- **Latest generation** with reasoning capabilities
- **Context**: 131K tokens
- **Features**: Tool use, thinking mode

---

## Cloud APIs via OpenRouter

### Free Tier (Rate Limited)

| Model | ID | Context | Rate Limit |
|-------|-----|---------|------------|
| Qwen2.5-VL 7B | `qwen/qwen-2.5-vl-7b-instruct:free` | 32K | ~20 req/min |
| Qwen3-VL 30B | `qwen/qwen3-vl-30b-a3b-thinking` | 131K | ~10 req/min |
| OpenRouter Auto | `openrouter/free` | 200K | Vision + Tools |

### Paid Tier - Budget ($0.10-0.50/M tokens)

| Model | Input $/M | Output $/M | Best For |
|-------|-----------|------------|----------|
| **Qwen2.5-VL 7B** | $0.20 | $0.20 | Best value for receipts |
| **Gemini 2.5 Flash** | $0.10 | $0.40 | Speed + accuracy |
| Qwen2.5-VL 32B | $0.40 | $0.40 | Higher accuracy |
| Qwen3.5 Flash | $0.10 | $0.40 | Latest Qwen |

### Paid Tier - Standard ($1-5/M tokens)

| Model | Input $/M | Output $/M | Best For |
|-------|-----------|------------|----------|
| Claude Haiku 4.5 | $1.00 | $5.00 | Fast, good quality |
| Claude Sonnet 4.5 | $3.00 | $15.00 | Documents, reasoning |
| GPT-4o | $5.00 | $15.00 | Maximum accuracy |
| Gemini 2.5 Pro | $1.25 | $5.00 | Long documents |

### Paid Tier - Premium ($15+/M tokens)

| Model | Input $/M | Output $/M | Best For |
|-------|-----------|------------|----------|
| Claude Opus 4 | $15.00 | $75.00 | Complex analysis |
| GPT-5 | $10.00 | $30.00 | Handwriting (95% acc) |

---

## Benchmark Results (2026)

### OmniDocBench V1.5 (Document Parsing)

| Rank | Model | Score | Size |
|------|-------|-------|------|
| 1 | GLM-OCR | 94.62 | 0.9B |
| 2 | PaddleOCR-VL 1.5 | 94.50 | 0.9B |
| 3 | DeepSeek-OCR-2 | 93.80 | 3B |
| 4 | Qwen2.5-VL-72B | 92.10 | 72B |

### DocVQA (Document Q&A)

| Model | Score |
|-------|-------|
| GPT-4o | 92.8 |
| Gemini 2.5 Pro | 91.5 |
| Qwen2.5-VL 32B | 90.2 |
| Claude Sonnet 4.5 | 89.7 |
| Qwen2.5-VL 7B | 87.3 |

### Invoice Extraction Accuracy (Real-world)

| Model | Accuracy | Source |
|-------|----------|--------|
| Gemini 2.5 Pro | 94% | Gennai benchmark |
| GPT-4 + OCR | 91% | Gennai benchmark |
| Claude Sonnet 3.5 | 90% | Gennai benchmark |
| Azure Doc Intelligence | 96% | AIMultiple (printed) |

### Handwriting Recognition

| Model | Accuracy |
|-------|----------|
| GPT-5 | 95% |
| olmOCR-2 | 93% |
| Gemini 2.5 Pro | 91% |

---

## Language Support Comparison

| Model | Languages | Scripts | Notes |
|-------|-----------|---------|-------|
| **PaddleOCR-VL** | 109 | All major | Best coverage |
| **GLM-OCR** | 100+ | All major | Excellent CJK |
| EasyOCR | 80+ | Major scripts | Open source classic |
| Azure Doc Intelligence | 300+ | All | Enterprise |
| Qwen2.5-VL | 20+ | Latin, CJK, Arabic, Cyrillic | Good for receipts |
| GPT-4o | Most | All major | Excellent |

### Specifically Supported

- **Latin**: English, Spanish, French, German, Italian, Portuguese, etc.
- **Cyrillic**: Russian, Ukrainian, Bulgarian, Serbian
- **CJK**: Chinese (Simplified/Traditional), Japanese, Korean
- **Arabic**: Arabic, Persian, Urdu
- **Thai/Vietnamese/Indonesian**: Full support
- **Devanagari**: Hindi, Sanskrit
- **Other**: Greek, Hebrew, Turkish, Polish, Czech, Filipino

---

## Recommendations for WhoAte

### Default Configuration (Balanced)

```bash
# .env.local
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_API_KEY=sk-or-v1-your-key
OPENAI_MODEL=qwen/qwen-2.5-vl-7b-instruct
```

**Cost estimate**: ~$0.001 per receipt (500 input + 500 output tokens)

### Budget Configuration (Free)

```bash
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_API_KEY=sk-or-v1-your-key
OPENAI_MODEL=qwen/qwen-2.5-vl-7b-instruct:free
```

### Premium Configuration (Best Accuracy)

```bash
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_API_KEY=sk-or-v1-your-key
OPENAI_MODEL=google/gemini-2.5-flash
```

### Self-Hosted Configuration (Privacy)

```bash
OPENAI_BASE_URL=http://localhost:11434/v1
OPENAI_API_KEY=ollama
OPENAI_MODEL=glm-ocr
```

---

## Cost Analysis (1000 receipts/month)

| Configuration | Model | Monthly Cost |
|--------------|-------|--------------|
| Free | Qwen2.5-VL 7B (free) | $0 |
| Budget | Qwen2.5-VL 7B | ~$0.40 |
| Balanced | Gemini 2.5 Flash | ~$0.50 |
| Premium | GPT-4o | ~$10.00 |
| Self-hosted | GLM-OCR/Ollama | Electricity only |

---

## Sources

1. OmniDocBench V1.5 Leaderboard (Feb 2026)
2. regolo.ai - DeepSeek-OCR-2 vs GLM-OCR vs PaddleOCR Benchmark
3. AIMultiple - OCR Benchmark 2026
4. Gennai - Claude vs ChatGPT Invoice Processing
5. OpenRouter Pricing (Mar 2026)
6. Modal Blog - 8 Top Open-Source OCR Models
7. DataCamp - Top 10 Vision Language Models 2026
8. pricepertoken.com - LLM API Pricing
