# OCR Models Research for Receipt Parsing

> Research conducted: March 2026
> Last updated: March 2026
> Purpose: Finding the best vision-language models for multilingual receipt OCR

## Executive Summary

For WhoAte's receipt OCR, we recommend **Gemini 3.1 Flash** as the default:

| Tier | Model | Cost/Receipt | Speed | Accuracy |
|------|-------|--------------|-------|----------|
| **Default** | Gemini 3.1 Flash | ~$0.0013 | 6s | ✅ Excellent |
| **Fast** | Gemini 2.5 Flash | ~$0.0021 | 3.4s | ✅ Excellent |
| **Budget** | Gemini 2.0 Flash | ~$0.0005 | 5s | ⚠️ No currency |
| **Free** | Qwen2.5-VL 7B | $0 | - | ⚠️ Tax handling |
| **Self-hosted** | GLM-OCR | $0 | - | ✅ Good |

### Key Finding: European VAT Handling

Serbian/European receipts have **VAT included** in prices. Models must understand this:

| Model | Total (expected: 6455 RSD) | Verdict |
|-------|---------------------------|---------|
| Gemini 3.1 Flash | 6455 ✅ | Correct |
| Gemini 2.5 Flash | 6455 ✅ | Correct |
| Gemini 2.0 Flash | 6455 ✅ | Correct (no currency) |
| Grok 4.1 Fast | 6455 ✅ | Correct but expensive |
| Grok 4 Fast | 6455 ✅ | Correct but very slow |
| Claude 4.6 Opus | 6455 ✅ | Correct |
| Gemini 2.5 Flash Lite | 7530.83 ❌ | Added tax on top |
| Qwen2.5-VL 7B | 7530.83 ❌ | Added tax on top |

---

## Real-World Benchmark Results

### Test: Serbian Restaurant Receipt

**Image**: Thermal receipt with 12 items, Cyrillic text, VAT included
**Expected**: total=6455 RSD, tax=1075.83 (already included)

| Model | Total | Time | Input Tokens | Output Tokens | Cost/Request |
|-------|-------|------|--------------|---------------|--------------|
| **gemini-3.1-flash** | ✅ 6455 | 6.1s | 559 | 750 | ~$0.0013 |
| **gemini-2.5-flash** | ✅ 6455 | 3.4s | 559 | 759 | ~$0.0021 |
| gemini-2.5-flash-lite | ❌ 7530.83 | 2.3s | 559 | 765 | ~$0.0005 |
| gemini-2.0-flash | ✅ 6455 | 4.9s | 1589 | 778 | ~$0.0005 |
| gemini-2.0-flash-lite | ❌ null | 5.5s | 1589 | 772 | ~$0.0003 |
| grok-4.1-fast | ✅ 6455 | ~15s | 2010 | 12208* | ~$0.0065 |
| grok-4-fast | ✅ 6455 | 107s | 2215 | 9644 | ~$0.005 |

*Grok 4.1 uses 11,604 reasoning tokens (95% of output)

### Winner: Gemini 3.1 Flash

- ✅ Correct total interpretation (VAT included)
- ✅ Detects currency (RSD)
- ✅ Cheapest accurate model ($0.0013/receipt)
- ⚠️ Slightly slower than 2.5 (6s vs 3.4s)

---

## Pricing Comparison (OpenRouter, March 2026)

### Vision Models - Budget Tier

| Model | Input $/M | Output $/M | Vision | Receipt Cost |
|-------|-----------|------------|--------|--------------|
| **gemini-3.1-flash** | $0.25 | $1.50 | ✅ | ~$0.0013 |
| gemini-2.5-flash | $0.30 | $2.50 | ✅ | ~$0.0021 |
| gemini-2.5-flash-lite | $0.10 | $0.40 | ✅ | ~$0.0005 |
| gemini-2.0-flash | $0.10 | $0.40 | ✅ | ~$0.0005 |
| gemini-2.0-flash-lite | $0.075 | $0.30 | ✅ | ~$0.0003 |
| grok-4.1-fast | $0.20 | $0.50 | ✅ | ~$0.0065* |
| grok-4-fast | $0.20 | $0.50 | ✅ | ~$0.005 |
| qwen-2.5-vl-7b | $0.20 | $0.20 | ✅ | ~$0.0003 |

*Grok uses excessive reasoning tokens

### Vision Models - Standard Tier

| Model | Input $/M | Output $/M | Receipt Cost |
|-------|-----------|------------|--------------|
| gemini-2.5-pro | $1.25 | $10.00 | ~$0.008 |
| grok-4 | $3.00 | $15.00 | ~$0.012 |
| claude-haiku-4.5 | $1.00 | $5.00 | ~$0.004 |
| gpt-4o | $5.00 | $15.00 | ~$0.014 |

