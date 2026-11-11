/*!
 * BugTicket — floating support widget: report a bug (screenshots, markup, recording, diagnostics) + optional rate / ideas menu.
 *
 *   npm:     import BugTicket from 'bug-ticket-widget';  BugTicket.init({ endpoint: '/api/feedback' })
 *   script:  <script src="dist/bug-ticket.umd.js"></script> <script>BugTicket.init({ endpoint: '/api/feedback' })</script>
 *
 * LOOK & FEEL (every piece is overridable)
 *   theme     { primary:'#4F46E5', primaryHover, radius:'16px', font:'Inter', loadFont:true, mode:'auto'|'light'|'dark', tokens:{ '--bt-panel-bg': '#fff', … } }
 *   brand     { name:'Support', logo: '<svg…>' | 'https://…/logo.png' | false, tagline }
 *   button    { icon:'<svg>'|html, label:'Support', size:56, pulse:true, badge:1|null, draggable:true, rememberPosition:true,
 *               autoHide:true, autoHideDelay:3000, position:'bottom-right'|'bottom-left'|'top-right'|'top-left', offset:24, hidden:false }
 *   icons     { star, idea, bug, close, back, … } html/svg overrides
 *   css       extra CSS injected inside the widget (use the --bt-* tokens or the .bt-* class names)
 *   stylesheets ['https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'] loaded inside the widget so <i class="fa …"> icons work
 *   menu      three built-ins exist by id: 'rate' (rating), 'idea' (feedback), 'bug' (bug). By default only 'bug' is shown,
 *             so clicking the button opens the report form directly. Pass an array to enable, tweak, reorder or add:
 *               menu: [ { id:'rate', show:true }, { id:'idea', show:true },      // enable the built-ins → menu appears
 *                       { id:'bug', title:'Something broke?' },                  // override any field of a built-in
 *                       { id:'help', type:'link', title:'Help centre', url:'…' },// add your own
 *                       { id:'chat', type:'custom', title:'Live chat', onClick:(api)=>… , show:()=>user.isPro } ]
 *               order = your array order, built-ins you did not mention are appended (menuDefaults:false drops them)
 *               item fields: id, type, title, subtitle, icon, show (bool | fn), url, target, onClick, endpoint, onSubmit, placeholder, titleField, submitLabel
 *   menuDefaults true · skipMenuWhenSingle true (one visible item → open it directly)
 *
 * DELIVERY  endpoint, headers, format:'json'|'multipart', onSubmit(payload), onSuccess, onError, successLink, meta, reporter, rememberReporter
 *   every submission carries { type:'bug'|'rating'|'feedback'|…, reporter, context, meta }
 * BUG FLOW  severities, fields, capture, record, diagnostics, maxImageWidth, imageFormat, imageQuality, saveDraft, suggestTitle
 * MISC      locale 'en'|'ar', labels, dir, hotkey, vueUrl, html2canvas (function), html2canvasUrl
 *
 * API  init · open(itemId?) · close · toggle · destroy · openBug(step?) · capture(kind) · record · stopRecording
 *      setBadge(n) · setMeta · setReporter · setTheme(partial) · resetPosition · getContext · on(evt, fn)
 *      getMenu() · addMenuItem(item, index?) · updateMenuItem(id, patch) · removeMenuItem(id) · showMenuItem(id, bool)
 *      evts: open, close, submit, progress, success, error, screenshot, recording, drag
 */
