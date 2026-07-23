export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter();
  let lastPath = '';

  function pushPageView() {
    const path = window.location.pathname + window.location.search;
    if (path === lastPath) return;
    lastPath = path;
    window.dataLayer?.push({
      event: 'virtual_page_view',
      page_location: window.location.href,
      page_path: path,
      page_title: document.title,
      page_referrer: document.referrer || undefined,
    });
  }

  nuxtApp.hook('app:mounted', () => nextTick(pushPageView));
  router.afterEach(() => nextTick(pushPageView));
});
