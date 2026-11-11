// npm entry: Vue is a peer dependency and injected into the core so nothing is fetched from a CDN.
import * as Vue from 'vue';
import core from './core.js';

const api = Object.assign({}, core, { init: (options = {}) => core.init({ vue: Vue, ...options }) });

/** Vue 3 plugin: app.use(BugTicketPlugin, options) → this.$bugTicket / inject('bugTicket') */
export const BugTicketPlugin = {
  install(app, options = {}) {
    if (options.autoInit !== false && typeof window !== 'undefined') api.init(options);
    app.config.globalProperties.$bugTicket = api;
    app.provide('bugTicket', api);
  },
};

/** Composable: const bugTicket = useBugTicket() */
export const useBugTicket = () => api;

export const { init, destroy, open, close, toggle, openBug, capture, record, stopRecording, setBadge, setMeta, setReporter, setTheme, resetPosition, getContext, getMenu, addMenuItem, updateMenuItem, removeMenuItem, showMenuItem, on, version } = api;
export default api;
