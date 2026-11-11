import type { App } from 'vue';

export type MenuItemType = 'rating' | 'feedback' | 'bug' | 'link' | 'custom';

export interface MenuItem {
  /** Built-ins: 'rate' | 'idea' | 'bug'. Any other id creates a new item. */
  id?: string;
  type?: MenuItemType;
  title?: string;
  subtitle?: string;
  /** SVG/HTML string, emoji, or image URL. */
  icon?: string;
  /** Default true. A function is re-evaluated on every render. */
  show?: boolean | ((api: BugTicketAPI) => boolean);
  url?: string;
  target?: string;
  onClick?: (api: BugTicketAPI, item: MenuItem) => void;
  /** Per-item delivery overrides. */
  endpoint?: string;
  onSubmit?: (payload: Payload, item: MenuItem) => unknown | Promise<unknown>;
  placeholder?: string;
  /** feedback items: show a short title input. */
  titleField?: boolean;
  submitLabel?: string;
}

export interface Reporter { name?: string; email?: string; editable?: boolean }

export interface Theme {
  primary?: string;
  primaryHover?: string | null;
  radius?: string;
  font?: string;
  loadFont?: boolean;
  mode?: 'auto' | 'light' | 'dark';
  /** Any --bt-* CSS variable. */
  tokens?: Record<string, string | number>;
}

export interface Brand { name?: string | null; logo?: string | false; tagline?: string | null }

export interface ButtonOptions {
  icon?: string | null;
  label?: string | false | null;
  size?: number;
  pulse?: boolean;
  badge?: number | string | null;
  draggable?: boolean;
  rememberPosition?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  offset?: number;
  hidden?: boolean;
}

export interface Options {
  endpoint?: string | null;
  headers?: Record<string, string>;
  format?: 'json' | 'multipart';
  onSubmit?: (payload: Payload, item?: MenuItem) => unknown | Promise<unknown>;
  onSuccess?: (response: any, payload: Payload) => void;
  onError?: (error: Error, payload: Payload) => void;
  successLink?: (response: any) => string | null | undefined;
  meta?: Record<string, unknown> | (() => Record<string, unknown>) | null;
  reporter?: Reporter | (() => Reporter | null) | null;
  rememberReporter?: boolean;

  theme?: Theme;
  brand?: Brand;
  button?: ButtonOptions;
  icons?: Partial<Record<'help' | 'close' | 'back' | 'star' | 'starFill' | 'idea' | 'bug' | 'link' | 'logo' | 'area' | 'page' | 'element' | 'record' | 'native' | 'upload' | 'attach' | 'check', string>>;
  css?: string;
  stylesheets?: string[];

  menu?: MenuItem[] | null;
  menuDefaults?: boolean;
  skipMenuWhenSingle?: boolean;

  locale?: 'en' | 'ar' | string;
  labels?: Record<string, string | string[]>;
  dir?: 'auto' | 'ltr' | 'rtl';
  hotkey?: string | false;

  severities?: string[];
  fields?: { area?: boolean; expected?: boolean; actual?: boolean; reporter?: 'auto' | boolean; attachments?: boolean };
  capture?: { page?: boolean; area?: boolean; native?: boolean; element?: boolean; record?: boolean };
  record?: { maxSeconds?: number; mic?: boolean; mimeType?: string | null };
  diagnostics?: { console?: boolean; network?: boolean; breadcrumbs?: boolean; storage?: boolean };
  maxImageWidth?: number;
  imageFormat?: 'png' | 'jpeg';
  imageQuality?: number;
  saveDraft?: boolean;
  suggestTitle?: boolean;

  /** Inject a Vue 3 namespace (done automatically by the npm entry). */
  vue?: unknown;
  vueUrl?: string;
  html2canvasUrl?: string;
}

export interface Screenshot { id: number; name: string; caption: string; width: number; height: number; dataUrl: string }
export interface Recording { id: number; name: string; type: string; size: number; duration: number; caption: string; dataUrl: string }
export interface Attachment { id: number; name: string; type: string; size: number; dataUrl: string }

