# Sources and Methods used in AI Development

## Sources

- [OpenAI API](https://platform.openai.com/docs/api-reference)
- [OpenAI API](https://platform.openai.com/docs/api-reference)
- [Which LLM writes the best SQL?](https://www.tinybird.co/blog-posts/which-llm-writes-the-best-sql)
- [We graded 19 LLMs on SQL. You graded us.](https://www.tinybird.co/blog-posts/we-graded-19-llms-on-sql-you-graded-us)
- [Ollama](https://ollama.com/)
- [Ollama API](https://ollama.com/docs/api)
- [Ollama API](https://ollama.com/docs/api)

Things we looked at:
- Simple SQL queries that got us most of the data we needed rather than using AI
  - Too many queries to build
- AI models that were good at SQL
  - We used `qwen2.5:7b-instruct` as our primary model after testing
  - Considered Code Llama and Mistral models based on TinyBird benchmarks
  - Settled on Qwen 2.5 for good SQL performance and reliability

## Implementation Results

After implementing the AI system with comprehensive security and geographic data:
- **98.9% geocoding success** (91/92 events)
- **6-layer security system** for read-only enforcement
- **Structured UI responses** with clickable event cards
- **Geographic query support** across all continents
- **Performance target**: <1000ms response time achieved

See `AI_CHANGELOG.md` for detailed implementation history.