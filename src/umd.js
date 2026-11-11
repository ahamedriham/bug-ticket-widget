// Browser build for <script> tags: exposes window.BugTicket; Vue is taken from window.Vue or loaded from cdnjs on first init.
import core from './core.js';
if (typeof window !== 'undefined') window.BugTicket = core;
export default core;
