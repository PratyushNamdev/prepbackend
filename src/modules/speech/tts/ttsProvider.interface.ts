export type TtsInput = {
  text: string;
  language: "en" | "hinglish";
};

export type TtsOutput = {
  audioUrl: string | null;
  provider: string;
};

export interface TtsProvider {
  readonly name: string;
  synthesize(input: TtsInput): Promise<TtsOutput>;
}
