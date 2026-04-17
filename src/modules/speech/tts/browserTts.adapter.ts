import type { TtsInput, TtsOutput, TtsProvider } from "./ttsProvider.interface.js";

export class BrowserTtsAdapter implements TtsProvider {
  readonly name = "browser-tts";

  async synthesize(_input: TtsInput): Promise<TtsOutput> {
    return {
      audioUrl: null,
      provider: this.name
    };
  }
}
