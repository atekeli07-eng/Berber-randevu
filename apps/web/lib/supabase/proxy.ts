import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasSupabaseEnv, supabaseEnv } from "./env";

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!hasSupabaseEnv()) {
    if (pathname.startsWith("/panel")) {
      const url = request.nextUrl.clone();
      url.pathname = "/giris";
      url.searchParams.set("yapilandirma", "1");
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const { url, key } = supabaseEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && pathname.startsWith("/panel")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/giris";
    return NextResponse.redirect(redirectUrl);
  }

  if (user && (pathname === "/giris" || pathname === "/kayit")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/panel";
    const redirect = NextResponse.redirect(redirectUrl);
    response.cookies.getAll().forEach((cookie) => {
      redirect.cookies.set(cookie);
    });
    return redirect;
  }

  return response;
}
