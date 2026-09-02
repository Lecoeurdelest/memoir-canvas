/** Current WebMCP plus the two earlier challenge API shapes. */

import type { ToolDescriptor } from './descriptors';

export interface WebMcpTool {
  name: string;
  description: string;
  inputSchema: ToolDescriptor['inputSchema'];
  annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
  execute: (args: unknown) => Promise<unknown>;
}

export interface ModelContextLike {
  provideContext?: (ctx: { tools: WebMcpTool[] }) => void | Promise<void>;
  registerTool?: (tool: WebMcpTool, options?: { signal?: AbortSignal }) => void | Promise<void>;
  unregisterTool?: (name: string) => void | Promise<void>;
}

export type ModelContextFlavour = 'navigator' | 'document' | 'absent';

export type RegistrationStatus = 'absent' | 'registering' | 'ready' | 'error';
export interface ModelContextReport {
  status: RegistrationStatus;
  registered: number;
  message: string | null;
}

export interface Detected {
  flavour: ModelContextFlavour;
  mc: ModelContextLike | null;
}

export function detectModelContext(): Detected {
  const doc = (globalThis as { document?: { modelContext?: ModelContextLike } }).document;
  if (doc?.modelContext) return { flavour: 'document', mc: doc.modelContext };

  const nav = (globalThis as { navigator?: { modelContext?: ModelContextLike } }).navigator;
  if (nav?.modelContext) return { flavour: 'navigator', mc: nav.modelContext };

  return { flavour: 'absent', mc: null };
}

export interface ToolHandler {
  (args: unknown): Promise<unknown>;
}

export class ModelContextBridge {
  readonly flavour: ModelContextFlavour;
  private readonly mc: ModelContextLike | null;
  private desired: ToolDescriptor[] = [];
  private handlers: Record<string, ToolHandler> = {};
  private registrations = new Map<ToolDescriptor['name'], AbortController>();
  private work: Promise<void> = Promise.resolve();
  private disposed = false;
  private readonly report: (report: ModelContextReport) => void;

  constructor(
    detected: Detected = detectModelContext(),
    report: (report: ModelContextReport) => void = () => undefined,
  ) {
    this.flavour = detected.flavour;
    this.mc = detected.mc;
    this.report = report;
  }

  get available(): boolean {
    return this.mc !== null;
  }

  provide(tools: ToolDescriptor[], handlers: Record<string, ToolHandler>): void {
    if (this.disposed) return;
    this.desired = tools;
    this.handlers = handlers;
    if (!this.mc) {
      this.report({ status: 'absent', registered: 0, message: null });
      return;
    }
    this.report({ status: 'registering', registered: this.registrations.size, message: null });
    this.work = this.work.then(() => this.synchronise()).catch((error: unknown) => {
      this.report({
        status: 'error',
        registered: this.registrations.size,
        message: error instanceof Error ? error.message : String(error),
      });
    });
  }

  private asTool(descriptor: ToolDescriptor): WebMcpTool {
    return {
      ...descriptor,
      annotations: {
        readOnlyHint: descriptor.name === 'read_memory_graph',
        untrustedContentHint: true,
      },
      execute: async (args: unknown) => {
        if (!this.desired.some((tool) => tool.name === descriptor.name)) {
          return {
            ok: false,
            error: { kind: 'refused', message: `${descriptor.name} is not available on this page now` },
          };
        }
        const handler = this.handlers[descriptor.name];
        if (!handler) throw new Error(`no handler for ${descriptor.name}`);
        return handler(args);
      },
    };
  }

  private async synchronise(): Promise<void> {
    if (!this.mc || this.disposed) return;
    const names = new Set(this.desired.map((tool) => tool.name));

    if (this.mc.registerTool) {
      for (const [name, controller] of this.registrations) {
        if (names.has(name)) continue;
        controller.abort();
        await this.mc.unregisterTool?.(name);
        this.registrations.delete(name);
      }
      for (const descriptor of this.desired) {
        if (this.disposed) return;
        if (this.registrations.has(descriptor.name)) continue;
        const controller = new AbortController();
        this.registrations.set(descriptor.name, controller);
        try {
          await this.mc.registerTool(this.asTool(descriptor), { signal: controller.signal });
        } catch (error) {
          controller.abort();
          this.registrations.delete(descriptor.name);
          throw error;
        }
      }
    } else if (this.mc.provideContext) {
      await this.mc.provideContext({ tools: this.desired.map((tool) => this.asTool(tool)) });
    } else {
      throw new Error('modelContext offers neither registerTool nor provideContext');
    }

    if (this.disposed) return;
    // A newer provide() can arrive while registration is awaiting the browser.
    if (this.mc.registerTool) {
      const actual = new Set(this.registrations.keys());
      if (actual.size !== names.size || [...names].some((name) => !actual.has(name))) {
        await this.synchronise();
        return;
      }
    }
    this.report({ status: 'ready', registered: this.desired.length, message: null });
  }

  currentTools(): ToolDescriptor[] {
    return this.desired;
  }

  settled(): Promise<void> {
    return this.work;
  }

  dispose(): void {
    this.disposed = true;
    this.desired = [];
    this.handlers = {};
    for (const controller of this.registrations.values()) controller.abort();
    this.work = this.work.then(async () => {
      for (const name of this.registrations.keys()) await this.mc?.unregisterTool?.(name);
      this.registrations.clear();
      if (!this.mc?.registerTool) await this.mc?.provideContext?.({ tools: [] });
    }).catch(() => undefined);
  }
}
