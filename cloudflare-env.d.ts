declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    DEEPSEEK_API_KEY?: string;
    DEEPSEEK_MODEL?: string;
    TAVILY_API_KEY?: string;
    BUCKET?: R2Bucket;
  }
}