### Vision Models - Premium Tier

| Model | Input $/M | Output $/M | Receipt Cost |
|-------|-----------|------------|--------------|
| claude-sonnet-4.6 | $3.00 | $15.00 | ~$0.012 |
| claude-opus-4.6 | $15.00 | $75.00 | ~$0.065 |

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

#### Qwen2.5-VL 7B
- **Benchmarks**: State-of-the-art on DocVQA, MathVista, RealWorldQA
- **Languages**: 20+ (including CJK, Arabic, Cyrillic)
- **Context**: 32K tokens
- **VRAM**: ~14GB (FP16), ~7GB (INT4)
- **License**: Apache 2.0
- **⚠️ Warning**: May incorrectly add tax on top for European receipts

---

## Recommendations for WhoAte

### Default Configuration (Best Value)

```bash
# .env.local
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_API_KEY=sk-or-v1-your-key
OPENAI_MODEL=google/gemini-3.1-flash-image-preview
```

**Cost estimate**: ~$0.0013 per receipt (~$1.30 per 1000 receipts)

### Fast Configuration (Lower Latency)

```bash
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_API_KEY=sk-or-v1-your-key
OPENAI_MODEL=google/gemini-2.5-flash
```

**Cost estimate**: ~$0.0021 per receipt (~$2.10 per 1000 receipts)

### Ultra-Budget Configuration

```bash
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_API_KEY=sk-or-v1-your-key
OPENAI_MODEL=google/gemini-2.0-flash-001
```

**Cost estimate**: ~$0.0005 per receipt (~$0.50 per 1000 receipts)
**⚠️ Note**: May not detect currency automatically

### Self-Hosted Configuration (Privacy)

```bash
OPENAI_BASE_URL=http://localhost:11434/v1
OPENAI_API_KEY=ollama
OPENAI_MODEL=glm-ocr
```

---

## Cost Analysis (1000 receipts/month)

| Configuration | Model | Monthly Cost | Accuracy |
|--------------|-------|--------------|----------|
| **Default** | Gemini 3.1 Flash | ~$1.30 | ✅ Excellent |
| Fast | Gemini 2.5 Flash | ~$2.10 | ✅ Excellent |
| Ultra-Budget | Gemini 2.0 Flash | ~$0.50 | ⚠️ No currency |
| Free (rate-limited) | Qwen2.5-VL 7B | $0 | ⚠️ Tax handling |
| Self-hosted | GLM-OCR/Ollama | Electricity | ✅ Good |
| Premium | GPT-4o | ~$14.00 | ✅ Excellent |

---

## Models NOT Recommended

| Model | Reason |
|-------|--------|
| **Gemini 2.5 Flash Lite** | Adds tax on top of VAT-inclusive totals |
| **Qwen2.5-VL 7B** | Same issue with European receipts |
| **Grok 4.x** | Excessive reasoning tokens (5x cost) |
| **Grok 4 Fast** | 107 seconds per request |

---

## Language Support Comparison

| Model | Languages | Scripts | Notes |
|-------|-----------|---------|-------|
| **PaddleOCR-VL** | 109 | All major | Best coverage |
| **GLM-OCR** | 100+ | All major | Excellent CJK |
| Gemini 3.1 Flash | Most | All major | Tested with Cyrillic |
| Qwen2.5-VL | 20+ | Latin, CJK, Arabic, Cyrillic | Good for receipts |
| GPT-4o | Most | All major | Excellent |

### Specifically Supported

- **Latin**: English, Spanish, French, German, Italian, Portuguese, etc.
- **Cyrillic**: Russian, Ukrainian, Bulgarian, Serbian ✅
- **CJK**: Chinese (Simplified/Traditional), Japanese, Korean
- **Arabic**: Arabic, Persian, Urdu
- **Thai/Vietnamese/Indonesian**: Full support
- **Other**: Greek, Hebrew, Turkish, Polish, Czech

---

## Academic Benchmarks (2026)

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

---

## Sources

1. OmniDocBench V1.5 Leaderboard (Feb 2026)
2. OpenRouter API - Model Pricing (Mar 2026)
3. WhoAte Internal Benchmark - Serbian Receipt Test (Mar 2026)
4. regolo.ai - DeepSeek-OCR-2 vs GLM-OCR vs PaddleOCR Benchmark
5. AIMultiple - OCR Benchmark 2026
6. Gennai - Claude vs ChatGPT Invoice Processing