export interface Context {
  url: string; referrer: string; title: string; timestamp: string; timezone: string;
  userAgent: string; language: string; platform: string; online: boolean;
  viewport: { width: number; height: number; dpr: number; scrollX: number; scrollY: number };
  screen: { width: number; height: number };
  connection: { type: string; downlink: number } | null;
  memory: { usedMB: number } | null;
  performance: { domContentLoaded: number; load: number } | null;
  console: { t: number; level: 'error' | 'warn'; msg: string }[];
  network: { t: number; method: string; url: string; status: number; ok: boolean; ms: number; error?: string }[];
  breadcrumbs: ({ t: number; type: 'click'; target: string; text: string } | { t: number; type: 'navigate' | 'load'; url: string })[];
  storage: { localStorageKeys: string[]; sessionStorageKeys: string[] } | null;
}

export interface Payload {
  type: MenuItemType | string;
  itemId?: string;
  title?: string;
  severity?: string;
  area?: string;
  steps?: string;
  expected?: string;
  actual?: string;
  rating?: number;
  text?: string;
  screenshots?: Screenshot[];
  recordings?: Recording[];
  attachments?: Attachment[];
  element?: { selector: string; tag: string; id: string | null; classes: string; text: string; html: string; rect: { x: number; y: number; w: number; h: number }; styles: Record<string, string> } | null;
  reporter: { name: string; email: string; source: 'app' | 'user' | 'anonymous' };
  context: Context;
  meta: Record<string, unknown>;
  plugin: string;
}

export type EventName = 'open' | 'close' | 'submit' | 'progress' | 'success' | 'error' | 'screenshot' | 'recording' | 'drag';

export interface BugTicketAPI {
  version: string;
  init(options?: Options): Promise<BugTicketAPI>;
  destroy(): void;
  open(itemId?: string): void;
  close(): void;
  toggle(): void;
  openBug(step?: 'form'): void;
  capture(kind?: 'page' | 'area' | 'element' | 'native'): Promise<void> | void;
  record(): Promise<void> | void;
  stopRecording(): void;
  setBadge(n: number | string | null): void;
  setMeta(meta: Record<string, unknown>): void;
  setReporter(reporter: Reporter | null): void;
  setTheme(theme: Theme & { css?: string }): void;
  resetPosition(): void;
  getContext(): Context | null;
  getMenu(): MenuItem[];
  addMenuItem(item: MenuItem, index?: number): MenuItem;
  updateMenuItem(id: string, patch: Partial<MenuItem>): MenuItem | null;
  removeMenuItem(id: string): boolean;
  showMenuItem(id: string, show: boolean): MenuItem | null;
  /** Returns an unsubscribe function. */
  on(event: EventName, handler: (...args: any[]) => void): () => void;
}

declare const BugTicket: BugTicketAPI;
export default BugTicket;

export const init: BugTicketAPI['init'];
export const destroy: BugTicketAPI['destroy'];
export const open: BugTicketAPI['open'];
export const close: BugTicketAPI['close'];
export const toggle: BugTicketAPI['toggle'];
export const openBug: BugTicketAPI['openBug'];
export const capture: BugTicketAPI['capture'];
export const record: BugTicketAPI['record'];
export const stopRecording: BugTicketAPI['stopRecording'];
export const setBadge: BugTicketAPI['setBadge'];
export const setMeta: BugTicketAPI['setMeta'];
export const setReporter: BugTicketAPI['setReporter'];
export const setTheme: BugTicketAPI['setTheme'];
export const resetPosition: BugTicketAPI['resetPosition'];
export const getContext: BugTicketAPI['getContext'];
export const getMenu: BugTicketAPI['getMenu'];
export const addMenuItem: BugTicketAPI['addMenuItem'];
export const updateMenuItem: BugTicketAPI['updateMenuItem'];
export const removeMenuItem: BugTicketAPI['removeMenuItem'];
export const showMenuItem: BugTicketAPI['showMenuItem'];
export const on: BugTicketAPI['on'];
export const version: string;

/** Vue 3 plugin: `app.use(BugTicketPlugin, options)`. Set `autoInit: false` to call init() yourself. */
export const BugTicketPlugin: { install(app: App, options?: Options & { autoInit?: boolean }): void };
/** Composable returning the API (same singleton). */
export function useBugTicket(): BugTicketAPI;

declare module 'vue' {
  interface ComponentCustomProperties { $bugTicket: BugTicketAPI }
}
