export default (request: Request) => {
  const url = new URL(request.url);
  const { pathname } = url;

  let target: string | null = null;

  if (pathname === '/tools' || pathname === '/tools/index.html') {
    target = '/tools/';
  } else if (pathname !== '/tools/' && pathname.endsWith('/')) {
    target = pathname.slice(0, -1);
  }

  if (!target) return;

  return new Response(null, {
    status: 301,
    headers: { location: `${target}${url.search}` },
  });
};
