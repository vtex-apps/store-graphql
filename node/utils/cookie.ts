const appendToCookie = (ctx: Context, extraValue: string) => {
  const {request: { headers: { cookie } }} = ctx
  ctx.request.headers.cookie = `${cookie}; ${extraValue}`
}

export { appendToCookie }