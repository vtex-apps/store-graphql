const appendToCookie = (ctx, extraValue) => {
  const {request: { headers: { cookie } }} = ctx
  ctx.request.headers.cookie = `${cookie}; ${extraValue}`
}

export { appendToCookie }