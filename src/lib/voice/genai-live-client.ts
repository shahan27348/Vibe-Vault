import {
  GoogleGenAI,
  type LiveCallbacks,
  LiveClientToolResponse,
  type LiveConnectConfig,
  type LiveServerContent,
  LiveServerMessage,
  type LiveServerToolCall,
  type LiveServerToolCallCancellation,
  type Part,
  Session,
} from "@google/genai";
import EventEmitter from "eventemitter3";
import { DEFAULT_LIVE_API_MODEL } from "./constants";
import { difference } from "lodash";
import { base64ToArrayBuffer } from "./audio-utils";

export interface StreamingLog {
  count?: number;
  data?: unknown;
  date: Date;
  message: string | object;
  type: string;
}

export interface LiveClientEventTypes {
  audio: (data: ArrayBuffer) => void;
  close: (event: CloseEvent) => void;
  content: (data: LiveServerContent) => void;
  error: (e: ErrorEvent) => void;
  interrupted: () => void;
  log: (log: StreamingLog) => void;
  open: () => void;
  setupcomplete: () => void;
  toolcall: (toolCall: LiveServerToolCall) => void;
  toolcallcancellation: (
    toolcallCancellation: LiveServerToolCallCancellation
  ) => void;
  turncomplete: () => void;
  inputTranscription: (text: string, isFinal: boolean) => void;
  outputTranscription: (text: string, isFinal: boolean) => void;
}

export class GenAILiveClient extends EventEmitter<LiveClientEventTypes> {
  public readonly model: string = DEFAULT_LIVE_API_MODEL;
  protected readonly client: GoogleGenAI;
  protected session?: Session;

  private _status: "connected" | "disconnected" | "connecting" = "disconnected";
  public get status() {
    return this._status;
  }

  constructor(apiKey: string, model?: string) {
    super();
    if (model) this.model = model;
    this.client = new GoogleGenAI({ apiKey });
  }

  public async connect(config: LiveConnectConfig): Promise<boolean> {
    if (this._status === "connected" || this._status === "connecting") {
      return false;
    }

    this._status = "connecting";
    const callbacks: LiveCallbacks = {
      onopen: this.onOpen.bind(this),
      onmessage: this.onMessage.bind(this),
      onerror: this.onError.bind(this),
      onclose: this.onClose.bind(this),
    };

    try {
      this.session = await this.client.live.connect({
        model: this.model,
        config: { ...config },
        callbacks,
      });
    } catch (e: unknown) {
      console.error("Error connecting to GenAI Live:", e);
      this._status = "disconnected";
      this.session = undefined;
      const errorEvent = new ErrorEvent("error", {
        error: e,
        message: (e as Error)?.message || "Failed to connect.",
      });
      this.onError(errorEvent);
      return false;
    }

    this._status = "connected";
    return true;
  }

  public disconnect() {
    this.session?.close();
    this.session = undefined;
    this._status = "disconnected";
    this.log("client.close", "Disconnected");
    return true;
  }

  public send(parts: Part | Part[], turnComplete = true) {
    if (this._status !== "connected" || !this.session) {
      this.emit("error", new ErrorEvent("Client is not connected"));
      return;
    }
    this.session.sendClientContent({ turns: parts, turnComplete });
    this.log("client.send", parts);
  }

  public sendRealtimeInput(chunks: Array<{ mimeType: string; data: string }>) {
    if (this._status !== "connected" || !this.session) {
      this.emit("error", new ErrorEvent("Client is not connected"));
      return;
    }
    chunks.forEach((chunk) => {
      this.session!.sendRealtimeInput({ media: chunk });
    });
  }

  public sendToolResponse(toolResponse: LiveClientToolResponse) {
    if (this._status !== "connected" || !this.session) {
      this.emit("error", new ErrorEvent("Client is not connected"));
      return;
    }
    if (toolResponse.functionResponses?.length) {
      this.session.sendToolResponse({
        functionResponses: toolResponse.functionResponses!,
      });
    }
    this.log("client.toolResponse", { toolResponse });
  }

  protected onMessage(message: LiveServerMessage) {
    if (message.setupComplete) {
      this.emit("setupcomplete");
      return;
    }
    if (message.toolCall) {
      this.log("server.toolCall", message);
      this.emit("toolcall", message.toolCall);
      return;
    }
    if (message.toolCallCancellation) {
      this.log("receive.toolCallCancellation", message);
      this.emit("toolcallcancellation", message.toolCallCancellation);
      return;
    }

    if (message.serverContent) {
      const { serverContent } = message;
      if (serverContent.interrupted) {
        this.log("receive.serverContent", "interrupted");
        this.emit("interrupted");
        return;
      }

      if (serverContent.inputTranscription) {
        this.emit(
          "inputTranscription",
          serverContent.inputTranscription.text ?? "",
          (serverContent.inputTranscription as Record<string, unknown>).isFinal as boolean ?? false
        );
      }

      if (serverContent.outputTranscription) {
        this.emit(
          "outputTranscription",
          serverContent.outputTranscription.text ?? "",
          (serverContent.outputTranscription as Record<string, unknown>).isFinal as boolean ?? false
        );
      }

      if (serverContent.modelTurn) {
        const parts: Part[] = serverContent.modelTurn.parts || [];
        const audioParts = parts.filter((p) =>
          p.inlineData?.mimeType?.startsWith("audio/pcm")
        );
        const base64s = audioParts.map((p) => p.inlineData?.data);
        const otherParts = difference(parts, audioParts);

        base64s.forEach((b64) => {
          if (b64) {
            const data = base64ToArrayBuffer(b64);
            this.emit("audio", data);
          }
        });

        if (otherParts.length > 0) {
          const content: LiveServerContent = {
            modelTurn: { parts: otherParts },
          };
          this.emit("content", content);
        }
      }

      if (serverContent.turnComplete) {
        this.emit("turncomplete");
      }
    }
  }

  protected onError(e: ErrorEvent) {
    this._status = "disconnected";
    console.error("GenAI Live error:", e);
    this.emit("error", e);
  }

  protected onOpen() {
    this._status = "connected";
    this.emit("open");
  }

  protected onClose(e: CloseEvent) {
    this._status = "disconnected";
    this.emit("close", e);
  }

  protected log(type: string, message: string | object) {
    this.emit("log", { type, message, date: new Date() });
  }
}
