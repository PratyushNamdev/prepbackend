export type SttInput = {
  audioUrl?: string;
  transcriptText?: string;
};

export type SttOutput = {
  transcript: string;
  confidence: number | null;
  provider: string;
};

export interface SttProvider {
  readonly name: string;
  transcribe(input: SttInput): Promise<SttOutput>;
}
