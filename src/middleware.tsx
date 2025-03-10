import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

 
// This function can be marked `async` if using `await` inside
export function middleware(req: NextRequest) {
    const loggedinCookie = req.cookies.get('loggedin')?.value
    const mfaedCookie = req.cookies.get('mfaed')?.value  
    const roleCookie = req.cookies.get('role')?.value
    // If the user is not logged in, redirect to the login page
    if(req.nextUrl.pathname.startsWith('/admin') || req.nextUrl.pathname.startsWith('/user')) {
        if(loggedinCookie != "true")
            return NextResponse.redirect(new URL('/', req.url))
        if(roleCookie == "No access")
            return NextResponse.redirect(new URL('/noaccess', req.url))
        if(mfaedCookie != "true" && !req.nextUrl.pathname.startsWith('/mfa'))
            return NextResponse.redirect(new URL('/mfa', req.url))
    }

    if(req.nextUrl.pathname.startsWith('/admin')) {
        if(roleCookie != "Admin")
            return NextResponse.redirect(new URL('/user', req.url))
    }

    if(req.nextUrl.pathname == '/' && loggedinCookie == "true" && mfaedCookie == "true") {
        if(roleCookie == "Admin")
            return NextResponse.redirect(new URL('/admin', req.url))
        else if(roleCookie == "General User" || roleCookie == "IT")
            return NextResponse.redirect(new URL('/user', req.url))
        else
            return NextResponse.redirect(new URL('/noaccess', req.url))
    }
}
