import type { SttInput, SttOutput, SttProvider } from "./sttProvider.interface.js";

export class BrowserTranscriptAdapter implements SttProvider {
  readonly name = "browser-transcript";

  async transcribe(input: SttInput): Promise<SttOutput> {
    return {
      transcript: input.transcriptText ?? "",
      confidence: null,
      provider: this.name
    };
  }
}
