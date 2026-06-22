export default defineNuxtPlugin(() => {
  const router = useRouter();

  router.afterEach(() => {
    nextTick(() => {
      window.dataLayer?.push({
        event: 'virtual_page_view',
        page_location: window.location.href,
        page_path: window.location.pathname + window.location.search,
        page_title: document.title,
        page_referrer: document.referrer || undefined,
      });
    });
  });
});