const global = typeof window !== 'undefined' ? window : globalThis;

  const SVG = {
    help: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>',
    close: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    back: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>',
    star: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>',
    starFill: '<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>',
    idea: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.4 8.4 0 0 1-3.6-.8L3 21l1.9-5.4A8.4 8.4 0 0 1 3 11.5a8.4 8.4 0 0 1 9-8.4 8.4 8.4 0 0 1 9 8.4z"/><path d="M8 12h.01M12 12h.01M16 12h.01"/></svg>',
    bug: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2l1.9 1.9M16 2l-1.9 1.9"/><path d="M9 7.1V6a3 3 0 0 1 6 0v1.1"/><path d="M12 20v-9"/><path d="M6.5 9h11a1 1 0 0 1 1 1v4a6.5 6.5 0 0 1-13 0v-4a1 1 0 0 1 1-1z"/><path d="M3 13h3.5M17.5 13H21M4 20l2.5-2.5M20 20l-2.5-2.5M4 6l2.5 2.5M20 6l-2.5 2.5"/></svg>',
    link: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7L12 19"/></svg>',
    logo: '<span class="bt-logo-dot"><i></i></span>',
    area: '✂️', page: '🖥️', element: '🎯', record: '🎥', native: '📸', upload: '🖼️', attach: '📎', check: '✓',
  };

  const I18N = {
    en: { support: 'Support', openWidget: 'Open support', rate: 'Rate your experience', rateSub: 'Share overall feedback', ideas: 'Send an idea', ideasSub: 'Tell us what you would like to see',
      bug: 'Report an issue', bugSub: "Tell us what's not working", backToOptions: 'Back to options', submit: 'Submit', thanks: 'Thank you!', thanksSub: 'Your feedback was received.',
      ratePh: 'What went well, what could be better?', ideaPh: 'Describe your idea…', ideaTitlePh: 'Give it a short title', pickStars: 'Tap a star to rate', starLabels: ['Poor', 'Fair', 'Okay', 'Good', 'Excellent'], capturingTip: 'Capturing the page…', autoAttached: 'Page details and diagnostics are attached automatically', optional: 'optional',
      bugTitle: 'Report a bug', launcherHint: 'Grab the evidence while it is still on screen.', capArea: 'Screenshot an area', capPage: 'Screenshot the page', capNative: 'Native screenshot',
      capEl: 'Pick the broken element', record: 'Record the screen', skip: 'Describe it without a screenshot', paste: 'or paste / drop an image anywhere',
      what: 'What went wrong?', titlePh: 'e.g. Total is wrong after applying a coupon', severity: 'Severity', area: 'Where', areaPh: 'Page or screen', steps: 'How to reproduce', stepsPh: '1. Add two items\n2. Apply coupon SAVE10\n3. Press Pay',
      more: 'More details', less: 'Fewer details', expected: 'Expected', actual: 'Actual', name: 'Your name', email: 'Email', reportingAs: 'Reporting as', change: 'Change', remember: 'Remember me on this device',
      evidence: 'Evidence', addMore: 'Add', upload: 'Upload image', caption: 'Describe this', markup: 'Edit', remove: 'Remove', attach: 'Attach a file', send: 'Send report', sending: 'Sending…', uploading: 'Uploading {p}%',
      back: 'Back', cancel: 'Cancel', close: 'Close', attached: 'Screenshot attached', recorded: 'Recording added', diag: 'Attached automatically: {list}', dConsole: '{n} console error(s)', dNetwork: 'recent requests', dCrumbs: 'your last actions',
      selTip: 'Drag to select the area · Esc to cancel', elTip: 'Click the broken element · Esc to cancel', recording: 'Recording', stop: 'Stop', withMic: 'Include microphone',
      box: 'Box', arrow: 'Arrow', pen: 'Pencil', text: 'Text', blur: 'Blur', crop: 'Crop', undo: 'Undo', save: 'Done', cropSave: 'Crop & done', textPh: 'Type a label, then click where it goes',
      hBox: 'Drag to draw a box', hArrow: 'Drag from tail to head', hPen: 'Draw freehand', hText: 'Click to place the label', hBlur: 'Drag over sensitive data to hide it', hCrop: 'Drag to choose what to keep',
      pickedEl: 'Element', draftBanner: 'We kept your unsent draft.', discard: 'Discard', dirtyClose: 'Discard this report?', keep: 'Keep editing',
      sentTitle: 'Thanks, report sent', sentBody: 'The team now has your description, screenshots and diagnostics.', sentBodyText: 'The team now has your description and diagnostics.', micDenied: 'Microphone not available — recording without sound.', sentId: 'Reference', copyLink: 'Copy link', copied: 'Copied', openLink: 'Open', another: 'Report another',
      needTitle: 'Add a short title so the team knows what to look for.', needText: 'Please write something first.', captureFail: 'Capture failed: {msg}. Paste or drop a screenshot instead.', sendFail: 'Could not send: {msg}', retry: 'Try again', unsupported: 'Not supported in this browser.' },
    ar: { support: 'الدعم', openWidget: 'فتح الدعم', rate: 'قيّم تجربتك', rateSub: 'شاركنا رأيك العام', ideas: 'أرسل فكرة', ideasSub: 'أخبرنا بما تود رؤيته', bug: 'الإبلاغ عن مشكلة', bugSub: 'أخبرنا بما لا يعمل',
      backToOptions: 'العودة إلى الخيارات', submit: 'إرسال', thanks: 'شكرًا لك!', thanksSub: 'تم استلام ملاحظاتك.', ratePh: 'ما الذي أعجبك وما الذي يمكن تحسينه؟', ideaPh: 'صف فكرتك…', ideaTitlePh: 'عنوان قصير', pickStars: 'انقر على نجمة للتقييم', starLabels: ['ضعيف', 'مقبول', 'جيد', 'جيد جدًا', 'ممتاز'], capturingTip: 'جارٍ التقاط الصفحة…', autoAttached: 'تُرفق تفاصيل الصفحة والبيانات التشخيصية تلقائيًا', optional: 'اختياري',
      bugTitle: 'الإبلاغ عن خطأ', launcherHint: 'التقط الدليل وهو ما زال على الشاشة.', capArea: 'لقطة لمنطقة', capPage: 'لقطة للصفحة', capNative: 'لقطة شاشة أصلية', capEl: 'اختر العنصر المعطّل', record: 'تسجيل الشاشة', skip: 'وصف الخطأ بدون لقطة', paste: 'أو الصق / أسقط صورة في أي مكان',
      what: 'ما الذي حدث؟', titlePh: 'مثال: الإجمالي خاطئ بعد تطبيق الكوبون', severity: 'الخطورة', area: 'أين', areaPh: 'الصفحة أو الشاشة', steps: 'كيفية إعادة الإنتاج', stepsPh: '١. أضف منتجين\n٢. طبّق الكوبون\n٣. اضغط دفع', more: 'تفاصيل أكثر', less: 'تفاصيل أقل', expected: 'المتوقع', actual: 'الفعلي',
      name: 'اسمك', email: 'البريد الإلكتروني', reportingAs: 'المُبلّغ', change: 'تغيير', remember: 'تذكرني على هذا الجهاز', evidence: 'الأدلة', addMore: 'إضافة', upload: 'رفع صورة', caption: 'صف هذه', markup: 'تعديل', remove: 'إزالة', attach: 'إرفاق ملف',
      send: 'إرسال البلاغ', sending: 'جارٍ الإرسال…', uploading: 'جارٍ الرفع {p}%', back: 'رجوع', cancel: 'إلغاء', close: 'إغلاق', attached: 'تمت إضافة اللقطة', recorded: 'تمت إضافة التسجيل', diag: 'مرفق تلقائيًا: {list}', dConsole: '{n} خطأ من وحدة التحكم', dNetwork: 'آخر الطلبات', dCrumbs: 'آخر إجراءاتك',
      selTip: 'اسحب لتحديد المنطقة · Esc للإلغاء', elTip: 'انقر على العنصر المعطّل · Esc للإلغاء', recording: 'جارٍ التسجيل', stop: 'إيقاف', withMic: 'تضمين الميكروفون', box: 'مربع', arrow: 'سهم', pen: 'قلم', text: 'نص', blur: 'تمويه', crop: 'قص', undo: 'تراجع', save: 'تم', cropSave: 'قص وإنهاء',
      textPh: 'اكتب التسمية ثم انقر مكانها', hBox: 'اسحب لرسم مربع', hArrow: 'اسحب من الذيل إلى الرأس', hPen: 'ارسم بحرية', hText: 'انقر لوضع التسمية', hBlur: 'اسحب فوق البيانات الحساسة لإخفائها', hCrop: 'اسحب لاختيار ما تحتفظ به', pickedEl: 'العنصر',
      draftBanner: 'احتفظنا بمسودتك غير المرسلة.', discard: 'تجاهل', dirtyClose: 'تجاهل هذا البلاغ؟', keep: 'متابعة التحرير', sentTitle: 'شكرًا، تم إرسال البلاغ', sentBody: 'لدى الفريق الآن وصفك ولقطاتك والبيانات التشخيصية.', sentBodyText: 'لدى الفريق الآن وصفك والبيانات التشخيصية.', micDenied: 'الميكروفون غير متاح — سيتم التسجيل بدون صوت.', sentId: 'المرجع', copyLink: 'نسخ الرابط', copied: 'تم النسخ', openLink: 'فتح', another: 'بلاغ آخر',
      needTitle: 'أضف عنوانًا قصيرًا ليعرف الفريق ما يبحث عنه.', needText: 'يرجى كتابة شيء أولًا.', captureFail: 'فشل الالتقاط: {msg}. الصق أو أسقط لقطة بدلاً من ذلك.', sendFail: 'تعذر الإرسال: {msg}', retry: 'حاول مجددًا', unsupported: 'غير مدعوم في هذا المتصفح.' },
  };

  const DEFAULTS = {
    endpoint: null, headers: {}, format: 'json', onSubmit: null, onSuccess: null, onError: null, successLink: null, meta: null, reporter: null, rememberReporter: true,
    theme: { primary: '#4F46E5', primaryHover: null, radius: '16px', font: 'Inter', loadFont: true, mode: 'auto', tokens: {} },
    brand: { name: null, logo: undefined, tagline: null },
    button: { icon: null, label: null, size: 56, pulse: true, badge: null, draggable: true, rememberPosition: true, autoHide: true, autoHideDelay: 3000, position: 'bottom-right', offset: 24, hidden: false },
    icons: {}, css: '', stylesheets: [], menu: null, menuDefaults: true, skipMenuWhenSingle: true,
    locale: 'en', labels: {}, dir: 'auto', hotkey: 'ctrl+shift+b',
    severities: ['Blocker', 'Major', 'Minor', 'Trivial'],
    fields: { area: true, expected: true, actual: true, reporter: 'auto', attachments: true },
    capture: { page: true, area: true, native: true, element: true, record: true },
    record: { maxSeconds: 60, mic: false, mimeType: null },
    diagnostics: { console: true, network: true, breadcrumbs: true, storage: false },
    maxImageWidth: 1600, imageFormat: 'png', imageQuality: 0.9, saveDraft: true, suggestTitle: true,
    vue: null, vueUrl: 'https://cdnjs.cloudflare.com/ajax/libs/vue/3.4.21/vue.global.prod.min.js',
    html2canvasUrl: 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
    html2canvas: null, // pass the function (import html2canvas from 'html2canvas') to skip the CDN download
  };
  const COLORS = ['#E53935', '#FB8C00', '#FDD835', '#43A047', '#1E88E5', '#111111', '#FFFFFF'];
  const SEV_COLORS = ['#C62828', '#E07B00', '#C9A400', '#7A8597'];
  const TOOL_KEYS = { b: 'box', a: 'arrow', p: 'pen', t: 'text', u: 'blur', c: 'crop' };

  const CSS = `
:host{all:initial;font-family:var(--bt-font),system-ui,-apple-system,"Segoe UI",Roboto,"Noto Sans Arabic",sans-serif;font-size:14px;line-height:1.5;
  --bt-primary:#4F46E5;--bt-primary-hover:#6366F1;--bt-primary-ink:#fff;--bt-primary-soft:rgba(99,102,241,.12);--bt-ring:rgba(99,102,241,.45);--bt-radius:16px;--bt-font:Inter;
  --bt-bg:#F8FAFC;--bt-panel-bg:#fff;--bt-ink:#1E293B;--bt-muted:#64748B;--bt-line:#E2E8F0;--bt-field-bg:#F8FAFC;--bt-danger:#DC2626;--bt-ok:#10B981;--bt-shadow:0 25px 50px -12px rgba(0,0,0,.25);--bt-z:2147483000}
:host([data-mode="dark"]){--bt-bg:#0F172A;--bt-panel-bg:#1E293B;--bt-ink:#F1F5F9;--bt-muted:#94A3B8;--bt-line:#334155;--bt-field-bg:#0F172A;--bt-danger:#F87171;--bt-ok:#34D399;--bt-primary-soft:rgba(99,102,241,.22)}
*{box-sizing:border-box}button{font:inherit}
.bt-widget{position:fixed;z-index:var(--bt-z);transition:opacity .4s ease,transform .4s cubic-bezier(.16,1,.3,1);touch-action:none}
.bt-widget.idle{opacity:.7;transform:scale(.95)}.bt-widget.idle:hover{opacity:1;transform:scale(1)}
.bt-widget.dragging{transition:none;scale:1.05;cursor:grabbing}
.bt-fab{position:relative;display:flex;align-items:center;justify-content:center;gap:10px;height:var(--bt-size);min-width:var(--bt-size);padding:0 15px;border:0;border-radius:9999px;background:var(--bt-primary);color:var(--bt-primary-ink);cursor:pointer;
  box-shadow:0 0 0 3px var(--bt-ring),0 10px 15px -3px rgba(0,0,0,.2);transition:all .35s cubic-bezier(.16,1,.3,1);white-space:nowrap;font-weight:600;user-select:none}
.bt-widget.draggable .bt-fab{cursor:grab}.bt-widget.dragging .bt-fab{cursor:grabbing;box-shadow:0 20px 25px -5px var(--bt-ring)}
.bt-fab:hover,.bt-widget.open .bt-fab{background:var(--bt-primary-hover);box-shadow:0 10px 25px -5px var(--bt-ring),0 8px 10px -6px var(--bt-ring)}
.bt-fab:focus-visible{outline:none;box-shadow:0 0 0 4px var(--bt-ring)}
.bt-fab .ic{position:relative;width:28px;height:28px;display:grid;place-items:center}
.bt-fab .ic>*{grid-area:1/1;transition:all .3s;display:grid;place-items:center}
.bt-fab .ic .x{opacity:0;transform:scale(.5)}.bt-widget.open .bt-fab .ic .x{opacity:1;transform:none}.bt-widget.open .bt-fab .ic .o{opacity:0;transform:scale(.5)}
.bt-fab .lbl{max-width:0;opacity:0;overflow:hidden;transition:all .35s cubic-bezier(.16,1,.3,1);margin-inline-start:-10px}
.bt-fab:hover .lbl,.bt-widget.open .bt-fab .lbl{max-width:160px;opacity:1;margin:0}
.bt-widget.pulse .bt-fab::before{content:"";position:absolute;inset:-4px;border-radius:9999px;background:var(--bt-ring);animation:bt-pulse 3s infinite ease-in-out;z-index:-1}
.bt-widget.open .bt-fab::before,.bt-widget.idle .bt-fab::before{animation:none;opacity:0}
@keyframes bt-pulse{0%{transform:scale(.95);opacity:.8}50%{transform:scale(1.15);opacity:0}100%{transform:scale(.95);opacity:0}}
.bt-badge{position:absolute;top:-4px;inset-inline-end:-4px;min-width:20px;height:20px;padding:0 5px;border-radius:999px;background:#F43F5E;color:#fff;font-size:10px;font-weight:700;display:grid;place-items:center;border:2px solid var(--bt-panel-bg);animation:bt-bounce 1s infinite}
@keyframes bt-bounce{0%,100%{transform:translateY(-25%);animation-timing-function:cubic-bezier(.8,0,1,1)}50%{transform:none;animation-timing-function:cubic-bezier(0,0,.2,1)}}
.bt-panel{position:fixed;z-index:calc(var(--bt-z) + 1);width:min(calc(100vw - 24px),320px);max-height:calc(100vh - 24px);background:var(--bt-panel-bg);color:var(--bt-ink);border:1px solid var(--bt-line);border-radius:var(--bt-radius);box-shadow:var(--bt-shadow);overflow:hidden;display:flex;flex-direction:column;user-select:text;
  transition:opacity .3s ease,transform .3s ease;transform-origin:bottom right}
.bt-panel.left{transform-origin:bottom left}.bt-panel.top{transform-origin:top right}.bt-panel.top.left{transform-origin:top left}
.bt-panel-enter-from,.bt-panel-leave-to{opacity:0;transform:translateY(8px) scale(.97)}
.bt-head{background:var(--bt-primary);color:var(--bt-primary-ink);padding:18px 20px;display:flex;align-items:center;justify-content:space-between;gap:10px;z-index:3;position:relative}
.bt-brand{display:flex;align-items:center;gap:10px;font-weight:700;font-size:20px;letter-spacing:-.01em;min-width:0}
.bt-brand img,.bt-brand svg{height:26px;width:auto;max-width:120px;display:block}
.bt-brand small{display:block;font-size:12px;font-weight:400;opacity:.85;letter-spacing:0}
.bt-logo-dot{width:24px;height:24px;border-radius:50%;border:2px solid currentColor;display:grid;place-items:center;flex:none}.bt-logo-dot i{width:10px;height:10px;border-radius:50%;background:currentColor;display:block}
.bt-x{width:28px;height:28px;border-radius:50%;border:0;background:rgba(255,255,255,.12);color:inherit;display:grid;place-items:center;cursor:pointer;opacity:.85;flex:none}.bt-x:hover{background:rgba(255,255,255,.22);opacity:1}
.bt-menu{display:flex;flex-direction:column;overflow:auto}
.bt-item{display:flex;gap:16px;align-items:flex-start;text-align:start;padding:18px 20px;border:0;border-top:1px solid var(--bt-line);background:none;color:var(--bt-ink);cursor:pointer;transition:background .15s}
.bt-item:first-child{border-top:0}.bt-item:hover,.bt-item:focus-visible{background:var(--bt-primary-soft);outline:none}
.bt-item .ic{color:var(--bt-primary);font-size:24px;width:26px;flex:none;padding-top:2px;transition:transform .2s;display:grid;place-items:center}.bt-item:hover .ic{transform:scale(1.1)}
.bt-item h4{margin:0;font-size:14px;font-weight:700}.bt-item p{margin:2px 0 0;font-size:12px;color:var(--bt-muted)}
.bt-sheet{background:var(--bt-panel-bg);padding:16px 20px 20px;display:flex;flex-direction:column;min-height:260px;animation:bt-up .3s cubic-bezier(.16,1,.3,1)}
@keyframes bt-up{from{transform:translateY(16px);opacity:0}to{transform:none;opacity:1}}
.bt-backlink{display:inline-flex;align-items:center;gap:6px;border:0;background:none;color:var(--bt-primary);font-weight:600;font-size:12px;cursor:pointer;padding:0;margin-bottom:12px}.bt-backlink:hover{text-decoration:underline}
.bt-sheet h4{margin:0 0 10px;font-size:14px;font-weight:700}
.bt-stars{display:flex;gap:6px;align-items:center;margin-bottom:12px}.bt-starlbl{margin-inline-start:6px;font-size:12px;color:var(--bt-muted);font-weight:600}.bt-stars button{border:0;background:none;padding:0;color:#CBD5E1;cursor:pointer;transition:transform .15s}.bt-stars button.on{color:#FBBF24}.bt-stars button:hover{transform:scale(1.25)}
:host([data-mode="dark"]) .bt-stars button{color:#475569}:host([data-mode="dark"]) .bt-stars button.on{color:#FBBF24}
.bt-field{width:100%;background:var(--bt-field-bg);color:var(--bt-ink);border:1px solid var(--bt-line);border-radius:calc(var(--bt-radius) * .7);padding:10px 12px;font:inherit;font-size:13px}
.bt-field:focus{outline:none;border-color:var(--bt-primary);box-shadow:0 0 0 3px var(--bt-primary-soft)}textarea.bt-field{resize:none}
.bt-field.bad{border-color:var(--bt-danger)}
.bt-btn{font-weight:600;border-radius:calc(var(--bt-radius) * .7);padding:10px 16px;border:1px solid var(--bt-line);background:var(--bt-panel-bg);color:var(--bt-ink);cursor:pointer;transition:background .15s}
.bt-btn:disabled{opacity:.5;cursor:default}.bt-btn:hover:not(:disabled){background:var(--bt-bg)}
.bt-btn.primary{background:var(--bt-primary);color:var(--bt-primary-ink);border-color:transparent;box-shadow:0 6px 14px -4px var(--bt-ring)}.bt-btn.primary:hover:not(:disabled){background:var(--bt-primary-hover)}
.bt-btn.ghost{border-color:transparent;background:none}.bt-btn.ghost:hover:not(:disabled){background:var(--bt-primary-soft)}
.bt-btn.danger{color:var(--bt-danger)}.bt-btn.sm{padding:5px 10px;font-size:13px}.bt-btn:focus-visible{outline:2px solid var(--bt-primary);outline-offset:2px}
.bt-btn.block{width:100%;margin-top:12px}
.bt-launch{display:grid;gap:8px;margin-top:12px}
.bt-launch button{display:flex;align-items:center;gap:12px;text-align:start;padding:11px 12px;border:1px solid var(--bt-line);background:var(--bt-panel-bg);color:var(--bt-ink);border-radius:calc(var(--bt-radius) * .7);cursor:pointer;font-weight:500;font-size:13px}
.bt-launch button:hover,.bt-launch button:focus-visible{border-color:var(--bt-primary);background:var(--bt-primary-soft);outline:none}
.bt-launch .ic{font-size:18px;width:24px;text-align:center}.bt-launch .alt{border-style:dashed;justify-content:center;font-weight:400;color:var(--bt-muted)}
.bt-launch .sub{display:block;font-weight:400;color:var(--bt-muted);font-size:11px}
.bt-launch.grid{grid-template-columns:1fr 1fr;margin-top:0;text-align:start}.bt-launch.grid button{flex-direction:column;align-items:flex-start;gap:6px;padding:10px}@media(max-width:420px){.bt-launch.grid{grid-template-columns:1fr}}
.bt-thanks{text-align:center;padding:24px 0 8px}.bt-thanks .ok{width:52px;height:52px;border-radius:50%;background:var(--bt-ok);color:#fff;display:grid;place-items:center;font-size:26px;margin:0 auto 12px}
.bt-hint{color:var(--bt-muted);font-size:12px;margin:0}.bt-err{color:var(--bt-danger);font-size:12px;margin:6px 0 0}
.bt-link{background:none;border:0;color:var(--bt-primary);cursor:pointer;padding:0;font-weight:600}
.bt-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}.bt-spacer{flex:1}.bt-mt{margin-top:14px}
/* ---- bug modal ---- */
.bt-overlay{position:fixed;inset:0;z-index:calc(var(--bt-z) + 2);background:rgba(15,23,42,.55);backdrop-filter:blur(2px);display:flex;align-items:center;justify-content:center;padding:16px}
.bt-modal{background:var(--bt-panel-bg);color:var(--bt-ink);border:1px solid var(--bt-line);border-radius:var(--bt-radius);width:100%;max-width:880px;max-height:100%;display:flex;flex-direction:column;overflow:hidden;box-shadow:var(--bt-shadow);position:relative}
.bt-modal.sm{max-width:460px}
.bt-mhead{display:flex;align-items:center;gap:10px;padding:14px 18px;border-bottom:1px solid var(--bt-line)}.bt-mhead h2{margin:0;font-size:17px;font-weight:700;flex:1}
.bt-mhead .bt-x{background:var(--bt-bg);color:var(--bt-muted)}.bt-mhead .bt-x:hover{background:var(--bt-primary-soft);color:var(--bt-primary)}
.bt-body{padding:18px;overflow:auto;flex:1}
.bt-foot{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:12px 18px;border-top:1px solid var(--bt-line);background:var(--bt-bg)}
@media(max-width:640px){.bt-overlay{padding:0;align-items:flex-end}.bt-modal{border-radius:var(--bt-radius) var(--bt-radius) 0 0;max-height:96%}.bt-modal.sm{max-width:100%}.bt-foot .bt-btn{flex:1;text-align:center}}
.bt-cols{display:grid;gap:20px;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr)}@media(max-width:760px){.bt-cols{grid-template-columns:1fr}}
label{display:block;font-weight:600;font-size:13px;margin-bottom:4px}.bt-opt{font-weight:400;color:var(--bt-muted);font-size:11px;margin-inline-start:4px}
.bt-seg{display:flex;border:1px solid var(--bt-line);border-radius:calc(var(--bt-radius) * .6);overflow:hidden;background:var(--bt-field-bg)}
.bt-seg button{flex:1;border:0;background:none;color:var(--bt-muted);padding:8px 6px;cursor:pointer;display:flex;gap:6px;align-items:center;justify-content:center;font-weight:600;font-size:13px}
.bt-seg button+button{border-inline-start:1px solid var(--bt-line)}.bt-seg button.on{background:var(--bt-panel-bg);color:var(--bt-ink)}.bt-seg i{width:9px;height:9px;border-radius:50%;display:inline-block}
.bt-evhead{display:flex;align-items:center;gap:8px;margin-bottom:8px}.bt-evhead h3{margin:0;font-size:14px;font-weight:700;flex:1}
.bt-dd{position:relative}.bt-dd ul{position:absolute;inset-inline-end:0;top:100%;margin:4px 0 0;padding:6px;list-style:none;background:var(--bt-panel-bg);border:1px solid var(--bt-line);border-radius:12px;box-shadow:var(--bt-shadow);min-width:220px;z-index:5}
.bt-dd li button{width:100%;text-align:start;border:0;background:none;color:var(--bt-ink);padding:8px 10px;border-radius:8px;cursor:pointer;display:flex;gap:10px;align-items:center}.bt-dd li button:hover{background:var(--bt-primary-soft)}
.bt-drop{border:2px dashed var(--bt-line);background:var(--bt-field-bg);border-radius:calc(var(--bt-radius) * .7);padding:18px;text-align:center;cursor:pointer;color:var(--bt-muted);font-size:13px}.bt-drop.over{border-color:var(--bt-primary);color:var(--bt-ink)}
.bt-shots{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
.bt-shot{border:1px solid var(--bt-line);border-radius:12px;overflow:hidden;background:var(--bt-field-bg);position:relative}
.bt-shot img{display:block;width:100%;aspect-ratio:16/10;object-fit:cover;background:#0002;cursor:pointer}.bt-shot video{display:block;width:100%;aspect-ratio:16/10;background:#000;object-fit:contain}
.bt-shot .acts{position:absolute;top:6px;inset-inline-end:6px;display:flex;gap:4px;opacity:0;transition:opacity .15s}.bt-shot:hover .acts,.bt-shot:focus-within .acts{opacity:1}@media(hover:none){.bt-shot .acts{opacity:1}}
.acts button{border:0;background:rgba(0,0,0,.65);color:#fff;border-radius:6px;padding:3px 8px;font-size:12px;cursor:pointer}
.bt-cap{border:0;border-top:1px solid var(--bt-line);width:100%;background:var(--bt-panel-bg);color:var(--bt-ink);padding:6px 8px;font:inherit;font-size:12px}.bt-cap:focus{outline:none;background:var(--bt-primary-soft)}
.bt-chip{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--bt-line);border-radius:999px;padding:2px 10px;font-size:13px;background:var(--bt-field-bg)}.bt-chip button{border:0;background:none;color:var(--bt-danger);cursor:pointer}
.bt-el{border:1px solid var(--bt-line);border-radius:12px;padding:8px 10px;font-size:13px;background:var(--bt-field-bg)}.bt-el code{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px;word-break:break-all;color:var(--bt-muted)}
.bt-banner{display:flex;gap:10px;align-items:center;background:var(--bt-primary-soft);border-radius:10px;padding:8px 12px;font-size:13px;margin-bottom:14px}
.bt-prog{height:4px;background:var(--bt-line);border-radius:2px;overflow:hidden;width:100%}.bt-prog i{display:block;height:100%;background:var(--bt-primary);transition:width .2s}
.bt-done{text-align:center;padding:12px 0}.bt-done .ok{width:56px;height:56px;border-radius:50%;background:var(--bt-ok);color:#fff;display:grid;place-items:center;font-size:28px;margin:0 auto 12px}.bt-done h2{margin:0 0 6px;font-size:18px}
.bt-ref{display:inline-flex;gap:8px;align-items:center;margin-top:12px;background:var(--bt-field-bg);border:1px solid var(--bt-line);border-radius:8px;padding:6px 10px;font-family:ui-monospace,Menlo,monospace;font-size:13px}
.bt-confirm{position:absolute;inset:0;background:rgba(255,255,255,.85);display:grid;place-items:center;padding:20px;z-index:6}:host([data-mode="dark"]) .bt-confirm{background:rgba(15,23,42,.85)}
.bt-confirm div{background:var(--bt-panel-bg);border:1px solid var(--bt-line);border-radius:12px;padding:18px;max-width:320px;text-align:center}
canvas{touch-action:none;max-width:100%;max-height:60vh;width:auto;height:auto;display:block;margin:0 auto;border:1px solid var(--bt-line);cursor:crosshair}
.bt-tool{padding:5px 10px;border:1px solid var(--bt-line);background:var(--bt-panel-bg);color:var(--bt-ink);cursor:pointer;border-radius:8px;font-size:13px}.bt-tool.on{background:var(--bt-primary);color:var(--bt-primary-ink);border-color:var(--bt-primary)}.bt-tool kbd{font-size:10px;opacity:.6;margin-inline-start:4px}
.bt-sw{width:22px;height:22px;border-radius:50%;border:2px solid var(--bt-line);cursor:pointer;padding:0}.bt-sw.on{outline:2px solid var(--bt-primary);outline-offset:2px}
.bt-sz{width:28px;height:28px;border-radius:8px;border:1px solid var(--bt-line);background:var(--bt-panel-bg);display:grid;place-items:center;cursor:pointer;padding:0}.bt-sz.on{border-color:var(--bt-primary)}.bt-sz i{display:block;border-radius:50%;background:var(--bt-ink)}
.bt-sel{position:fixed;inset:0;z-index:calc(var(--bt-z) + 3);cursor:crosshair;background:rgba(0,0,0,.35);touch-action:none}.bt-sel .box{position:absolute;border:2px solid #fff;box-shadow:0 0 0 9999px rgba(0,0,0,.45)}
.bt-tip{position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:calc(var(--bt-z) + 4);background:var(--bt-ink);color:var(--bt-panel-bg);padding:6px 12px;border-radius:8px;font-weight:600;pointer-events:none;white-space:nowrap}
.bt-dim{position:absolute;bottom:-24px;right:0;background:#000;color:#fff;font-size:12px;padding:1px 6px;border-radius:4px}
.bt-hl{position:fixed;z-index:calc(var(--bt-z) + 3);pointer-events:none;border:2px solid var(--bt-primary);background:var(--bt-primary-soft);border-radius:3px}.bt-hl span{position:absolute;top:-22px;left:0;background:var(--bt-primary);color:var(--bt-primary-ink);font-size:11px;padding:1px 6px;border-radius:3px;white-space:nowrap}
.bt-rec{position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:calc(var(--bt-z) + 6);display:flex;gap:10px;align-items:center;background:#111;color:#fff;padding:8px 10px 8px 14px;border-radius:999px;box-shadow:0 4px 16px rgba(0,0,0,.3);font-weight:600}
.bt-rec .dot{width:10px;height:10px;border-radius:50%;background:#E53935;animation:bt-blink 1s steps(2) infinite}@keyframes bt-blink{to{opacity:.2}}.bt-rec button{font-weight:700;border:0;border-radius:999px;padding:4px 12px;background:#fff;color:#111;cursor:pointer}
.bt-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:calc(var(--bt-z) + 5);background:var(--bt-ink);color:var(--bt-panel-bg);padding:8px 14px;border-radius:10px;font-weight:600}
.bt-mic{list-style:none}.bt-mic label{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--bt-muted);padding:6px 10px;cursor:pointer}.bt-mic input{accent-color:var(--bt-primary)}
@media(prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
`;

  const TEMPLATE = `
<!-- ===== floating widget ===== -->
<transition name="bt-panel">
  <div v-if="panel" class="bt-panel" :class="{left:isLeft, top:isTop}" :style="panelStyle" :dir="dir" role="dialog" :aria-label="brandName" ref="panelEl">
    <div class="bt-head">
      <div class="bt-brand"><span v-if="opts.brand.logo!==false" v-html="logoHtml"></span><span><span>{{ brandName }}</span><small v-if="opts.brand.tagline">{{ opts.brand.tagline }}</small></span></div>
      <button class="bt-x" @click="closePanel" :aria-label="L.close" v-html="I.close"></button>
    </div>
    <div class="bt-menu" v-if="!sheet">
      <button v-for="m in visibleMenu" :key="m.id" class="bt-item" @click="pick(m)"><span class="ic" v-html="m.icon"></span><span><h4>{{ m.title }}</h4><p v-if="m.subtitle">{{ m.subtitle }}</p></span></button>
    </div>
      <div v-else class="bt-sheet">
        <button class="bt-backlink" @click="sheet=null" v-if="sheet.view!=='thanks' && visibleMenu.length>1"><span v-html="I.back"></span> {{ L.backToOptions }}</button>

        <template v-if="sheet.view==='rating' || sheet.view==='feedback'">
          <h4>{{ sheet.item.title }}</h4>
          <div v-if="sheet.view==='rating'" class="bt-stars" role="radiogroup" :aria-label="L.pickStars">
            <button v-for="n in 5" :class="{on:n<=(hoverStar||sf.rating)}" @click="sf.rating=n;$nextTick(()=>$refs.sfText&&$refs.sfText.focus())" @mouseenter="hoverStar=n" @mouseleave="hoverStar=0" role="radio" :aria-checked="sf.rating===n" :aria-label="L.starLabels[n-1]" v-html="I.starFill"></button>
            <span class="bt-starlbl">{{ (hoverStar||sf.rating) ? L.starLabels[(hoverStar||sf.rating)-1] : L.pickStars }}</span>
          </div>
          <input v-if="sheet.item.titleField" class="bt-field" style="margin-bottom:8px" v-model.trim="sf.title" :placeholder="L.ideaTitlePh">
          <textarea class="bt-field" rows="4" v-model="sf.text" ref="sfText" :placeholder="sheet.item.placeholder || (sheet.view==='rating' ? L.ratePh : L.ideaPh)" :class="{bad:sfErr}"></textarea>
          <p v-if="sfErr" class="bt-err">{{ sfErr }}</p>
          <div class="bt-spacer"></div>
          <button class="bt-btn primary block" @click="submitSimple" :disabled="sending">{{ sending ? L.sending : (sheet.item.submitLabel || L.submit) }}</button>
        </template>

        <template v-else-if="sheet.view==='thanks'">
          <div class="bt-thanks"><div class="ok" v-html="I.check"></div><h4 style="margin-bottom:4px">{{ L.thanks }}</h4><p class="bt-hint">{{ L.thanksSub }}</p></div>
          <div class="bt-spacer"></div>
          <button class="bt-btn block" @click="sheet=null">{{ L.backToOptions }}</button>
        </template>
      </div>
  </div>
</transition>

<div v-if="!opts.button.hidden && !mode && !rec.active" class="bt-widget" :class="widgetClass" :style="widgetStyle" ref="widget" @mouseenter="hovered=true;wake()" @mouseleave="hovered=false;armIdle()" :dir="dir">

  <button class="bt-fab" :aria-label="opts.button.label || L.openWidget" @pointerdown="dragStart" @click="fabClick" ref="fab">
    <span class="ic"><span class="o" v-html="fabIcon"></span><span class="x" v-html="I.close"></span></span>
    <span class="lbl" v-if="opts.button.label !== false">{{ opts.button.label || L.support }}</span>
    <span v-if="badge && !panel" class="bt-badge">{{ badge }}</span>
  </button>
</div>

<!-- ===== bug modal ===== -->
<div v-if="open" class="bt-overlay" @click.self="requestClose" :dir="dir" ref="overlay" @keydown="trapFocus">
  <div class="bt-modal" :class="{sm: step==='done'}" role="dialog" aria-modal="true" :aria-label="L.bugTitle">
    <template v-if="step==='form'">
      <div class="bt-mhead"><h2>{{ L.bugTitle }}</h2><button class="bt-x" @click="requestClose" :aria-label="L.close" v-html="I.close"></button></div>
      <div class="bt-body">
        <div v-if="draftRestored" class="bt-banner">{{ L.draftBanner }}<span class="bt-spacer"></span><button class="bt-link" @click="discardDraft">{{ L.discard }}</button></div>
        <div class="bt-cols">
          <div>
            <label for="bt-t">{{ L.what }}</label>
            <input id="bt-t" class="bt-field" :class="{bad:showErrors&&!t.title}" v-model.trim="t.title" :placeholder="L.titlePh" ref="titleEl" @keydown.enter.prevent="focusSteps">
            <p v-if="showErrors&&!t.title" class="bt-err">{{ L.needTitle }}</p>
            <div class="bt-mt"><label>{{ L.severity }}</label>
              <div class="bt-seg" role="radiogroup"><button v-for="(s,i) in opts.severities" role="radio" :aria-checked="t.severity===s" :class="{on:t.severity===s}" @click="t.severity=s"><i :style="{background:sevColor(i)}"></i>{{ s }}</button></div></div>
            <div class="bt-mt"><label for="bt-st">{{ L.steps }} <span class="bt-opt">{{ L.optional }}</span></label><textarea id="bt-st" class="bt-field" rows="3" v-model="t.steps" :placeholder="L.stepsPh" ref="stepsEl" @input="autosize"></textarea></div>
            <button class="bt-link bt-mt" style="display:block;font-size:13px" @click="more=!more" :aria-expanded="more">{{ more ? L.less : L.more }} {{ more ? '▴' : '▾' }}</button>
            <div v-if="more">
              <div class="bt-mt" v-if="opts.fields.area"><label for="bt-a">{{ L.area }}</label><input id="bt-a" class="bt-field" v-model.trim="t.area" :placeholder="L.areaPh"></div>
              <div class="bt-mt" v-if="opts.fields.expected"><label for="bt-e">{{ L.expected }}</label><textarea id="bt-e" class="bt-field" rows="2" v-model="t.expected" @input="autosize"></textarea></div>
              <div class="bt-mt" v-if="opts.fields.actual"><label for="bt-ac">{{ L.actual }}</label><textarea id="bt-ac" class="bt-field" rows="2" v-model="t.actual" @input="autosize"></textarea></div>
            </div>
            <div class="bt-mt" v-if="reporterMode==='locked'"><p class="bt-hint">{{ L.reportingAs }} <strong style="color:var(--bt-ink)">{{ t.reporter.name || t.reporter.email }}</strong><span v-if="t.reporter.name && t.reporter.email"> · {{ t.reporter.email }}</span></p></div>
            <div class="bt-mt" v-else-if="reporterMode==='edit'">
              <div class="bt-row" style="align-items:flex-start">
                <div style="flex:1;min-width:140px"><label for="bt-n">{{ L.name }}</label><input id="bt-n" class="bt-field" v-model.trim="t.reporter.name" autocomplete="name"></div>
                <div style="flex:1;min-width:140px"><label for="bt-m">{{ L.email }}</label><input id="bt-m" class="bt-field" type="email" v-model.trim="t.reporter.email" autocomplete="email" :class="{bad:showErrors&&t.reporter.email&&!validEmail}"></div>
              </div>
              <label v-if="opts.rememberReporter && !presetReporter" class="bt-hint" style="display:flex;gap:6px;align-items:center;margin-top:6px;font-weight:400"><input type="checkbox" v-model="rememberMe"> {{ L.remember }}</label>
              <button v-if="presetReporter" class="bt-link" style="font-size:13px;margin-top:4px" @click="applyReporter">{{ L.reportingAs }}: {{ presetReporter.name || presetReporter.email }} ↺</button>
            </div>
            <div class="bt-mt" v-else-if="reporterMode==='preset'"><p class="bt-hint">{{ L.reportingAs }} <strong style="color:var(--bt-ink)">{{ t.reporter.name || t.reporter.email }}</strong><span v-if="t.reporter.name && t.reporter.email"> · {{ t.reporter.email }}</span> · <button class="bt-link" style="font-size:13px" @click="editReporter=true">{{ L.change }}</button></p></div>
          </div>
          <div>
            <div class="bt-evhead"><h3>{{ L.evidence }} <span class="bt-hint" v-if="evidenceCount">({{ evidenceCount }})</span></h3>
              <div class="bt-dd"><button class="bt-btn sm" @click="menuOpen=!menuOpen" :aria-expanded="menuOpen">+ {{ L.addMore }}</button>
                <ul v-if="menuOpen" @click="menuOpen=false">
                  <li v-if="opts.capture.area"><button @click="capture('area')">{{ I.area }} {{ L.capArea }}</button></li>
                  <li v-if="opts.capture.page"><button @click="capture('page')">{{ I.page }} {{ L.capPage }}</button></li>
                  <li v-if="opts.capture.element"><button @click="capture('element')">{{ I.element }} {{ L.capEl }}</button></li>
                  <li v-if="opts.capture.native && hasNative"><button @click="capture('native')">{{ I.native }} {{ L.capNative }}</button></li>
                  <li v-if="opts.capture.record && hasRecord"><button @click="record()">{{ I.record }} {{ L.record }}</button></li>
                  <li v-if="opts.capture.record && hasRecord" class="bt-mic" @click.stop><label><input type="checkbox" v-model="mic"> {{ L.withMic }}</label></li>
                  <li><button @click="$refs.file.click()">{{ I.upload }} {{ L.upload }}</button></li>
                  <li v-if="opts.fields.attachments"><button @click="$refs.att.click()">{{ I.attach }} {{ L.attach }}</button></li>
                </ul></div>
              <input ref="file" type="file" accept="image/*" multiple hidden @change="onFiles($event.target.files);$event.target.value=''">
              <input ref="att" type="file" multiple hidden @change="onAttach($event.target.files);$event.target.value=''">
            </div>
            <div v-if="!evidenceCount" class="bt-drop" :class="{over:dragOver}" @dragover.prevent="dragOver=true" @dragleave="dragOver=false" @drop.prevent="onDrop">
              <p class="bt-hint" style="margin-bottom:10px;color:inherit">{{ L.launcherHint }}</p>
              <div class="bt-launch grid">
                <button v-if="opts.capture.area" @click="capture('area')"><span class="ic">{{ I.area }}</span><span>{{ L.capArea }}</span></button>
                <button v-if="opts.capture.page" @click="capture('page')"><span class="ic">{{ I.page }}</span><span>{{ L.capPage }}</span></button>
                <button v-if="opts.capture.element" @click="capture('element')"><span class="ic">{{ I.element }}</span><span>{{ L.capEl }}</span></button>
                <button v-if="opts.capture.record && hasRecord" @click="record()"><span class="ic">{{ I.record }}</span><span>{{ L.record }}</span></button>
                <label v-if="opts.capture.record && hasRecord" class="bt-mic" style="grid-column:1/-1"><input type="checkbox" v-model="mic"> {{ L.withMic }}</label>
                <button class="alt" @click="$refs.file.click()" style="grid-column:1/-1">{{ I.upload }} {{ L.upload }}</button>
              </div>
              <p class="bt-hint" style="margin-top:10px">{{ L.paste }}</p>
            </div>
            <div class="bt-shots" v-else @dragover.prevent="dragOver=true" @dragleave="dragOver=false" @drop.prevent="onDrop">
              <div class="bt-shot" v-for="(s,i) in t.screenshots" :key="s.id">
                <img :src="s.dataUrl" :alt="s.caption||'Screenshot '+(i+1)" @click="startAnnotate(i)" tabindex="0" @keydown.enter="startAnnotate(i)">
                <div class="acts"><button @click="startAnnotate(i)">✎ {{ L.markup }}</button><button @click="t.screenshots.splice(i,1)" :aria-label="L.remove">✕</button></div>
                <input class="bt-cap" v-model="s.caption" :placeholder="L.caption">
              </div>
              <div class="bt-shot" v-for="(v,i) in t.recordings" :key="v.id">
                <video :src="v.dataUrl" controls preload="metadata"></video>
                <div class="acts"><button @click="t.recordings.splice(i,1)" :aria-label="L.remove">✕</button></div>
                <input class="bt-cap" v-model="v.caption" :placeholder="L.caption + ' · ' + v.duration + 's · ' + (v.size/1048576).toFixed(1) + ' MB'">
              </div>
            </div>
            <div class="bt-el bt-mt" v-if="t.element"><div class="bt-row"><strong>{{ L.pickedEl }}</strong> <span class="bt-hint">&lt;{{ t.element.tag }}&gt;</span><span class="bt-spacer"></span><button class="bt-btn sm ghost danger" @click="t.element=null">✕</button></div><code>{{ t.element.selector }}</code></div>
            <div class="bt-row bt-mt" v-if="t.attachments.length"><span class="bt-chip" v-for="(a,i) in t.attachments" :key="a.id">{{ I.attach }} {{ a.name }} <button @click="t.attachments.splice(i,1)" aria-label="remove">✕</button></span></div>
            <p class="bt-hint bt-mt" style="display:flex;gap:6px;align-items:center" :title="diagList"><span aria-hidden="true">🔒</span>{{ L.autoAttached }}</p>
          </div>
        </div>
      </div>
      <div class="bt-foot">
        <div v-if="sending && progress!==null" style="width:100%"><div class="bt-prog"><i :style="{width:progress+'%'}"></i></div></div>
        <p v-if="error" class="bt-err" style="width:100%;margin:0">{{ error }}</p>
        <button class="bt-btn ghost" @click="backToLauncher">{{ L.cancel }}</button><span class="bt-spacer"></span>
        <button class="bt-btn primary" @click="submitBug" :disabled="sending">{{ sending ? (progress!==null ? fmt(L.uploading,{p:progress}) : L.sending) : (error ? L.retry : L.send) }}</button>
      </div>
    </template>

    <template v-else-if="step==='edit'">
      <div class="bt-mhead" style="flex-wrap:wrap;gap:6px">
        <button v-for="(tl,k) in toolKeys" class="bt-tool" :class="{on:annot.tool===tl}" @click="setTool(tl)" :title="toolHints[tl]">{{ L[tl] }}<kbd>{{ k.toUpperCase() }}</kbd></button><span style="width:6px"></span>
        <button v-for="c in colors" class="bt-sw" :class="{on:annot.color===c}" :style="{background:c}" @click="annot.color=c" :aria-label="c"></button><span style="width:6px"></span>
        <button v-for="s in [1,2,3]" class="bt-sz" :class="{on:annot.size===s}" @click="annot.size=s"><i :style="{width:4+s*3+'px',height:4+s*3+'px'}"></i></button><span class="bt-spacer"></span>
        <button class="bt-btn sm" @click="undo" :disabled="!annot.ops.length && !annot.crop" title="Ctrl+Z">{{ L.undo }}</button>
        <button class="bt-btn sm ghost" @click="step='form'">{{ L.cancel }}</button>
        <button class="bt-btn sm primary" @click="applyAnnotation" title="Enter">{{ annot.crop ? L.cropSave : L.save }}</button>
      </div>
      <div class="bt-body">
        <input v-if="annot.tool==='text'" class="bt-field" style="margin-bottom:10px" v-model="annot.text" :placeholder="L.textPh" ref="textEl">
        <p v-else class="bt-hint" style="margin-bottom:10px">{{ toolHints[annot.tool] }}</p>
        <canvas ref="canvas" @pointerdown="penDown" @pointermove="penMove" @pointerup="penUp" @pointercancel="penUp"></canvas>
      </div>
    </template>

    <template v-else-if="step==='done'">
      <div class="bt-body bt-done"><div class="ok" v-html="I.check"></div><h2>{{ L.sentTitle }}</h2><p class="bt-hint">{{ result.media ? L.sentBody : L.sentBodyText }}</p>
        <div class="bt-ref" v-if="result.id">{{ L.sentId }}: {{ result.id }}</div>
        <div class="bt-row bt-mt" style="justify-content:center"><a v-if="result.link" class="bt-btn" :href="result.link" target="_blank" rel="noopener" style="text-decoration:none">{{ L.openLink }} ↗</a><button v-if="result.link" class="bt-btn" @click="copy(result.link)">{{ L.copyLink }}</button></div></div>
      <div class="bt-foot"><button class="bt-btn ghost" @click="openBug('form')">{{ L.another }}</button><span class="bt-spacer"></span><button class="bt-btn primary" @click="close" ref="first">{{ L.close }}</button></div>
    </template>

    <div v-if="confirmClose" class="bt-confirm" @click.self="confirmClose=false"><div><p style="margin:0 0 12px;font-weight:600">{{ L.dirtyClose }}</p>
      <div class="bt-row" style="justify-content:center"><button class="bt-btn" @click="confirmClose=false">{{ L.keep }}</button><button class="bt-btn danger" @click="discardAndClose">{{ L.discard }}</button></div></div></div>
  </div>
</div>

<div v-if="mode==='area'" class="bt-sel" @pointerdown="selDown" @pointermove="selMove" @pointerup="selUp" @pointercancel="cancelMode" tabindex="0" ref="selEl" @keydown.esc="cancelMode">
  <div class="bt-tip">{{ L.selTip }}</div>
  <div v-if="sel.w||sel.h" class="box" :style="{left:selNorm.x+'px',top:selNorm.y+'px',width:selNorm.w+'px',height:selNorm.h+'px'}"><span class="bt-dim">{{ Math.round(selNorm.w) }} × {{ Math.round(selNorm.h) }}</span></div>
</div>
<template v-if="mode==='element'"><div class="bt-tip">{{ L.elTip }}</div><div v-if="hl.w" class="bt-hl" :style="{left:hl.x+'px',top:hl.y+'px',width:hl.w+'px',height:hl.h+'px'}"><span>{{ hl.label }}</span></div></template>
<div v-if="capturing && !mode" class="bt-tip">{{ L.capturingTip }}</div>
<div v-if="rec.active" class="bt-rec" role="status"><span class="dot"></span>{{ L.recording }} {{ recClock }}<button @click="stopRecording">■ {{ L.stop }}</button></div>
<div v-if="toast" class="bt-toast" role="status" aria-live="polite">{{ toast }}</div>
`;

  // ---------- helpers ----------
  const loadScript = src => new Promise((res, rej) => { if ([...document.scripts].some(s => s.src === src)) return res(); const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('Failed to load ' + src)); document.head.appendChild(s); });
  const fmt = (s, v) => String(s).replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');
  const norm = r => ({ x: Math.min(r.x, r.x + r.w), y: Math.min(r.y, r.y + r.h), w: Math.abs(r.w), h: Math.abs(r.h) });
  const dataUrlToBlob = d => { const [h, b] = d.split(','), mime = h.match(/:(.*?);/)[1], bin = atob(b), a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return new Blob([a], { type: mime }); };
  const trimText = (s, n) => (s || '').replace(/\s+/g, ' ').trim().slice(0, n);
  const deep = (base, over) => { const o = Object.assign({}, base); for (const k in over || {}) o[k] = over[k] && typeof over[k] === 'object' && !Array.isArray(over[k]) && base[k] && typeof base[k] === 'object' ? Object.assign({}, base[k], over[k]) : over[k]; return o; };
  const hexToRgba = (hex, a) => { const m = hex.replace('#', ''); if (!/^[0-9a-f]{6}$/i.test(m)) return hex; return `rgba(${parseInt(m.slice(0, 2), 16)},${parseInt(m.slice(2, 4), 16)},${parseInt(m.slice(4, 6), 16)},${a})`; };
  const lighten = (hex, p) => { const m = hex.replace('#', ''); if (!/^[0-9a-f]{6}$/i.test(m)) return hex; const c = [0, 2, 4].map(i => Math.min(255, Math.round(parseInt(m.slice(i, i + 2), 16) + (255 - parseInt(m.slice(i, i + 2), 16)) * p))); return '#' + c.map(x => x.toString(16).padStart(2, '0')).join(''); };
  const iconHtml = v => /^https?:|^\/|^data:/.test(v || '') ? `<img src="${v}" alt="">` : v;
  function cssPath(el) {
    if (!(el instanceof Element)) return ''; if (el.id && document.querySelectorAll('#' + CSS.escape(el.id)).length === 1) return '#' + el.id;
    const parts = []; let depth = 0;
    while (el && el.nodeType === 1 && el !== document.body && depth++ < 6) { let s = el.tagName.toLowerCase(); if (el.id) { parts.unshift(s + '#' + el.id); break; } const sib = [...el.parentNode.children].filter(c => c.tagName === el.tagName); if (sib.length > 1) s += `:nth-of-type(${sib.indexOf(el) + 1})`; parts.unshift(s); el = el.parentNode; }
    return parts.join(' > ');
  }
  function postWithProgress(url, headers, body, onProgress) {
    return new Promise((res, rej) => { const x = new XMLHttpRequest(); x.open('POST', url); Object.entries(headers).forEach(([k, v]) => x.setRequestHeader(k, v)); x.upload.onprogress = e => { if (e.lengthComputable) onProgress(Math.round(e.loaded / e.total * 100)); };
      x.onload = () => { if (x.status >= 200 && x.status < 300) { let j = {}; try { j = JSON.parse(x.responseText); } catch (e) {} res(j); } else rej(new Error('Server responded ' + x.status)); }; x.onerror = () => rej(new Error('Network error')); x.send(body); });
  }

  // ---------- diagnostics ----------
  const diag = { console: [], network: [], crumbs: [], installed: false };
  const push = (arr, item, max) => { arr.push(item); if (arr.length > max) arr.shift(); };
  function installDiagnostics(d) {
    if (diag.installed) return; diag.installed = true;
    if (d.console) {
      const oe = console.error, ow = console.warn;
      console.error = function () { push(diag.console, { t: Date.now(), level: 'error', msg: [...arguments].map(a => a instanceof Error ? a.stack || a.message : String(a)).join(' ').slice(0, 600) }, 50); oe.apply(console, arguments); };
      console.warn = function () { push(diag.console, { t: Date.now(), level: 'warn', msg: [...arguments].map(String).join(' ').slice(0, 300) }, 50); ow.apply(console, arguments); };
      window.addEventListener('error', e => push(diag.console, { t: Date.now(), level: 'error', msg: `${e.message} (${e.filename}:${e.lineno})` }, 50));
      window.addEventListener('unhandledrejection', e => push(diag.console, { t: Date.now(), level: 'error', msg: 'Unhandled rejection: ' + String(e.reason && e.reason.stack || e.reason).slice(0, 600) }, 50));
    }
    if (d.network) {
      const of = window.fetch;
      if (of) window.fetch = function (input, init) { const t0 = performance.now(), url = typeof input === 'string' ? input : input.url, method = (init && init.method) || (input && input.method) || 'GET';
        return of.apply(this, arguments).then(r => { push(diag.network, { t: Date.now(), method, url: String(url).slice(0, 300), status: r.status, ok: r.ok, ms: Math.round(performance.now() - t0) }, 40); return r; }, e => { push(diag.network, { t: Date.now(), method, url: String(url).slice(0, 300), status: 0, ok: false, error: String(e), ms: Math.round(performance.now() - t0) }, 40); throw e; }); };
      const XO = XMLHttpRequest.prototype.open, XS = XMLHttpRequest.prototype.send;
      XMLHttpRequest.prototype.open = function (m, u) { this.__bt = { method: m, url: String(u).slice(0, 300) }; return XO.apply(this, arguments); };
      XMLHttpRequest.prototype.send = function () { const t0 = performance.now(), i = this.__bt || {}; this.addEventListener('loadend', () => push(diag.network, { t: Date.now(), method: i.method, url: i.url, status: this.status, ok: this.status >= 200 && this.status < 400, ms: Math.round(performance.now() - t0) }, 40)); return XS.apply(this, arguments); };
    }
    if (d.breadcrumbs) {
      document.addEventListener('click', e => { if (host && host.contains(e.target)) return; const el = e.target.closest && e.target.closest('button,a,[role=button],input,select,label,summary') || e.target; push(diag.crumbs, { t: Date.now(), type: 'click', target: cssPath(el), text: trimText(el.innerText || el.value || el.getAttribute && el.getAttribute('aria-label'), 60) }, 30); }, true);
      const nav = () => push(diag.crumbs, { t: Date.now(), type: 'navigate', url: location.href }, 30);
      ['pushState', 'replaceState'].forEach(k => { const o = history[k]; history[k] = function () { const r = o.apply(this, arguments); nav(); return r; }; });
      window.addEventListener('popstate', nav); window.addEventListener('hashchange', nav); push(diag.crumbs, { t: Date.now(), type: 'load', url: location.href }, 30);
    }
  }

  // ---------- instance ----------
  let host = null, app = null, vm = null, keyHandler = null, listeners = {}, runtimeMeta = {}, runtimeReporter = null, themeStyle = null, currentOpts = null;
  const emit = (e, ...a) => (listeners[e] || []).forEach(f => { try { f(...a); } catch (err) { console.warn('[BugTicket] listener error', err); } });

  function applyThemeVars(opts) {
    const th = opts.theme, vars = { '--bt-primary': th.primary, '--bt-primary-hover': th.primaryHover || lighten(th.primary, .18), '--bt-primary-soft': hexToRgba(th.primary, .12), '--bt-ring': hexToRgba(th.primary, .45), '--bt-radius': th.radius, '--bt-font': th.font, '--bt-size': opts.button.size + 'px' };
    Object.assign(vars, th.tokens || {});
    Object.entries(vars).forEach(([k, v]) => host.style.setProperty(k, v));
    const dark = th.mode === 'dark' || (th.mode === 'auto' && (document.documentElement.classList.contains('dark') || matchMedia('(prefers-color-scheme: dark)').matches));
    host.setAttribute('data-mode', dark ? 'dark' : 'light');
  }

  async function init(userOpts) {
    if (host) destroy();
    const u = userOpts || {}, opts = deep(DEFAULTS, u); currentOpts = opts;
    const L = Object.assign({}, I18N.en, I18N[opts.locale] || {}, opts.labels || {});
    const I = Object.assign({}, SVG, opts.icons || {}); if (opts.button.icon) I.help = iconHtml(opts.button.icon);
    const dir = opts.dir === 'auto' ? (opts.locale === 'ar' ? 'rtl' : 'ltr') : opts.dir;
    installDiagnostics(opts.diagnostics);
    if (opts.theme.loadFont && opts.theme.font && !document.querySelector('link[data-bt-font]')) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.dataset.btFont = '1'; l.href = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(opts.theme.font) + ':wght@400;500;600;700&display=swap'; document.head.appendChild(l); }
    let V = opts.vue || global.Vue; if (!V) { await loadScript(opts.vueUrl); V = global.Vue; }
    if (!V || !V.createApp) throw new Error('[BugTicket] Vue 3 not found. Pass { vue } or load Vue before init.');
    const { createApp, reactive, ref, computed, nextTick, watch, onMounted, onBeforeUnmount } = V;

    host = document.createElement('div'); host.id = 'bug-ticket-plugin';
    const shadow = host.attachShadow({ mode: 'open' }), style = document.createElement('style'), mount = document.createElement('div');
    style.textContent = CSS; shadow.append(style);
    (opts.stylesheets || []).forEach(href => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; shadow.appendChild(l); });
    themeStyle = document.createElement('style'); themeStyle.textContent = opts.css || ''; shadow.append(themeStyle, mount); document.body.appendChild(host);
    applyThemeVars(opts);
    const mq = matchMedia('(prefers-color-scheme: dark)'); mq.addEventListener('change', () => applyThemeVars(opts));
    const mo = new MutationObserver(() => applyThemeVars(opts)); mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    const DRAFT_KEY = 'bugticket:draft:' + location.host, POS_KEY = 'bugticket:pos:' + location.host, REP_KEY = 'bugticket:reporter';

    const BUILTIN = {
      rate: { id: 'rate', type: 'rating', title: L.rate, subtitle: L.rateSub, show: false },
      idea: { id: 'idea', type: 'feedback', title: L.ideas, subtitle: L.ideasSub, titleField: true, show: false },
      bug: { id: 'bug', type: 'bug', title: L.bug, subtitle: L.bugSub, show: true },
    };
    const typeIcon = ty => I[ty === 'rating' ? 'star' : ty === 'feedback' ? 'idea' : ty === 'bug' ? 'bug' : 'link'];
    const normItem = (m, i) => { const base = BUILTIN[m.id] || {}; const it = Object.assign({ show: true }, base, m, { id: m.id || (m.type || 'item') + '-' + (i ?? Date.now()) }); it.type = it.type || 'custom'; it.icon = iconHtml(m.icon) || base.icon || typeIcon(it.type); return it; };
    const buildMenu = () => { const given = (opts.menu || []).map(normItem), ids = new Set(given.map(m => m.id)); const rest = opts.menuDefaults ? Object.values(BUILTIN).filter(b => !ids.has(b.id)).map(normItem) : []; return given.concat(rest); };
    const menuState = V.reactive(buildMenu());
    const isShown = m => typeof m.show === 'function' ? !!m.show(API) : m.show !== false;

    app = createApp({
      template: TEMPLATE,
      setup() {
        // ----- widget state -----
        const menu = menuState, visibleMenu = computed(() => menu.filter(isShown));
        const panel = ref(false), sheet = ref(null), idle = ref(false), hovered = ref(false), dragging = ref(false), badge = ref(opts.button.badge), hoverStar = ref(0);
        const widget = ref(null), fab = ref(null), panelEl = ref(null);
        const pos = reactive({ x: null, y: null });
        const brandName = computed(() => opts.brand.name || L.support);
        const logoHtml = computed(() => opts.brand.logo === undefined ? I.logo : iconHtml(opts.brand.logo));
        const fabIcon = computed(() => I.help);
        const isLeft = computed(() => pos.x !== null ? pos.x + (opts.button.size / 2) < innerWidth / 2 : /left/.test(opts.button.position));
        const isTop = computed(() => pos.y !== null ? pos.y + (opts.button.size / 2) < innerHeight / 2 : /top/.test(opts.button.position));
        const widgetClass = computed(() => ({ open: panel.value, idle: idle.value && !panel.value && !hovered.value && !dragging.value, dragging: dragging.value, pulse: opts.button.pulse && !idle.value, draggable: opts.button.draggable, left: isLeft.value, top: isTop.value }));
        const widgetStyle = computed(() => { const o = opts.button.offset + 'px', sz = opts.button.size; if (pos.x === null) return { [isLeft.value ? 'left' : 'right']: o, [isTop.value ? 'top' : 'bottom']: o };
          return { [isLeft.value ? 'left' : 'right']: (isLeft.value ? pos.x : innerWidth - pos.x - sz) + 'px', [isTop.value ? 'top' : 'bottom']: (isTop.value ? pos.y : innerHeight - pos.y - sz) + 'px' }; });
        const panelStyle = reactive({ left: '-9999px', top: '-9999px', visibility: 'hidden' });
        // Where the panel opens from: an element passed to open()/toggle() ({ anchor }), the floating
        // button, or — when the button is hidden — the corner set by button.position / button.offset.
        let anchorEl = null;
        function anchorRect() {
          const a = anchorEl && anchorEl.isConnected ? anchorEl : fab.value; if (a) return a.getBoundingClientRect();
          const o = opts.button.offset, sz = opts.button.size, left = isLeft.value ? o : innerWidth - o - sz, top = isTop.value ? o : innerHeight - o - sz;
          return { left, top, right: left + sz, bottom: top + sz, width: sz, height: sz };
        }
        function placePanel() {
          const pe = panelEl.value; if (!pe) return; const f = anchorRect();
          const pr = pe.getBoundingClientRect(), gap = 14, m = 12, pw = pr.width, ph = pr.height;
          const alignLeft = anchorEl && anchorEl.isConnected ? (f.left + f.width / 2) < innerWidth / 2 : isLeft.value;
          let top = f.top - gap - ph; if (top < m) top = f.bottom + gap; if (top + ph > innerHeight - m) top = Math.max(m, innerHeight - m - ph);
          let left = alignLeft ? f.left : f.right - pw; left = Math.max(m, Math.min(innerWidth - m - pw, left));
          Object.assign(panelStyle, { left: left + 'px', top: top + 'px', visibility: 'visible' });
        }
        let ro = null;
        watch(panel, v => nextTick(() => { if (v && panelEl.value) { placePanel(); ro = new ResizeObserver(placePanel); ro.observe(panelEl.value); } else { ro && ro.disconnect(); ro = null; Object.assign(panelStyle, { left: '-9999px', top: '-9999px', visibility: 'hidden' }); } }));
        watch(sheet, () => nextTick(placePanel));
        let idleTimer = null;
        const wake = () => { idle.value = false; armIdle(); };
        const armIdle = () => { clearTimeout(idleTimer); if (!opts.button.autoHide || panel.value || hovered.value || dragging.value) return; idleTimer = setTimeout(() => { if (!panel.value && !hovered.value && !dragging.value) idle.value = true; }, opts.button.autoHideDelay); };
        const onActivity = () => wake();
        const clamp = () => { if (pos.x === null) return; const sz = opts.button.size; pos.x = Math.max(8, Math.min(innerWidth - sz - 8, pos.x)); pos.y = Math.max(8, Math.min(innerHeight - sz - 8, pos.y)); };
        onMounted(() => { ['mousemove', 'keydown', 'touchstart'].forEach(ev => window.addEventListener(ev, onActivity, { passive: true })); window.addEventListener('scroll', onActivity, true); window.addEventListener('resize', () => { clamp(); placePanel(); });
          if (opts.button.rememberPosition) { try { const p = JSON.parse(localStorage.getItem(POS_KEY) || 'null'); if (p && Number.isFinite(p.x)) { pos.x = p.x; pos.y = p.y; nextTick(clamp); } } catch (e) {} }
          armIdle(); });
        onBeforeUnmount(() => { ['mousemove', 'keydown', 'touchstart'].forEach(ev => window.removeEventListener(ev, onActivity)); window.removeEventListener('scroll', onActivity, true); window.removeEventListener('resize', clamp); clearTimeout(idleTimer); });

        // drag
        let drag = null;
        function dragStart(e) {
          if (!opts.button.draggable || e.button > 0) return;
          const wr = fab.value.getBoundingClientRect();
          drag = { sx: e.clientX, sy: e.clientY, ox: isLeft.value ? wr.left : wr.right - opts.button.size, oy: wr.top, moved: false };
          fab.value.setPointerCapture(e.pointerId); fab.value.addEventListener('pointermove', dragMove); fab.value.addEventListener('pointerup', dragEnd, { once: true }); fab.value.addEventListener('pointercancel', dragEnd, { once: true });
        }
        function dragMove(e) {
          if (!drag) return; const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
          if (!drag.moved && Math.hypot(dx, dy) < 6) return;
          if (!drag.moved) { drag.moved = true; dragging.value = true; if (panel.value) closePanel(); }
          pos.x = drag.ox + dx; pos.y = drag.oy + dy; clamp();
        }
        function dragEnd() {
          fab.value && fab.value.removeEventListener('pointermove', dragMove);
          if (drag && drag.moved) { dragging.value = false; if (opts.button.rememberPosition) { try { localStorage.setItem(POS_KEY, JSON.stringify({ x: pos.x, y: pos.y })); } catch (e) {} } emit('drag', { x: pos.x, y: pos.y }); setTimeout(() => { drag = null; }, 0); armIdle(); }
          else drag = null;
        }
        const fabClick = () => { if (drag && drag.moved) return; togglePanel(); };
        const resetPosition = () => { pos.x = null; pos.y = null; try { localStorage.removeItem(POS_KEY); } catch (e) {} };

        // panel
        function openPanel(itemId, o) { if (itemId && typeof itemId === 'object') { o = itemId; itemId = undefined; } anchorEl = (o && o.anchor) || null; const vis = visibleMenu.value; if (!itemId && opts.skipMenuWhenSingle && vis.length === 1 && vis[0].type === 'bug') { openBug('form'); return; }
          panel.value = true; badge.value = null; idle.value = false; clearTimeout(idleTimer); sheet.value = null; emit('open', 'panel'); if (itemId) { const m = menu.find(x => x.id === itemId); if (m) nextTick(() => pick(m)); } else if (opts.skipMenuWhenSingle && vis.length === 1) nextTick(() => pick(vis[0])); nextTick(() => panelEl.value && panelEl.value.querySelector('.bt-item') && panelEl.value.querySelector('.bt-item').focus()); }
        function closePanel() { panel.value = false; sheet.value = null; emit('close', 'panel'); armIdle(); }
        const togglePanel = o => panel.value ? closePanel() : openPanel(undefined, o);
        const sf = reactive({ rating: 0, title: '', text: '' }), sfErr = ref('');
        function pick(m) {
          sfErr.value = ''; Object.assign(sf, { rating: 0, title: '', text: '' });
          if (m.type === 'bug') { openBug('form'); return; }
          if (m.type === 'rating' || m.type === 'feedback') { sheet.value = { view: m.type, item: m }; return; }
          if (m.type === 'link' && m.url) { window.open(m.url, m.target || '_blank', 'noopener'); return; }
          if (typeof m.onClick === 'function') m.onClick(API, m);
        }

        // ----- bug state -----
        const blank = () => ({ title: '', severity: opts.severities[1] || opts.severities[0], area: '', steps: '', expected: '', actual: '', reporter: { name: '', email: '' }, screenshots: [], recordings: [], attachments: [], element: null });
        const t = reactive(blank());
        const editReporter = ref(false), rememberMe = ref(true), presetReporter = ref(null);
        const resolveReporter = () => { const r = typeof opts.reporter === 'function' ? opts.reporter() : opts.reporter; const rr = runtimeReporter; if (rr && (rr.name || rr.email)) return Object.assign({ editable: false }, r || {}, rr); return r && (r.name || r.email) ? Object.assign({ editable: false }, r) : null; };
        function applyReporter() { const r = resolveReporter(); presetReporter.value = r; if (r) { t.reporter.name = r.name || ''; t.reporter.email = r.email || ''; editReporter.value = false; } else if (opts.rememberReporter) { try { const m = JSON.parse(localStorage.getItem(REP_KEY) || 'null'); if (m) { t.reporter.name = t.reporter.name || m.name || ''; t.reporter.email = t.reporter.email || m.email || ''; } } catch (e) {} } }
        applyReporter();
        const reporterMode = computed(() => { const r = presetReporter.value, f = opts.fields.reporter; if (f === false) return r ? 'locked' : 'none'; if (r) return r.editable === false ? 'locked' : (editReporter.value ? 'edit' : 'preset'); return f === 'auto' || f === true ? 'edit' : 'none'; });
        const validEmail = computed(() => !t.reporter.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t.reporter.email));
        const open = ref(false), step = ref('form'), more = ref(false), menuOpen = ref(false), dragOver = ref(false), sending = ref(false), progress = ref(null), capturing = ref(false), error = ref(''), showErrors = ref(false), toast = ref(''), mode = ref(null), confirmClose = ref(false), draftRestored = ref(false), result = reactive({ id: null, link: null });
        const annot = reactive({ active: false, index: -1, img: null, ops: [], cur: null, crop: null, tool: 'box', color: COLORS[0], size: 2, text: '' });
        const canvas = ref(null), selEl = ref(null), titleEl = ref(null), stepsEl = ref(null), textEl = ref(null), overlay = ref(null), first = ref(null);
        const sel = reactive({ x: 0, y: 0, w: 0, h: 0, down: false }), hl = reactive({ x: 0, y: 0, w: 0, h: 0, label: '', el: null });
        const hasNative = !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia), hasRecord = hasNative && typeof MediaRecorder !== 'undefined';
        const mic = ref(!!opts.record.mic), rec = reactive({ active: false, seconds: 0, recorder: null, stream: null, chunks: [], timer: null, start: 0 });
        const recClock = computed(() => `${Math.floor(rec.seconds / 60)}:${String(rec.seconds % 60).padStart(2, '0')}`);
        const selNorm = computed(() => norm(sel));
        const evidenceCount = computed(() => t.screenshots.length + t.recordings.length);
        const dirty = computed(() => !!(t.title || t.steps || t.expected || t.actual || evidenceCount.value || t.attachments.length || t.element));
        const diagList = computed(() => [opts.diagnostics.console && diag.console.length && fmt(L.dConsole, { n: diag.console.length }), opts.diagnostics.network && diag.network.length && L.dNetwork, opts.diagnostics.breadcrumbs && L.dCrumbs].filter(Boolean).join(', '));
        const toolHints = { box: L.hBox, arrow: L.hArrow, pen: L.hPen, text: L.hText, blur: L.hBlur, crop: L.hCrop };
        const sevColor = i => SEV_COLORS[Math.round(i * (SEV_COLORS.length - 1) / Math.max(1, opts.severities.length - 1))];
        const say = m => { toast.value = m; setTimeout(() => toast.value = '', 2200); };
        const autosize = e => { const el = e.target; el.style.height = 'auto'; el.style.height = Math.min(260, el.scrollHeight + 2) + 'px'; };
        const focusSteps = () => stepsEl.value && stepsEl.value.focus();
        const copy = async s => { try { await navigator.clipboard.writeText(s); say(L.copied); } catch (e) {} };
        let lastFocus = null;

        if (opts.saveDraft) {
          try { const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); if (d && (d.title || d.steps)) { Object.assign(t, d, { screenshots: [], recordings: [], attachments: [], element: null }); draftRestored.value = true; applyReporter(); } } catch (e) {}
          watch(() => [t.title, t.area, t.steps, t.expected, t.actual, t.severity, t.reporter.name, t.reporter.email], () => { try { const { screenshots, recordings, attachments, element, ...rest } = JSON.parse(JSON.stringify(t)); localStorage.setItem(DRAFT_KEY, JSON.stringify(rest)); } catch (e) {} }, { deep: true });
        }
        const clearDraft = () => { try { localStorage.removeItem(DRAFT_KEY); } catch (e) {} };
        const discardDraft = () => { Object.assign(t, blank()); applyReporter(); clearDraft(); draftRestored.value = false; };

        function openBug(s) {
          lastFocus = document.activeElement; closePanel(); open.value = true; error.value = ''; showErrors.value = false; menuOpen.value = false;
          step.value = s === 'edit' ? 'form' : (s || 'form');
          if (!t.area && opts.fields.area) t.area = trimText(document.title, 60);
          if (opts.suggestTitle && !t.title && diag.console.length) { const last = diag.console.filter(c => c.level === 'error').pop(); if (last && Date.now() - last.t < 60000) t.title = trimText(last.msg.split('\n')[0], 90); }
          nextTick(() => titleEl.value && titleEl.value.focus()); emit('open', 'bug');
        }
        watch(step, s => nextTick(() => { if (s === 'form') titleEl.value && titleEl.value.focus(); if (s === 'edit' && annot.tool === 'text') textEl.value && textEl.value.focus(); if (s === 'done') first.value && first.value.focus(); }));
        function close() { open.value = false; annot.active = false; mode.value = null; confirmClose.value = false; menuOpen.value = false; if (lastFocus && lastFocus.focus) lastFocus.focus(); emit('close', 'bug'); }
        const requestClose = () => { if (step.value === 'form' && dirty.value) confirmClose.value = true; else close(); };
        const discardAndClose = () => { Object.assign(t, blank()); applyReporter(); clearDraft(); close(); };
        const backToLauncher = () => { requestClose(); };
        function trapFocus(e) { if (e.key !== 'Tab' || !overlay.value) return; const f = [...overlay.value.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(x => !x.disabled && x.offsetParent !== null); if (!f.length) return; const a = shadow.activeElement; if (e.shiftKey && a === f[0]) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && a === f[f.length - 1]) { e.preventDefault(); f[0].focus(); } }

        // images
        function addDataUrl(dataUrl, name, caption) {
          const img = new Image();
          img.onload = () => { let w = img.naturalWidth, h = img.naturalHeight, out = dataUrl;
            if (w > opts.maxImageWidth || opts.imageFormat === 'jpeg') { const s = Math.min(1, opts.maxImageWidth / w), c = document.createElement('canvas'); c.width = Math.round(w * s); c.height = Math.round(h * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); out = c.toDataURL('image/' + opts.imageFormat, opts.imageQuality); w = c.width; h = c.height; }
            const shot = { id: Date.now() + Math.random(), name: name || 'screenshot.' + (opts.imageFormat === 'jpeg' ? 'jpg' : 'png'), caption: caption || '', width: w, height: h, dataUrl: out };
            t.screenshots.push(shot); emit('screenshot', shot); if (!open.value) openBug('form'); };
          img.src = dataUrl;
        }
        const addImage = f => { if (!f || !f.type.startsWith('image/')) return; const r = new FileReader(); r.onload = () => addDataUrl(r.result, f.name); r.readAsDataURL(f); };
        const onFiles = l => [...l].forEach(addImage);
        const onDrop = e => { dragOver.value = false; [...e.dataTransfer.files].forEach(f => f.type.startsWith('image/') ? addImage(f) : onAttach([f])); };
        const onAttach = l => [...l].forEach(f => { const r = new FileReader(); r.onload = () => t.attachments.push({ id: Date.now() + Math.random(), name: f.name, type: f.type, size: f.size, dataUrl: r.result }); r.readAsDataURL(f); });
        const onPaste = e => { if (!open.value) return; const items = [...(e.clipboardData && e.clipboardData.items || [])].filter(i => i.type.startsWith('image/')); if (!items.length) return; items.forEach(i => addImage(i.getAsFile())); say(L.attached); };
        window.addEventListener('paste', onPaste);

        // capture
        async function renderViewport() { const h2c = typeof opts.html2canvas === 'function' ? opts.html2canvas : (global.html2canvas || (await loadScript(opts.html2canvasUrl), global.html2canvas)); await nextTick(); await new Promise(r => setTimeout(r, 80)); return h2c(document.body, { useCORS: true, logging: false, scale: Math.min(2, devicePixelRatio || 1), ignoreElements: el => el === host, x: scrollX, y: scrollY, width: innerWidth, height: innerHeight }); }
        function cropCanvas(c, area, scale) { const o = document.createElement('canvas'); o.width = Math.round(area.w * scale); o.height = Math.round(area.h * scale); o.getContext('2d').drawImage(c, area.x * scale, area.y * scale, o.width, o.height, 0, 0, o.width, o.height); return o; }
        async function nativeShot() { const stream = await navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: 'browser' }, audio: false, preferCurrentTab: true, selfBrowserSurface: 'include' }); try { const v = document.createElement('video'); v.srcObject = stream; v.muted = true; await v.play(); await new Promise(r => setTimeout(r, 150)); const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight; c.getContext('2d').drawImage(v, 0, 0); return c; } finally { stream.getTracks().forEach(tr => tr.stop()); } }
        async function capture(kind, area) {
          menuOpen.value = false;
          if (kind === 'area') return startMode('area'); if (kind === 'element') return startMode('element');
          if (kind === 'native' && !hasNative) { error.value = L.unsupported; return; }
          capturing.value = true; open.value = false; panel.value = false; mode.value = null;
          try { let c, name = 'page-capture';
            if (kind === 'native') { c = await nativeShot(); name = 'screenshot'; } else { c = await renderViewport(); if (area && area.w > 2 && area.h > 2) { c = cropCanvas(c, area, c.width / innerWidth); name = 'area-capture'; } }
            addDataUrl(c.toDataURL('image/png'), name + '.png', '');
          } catch (e) { if (e.name !== 'NotAllowedError') error.value = fmt(L.captureFail, { msg: e.message }); open.value = true; }
          finally { capturing.value = false; }
        }
        async function record() {
          menuOpen.value = false; if (!hasRecord) { error.value = L.unsupported; return; } if (rec.active) return;
          const reopen = open.value;
          try { const stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: true, preferCurrentTab: true, selfBrowserSurface: 'include' });
            if (mic.value) { try { const m = await navigator.mediaDevices.getUserMedia({ audio: true }); m.getAudioTracks().forEach(tr => stream.addTrack(tr)); } catch (e) { say(L.micDenied); } }
            const mime = opts.record.mimeType || ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'].find(m => MediaRecorder.isTypeSupported(m)) || '';
            const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
            Object.assign(rec, { active: true, seconds: 0, recorder, stream, chunks: [], start: Date.now() }); open.value = false; panel.value = false; mode.value = null;
            recorder.ondataavailable = e => { if (e.data && e.data.size) rec.chunks.push(e.data); }; recorder.onstop = finishRecording;
            stream.getVideoTracks()[0].addEventListener('ended', stopRecording);
            rec.timer = setInterval(() => { rec.seconds = Math.round((Date.now() - rec.start) / 1000); if (rec.seconds >= opts.record.maxSeconds) stopRecording(); }, 500);
            recorder.start(1000); emit('recording', 'start');
          } catch (e) { if (e.name !== 'NotAllowedError') error.value = fmt(L.captureFail, { msg: e.message }); if (reopen) open.value = true; }
        }
        function stopRecording() { if (!rec.active || !rec.recorder) return; clearInterval(rec.timer); rec.active = false; if (rec.recorder.state !== 'inactive') rec.recorder.stop(); else finishRecording(); }
        function finishRecording() {
          const type = (rec.recorder && rec.recorder.mimeType) || 'video/webm', blob = new Blob(rec.chunks, { type }), duration = Math.round((Date.now() - rec.start) / 1000);
          if (rec.stream) rec.stream.getTracks().forEach(tr => tr.stop()); rec.recorder = null; rec.stream = null; rec.chunks = [];
          if (!blob.size) { openBug('form'); return; }
          const r = new FileReader(); r.onload = () => { const v = { id: Date.now(), name: 'recording-' + Date.now() + (type.includes('mp4') ? '.mp4' : '.webm'), type, size: blob.size, duration, caption: '', dataUrl: r.result }; t.recordings.push(v); emit('recording', 'stop', v); openBug('form'); say(L.recorded); }; r.readAsDataURL(blob);
        }
        let elMove = null, elClick = null, elKey = null;
        function startMode(m) {
          open.value = false; panel.value = false; mode.value = m;
          if (m === 'area') { Object.assign(sel, { x: 0, y: 0, w: 0, h: 0, down: false }); nextTick(() => selEl.value && selEl.value.focus()); }
          if (m === 'element') { hl.w = 0; hl.el = null;
            elMove = e => { const el = document.elementFromPoint(e.clientX, e.clientY); if (!el || host.contains(el) || el === document.documentElement || el === document.body) { hl.w = 0; hl.el = null; return; } const r = el.getBoundingClientRect(); Object.assign(hl, { x: r.left, y: r.top, w: r.width, h: r.height, el, label: el.tagName.toLowerCase() + (el.id ? '#' + el.id : typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/)[0] : '') }); };
            elClick = async e => { e.preventDefault(); e.stopPropagation(); const el = hl.el; teardownEl(); if (!el) return cancelMode(); const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
              t.element = { selector: cssPath(el), tag: el.tagName.toLowerCase(), id: el.id || null, classes: typeof el.className === 'string' ? el.className : '', text: trimText(el.innerText, 200), html: trimText(el.outerHTML, 2000), rect: { x: Math.round(r.left + scrollX), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height) }, styles: { display: cs.display, visibility: cs.visibility, opacity: cs.opacity, zIndex: cs.zIndex } };
              mode.value = null; await capture('page', { x: Math.max(0, r.left - 12), y: Math.max(0, r.top - 12), w: Math.min(innerWidth, r.width + 24), h: Math.min(innerHeight, r.height + 24) }); };
            elKey = e => { if (e.key === 'Escape') { teardownEl(); cancelMode(); } };
            document.addEventListener('mousemove', elMove, true); document.addEventListener('click', elClick, true); document.addEventListener('keydown', elKey, true); }
        }
        function teardownEl() { document.removeEventListener('mousemove', elMove, true); document.removeEventListener('click', elClick, true); document.removeEventListener('keydown', elKey, true); hl.w = 0; }
        const cancelMode = () => { mode.value = null; open.value = true; };
        const selDown = e => { sel.down = true; sel.x = e.clientX; sel.y = e.clientY; sel.w = sel.h = 0; selEl.value.setPointerCapture(e.pointerId); };
        const selMove = e => { if (!sel.down) return; sel.w = e.clientX - sel.x; sel.h = e.clientY - sel.y; };
        const selUp = () => { if (!sel.down) return; sel.down = false; const r = norm(sel); if (r.w < 3 || r.h < 3) return cancelMode(); capture('page', r); };

        // editor
        function startAnnotate(i) { Object.assign(annot, { index: i, ops: [], cur: null, crop: null, tool: 'box', active: true }); step.value = 'edit'; const img = new Image(); img.onload = () => { annot.img = img; nextTick(draw); }; img.src = t.screenshots[i].dataUrl; }
        const setTool = tl => { annot.tool = tl; annot.cur = null; draw(); if (tl === 'text') nextTick(() => textEl.value && textEl.value.focus()); };
        const lw = (c, s) => Math.max(2, c.width / 400) * s;
        function pixelate(ctx, r, src) { r = norm(r); if (r.w < 2 || r.h < 2) return; const px = Math.max(8, Math.round(Math.max(r.w, r.h) / 12)), tmp = document.createElement('canvas'); tmp.width = Math.max(1, Math.round(r.w / px)); tmp.height = Math.max(1, Math.round(r.h / px)); tmp.getContext('2d').drawImage(src, r.x, r.y, r.w, r.h, 0, 0, tmp.width, tmp.height); ctx.imageSmoothingEnabled = false; ctx.drawImage(tmp, 0, 0, tmp.width, tmp.height, r.x, r.y, r.w, r.h); ctx.imageSmoothingEnabled = true; }
        function drawOp(ctx, c, o, img) {
          ctx.strokeStyle = ctx.fillStyle = o.color; ctx.lineWidth = lw(c, o.size); ctx.lineCap = ctx.lineJoin = 'round';
          if (o.type === 'blur') return pixelate(ctx, o, img);
          if (o.type === 'pen') { if (o.pts.length < 2) return; ctx.beginPath(); ctx.moveTo(o.pts[0].x, o.pts[0].y); o.pts.slice(1).forEach(q => ctx.lineTo(q.x, q.y)); return ctx.stroke(); }
          if (o.type === 'text') { const fs = Math.max(14, c.width / 50) * (0.7 + o.size * 0.3); ctx.font = `bold ${fs}px system-ui,sans-serif`; const w = ctx.measureText(o.text).width; ctx.fillStyle = o.color === '#FFFFFF' ? 'rgba(0,0,0,.7)' : 'rgba(255,255,255,.85)'; ctx.fillRect(o.x - 6, o.y - fs - 4, w + 12, fs + 10); ctx.fillStyle = o.color; return ctx.fillText(o.text, o.x, o.y); }
          if (o.type === 'arrow') { const hd = ctx.lineWidth * 4, ang = Math.atan2(o.h, o.w), x2 = o.x + o.w, y2 = o.y + o.h; ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(x2, y2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - hd * Math.cos(ang - 0.4), y2 - hd * Math.sin(ang - 0.4)); ctx.lineTo(x2 - hd * Math.cos(ang + 0.4), y2 - hd * Math.sin(ang + 0.4)); ctx.closePath(); return ctx.fill(); }
          const r = norm(o); ctx.strokeRect(r.x, r.y, r.w, r.h);
        }
        function draw(forExport) {
          const c = canvas.value, img = annot.img; if (!c || !img) return; c.width = img.naturalWidth; c.height = img.naturalHeight; const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
          [...annot.ops, ...(annot.cur && annot.tool !== 'crop' ? [annot.cur] : [])].forEach(o => drawOp(ctx, c, o, img));
          const crop = annot.tool === 'crop' && annot.cur ? annot.cur : annot.crop;
          if (crop && !forExport) { const r = norm(crop); ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(0, 0, c.width, r.y); ctx.fillRect(0, r.y + r.h, c.width, c.height - r.y - r.h); ctx.fillRect(0, r.y, r.x, r.h); ctx.fillRect(r.x + r.w, r.y, c.width - r.x - r.w, r.h); ctx.setLineDash([8, 6]); ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.strokeRect(r.x, r.y, r.w, r.h); ctx.setLineDash([]); }
        }
        const cpos = e => { const c = canvas.value, b = c.getBoundingClientRect(); return { x: (e.clientX - b.left) * c.width / b.width, y: (e.clientY - b.top) * c.height / b.height }; };
        const penDown = e => { const p = cpos(e), base = { type: annot.tool, color: annot.color, size: annot.size }; if (annot.tool === 'text') { if (annot.text.trim()) { annot.ops.push({ ...base, x: p.x, y: p.y, text: annot.text.trim() }); draw(); } return; } annot.cur = annot.tool === 'pen' ? { ...base, pts: [p] } : { ...base, x: p.x, y: p.y, w: 0, h: 0 }; canvas.value.setPointerCapture(e.pointerId); };
        const penMove = e => { if (!annot.cur) return; const p = cpos(e); if (annot.cur.type === 'pen') annot.cur.pts.push(p); else { annot.cur.w = p.x - annot.cur.x; annot.cur.h = p.y - annot.cur.y; } draw(); };
        const penUp = () => { const cur = annot.cur; annot.cur = null; if (cur && cur.type === 'pen') { if (cur.pts.length > 1) annot.ops.push(cur); } else if (cur && (Math.abs(cur.w) > 4 || Math.abs(cur.h) > 4)) { if (cur.type === 'crop') annot.crop = cur; else annot.ops.push(cur); } draw(); };
        const undo = () => { if (annot.tool === 'crop' && annot.crop) annot.crop = null; else annot.ops.pop(); draw(); };
        const applyAnnotation = () => { annot.cur = null; draw(true); let out = canvas.value; if (annot.crop) out = cropCanvas(out, norm(annot.crop), 1); const s = t.screenshots[annot.index]; s.dataUrl = out.toDataURL('image/png'); s.width = out.width; s.height = out.height; annot.active = false; step.value = 'form'; };
        function editorKeys(e) { if (!open.value || step.value !== 'edit') return false; const typing = shadow.activeElement && /INPUT|TEXTAREA/.test(shadow.activeElement.tagName);
          if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); return true; } if (e.key === 'Enter' && !typing) { e.preventDefault(); applyAnnotation(); return true; } if (e.key === 'Escape') { step.value = 'form'; return true; }
          if (!typing && TOOL_KEYS[e.key.toLowerCase()]) { setTool(TOOL_KEYS[e.key.toLowerCase()]); return true; } return false; }

        // ----- delivery -----
        function getContext() {
          const nav = navigator, perf = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
          return { url: location.href, referrer: document.referrer, title: document.title, timestamp: new Date().toISOString(), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, userAgent: nav.userAgent, language: nav.language, platform: nav.platform, online: nav.onLine,
            viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio || 1, scrollX, scrollY }, screen: { width: screen.width, height: screen.height }, connection: nav.connection ? { type: nav.connection.effectiveType, downlink: nav.connection.downlink } : null,
            memory: performance.memory ? { usedMB: Math.round(performance.memory.usedJSHeapSize / 1048576) } : null, performance: perf ? { domContentLoaded: Math.round(perf.domContentLoadedEventEnd), load: Math.round(perf.loadEventEnd) } : null,
            console: opts.diagnostics.console ? diag.console.slice() : [], network: opts.diagnostics.network ? diag.network.slice() : [], breadcrumbs: opts.diagnostics.breadcrumbs ? diag.crumbs.slice() : [], storage: opts.diagnostics.storage ? { localStorageKeys: Object.keys(localStorage), sessionStorageKeys: Object.keys(sessionStorage) } : null };
        }
        const reporterOut = () => Object.assign({}, t.reporter, { source: presetReporter.value ? 'app' : (t.reporter.name || t.reporter.email ? 'user' : 'anonymous') });
        const metaOut = () => Object.assign({}, typeof opts.meta === 'function' ? opts.meta() : opts.meta, runtimeMeta);
        async function deliver(payload, item, onProg) {
          const ep = item && item.endpoint || opts.endpoint, sub = item && item.onSubmit || opts.onSubmit; let res = null;
          if (sub) res = await sub(payload, item);
          if (ep) { const headers = Object.assign({}, opts.headers); let body;
            if (opts.format === 'multipart' && payload.type === 'bug') { const fd = new FormData(), { screenshots, recordings, attachments, ...rest } = payload;
              fd.append('ticket', JSON.stringify({ ...rest, screenshots: screenshots.map(({ dataUrl, ...s }) => s), recordings: recordings.map(({ dataUrl, ...v }) => v), attachments: attachments.map(({ dataUrl, ...a }) => a) }));
              screenshots.forEach((s, i) => fd.append('screenshots[]', dataUrlToBlob(s.dataUrl), s.name || 'screenshot-' + i + '.png')); recordings.forEach(v => fd.append('recordings[]', dataUrlToBlob(v.dataUrl), v.name)); attachments.forEach(a => fd.append('attachments[]', dataUrlToBlob(a.dataUrl), a.name)); body = fd;
            } else { headers['Content-Type'] = 'application/json'; body = JSON.stringify(payload); }
            res = await postWithProgress(ep, headers, body, onProg || (() => {})); }
          if (!sub && !ep) console.log('[BugTicket] no endpoint/onSubmit configured — payload:', payload);
          return res || {};
        }
        async function submitSimple() {
          const item = sheet.value.item, type = sheet.value.view; sfErr.value = '';
          if (type === 'rating' && !sf.rating) { sfErr.value = L.pickStars; return; } if (!sf.text.trim() && !(type === 'rating' && sf.rating)) { sfErr.value = L.needText; return; }
          const payload = { type: item.type, itemId: item.id, rating: type === 'rating' ? sf.rating : undefined, title: sf.title || undefined, text: sf.text.trim(), reporter: reporterOut(), context: getContext(), meta: metaOut(), plugin: 'BugTicket/' + API.version };
          sending.value = true; emit('submit', payload);
          try { const res = await deliver(payload, item); if (opts.onSuccess) opts.onSuccess(res, payload); emit('success', res, payload); sheet.value = { view: 'thanks', item }; }
          catch (e) { sfErr.value = fmt(L.sendFail, { msg: e.message }); if (opts.onError) opts.onError(e, payload); emit('error', e, payload); } finally { sending.value = false; }
        }
        async function submitBug() {
          showErrors.value = true; if (!t.title) { titleEl.value && titleEl.value.focus(); return; } if (!validEmail.value) return;
          if (reporterMode.value === 'edit' && !presetReporter.value && opts.rememberReporter) { try { rememberMe.value ? localStorage.setItem(REP_KEY, JSON.stringify({ name: t.reporter.name, email: t.reporter.email })) : localStorage.removeItem(REP_KEY); } catch (e) {} }
          sending.value = true; error.value = ''; progress.value = null;
          const payload = { type: 'bug', ...JSON.parse(JSON.stringify(t)), reporter: reporterOut(), context: getContext(), meta: metaOut(), plugin: 'BugTicket/' + API.version }; emit('submit', payload);
          try { progress.value = 0; const res = await deliver(payload, menu.find(m => m.type === 'bug'), p => { progress.value = p; emit('progress', p); });
            result.media = (payload.screenshots || []).length + (payload.recordings || []).length + (payload.attachments || []).length; result.id = res.id || res.ticketId || res.key || null; result.link = (opts.successLink ? opts.successLink(res) : res.url || res.link) || null;
            if (opts.onSuccess) opts.onSuccess(res, payload); emit('success', res, payload); Object.assign(t, blank()); applyReporter(); clearDraft(); draftRestored.value = false; step.value = 'done'; }
          catch (e) { error.value = fmt(L.sendFail, { msg: e.message }); if (opts.onError) opts.onError(e, payload); emit('error', e, payload); } finally { sending.value = false; progress.value = null; }
        }

        return { opts, L, I, dir, fmt, menu, visibleMenu, brandName, logoHtml, fabIcon, panel, panelStyle, isLeft, isTop, sheet, badge, hoverStar, sf, sfErr, widget, fab, panelEl, widgetClass, widgetStyle, hovered, wake, armIdle, dragStart, fabClick, openPanel, closePanel, togglePanel, pick, resetPosition, submitSimple,
          t, open, step, more, menuOpen, dragOver, sending, progress, capturing, error, showErrors, toast, mode, confirmClose, draftRestored, result, annot, canvas, selEl, titleEl, stepsEl, textEl, overlay, first, sel, selNorm, hl, hasNative, hasRecord, mic, rec, recClock, evidenceCount, dirty, diagList, colors: COLORS, toolKeys: TOOL_KEYS, toolHints, sevColor, autosize, focusSteps, copy,
          reporterMode, presetReporter, editReporter, rememberMe, validEmail, applyReporter, discardDraft, openBug, close, requestClose, discardAndClose, backToLauncher, trapFocus, onFiles, onDrop, onAttach, capture, record, stopRecording, cancelMode, selDown, selMove, selUp, startAnnotate, setTool, penDown, penMove, penUp, undo, applyAnnotation, submitBug, getContext,
          _onPaste: onPaste, _teardownEl: teardownEl, _editorKeys: editorKeys, _setBadge: n => { badge.value = n; },
          _menu: { get: () => menu.map(m => Object.assign({}, m)), add: (item, idx) => { const it = normItem(item || {}); const i = menu.findIndex(m => m.id === it.id); if (i > -1) menu.splice(i, 1); menu.splice(Number.isInteger(idx) ? idx : menu.length, 0, it); return it; },
            update: (id, patch) => { const i = menu.findIndex(m => m.id === id); if (i < 0) return null; const it = normItem(Object.assign({}, menu[i], patch || {}, { id })); menu.splice(i, 1, it); return it; },
            remove: id => { const i = menu.findIndex(m => m.id === id); if (i > -1) menu.splice(i, 1); return i > -1; } } };
      }
    });
    vm = app.mount(mount);

    keyHandler = e => {
      if (vm._editorKeys(e)) return;
      if (e.key === 'Escape') { if (vm.open) { if (vm.confirmClose) vm.confirmClose = false; else if (vm.menuOpen) vm.menuOpen = false; else vm.requestClose(); } else if (vm.panel) { if (vm.sheet) vm.sheet = null; else vm.closePanel(); } return; }
      if (!opts.hotkey) return; const parts = String(opts.hotkey).toLowerCase().split('+');
      if (parts.includes('ctrl') !== e.ctrlKey || parts.includes('shift') !== e.shiftKey || parts.includes('alt') !== e.altKey) return;
      if (e.key.toLowerCase() === parts[parts.length - 1]) { e.preventDefault(); vm.open ? vm.requestClose() : vm.togglePanel(); }
    };
    window.addEventListener('keydown', keyHandler);
    return API;
  }

  function destroy() {
    if (vm) { window.removeEventListener('paste', vm._onPaste); vm._teardownEl(); vm.stopRecording(); }
    if (keyHandler) window.removeEventListener('keydown', keyHandler);
    if (app) app.unmount(); if (host) host.remove(); host = app = vm = keyHandler = null;
  }

  const API = {
    version: '4.4.0', init, destroy,
    open: (itemId, o) => vm && vm.openPanel(itemId, o), close: () => vm && (vm.open ? vm.close() : vm.closePanel()), toggle: o => vm && vm.togglePanel(o),
    openBug: step => vm && vm.openBug(step), capture: kind => vm && vm.capture(kind || 'page'), record: () => vm && vm.record(), stopRecording: () => vm && vm.stopRecording(),
    setBadge: n => vm && vm._setBadge(n), setMeta: m => Object.assign(runtimeMeta, m || {}), setReporter: r => { runtimeReporter = r || null; vm && vm.applyReporter(); },
    setTheme: th => { if (!host || !currentOpts) return; currentOpts.theme = Object.assign({}, currentOpts.theme, th || {}); applyThemeVars(currentOpts); if (th && typeof th.css === 'string') themeStyle.textContent = th.css; },
    resetPosition: () => vm && vm.resetPosition(), getContext: () => vm ? vm.getContext() : null,
    getMenu: () => vm ? vm._menu.get() : [], addMenuItem: (item, index) => vm && vm._menu.add(item, index), updateMenuItem: (id, patch) => vm && vm._menu.update(id, patch),
    removeMenuItem: id => vm && vm._menu.remove(id), showMenuItem: (id, show) => vm && vm._menu.update(id, { show: show !== false }),
    on: (e, f) => { (listeners[e] = listeners[e] || []).push(f); return () => { listeners[e] = (listeners[e] || []).filter(x => x !== f); }; },
  };
export default API;
